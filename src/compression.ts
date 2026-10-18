import type { RequestHandler, Response } from 'express';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';

/**
 * Tipos que conviene comprimir (texto). Las imágenes, las fuentes y los
 * formatos comprimidos (webp, avif, png, jpg, woff2) ya viajan comprimidos: si
 * se vuelven a comprimir se gasta CPU para no ahorrar un solo byte.
 */
const COMPRESSIBLE =
  /^(?:text\/|image\/svg\+xml|application\/(?:javascript|json|xml|manifest\+json))/;

/** Por debajo de este tamaño el ahorro no compensa las cabeceras extra. */
const MIN_SIZE = 1024;

/** Niveles moderados: la compresión se hace en cada petición, no en el build. */
const GZIP_LEVEL = 6;
const BROTLI_QUALITY = 5;

type Encoding = 'br' | 'gzip';

/**
 * Negocia la codificación a partir de `Accept-Encoding` respetando los
 * factores de calidad (`br;q=0` significa que el cliente NO acepta brotli).
 */
function negotiate(header: string | undefined): Encoding | null {
  if (!header) {
    return null;
  }

  const accepted = new Map<string, number>();

  for (const part of header.split(',')) {
    const [rawName, ...params] = part.trim().split(';');
    let quality = 1;

    for (const param of params) {
      const [key, value] = param.trim().split('=');
      if (key === 'q') {
        const parsed = Number.parseFloat(value ?? '');
        quality = Number.isNaN(parsed) ? 1 : parsed;
      }
    }

    if (rawName) {
      accepted.set(rawName.trim().toLowerCase(), quality);
    }
  }

  const weight = (name: string): number => accepted.get(name) ?? accepted.get('*') ?? 0;

  if (weight('br') > 0) {
    return 'br';
  }

  if (weight('gzip') > 0) {
    return 'gzip';
  }

  return null;
}

/** Añade un valor a `Vary` sin duplicarlo. */
function appendVary(res: Response, value: string): void {
  const current = res.getHeader('Vary');
  const existing = Array.isArray(current) ? current.join(', ') : String(current ?? '');

  if (!existing) {
    res.setHeader('Vary', value);
    return;
  }

  if (!new RegExp(`(?:^|,)\\s*${value}\\s*(?:,|$)`, 'i').test(existing)) {
    res.setHeader('Vary', `${existing}, ${value}`);
  }
}

/**
 * Middleware de compresión gzip/brotli construido sobre `node:zlib`, sin
 * dependencias externas.
 *
 * Funciona con las dos fuentes de respuesta del servidor: los archivos
 * estáticos (`express.static`, que escribe en streaming) y las páginas que
 * genera el motor de Angular. Para poder comprimir y conocer el tamaño final,
 * la respuesta se retiene en memoria y se envía de una sola vez; si algo falla
 * o el resultado no conviene, se responde **sin comprimir** (la respuesta nunca
 * se rompe por culpa de este middleware).
 */
export function compression(): RequestHandler {
  return (req, res, next) => {
    const encoding = negotiate(req.headers['accept-encoding']);

    // Sin codificación aceptada, o en peticiones sin cuerpo, no se intercepta.
    if (!encoding || req.method !== 'GET') {
      next();
      return;
    }

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    const originalFlushHeaders = res.flushHeaders.bind(res);
    const chunks: Buffer[] = [];
    let bodySeen = false;

    const collect = (chunk: unknown, format?: string): void => {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk, (format as BufferEncoding) ?? 'utf8'));
      } else if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk));
      }
    };

    const restore = (): void => {
      res.write = originalWrite;
      res.end = originalEnd;
      res.flushHeaders = originalFlushHeaders;
    };

    // El motor de Angular llama a `flushHeaders()` **antes** de escribir el
    // cuerpo. Una vez enviadas las cabeceras ya no se puede anunciar
    // `Content-Encoding`, y como este middleware retiene la respuesta completa
    // en memoria, el envío se posterga hasta tener el cuerpo listo.
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- el cuerpo vacío es justo el objetivo: no enviar cabeceras todavía
    res.flushHeaders = (): void => {};

    res.write = ((chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean => {
      bodySeen = true;
      collect(chunk, typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined);

      const done = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;
      if (typeof done === 'function') {
        done();
      }

      // Se declara que nunca hay contrapresión: el cuerpo se retiene en memoria.
      return true;
    }) as typeof res.write;

    res.end = ((chunk?: unknown, encodingOrCallback?: unknown, callback?: unknown): Response => {
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk) || chunk instanceof Uint8Array) {
        bodySeen = true;
        collect(chunk, typeof encodingOrCallback === 'string' ? encodingOrCallback : undefined);
      }

      const done: (() => void) | undefined =
        typeof encodingOrCallback === 'function'
          ? (encodingOrCallback as () => void)
          : typeof callback === 'function'
            ? (callback as () => void)
            : undefined;

      restore();
      send(chunks, bodySeen, done);
      return res;
    }) as typeof res.end;

    /**
     * Decide si comprime y responde. Nunca lanza: en el peor caso envía el
     * cuerpo tal cual llegó.
     */
    const send = (parts: Buffer[], seen: boolean, done?: () => void): void => {
      const body = Buffer.concat(parts);

      const compressible =
        seen &&
        body.length >= MIN_SIZE &&
        !res.headersSent &&
        res.getHeader('content-encoding') === undefined &&
        res.getHeader('content-range') === undefined &&
        !String(res.getHeader('cache-control') ?? '').includes('no-transform') &&
        (res.statusCode === 200 || res.statusCode === 404) &&
        COMPRESSIBLE.test(String(res.getHeader('content-type') ?? ''));

      if (!compressible) {
        if (seen && !res.headersSent) {
          res.setHeader('Content-Length', body.length);
        }

        originalEnd(body.length > 0 ? body : undefined, done);
        return;
      }

      let encoded: Buffer;

      try {
        encoded =
          encoding === 'br'
            ? brotliCompressSync(body, {
                params: { [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY },
              })
            : gzipSync(body, { level: GZIP_LEVEL });
      } catch {
        res.setHeader('Content-Length', body.length);
        originalEnd(body, done);
        return;
      }

      // Si el resultado no es más pequeño (cuerpos muy pequeños o ya densos),
      // se envía el original.
      if (encoded.length >= body.length) {
        res.setHeader('Content-Length', body.length);
        originalEnd(body, done);
        return;
      }

      try {
        res.setHeader('Content-Encoding', encoding);
        res.setHeader('Content-Length', encoded.length);
        appendVary(res, 'Accept-Encoding');
      } catch {
        restore();
        originalEnd(body, done);
        return;
      }

      originalEnd(encoded, done);
    };

    next();
  };
}
