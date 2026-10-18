/**
 * Smoke test del servidor de producción (`dist/portafolio/server/server.mjs`).
 *
 * Comprueba, contra un servidor en marcha, que:
 *  1. gzip y brotli devuelven **exactamente** el mismo cuerpo que la respuesta
 *     sin comprimir (comparación byte a byte),
 *  2. no se recomprime lo que ya está comprimido (PNG) ni los cuerpos diminutos,
 *  3. `br;q=0` cae a gzip en lugar de brotli,
 *  4. están las cabeceras de seguridad y las políticas de caché esperadas.
 *
 * Uso:
 *   node dist/portafolio/server/server.mjs      # en otra terminal
 *   node tools/smoke-test-server.mjs            # SMOKE_URL y PORT son opcionales
 */
import { readdirSync } from 'node:fs';
import { get } from 'node:http';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';

const base = process.env.SMOKE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
const browserDist = new URL('../dist/portafolio/browser/', import.meta.url);

let failures = 0;

function check(label, ok, detail = '') {
  if (!ok) {
    failures += 1;
  }
  console.log(`${ok ? '  ok  ' : ' FALLA'} ${label}${detail ? ` -> ${detail}` : ''}`);
}

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = get(`${base}${path}`, { headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }),
      );
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error(`timeout en ${path}`)));
  });
}

function decode(body, encoding) {
  if (encoding === 'br') {
    return brotliDecompressSync(body);
  }
  if (encoding === 'gzip') {
    return gunzipSync(body);
  }
  return body;
}

const distFiles = readdirSync(browserDist);
const mainBundle = `/${distFiles.find((file) => /^main-.*\.js$/.test(file))}`;
const styleBundle = `/${distFiles.find((file) => /^styles-.*\.css$/.test(file))}`;

async function main() {
  console.log(`Servidor: ${base}\n`);

  // --- 1: cuerpo idéntico al descomprimir ---------------------------------
  console.log('Compresión (cuerpo idéntico byte a byte)');
  const compressible = [
    '/',
    '/about',
    '/projects',
    '/skills',
    '/contact',
    '/no-existe',
    '/assets/img/logo.svg',
    mainBundle,
  ];

  for (const route of compressible) {
    const plain = await request(route);

    for (const encoding of ['gzip', 'br']) {
      const response = await request(route, { 'Accept-Encoding': encoding });
      const sent = response.headers['content-encoding'];
      const decoded = decode(response.body, sent);

      check(
        `${route} [${encoding}]`,
        response.status === plain.status && sent === encoding && decoded.equals(plain.body),
        `status=${response.status} encoding=${sent ?? '-'} descomprimido=${decoded.length}B original=${plain.body.length}B`,
      );
    }
  }

  // --- 2: lo que no debe recomprimirse ------------------------------------
  console.log('\nSin recomprimir');
  const png = await request('/assets/icons/angular.png', { 'Accept-Encoding': 'gzip, br' });
  check(
    'PNG sin Content-Encoding',
    png.headers['content-encoding'] === undefined,
    String(png.headers['content-encoding']),
  );

  const tiny = await request(styleBundle, { 'Accept-Encoding': 'gzip, br' });
  check(
    `CSS diminuto (${styleBundle}) sin comprimir`,
    tiny.status === 200 && tiny.headers['content-encoding'] === undefined,
    `status=${tiny.status} encoding=${tiny.headers['content-encoding'] ?? '-'}`,
  );

  // --- 3: negociación de Accept-Encoding ----------------------------------
  console.log('\nNegociación de Accept-Encoding');
  const brZero = await request('/about', { 'Accept-Encoding': 'br;q=0, gzip' });
  check(
    'br;q=0 cae a gzip',
    brZero.headers['content-encoding'] === 'gzip',
    String(brZero.headers['content-encoding']),
  );

  const gzipZero = await request('/about', { 'Accept-Encoding': 'gzip;q=0' });
  check('gzip;q=0 responde sin comprimir', gzipZero.headers['content-encoding'] === undefined);

  const none = await request('/about');
  check('sin Accept-Encoding no comprime', none.headers['content-encoding'] === undefined);

  const vary = await request('/about', { 'Accept-Encoding': 'gzip' });
  check(
    'Vary: Accept-Encoding',
    String(vary.headers.vary ?? '').includes('Accept-Encoding'),
    vary.headers.vary,
  );

  const identity = await request('/about', { 'Accept-Encoding': 'gzip' });
  check('cuerpo sin comprimir intacto', identity.body.length > 1000, `${identity.body.length}B`);

  // --- 4: cabeceras de seguridad y caché ---------------------------------
  console.log('\nCabeceras');
  const home = await request('/', { 'Accept-Encoding': 'gzip' });
  check('X-Content-Type-Options: nosniff', home.headers['x-content-type-options'] === 'nosniff');
  check(
    'Referrer-Policy',
    Boolean(home.headers['referrer-policy']),
    home.headers['referrer-policy'],
  );
  check(
    'X-Frame-Options',
    Boolean(home.headers['x-frame-options']),
    home.headers['x-frame-options'],
  );
  check('Permissions-Policy', Boolean(home.headers['permissions-policy']));
  check('sin X-Powered-By', home.headers['x-powered-by'] === undefined);

  const htmlCache = String(home.headers['cache-control'] ?? '');
  check('HTML revalida siempre', htmlCache.includes('must-revalidate'), htmlCache);

  const bundleCache = String((await request(mainBundle)).headers['cache-control'] ?? '');
  check('bundle con hash: inmutable', bundleCache.includes('immutable'), bundleCache);

  const assetCache = String(png.headers['cache-control'] ?? '');
  check('asset sin hash: caché corta', assetCache.includes('86400'), assetCache);

  const robots = String((await request('/robots.txt')).headers['cache-control'] ?? '');
  check('robots.txt: 1 hora', robots.includes('3600'), robots);

  const sitemap = String((await request('/sitemap.xml')).headers['cache-control'] ?? '');
  check('sitemap.xml: 1 hora', sitemap.includes('3600'), sitemap);

  const notFound = await request('/no-existe', { 'Accept-Encoding': 'gzip' });
  check('404 real', notFound.status === 404, String(notFound.status));
  check('404 comprimido', notFound.headers['content-encoding'] === 'gzip');

  console.log(`\n${failures === 0 ? 'TODO OK' : `${failures} comprobación(es) fallidas`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
