# Portafolio — José Luis Madrid Londoño

Portafolio profesional de desarrollo de software: página de inicio, perfil,
proyectos, habilidades y un formulario de contacto que consume una API externa.

Sitio canónico: **<https://www.joseluismadrid.com>** (con `www`).

---

## 1. Stack

| Elemento               | Versión / configuración                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Framework              | Angular **21.2** — componentes _standalone_, sin `zone.js` (_zoneless_)                                |
| Renderizado            | SSR (`@angular/ssr`) con **prerenderizado (SSG)** de las rutas públicas y SSR bajo demanda para el 404 |
| Lenguaje               | TypeScript 5.9 (`strict`, `noImplicitOverride`, `noImplicitReturns`, `strictTemplates`)                |
| Estilos                | SCSS con parciales compartidos en `src/styles/` (`colores`, `typografia`, `titulos`, `breakpoints`)    |
| Formularios            | `@angular/forms` — _reactive forms_ con validadores síncronos                                          |
| Notificaciones         | SweetAlert2 (cargado desde `node_modules`, **no** desde CDN)                                           |
| Tests                  | Vitest 4 vía `@angular/build:unit-test`                                                                |
| Análisis estático      | ESLint 9 + `angular-eslint` 21 + `typescript-eslint` 8 (`eslint.config.mjs`)                           |
| Formato                | Prettier 3 (`.prettierrc`, `.prettierignore`) sobre **todo** el repositorio                            |
| Gestor de paquetes     | **pnpm** (`packageManager` de Angular apunta a pnpm)                                                   |
| Servidor de producción | Express 5 (`src/server.ts` + `src/compression.ts`) sirviendo `dist/portafolio`, con gzip/Brotli        |

> _Gates_ de calidad: `tsc`, `pnpm lint`, `pnpm format:check`, `pnpm test` y
> `pnpm build:prod` (ver §5).

---

## 2. Requisitos

- Node.js 20 o superior (probado con 24.x).
- pnpm (probado con 12.11).

```bash
pnpm install
```

No usar `npm` ni `yarn`: el `pnpm-lock.yaml` es la única fuente de verdad de
versiones.

---

## 3. Scripts

| Comando                     | Qué hace                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| `pnpm start`                | Servidor de desarrollo en <http://localhost:4200> (con SSR)       |
| `pnpm start:dev`            | Igual, usando `environment.development.ts`                        |
| `pnpm build`                | Build de desarrollo                                               |
| `pnpm build:prod`           | Build de producción en `dist/portafolio` (prerenderiza las rutas) |
| `pnpm test`                 | Tests unitarios con Vitest                                        |
| `pnpm lint`                 | ESLint sobre todo el repo (`eslint .`)                            |
| `pnpm format`               | Prettier sobre todo el repo (`prettier --write .`)                |
| `pnpm format:check`         | Comprueba el formato sin escribir (para CI)                       |
| `pnpm serve:ssr:portafolio` | Sirve el build con Express (`PORT`, por defecto 4000)             |

Prueba de humo del servidor de producción (comprueba compresión, cabeceras y
caché sobre el build real, con el servidor levantado):

```bash
pnpm build:prod
$env:PORT=4130; node dist/portafolio/server/server.mjs    # en otra terminal
$env:PORT=4130; node tools/smoke-test-server.mjs
```

Para probar el resultado de producción en local:

```bash
pnpm build:prod
$env:PORT=4125            # PowerShell (en bash: PORT=4125)
pnpm serve:ssr:portafolio
```

---

## 4. Estructura

```
src/
├── app/
│   ├── app.{ts,html,scss}          · root: skip-link + header + <main id="contenido"> + footer
│   ├── app.config.ts               · providers (router, http, hydration, SeoService)
│   ├── app.routes.ts               · rutas + title/description por ruta
│   ├── app.routes.server.ts        · Prerender de las rutas públicas, SSR 404 para el resto
│   ├── pages/                      · home · about · projects · skills · contact · not-found
│   └── shared/
│       ├── components/             · header · footer · cards · botones-redes · loader
│       ├── interface/              · contact.interface.ts
│       └── service/                · contact.ts (API) · seo.ts (metadatos por ruta)
├── assets/                         · img/ · icons/ (incluye robots.txt, sitemap.xml, webmanifest)
├── env/                            · environment.ts → development / prod (fileReplacement)
├── styles/                         · parciales SCSS compartidos (sin CSS: solo tokens y mixins)
├── styles.scss                     · estilos globales (box-sizing, body, :focus-visible, .skip-link)
├── index.html                      · metadatos base, favicons, manifest, GTM/GA
├── main.ts / main.server.ts        · bootstrap cliente / servidor
├── server.ts                       · Express: cabeceras, caché, estáticos, robots/sitemap, SSR
└── compression.ts                  · middleware propio de gzip/Brotli (sin dependencias)
```

Configuración y herramientas en la raíz:

```
eslint.config.mjs                   · ESLint (TS + plantillas Angular)
.prettierrc / .prettierignore       · formato (el lockfile queda excluido)
tools/
├── resize-icons.ps1                · redimensiona los PNG de iconos conservando alfa
├── svgo.config.mjs                 · configuración de SVGO usada en `src/assets/img`
└── smoke-test-server.mjs           · prueba de humo del servidor de producción
```

El contenido textual vive **en los componentes** (no hay CMS ni capa de datos).
El único servicio de datos es `ContactService` → `POST {apiUrl}/contact/`.

