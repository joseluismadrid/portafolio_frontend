import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { sticker, logger } from '@poppinss/cliui';

import { compression } from './compression';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// No anunciar el servidor en cada respuesta.
app.disable('x-powered-by');

// Cabeceras de seguridad para todas las respuestas.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // HSTS solo cuando la petición llega por HTTPS. Un `X-Forwarded-Proto`
  // falsificado no aporta nada: los navegadores ignoran HSTS si la respuesta
  // viaja por HTTP.
  if (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }

  next();
});

// Compresión gzip/brotli (implementada con `node:zlib`, sin dependencias).
app.use(compression());

// robots.txt y sitemap.xml se atienden ANTES de los archivos estáticos para
// poder darles una caché corta: el sitemap cambia cuando cambia el contenido.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(join(browserDistFolder, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(join(browserDistFolder, 'sitemap.xml'));
});

app.use(
  express.static(browserDistFolder, {
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      // Los bundles llevan un hash en el nombre, así que su contenido es
      // inmutable y se pueden cachear para siempre. Los assets sin hash
      // (imágenes, iconos) no: si cambian, el navegador debe poder recibir la
      // versión nueva sin esperar un año.
      const isHashed = /[-.][A-Za-z0-9_-]{8}\.(?:js|css)$/.test(filePath);

      res.setHeader(
        'Cache-Control',
        isHashed ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
      );
    },
  }),
);

// A partir de aquí sólo quedan páginas: las rutas prerenderizadas y el 404.
// El HTML no se cachea a ciegas; se revalida en cada visita.
app.use((req, res, next) => {
  if (!res.getHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    sticker()
      .add('Servidor HTTP iniciado')
      .add('')
      .add(`Servidor ejecutándose en puerto   http://localhost: ${logger.colors.cyan(`${port}`)}`)
      .render();
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