---

## 5. Calidad

Antes de dar por bueno un cambio:

```bash
pnpm exec tsc -p tsconfig.app.json --noEmit     # tipos de la aplicación
pnpm exec tsc -p tsconfig.spec.json --noEmit    # tipos de los tests
pnpm lint                                        # ESLint (0 avisos)
pnpm format:check                                # Prettier
pnpm test                                        # 14 archivos / 28 tests
pnpm build:prod                                  # build + prerender
```

Presupuestos de bundle definidos en `angular.json` (warning 500 kB, error 1 MB).
`main.js` está en ~461 kB (warning), por debajo del error.

El repositorio entero está formateado con Prettier: si tocas un archivo, ejecuta
`pnpm format` (o Prettier solo sobre lo que tocaste) y `pnpm lint` antes de
cerrar el cambio. `pnpm-lock.yaml` está excluido en `.prettierignore` a
propósito: pnpm lo genera y reformatearlo produce un diff enorme sin cambiar
ninguna resolución.

---

## 6. SEO y renderizado

- Cada ruta declara `title` y `data.description` en `app.routes.ts`.
- `SeoService` aplica al documento, en cada `NavigationEnd`: `title`,
  `meta[name=description]`, `link[rel=canonical]`, `og:title`, `og:description`,
  `og:url` y `twitter:*`. La URL canónica se construye sobre
  `SITE_ORIGIN` (`https://www.joseluismadrid.com`).
- La ruta comodín `**` renderiza `NotFound`, responde **404** y `noCanonical: true`
  evita declarar una canónica en una URL que no existe.
- Las rutas públicas se generan como HTML estático en `dist/portafolio/browser/**/index.html`.

**Al desplegar**, revisar `angular.json` → `security.allowedHosts`: si queda
vacío (`[]`), el servidor rechaza todas las peticiones al validar el `Host` y el
prerenderizado nunca se entrega (cae a render en cliente). Debe incluir el
dominio real, `www` y `localhost`.

---

## 7. Servidor de producción (compresión, caché y cabeceras)

El build se sirve con `src/server.ts` tal cual (PM2), así que la compresión se
hace **en proceso**, sin depender del proxy:

- **Compresión** — `src/compression.ts` es un middleware propio (solo
  `node:zlib`) que negocia `Accept-Encoding` (Brotli `br` > gzip `gzip`, respeta
  `q=0` y `*`), comprime respuestas de texto de más de 1 kB y añade
  `Vary: Accept-Encoding`. Ante cualquier error sirve el cuerpo sin comprimir en
  lugar de romper la respuesta.
- **Cabeceras** — `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`
  y `Permissions-Policy` (cámara, micrófono, geolocalización y pagos denegados).
  HSTS se envía **solo** cuando la petición ya llega por HTTPS.
- **Caché** — bundles con hash (`main-*.js`, `styles-*.css`) un año `immutable`;
  assets sin hash, un día; HTML, `max-age=0, must-revalidate`; `robots.txt` y
  `sitemap.xml`, una hora.
- **`robots.txt` y `sitemap.xml`** se sirven con manejadores explícitos **antes**
  de `express.static`: si van después, los sirve el estático con la caché larga
  de los assets.

---

## 8. Accesibilidad

- Enlace «Saltar al contenido principal» (`.skip-link`) como primer elemento
  enfocable; `<main id="contenido" tabindex="-1">` como destino.
- `:focus-visible` global con contorno visible; el formulario añade borde + halo.
- Los títulos animados respetan `prefers-reduced-motion: reduce`.
- Formulario: `<h1>` fuera del `<legend>` (el `legend` solo admite _phrasing
  content_), `aria-invalid` y `aria-describedby` en cada campo con error, y el
  botón de envío permanece activo salvo mientras hay un envío en curso.
- Las imágenes decorativas/duplicadas (tooltips de redes, iconos de bloqueo)
  están fuera del árbol de accesibilidad.

---

## 9. Limitaciones conocidas / siguientes pasos

- `web-app-manifest-512x512.png` (231,1 KiB) solo se descarga al instalar la PWA
  y sigue sin optimizar; se puede recomprimir con `pnpm dlx sharp-cli`
  conservando `image/png`, pero no hay forma de verificar la instalación en todas
  las plataformas desde aquí.
- Los SVG se optimizaron con `tools/svgo.config.mjs` (precisión 6, sin fusionar
  paths). El preset por defecto de SVGO reduce más (logo.svg 73,3 → 24,3 KiB) pero
  fusiona paths y cambia hasta un 29 % de los píxeles a tamaño de uso; queda como
  opción si algún día se acepta esa diferencia.
- No hay `Content-Security-Policy`: `index.html` carga GTM/GA y una política real
  debe probarse contra el sitio desplegado.
- La cobertura de tests es básica (componentes + servicio de contacto + SEO).
- `ContactService` asume un backend `POST /contact/`; no hay contrato OpenAPI ni
  esquema compartido con el backend.
- No se ejecutó auditoría Lighthouse/axe ni pruebas en navegador real: la
  verificación visual se hizo con capturas de Edge headless y comparación de
  píxeles (ver `docs/refactor-plan.md` §10).

---

## 10. Documentación interna

- [`docs/refactor-plan.md`](docs/refactor-plan.md) — auditoría, plan por
  sesiones, resultados medidos y decisiones.
- [`AGENTS.md`](AGENTS.md) — convenciones y flujo de trabajo para agentes y
  colaboradores.
