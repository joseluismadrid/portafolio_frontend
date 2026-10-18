# Plan de refactorización — Portafolio (frontend)

> **Estado: sesiones S1–S6 ejecutadas y verificadas.** Los resultados reales,
> las métricas finales y las decisiones que **no** se tomaron están en la
> **§9 Resultados**. La §4 conserva los hallazgos tal como se detectaron en la
> auditoría (con las referencias de línea originales) para poder contrastarlos.
>
> Fase 1 (auditoría) y Fase 2 (plan). Fecha de auditoría: 2026-10-17 · Rama:
> `main` · Commit base: `f26a51d`. Los cambios de S1–S6 están sin commitear.

---

## 1. Contexto técnico verificado

| Elemento                | Valor real                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Framework               | Angular **21.2.x** (standalone components, signals disponibles)                                                            |
| Builder                 | `@angular/build:application` + SSR (`@angular/ssr`) con `RenderMode.Prerender` para `**`                                   |
| TypeScript              | 5.9.2 · `strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `strictTemplates` |
| Estilos                 | SCSS con parciales globales (`colores`, `typografia`, `formas`, `breakpoints`) + `stylePreprocessorOptions`                |
| Estado reactivo         | **Zoneless** (no hay `zone.js` en `package.json` ni en el bundle)                                                          |
| Gestor de paquetes      | pnpm 12.11.2 (`angular.json` → `cli.packageManager: "pnpm"`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` versionado)           |
| Tests                   | Vitest 4.1.8 vía `@angular/build:unit-test` (12 archivos, 15 tests)                                                        |
| Formatter               | Prettier 3.8.1 (`.prettierrc`, parser `angular` para HTML). **Sin ESLint configurado**                                     |
| Almacenamiento de datos | Todo el contenido está **hardcodeado** en los componentes (no hay capa de datos)                                           |
| Único endpoint          | `POST {apiUrl}/contact/` (`ContactService`)                                                                                |

### Estructura observada

```
src/
├── app/
│   ├── app.{ts,html,scss,spec.ts}
│   ├── app.config.ts / app.config.server.ts / app.routes.ts / app.routes.server.ts
│   ├── pages/{home,about,projects,skills,contact}/     (ts, html, scss, spec)
│   └── shared/
│       ├── components/{header,footer,cards,botones-redes,loader}/
│       ├── interface/contact.interface.ts
│       └── service/contact.ts
├── assets/{img,icons}/  · robots.txt · sitemap.xml
├── env/{environment,environment.development,environment.prod,environment.develoment}.ts
├── styles/{colores,typografia,formas,breakpoints}.scss
├── styles.scss · index.html · main.ts · main.server.ts · server.ts
```

La estructura de carpetas es **buena y coherente** (`pages/` vs `shared/`, separación interface/service). No se propone reorganizar el árbol ni cambiar de framework.

---

## 2. Baseline medido (antes de tocar nada)

Comandos ejecutados y resultado real:

| Comando                                         | Resultado                                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm exec tsc -p tsconfig.app.json --noEmit`   | ✅ exit 0, **0 errores de tipos**                                                                           |
| `pnpm exec ng test --watch=false`               | ✅ **12 archivos / 15 tests en verde** (64.6 s)                                                             |
| `pnpm exec ng build --configuration production` | ✅ exit 0 · **`main.js` 452.66 kB raw / 113.32 kB transfer** · `styles.css` 209 B · 6 rutas prerenderizadas |
| Peso de `dist/portafolio/browser/assets`        | ⚠️ **4.083,6 kB** (4,08 MB)                                                                                 |

**No existe ningún defecto P0**: el proyecto compila, tipa y pasa tests. Los hallazgos son de SEO, rendimiento, accesibilidad y mantenibilidad.

Evidencia clave recolectada (comprobada en `dist/`):

```
dist/portafolio/browser/about/index.html
  <link rel="canonical" href="https://www.joseluismadrid.com/">     ← canónica del ROOT, no de /about
  <meta property="og:url" content="https://www.joseluismadrid.com/"> ← ídem
  <meta name="description" content="Portafolio de Jose Luis Madrid Londoño…"> ← idéntica en las 5 páginas
  <title>Sobre mí | José Luis Madrid Londoño - Desarrollador Full Stack</title> ← ✅ esto sí es correcto por ruta

src/assets/robots.txt        → Sitemap: https://joseluismadrid.com/sitemap.xml      (sin www)
src/assets/sitemap.xml       → <loc>https://joseluismadrid.com/…</loc>              (sin www)
src/index.html (canonical)   → https://www.joseluismadrid.com/                      (con www)
```

---

## 3. Calificación inicial por área

Escala 1–5. Cada nota está respaldada por los hallazgos de la sección 4.

| Área                        | Nota    | Justificación breve                                                                                                                                                                                                                                                         |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquitectura y estructura   | **4/5** | Carpetas claras, componentes standalone, rutas ordenadas. Solo detalles: `title` sin usar en `App`, componentes con `imports: []` o `standalone: true` redundante.                                                                                                          |
| Componentes y reutilización | **3/5** | `Cards` está bien extraído y se reutiliza, pero hay **4 bloques de "tarjeta"** y el bloque de "título neón con animación typing" **copiado en 5 archivos**.                                                                                                                 |
| TypeScript                  | **4/5** | `strict` activo, `IContact` tipado, sin `any` en plantillas. Único `any`: el retorno de `ContactService`. Arrays de datos sin interface propia.                                                                                                                             |
| Estilos y UI/UX             | **3/5** | Sistema de variables coherente y buena jerarquía visual, pero: `@keyframes` duplicados, reglas vacías, variables muertas, `formas.scss` apoyado en un `var(--radius)` inexistente, `cursor:pointer` en elementos no clicables, sin skip-link, sin `prefers-reduced-motion`. |
| SEO técnico                 | **2/5** | `title` por ruta ✅, `robots.txt` y `sitemap.xml` ✅, `alt` descriptivos ✅, prerender ✅. Pero **canonical y `og:url` duplicados apuntando al root en las 5 páginas**, descripciones idénticas, conflicto www/no-www, manifest y favicons sin enlazar, soft-404.           |
| Rendimiento                 | **2/5** | Bundle razonable (113 kB transfer), pero se envían **4,08 MB de assets** con un SVG muerto de **1,44 MB**, PNGs de 373 kB / 264 kB renderizados a 48 px y **SweetAlert2 cargado dos veces** (bundle + CDN).                                                                 |
| Seguridad del frontend      | **4/5** | Sin secretos (la `apiUrl` y los IDs de GA/GTM son públicos por diseño), `rel="noopener noreferrer"` correcto en enlaces externos, sin `innerHTML`. A mejorar: script CDN sin SRI (además redundante).                                                                       |
| Pruebas y calidad           | **3/5** | 15 tests en verde, pero cobertura superficial (casi todos `should create`). Prettier configurado pero no aplicado de forma consistente. Sin ESLint.                                                                                                                         |
| Documentación               | **2/5** | `README.md` es el scaffold por defecto de Angular; no hay `AGENTS.md` ni `docs/`.                                                                                                                                                                                           |
| Gestión de paquetes         | **3/5** | pnpm correcto y lockfile versionado, pero: devDependency `sitemap` sin uso, `.vscode/tasks.json` aún con `"type": "npm"`, archivo duplicado `environment.develoment.ts` (typo).                                                                                             |

**Promedio inicial ≈ 3,0 / 5**

---

## 4. Hallazgos priorizados

### P0 — Crítico

Ninguno. El proyecto compila, pasa el type-check y los tests en verde.

---

### P1 — Alto

#### P1-1 · Canonical y `og:url` duplicados en todas las páginas (SEO)

- **Problema:** `src/index.html` declara `rel="canonical"` y `og:url` **estáticos** apuntando siempre al root. Como SSR prerenderiza 5 rutas, las 5 generan una canónica idéntica.
- **Evidencia:** `dist/portafolio/browser/about/index.html` (ver §2). Es exactamente el caso de "metadatos duplicados" que la auditoría debía detectar.
- **Impacto:** Google puede consolidar `/about`, `/projects`, `/skills` y `/contact` en `/` y no indexarlas. La auditoría debía detectar metadatos duplicados.
- **Archivos:** `src/index.html`, `src/app/app.routes.ts`, nuevo `src/app/shared/service/seo.ts` (o `core/`).
- **Esfuerzo:** ~1 h.

#### P1-2 · Dominio canónico contradictorio (SEO)

- **Problema:** el sitio se declara bajo **dos hosts distintos** para el mismo contenido: `https://www.joseluismadrid.com/` (canonical, og:url, og:image) y `https://joseluismadrid.com/` (`robots.txt`, `sitemap.xml`).
- **Evidencia:** §2, los cuatro archivos citados.
- **Impacto:** señales divergentes de canonicidad; el `Sitemap:` de robots.txt apunta a un host distinto del canonical.
- **Archivos:** `src/assets/robots.txt`, `src/assets/sitemap.xml`, `src/index.html`.
- **Bloqueado por:** Q1 (dominio oficial).
- **Esfuerzo:** ~20 min.

#### P1-3 · `assets/img/logo-fondo.svg` (1,44 MB) se publica y nunca se usa (Rendimiento)

- **Problema:** archivo muerto de **1.443,1 kB** presente en `dist/`, sin ninguna referencia en el código (grep `logo-fondo` → 0 usos).
- **Impacto:** 35 % del peso total desplegado de assets. Además `foto.svg` (62,1 kB) también está sin usar.
- **Archivos:** `src/assets/img/logo-fondo.svg`, `src/assets/img/foto.svg`.
- **Esfuerzo:** ~10 min (borrado verificado).

#### P1-4 · Imágenes de tecnologías sobredimensionadas (Rendimiento)

- **Problema:** se sirven PNGs a resolución enorme para renderizarse a **48×48 px** (`about.scss` → `.tech-card img { width:48px; height:48px }`, `width/height="60"` en el HTML):
  `mongo.png` 373,2 kB · `mysql.png` 264,4 kB · `instagram.png` 147,1 kB · `puntonet.png` 121,5 kB · `html.png` 81,4 kB · `angular.png` 70,8 kB · `docker.png` 62,1 kB.
- **Impacto:** ~1,1 MB por encima de lo necesario en la ruta `/about`, en `loading="lazy"` (mitiga, pero no soluciona).
- **Archivos:** `src/assets/icons/*`, `src/app/pages/about/about.ts`.
- **Riesgo:** hay que regenerar binarios; se preservan nombres y rutas (no cambia el contrato del componente).
- **Esfuerzo:** ~1 h.

#### P1-5 · SweetAlert2 cargado dos veces (Rendimiento + Seguridad)

- **Problema:** `sweetalert2@11.26.25` está en `dependencies` y se importa en `contact.ts` (`import Swal from 'sweetalert2'`), **y además** `src/index.html` lo carga desde CDN: `<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11">`.
- **Evidencia:** el string `sweetalert2` aparece en `dist/.../main-HFB6HCB3.js`; y el `<script>` CDN está en `index.html:192`.
- **Impacto:** petición de terceros innecesaria, peso duplicado, dependencia externa sin atributo `integrity` (superficie de supply-chain) y en una versión de CDN fijada "a lo ancho" (`@11` = siempre la última 11.x).
- **Archivos:** `src/index.html`.
- **Conservación de comportamiento:** ambas rutas exponen `window.Swal`; el código usa el **módulo npm**, por lo que eliminar el `<script>` no altera la funcionalidad.
- **Esfuerzo:** ~10 min.

#### P1-6 · Animaciones decorativas infinitas sin `prefers-reduced-motion` (Accesibilidad)

- **Problema:** los títulos de las 5 páginas tienen `animation: typing 3s …, blink 0.8s infinite`. El `blink` es infinito y decorativo.
- **Evidencia:** `home.scss:34,181` · `about.scss:64,125` · `projects.scss:61` · `skills.scss:59` · `contact.scss:72`.
- **Referencia:** guía de UX del proyecto — _"Continuous Animation: infinite animations are distracting → use for loading indicators only"_ y _"Reduced Motion: severity High"_.
- **Archivos:** los 5 `.scss` de páginas + `src/styles/`.
- **Esfuerzo:** incluido en P1-7.

#### P1-7 · Bloque de título + `@keyframes` duplicado en 5 archivos (Mantenibilidad)

- **Problema:** el mismo bloque (~25 líneas) de `.titulo { color:$primary; clamp(2rem,3vw+1rem,4rem); text-shadow: …; overflow:hidden; white-space:nowrap; border-right:3px solid $primary; width:fit-content; animation: typing…, blink… }` está copiado, con leves variaciones, en `home.scss` (×2), `about.scss` (×2), `projects.scss`, `skills.scss`, `contact.scss`. `@keyframes typing` y `@keyframes blink` están definidos **4 veces** (en `about`, `projects`, `skills`, `contact`) y una 5.ª anidada dentro de `.personinfo` en `home.scss`.
- **Impacto:** cualquier ajuste de diseño debe replicarse en 6 sitios; ya hay derivas (contact usa `clamp(2rem,2vw+0.2rem,4rem)`; about usa `clamp(2rem,3vw+1rem,4rem)`).
- **Solución propuesta:** extraer `@mixin titulo-neon` (o `%placeholder`) + los `@keyframes` a `src/styles/` y consumirlo desde los 5 archivos. **No cambia el diseño actual**, solo elimina la copia.
- **Archivos:** nuevo `src/styles/animaciones.scss` (o `titulos.scss`) + los 5 `.scss`.
- **Riesgo:** bajo; mejora visual solo si se decide unificar el `clamp` (se preguntará antes).
- **Esfuerzo:** ~1,5 h.

#### P1-8 · `ContactService` sin tipado de respuesta (TypeScript)

- **Problema:** `contactame(data: IContact): Observable<any>` y `this.http.post<any>(…)`. Es el **único `any` del proyecto**.
- **Impacto:** se pierde la verificación del contrato con el backend en el punto de integración; el `any` se propaga al `subscribe`.
- **Archivos:** `src/app/shared/service/contact.ts`, `src/app/shared/interface/contact.interface.ts`.
- **Esfuerzo:** ~20 min.

#### P1-9 · El formulario se vacía cuando el envío falla (UX / pérdida de datos) — _requiere autorización_

- **Problema:** en `contact.ts`, la rama `error` ejecuta `this.contactForm.reset()` igual que la rama `next`. Si el usuario pierde la conexión o el backend falla, **se borra todo lo que escribió** (incluido el mensaje, que puede tener hasta 2000 caracteres).
- **Evidencia:** `contact.ts:176-181`.
- **Impacto:** pérdida de datos del usuario; es un defecto funcional, no una preferencia.
- **Archivos:** `src/app/pages/contact/contact.ts`.
- **Nota:** es un **cambio de comportamiento** → se implementará solo con autorización (Q2).

#### P1-10 · Botón de envío deshabilitado impide ver las validaciones (Accesibilidad)

- **Problema:** `[disabled]="contactForm.invalid || contactForm.pending || loading"`. Con el botón deshabilitado, quien navega con teclado o lector de pantalla no puede disparar el evento que muestra los mensajes de error, y queda sin saber **qué** campo está mal (WCAG 3.3.1 / 3.3.3).
- **Evidencia:** `contact.html:154` + lógica de `markAllAsTouched()` ya existente en `contact.ts:131-137` (la retroalimentación ya está implementada, solo está inaccesible).
- **Archivos:** `src/app/pages/contact/contact.html`.
- **Nota:** cambio de comportamiento (el botón pasa a estar siempre activo salvo `loading`) → requiere autorización (Q2).

#### P1-11 · `.vscode/tasks.json` sigue invocando npm (Consistencia)

- **Problema:** tras el commit `f26a51d "chore: migrar gestor de paquetes a pnpm"`, las tareas del editor siguen con `"type": "npm"`.
- **Archivos:** `.vscode/tasks.json`.
- **Esfuerzo:** ~10 min.

---

### P2 — Medio

| ID    | Hallazgo                                                                                                                                                                              | Evidencia                                                   | Archivos                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| P2-1  | `<h1>` dentro de `<legend>`: `legend` solo admite _phrasing content_; es HTML inválido y rompe la semántica del formulario                                                            | `contact.html:5-7`                                          | `contact.html`                                  |
| P2-2  | `contact.html` repite `contactForm.get('x')?.errors?.['y']` **12 veces**; los getters `nombre/email/servicio/mensaje` existen pero la plantilla no los usa                            | `contact.html:23-148` vs `contact.ts:235-260`               | `contact.html`, `contact.ts`                    |
| P2-3  | Falta _skip link_ y `<main>` no tiene `id`/`tabindex`: no se puede saltar el header con teclado                                                                                       | `app.html:2-4`                                              | `app.html`, `header.scss`                       |
| P2-4  | `cursor: pointer` en `.tech-card`, que **no es clicable** (sugiere interactividad inexistente)                                                                                        | `about.scss:170`                                            | `about.scss`                                    |
| P2-5  | Focos sin estilo propio: `outline: none` en `contact.scss:138` sin sustituto visible                                                                                                  | `contact.scss:135-143`                                      | `contact.scss`                                  |
| P2-6  | `ChangeDetectorRef.detectChanges()` como parche dentro de `finalize()` en una app **zoneless**; se elimina al pasar `loading` a `signal()`                                            | `contact.ts:46-47,153-160`                                  | `contact.ts`                                    |
| P2-7  | Sin descripciones `meta description` por ruta (todas las páginas comparten la del root)                                                                                               | `dist/**/index.html`                                        | `index.html`, `seo.ts`                          |
| P2-8  | Ruta comodín `**` → `redirectTo: ''`: cualquier URL inexistente responde **200 con el contenido de home** (soft-404)                                                                  | `app.routes.ts:44-47` + 0 archivos `404.html` en `dist/`    | `app.routes.ts`, `app.routes.server.ts`         |
| P2-9  | `site.webmanifest` (y los iconos que referencia) **no está enlazado** en `index.html`; tampoco `favicon.svg`, `apple-touch-icon.png`, `favicon-96x96.png`                             | grep de `manifest`/`apple-touch` → 0 resultados             | `index.html`                                    |
| P2-10 | `src/env/environment.develoment.ts` (typo) duplica `environment.development.ts` y no lo referencia nadie                                                                              | `src/env/`                                                  | —                                               |
| P2-11 | `src/styles/formas.scss` define `$radius*` sobre `var(--radius)`, una custom property **que no existe en ningún archivo**, y ninguna de esas 5 variables se usa (verificado con grep) | `formas.scss:3-7`                                           | `formas.scss`                                   |
| P2-12 | Variables SCSS muertas: `$card-secondary`, `$card-hover`, `$font-size-title`, `$font-size-small`, `$font-size-large`, `$line-height`                                                  | grep: solo la definición                                    | `colores.scss`, `typografia.scss`               |
| P2-13 | Emojis como iconos en UI (`🔒` en proyectos, `✔`/`✓` vía `content`) en lugar de SVG                                                                                                   | `projects.html:30`, `projects.scss:168`, `skills.scss:113`  | `projects.html`, `projects.scss`, `skills.scss` |
| P2-14 | `@Input()` decorador en `Cards` y `Loader` en un proyecto Angular 21 donde el resto ya usa `signal()`                                                                                 | `cards.ts:11-13`, `loader.ts:16`                            | `cards.ts`, `loader.ts`                         |
| P2-15 | Ni `Projects` ni `Skills` declaran `standalone: true` (el resto sí): inconsistencia de estilo (funciona igual)                                                                        | `projects.ts:3-8`, `skills.ts:3-8`                          | —                                               |
| P2-16 | `Contributions`/`Perfil` en `Home` sin `readonly` ni tipo/interfaz; nombres en PascalCase/inglés mezclados (`Perfil` vs `contributions`)                                              | `home.ts:16-52`                                             | `home.ts`                                       |
| P2-17 | `Cards` añade un `div.container` + `:host` al 100 %: un nivel de anidación innecesario en un componente reutilizable                                                                  | `cards.html:1-2`, `cards.scss:6-16`                         | `cards.html`, `cards.scss`                      |
| P2-18 | Roboto **no está cargada en ningún sitio** y es la `$font-family` base: el sitio renderiza siempre con el `sans-serif` del sistema                                                    | grep `fonts.googleapis` → 0 resultados; `typografia.scss:9` | `index.html` o `typografia.scss`                |

---

### P3 — Bajo

| ID   | Hallazgo                                                                                                                             | Evidencia                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| P3-1 | `App.title = signal('portafolio')` nunca se usa                                                                                      | `app.ts:13`                                      |
| P3-2 | Comentarios muertos en `loader.html` (`<!-- <div class="contact__loader"> -->`) y regla vacía `.contact__loader {}` en `loader.scss` | `loader.html:1,8`, `loader.scss:8-9`             |
| P3-3 | `imports: []` innecesario en `Projects`/`Skills`; `pathMatch: 'full'` redundante en rutas hoja                                       | `projects.ts:5`, `skills.ts:4`, `app.routes.ts`  |
| P3-4 | `alt="Logo"` poco descriptivo en el enlace de inicio (mejor "Inicio — José Luis Madrid")                                             | `header.html:4`                                  |
| P3-5 | `body { min-width: 100% }` y `// overflow-x: hidden` comentado en `styles.scss`                                                      | `styles.scss:19,22`                              |
| P3-6 | Prettier no aplicado de forma consistente (p. ej. `contact.ts` con una propiedad por línea)                                          | `.prettierrc` + `pnpm exec prettier --check src` |
| P3-7 | `README.md` es el scaffold de Angular; no documenta el proyecto                                                                      | `README.md`                                      |
| P3-8 | Sin ESLint: se deben definir los gates de calidad reales                                                                             | `package.json`                                   |

---

## 5. Sesiones de trabajo propuestas (1–2 h cada una)

Cada sesión es autocontenida: se puede mergear y verificar por separado.

| Sesión | Contenido                                                                                                                                                                               | Prioridad                                    | Esfuerzo |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------- |
| **S1** | SEO: canonical/`og:url` por ruta + descripciones por ruta + unificación de dominio + manifest/favicons + política de soft-404                                                           | P1-1, P1-2, P2-7, P2-8, P2-9                 | ~1,5 h   |
| **S2** | Rendimiento de assets: borrar SVG muertos, optimizar PNGs, quitar CDN de SweetAlert2                                                                                                    | P1-3, P1-4, P1-5                             | ~1,5 h   |
| **S3** | Estilos: `@mixin` de título + `@keyframes` compartidos + `prefers-reduced-motion` + focos visibles + quitar `cursor:pointer` erróneo                                                    | P1-6, P1-7, P2-4, P2-5                       | ~2 h     |
| **S4** | TypeScript y limpieza: tipar `ContactService`, `loading` como `signal` (elimina `ChangeDetectorRef`), variables muertas, `environment.develoment.ts`, `.vscode/tasks.json`, `App.title` | P1-8, P1-11, P2-6, P2-10, P2-11, P2-12, P3-1 | ~1,5 h   |
| **S5** | Formulario y a11y: `legend`/`h1`, errores vía getters + `aria-invalid`/`aria-describedby`, skip-link, (opcional) botón siempre activo, (opcional) no borrar al fallar                   | P1-9*, P1-10*, P2-1, P2-2, P2-3              | ~2 h     |
| **S6** | Documentación y calidad: `README.md`, `AGENTS.md`, criterio de lint, Prettier sobre archivos tocados                                                                                    | P3-6, P3-7, P3-8                             | ~1,5 h   |

\* P1-9 y P1-10 cambian comportamiento observable → **pendientes de autorización (Q2)**.

---

## 6. Criterios de aceptación (por sesión)

1. `pnpm exec tsc -p tsconfig.app.json --noEmit` → 0 errores.
2. `pnpm exec ng test --watch=false` → los 15 tests actuales siguen en verde + los nuevos que se añadan.
3. `pnpm exec ng build --configuration production` → exit 0, sin superar los _budgets_ (`500 kB` warning / `1 MB` error) y sin nuevas advertencias.
4. El peso de `dist/**/assets` y de `main.js` no aumenta.
5. En S1: las 5 páginas prerenderizadas deben tener `canonical` **distinto y correcto**; verificación con `Select-String` sobre `dist/`.
6. En S3: `prefers-reduced-motion: reduce` desactiva el `typing`/`blink`; verificación visual.
7. Identidad visual preservada: no se cambian colores, tipografía, espaciados ni estructura de las páginas (salvo los defectos enumerados).
8. Cada sesión actualiza su sección en `docs/refactor-plan.md` con el resultado real de las validaciones.

---

## 7. Riesgos y mitigaciones

| Riesgo                                                     | Mitigación                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Romper el prerender SSR al tocar metadatos                 | Se verifica leyendo el HTML generado en `dist/**/index.html`, no asumiendo que funciona.                                  |
| Cambios de comportamiento en el formulario                 | Solo con autorización explícita (Q2); se documentan como cambio de comportamiento.                                        |
| Regenerar imágenes rompe rutas                             | Se conservan **nombres y rutas** de archivo; solo cambia el contenido binario y las dimensiones declaradas.               |
| Ejecutar Prettier sobre todo el repo genera un diff enorme | Prettier se aplica **solo a los archivos intervenidos** en cada sesión.                                                   |
| Abstracción excesiva al unificar estilos                   | Se extrae solo lo que está literalmente duplicado hoy (título + 2 `keyframes`); no se crean componentes genéricos nuevos. |
| El contenido hardcodeado en componentes                    | Fuera de alcance: moverlo a servicios/JSON no resuelve un problema real y aumenta el riesgo.                              |

---

## 8. Fuera de alcance (con justificación)

- **Cambiar de framework, builder o estrategia de renderizado** → funciona y no hay beneficio demostrable.
- **Migrar el contenido hardcodeado a una capa de datos / CMS** → no hay problema real; aumentaría complejidad.
- **Añadir Tailwind, una librería de componentes o de iconos (Lucide, etc.)** → el sistema SCSS actual es coherente; bastan SVG inline propios.
- **Rediseño visual / cambio de paleta** → la identidad visual se preserva por requisito explícito. (El motor de diseño sugiere JetBrains Mono + IBM Plex Sans + acento verde; se descarta por ser un cambio de identidad, no una corrección.)
- **Añadir ESLint** → no está configurado hoy; se propone como decisión explícita en S6, no como instalación silenciosa.

---

## 9. Resultados (S1–S6)

### 9.1 Métricas antes / después

Todos los valores medidos en este equipo con los comandos indicados.
`main.js` y `styles.css` se reportan en **kB decimales** (lo que imprime el
build); `assets` en **KiB** (1024 B), que es como se midió el baseline.

| Métrica                                          | Baseline (`f26a51d`)           | Final                                               | Comando / evidencia                                    |
| ------------------------------------------------ | ------------------------------ | --------------------------------------------------- | ------------------------------------------------------ |
| `tsc -p tsconfig.app.json --noEmit`              | exit 0                         | exit 0                                              | `pnpm exec tsc …`                                      |
| `tsc -p tsconfig.spec.json --noEmit`             | exit 0                         | exit 0                                              | `pnpm exec tsc …`                                      |
| Tests                                            | 12 archivos / 15 tests         | **14 archivos / 28 tests**                          | `pnpm test`                                            |
| `ng build --configuration production`            | exit 0                         | exit 0                                              | `pnpm build:prod`                                      |
| Prerender                                        | 6 rutas                        | 6 rutas                                             | salida del build                                       |
| `main.js`                                        | 452,66 kB / 113,32 kB transfer | 461,06 kB / 114,87 kB transfer                      | salida del build                                       |
| `styles.css`                                     | 209 B                          | 614 B                                               | salida del build                                       |
| `dist/**/assets`                                 | 4.083,6 KiB                    | **1.255,8 KiB (−69,2 %)**                           | `Get-ChildItem -Recurse \| Measure-Object Length -Sum` |
| Iconos PNG                                       | ~1.424 KiB (19 archivos)       | **516,4 KiB**                                       | ídem                                                   |
| `@keyframes typing/blink` en el bundle           | 5 copias escritas a mano       | 12 (6 componentes × 2, ya encapsuladas por Angular) | conteo con regex sobre `main-*.js`                     |
| CSS global muerto (`@keyframes` en `styles.css`) | 2 keyframes globales           | 0                                                   | `styles-*.css`                                         |

El `main.js` creció **+8,40 kB** (452,66 → 461,06 kB) por el `SeoService`, la
página `NotFound` y el formulario tipado. Al quitar `CommonModule`/`RouterModule`
de los componentes que no los usaban el bundle apenas varió (461,23 → 461,06 kB):
Angular ya los descartaba por _tree-shaking_. La limpieza se mantiene porque
evita que vuelvan a colarse, **no** por el tamaño.
(Nota: el build imprime kB decimales; las mediciones de `assets` con
`Measure-Object` están en KiB, no mezclar ambas cifras.)

### 9.2 Qué se hizo en cada sesión

| Sesión                            | Resultado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Verificación                                                                                                                                                                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1** SEO                        | `SeoService` (canónica, `og:url`, descripción y título sociales por ruta), `title` + `data.description` en las 5 rutas, `NotFound` con `noCanonical`, dominio unificado a `www`, manifest/favicons enlazados, `app.routes.server.ts` explícito + `**` SSR 404. **Hallazgo nuevo P0/P1 no detectado en la auditoría:** `security.allowedHosts: []` hacía fallar _todas_ las peticiones SSR («Bad Request»), por lo que el HTML prerenderizado nunca se servía.                                                                                         | HTML generado en `dist/**/index.html`: canónica y `og:url` iguales entre sí y **distintas por página**; `/no-existe` → **HTTP 404** con `ng-server-context="ssr"`, sin canónica; `/` y `/about` → `ng-server-context="ssg"`.                                                      |
| **S2** Rendimiento                | Borrados `logo-fondo.svg` (1443,1 kB) y `foto.svg` (62,1 kB) sin referencias; 19 PNG redimensionados a ≤96 px preservando alfa y proporción (`tools/resize-icons.ps1`); eliminado el `<script>` CDN de SweetAlert2 (ya venía en el bundle).                                                                                                                                                                                                                                                                                                           | assets 4.083,6 → 1.255,8 KiB; build exit 0; los 6 rutas prerenderizadas.                                                                                                                                                                                                          |
| **S3** Estilos                    | `src/styles/titulos.scss` con los `@keyframes` y el mixin `titulo-neon`/`titulo-neon-estatico` (incluye `prefers-reduced-motion`); eliminados los bloques duplicados de 5 páginas; `formas.scss` borrado; variables SCSS muertas fuera; `outline: none` del formulario ahora con borde + halo; `cursor: pointer` falso fuera; borde transparente en `.menu a` (evita el salto de 1 px al hacer hover).                                                                                                                                                | 12 keyframes encapsulados en el bundle y 0 globales muertos; `styles.css` 705 → 614 B; build y tests en verde; `styles.scss` ya no importa `titulos.scss` (era CSS muerto).                                                                                                       |
| **S4** TypeScript y limpieza      | `ContactService.contactame(): Observable<unknown>` (último `any`); `loading` como `signal` y `ChangeDetectorRef` fuera; `environment.develoment.ts` (typo) borrado; `sitemap` (devDependency sin uso) eliminado con pnpm; `.vscode/tasks.json` con tareas `shell` de pnpm; `App.title` fuera; `imports: []` y `CommonModule`/`RouterModule` sin uso eliminados.                                                                                                                                                                                       | `tsc` (app y spec) exit 0; tests y build en verde; `pnpm-lock.yaml` con −46 líneas (solo el paquete eliminado y sus dependencias).                                                                                                                                                |
| **S5** Formulario y accesibilidad | `<h1>` fuera del `<legend>` + `aria-labelledby` en el `fieldset`; 12 llamadas `form.get('x')?.errors?.['y']` sustituidas por getters tipados (`nombreError`… → `string \| null`) con `aria-invalid`/`aria-describedby`; skip-link y `<main id="contenido" tabindex="-1">`; `article` → `div` donde no era contenido autocontenido; `alt` del logo descriptivo; tooltips de redes fuera del árbol de accesibilidad. **Cambios de comportamiento autorizados:** el formulario ya no se vacía al fallar y el botón solo se deshabilita durante el envío. | HTML prerenderizado: skip-link, `main#contenido`, `<h1 id="contact-title">`, `fieldset aria-labelledby`, y el botón **sin** `disabled` en la carga inicial (antes nacía deshabilitado); 4 tests nuevos cubren envío correcto, envío fallido (conserva datos) y mensajes de error. |
| **S6** Documentación y calidad    | `README.md` del proyecto, `AGENTS.md` con convenciones y trampas, esta sección de resultados, y Prettier aplicado **solo a los archivos tocados**.                                                                                                                                                                                                                                                                                                                                                                                                    | `pnpm test` 14/28 en verde y `build:prod` exit 0 **después** del formateo.                                                                                                                                                                                                        |

### 9.3 Calificación final

| Área                        | Antes | Después | Motivo del cambio                                                                       |
| --------------------------- | ----- | ------- | --------------------------------------------------------------------------------------- |
| Arquitectura y estructura   | 4     | **4**   | Sin cambios estructurales (no hacía falta). Se limpiaron `imports` y estado muerto.     |
| Componentes y reutilización | 3     | **4**   | El bloque de título animado pasó de 6 copias a un único mixin.                          |
| TypeScript                  | 4     | **5**   | Cero `any`; respuesta del servicio `unknown`; formulario con getters tipados.           |
| Estilos y UI/UX             | 3     | **4**   | Tokens muertos fuera, `formas.scss` eliminado, foco visible, hover sin salto.           |
| SEO técnico                 | 2     | **5**   | Canónica/`og:url`/descripción por ruta, dominio unificado, 404 real, manifest enlazado. |
| Rendimiento                 | 2     | **4**   | −69 % de assets y CDN duplicado fuera; queda la conversión a WebP/SVGO.                 |
| Seguridad del frontend      | 4     | **5**   | Sin script de terceros (CDN) y con superficie de dependencias reducida.                 |
| Pruebas y calidad           | 3     | **4**   | De 15 a 28 tests, con casos de envío correcto/fallido y error por campo.                |
| Documentación               | 2     | **5**   | `README.md`, `AGENTS.md` y este plan con métricas reales.                               |
| Gestión de paquetes         | 3     | **5**   | Tareas en pnpm, dependencia sin uso eliminada, duplicado con typo borrado.              |

**Promedio inicial ≈ 3,0/5 → final ≈ 4,5/5.**

### 9.4 Decisiones tomadas (y por qué)

| Tema                                        | Decisión                                                           | Justificación                                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipografía                                  | Pila de fuentes del sistema en lugar de cargar Roboto/Google Fonts | Roboto **nunca** se cargaba: `$font-family` nombraba una fuente inexistente y el navegador caía a `sans-serif`. Cargarla habría añadido una petición externa y ~15 kB para un resultado visual equivalente. |
| `standalone: true` redundante en 8 archivos | No se normalizó                                                    | Es el valor por defecto en Angular 21: cero impacto en comportamiento y 8 archivos de ruido en el diff.                                                                                                     |
| `@keyframes` en `styles.scss`               | Se dejaron **solo** en `titulos.scss`                              | Angular renombra los keyframes por componente (`_ngcontent-*`); la copia global era CSS muerto y se eliminó.                                                                                                |
| Interfaces `IContribution`, `IProject`…     | No se crearon                                                      | TypeScript ya infiere la forma exacta de esos arrays sin `any`; añadir 4 interfaces de una sola línea sería ceremonia, no tipado. Sí se marcaron como `readonly`.                                           |
| `@Input()` → `input()` en `Cards`/`Loader`  | No se migró                                                        | Funciona y el beneficio medible en una app de este tamaño es nulo; obligaría a tocar plantillas y specs.                                                                                                    |
| `foto.png` → WebP                           | No se convirtió                                                    | Tiene canal alfa real (`minAlpha = 0`); el formato y la herramienta no se pueden decidir sin el propietario. Documentado en §8 del `README`.                                                                |
| ESLint                                      | **No se instala**                                                  | Requiere 4–6 paquetes nuevos y una decisión de configuración que es del propietario. Los gates actuales son `tsc` + tests + build + Prettier. Queda como propuesta, no como instalación silenciosa.         |
| Prettier                                    | Solo en los archivos tocados                                       | Ejecutarlo sobre todo el repo generaría un diff de ~41 archivos ajenos al cambio.                                                                                                                           |
| `pathMatch: 'full'` en rutas hoja           | Se mantuvo                                                         | Es explícito y no afecta al enrutado.                                                                                                                                                                       |
| Prettier en HTML                            | Aceptado (incluye `<img … />` autocerrados)                        | El build y los 28 tests siguen en verde; se revisó que no cambiara texto visible.                                                                                                                           |

**Revisadas en S7:** las filas «`foto.png` → WebP», «ESLint» y «Prettier» quedaron
superadas por lo que el propietario autorizó y se ejecutó después; ver §10.

### 9.5 Pendientes propuestos (estado tras S7)

El propietario autorizó ejecutarlos; el resultado medido está en §10.

| Prioridad | Tema                                                                                                       | Estado en S7                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P2        | Convertir `foto.png` a WebP/AVIF con la herramienta que decida el propietario.                             | **Hecho**: WebP q88 (12,0 kB, −86,7 %) con `<picture>` y PNG de reserva.                                                       |
| P3        | Optimizar los SVG con SVGO y comprimir en el host (Brotli/gzip).                                           | **Hecho**: compresión en proceso (`src/compression.ts`); 8 SVG −39,6 % crudo; `favicon.svg` (201 KiB) borrado.                 |
| P3        | Decidir si se añade ESLint (`angular-eslint`) y Prettier sobre todo el repositorio en un commit exclusivo. | **Hecho**: ESLint 9 + `angular-eslint` 21 + `typescript-eslint` 8 (0 avisos) y Prettier sobre todo el repo.                    |
| P3        | Añadir headers de seguridad en `src/server.ts` (CSP, `X-Content-Type-Options`).                            | **Parcial**: `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` y HSTS condicional. CSP pendiente (GTM/GA). |
| P3        | Extraer el tipado de los arrays de contenido si crecen o se comparten entre páginas.                       | No ejecutado: sigue sin hacer falta.                                                                                           |

---

## 10. Resultados (S7) — servidor, assets y calidad

Todo lo de esta sección se midió sobre el **build de producción** con el servidor
levantado (`node dist/portafolio/server/server.mjs`) y `tools/smoke-test-server.mjs`,
no en el servidor de desarrollo.

### 10.1 Hallazgos que abrieron la sesión (evidencia)

| Hallazgo                                             | Medición                                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| El servidor no comprimía **nada**                    | Con `Accept-Encoding: gzip, deflate, br`: `main-*.js` 461.065 B, `logo.svg` 133.985 B y `/` 25.924 B, todos sin `Content-Encoding` |
| Sin cabeceras de seguridad                           | No se enviaba `X-Content-Type-Options`, `Referrer-Policy` ni HSTS                                                                  |
| El HTML no declaraba caché                           | `/` se servía sin `Cache-Control`                                                                                                  |
| `robots.txt` y `sitemap.xml` con caché de **un año** | Los servía `express.static` con `max-age=31536000`; los manejadores explícitos de `server.ts` nunca se alcanzaban                  |
| `src/assets/icons/favicon.svg` (201 KiB) sin usar    | Cero referencias en el código; además no era vectorial (un PNG en base64 dentro de un `<svg>` con metadatos)                       |

### 10.2 Métricas antes / después

Carga inicial de la portada (los recursos que descarga de verdad), medidos con
el servidor en vivo:

| Recurso               | Antes (sin comprimir) | Después (Brotli) | Variación   |
| --------------------- | --------------------- | ---------------- | ----------- |
| `/` (HTML)            | 25.924 B              | 5.708 B          | −78,0 %     |
| `main-*.js`           | 461.065 B             | 126.183 B        | −72,6 %     |
| `styles-*.css`        | 614 B                 | 614 B            | 0 % (<1 kB) |
| `assets/img/logo.svg` | 133.985 B             | 10.621 B         | −92,1 %     |
| `assets/img/foto.*`   | 89.967 B (PNG)        | 11.988 B (WebP)  | −86,7 %     |
| **Total**             | **711.555 B**         | **155.114 B**    | **−78,2 %** |

Ejemplo de una imagen de tarjeta (se carga en diferido): `seguridad.svg`
193.822 B → 17.858 B (−90,8 %).

| Métrica                               | Antes de S7           | Después de S7           | Comando / evidencia                                        |
| ------------------------------------- | --------------------- | ----------------------- | ---------------------------------------------------------- |
| `src/assets` (total)                  | 1.255,8 KiB           | **880,8 KiB (−29,9 %)** | `Get-ChildItem -Recurse \| Measure-Object Sum`             |
| 8 SVG de `src/assets/img` (crudo)     | 479.470 B             | **289.368 B (−39,6 %)** | `tools/svgo.config.mjs`                                    |
| Los mismos 8 SVG (Brotli)             | 75,4 KiB              | **42,6 KiB (−43,5 %)**  | `node:zlib`, calidad 5                                     |
| `main.js` (build)                     | 461,06 kB             | 461,13 kB (+63 B)       | código nuevo (`compression.ts` no entra)                   |
| `server.mjs` (build)                  | —                     | 903,13 kB               | salida del build (crece con el middleware y las cabeceras) |
| Tests                                 | 14 archivos / 28      | 14 archivos / 28        | `pnpm test`                                                |
| `tsc` (app y spec)                    | exit 0                | exit 0                  | `pnpm exec tsc …`                                          |
| `ng build --configuration production` | exit 0                | exit 0                  | `pnpm build:prod`                                          |
| Prerender                             | 6 rutas               | 6 rutas                 | salida del build                                           |
| ESLint                                | no existía            | **0 avisos**            | `pnpm lint`                                                |
| Prettier                              | solo archivos tocados | **todo el repo**        | `pnpm format:check`                                        |

> El `main.js` crece 63 B y el HTML 49 B por el `<picture>`: el resto de la
> mejora viene de la compresión y de los assets, no del bundle.

### 10.3 Qué se hizo

| Área                       | Cambio                                                                                                                                                                                                                                                                                | Verificación                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Compresión (nueva)         | `src/compression.ts`: middleware propio con solo `node:zlib`. Negocia `br`/`gzip` (incluye `q=0` y `*`), mínimo 1 kB, tipos comprimibles, omite respuestas ya codificadas, `Content-Range`, `no-transform` y cabeceras ya enviadas; añade `Vary`. Si algo falla, sirve sin comprimir. | 35/35 comprobaciones byte a byte (`gunzipSync`/`brotliDecompressSync`): HTML de las 6 rutas + assets, en gzip y Brotli. |
| Cabeceras y caché          | `src/server.ts`: `x-powered-by` fuera; `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` y HSTS solo por HTTPS; bundles con hash `immutable` un año, assets sin hash un día, HTML `must-revalidate`, robots/sitemap una hora.                                     | `tools/smoke-test-server.mjs` sobre el build real.                                                                      |
| `robots.txt`/`sitemap.xml` | Manejadores movidos **antes** de `express.static` (dejaban de ser código muerto).                                                                                                                                                                                                     | Cabecera `Cache-Control: public, max-age=3600` en ambos.                                                                |
| Assets — SVG               | 8 SVG optimizados con `tools/svgo.config.mjs` (precisión 6, sin `mergePaths` ni `removeUnknownsAndDefaults`). `favicon.svg` (201 KiB, sin referencias) borrado.                                                                                                                       | Comparación de píxeles en Edge headless (ver 10.4) y capturas A/B a tamaño real.                                        |
| Assets — foto              | `foto.png` → `foto.webp` (q88, alfa sin pérdida) servida con `<picture>` y PNG de reserva.                                                                                                                                                                                            | Δ medio 1,29/255 frente al PNG a 490 px; el propio comparador mide 0,126/255 con WebP sin pérdida.                      |
| Calidad                    | ESLint 9 + `angular-eslint` 21 + `typescript-eslint` 8 (`eslint.config.mjs`, ignora `dist` y `.angular`), scripts `lint`/`format`/`format:check`, `.prettierignore` (excluye `pnpm-lock.yaml`) y Prettier sobre todo el repo.                                                         | `pnpm lint` exit 0 (4 hallazgos reales corregidos); `pnpm format:check` limpio; paridad de HTML.                        |

### 10.4 Cómo se verificó que las imágenes no cambiaron

Rasterización real en Edge headless a tamaño absoluto y comparación de píxeles
RGBA (herramienta temporal, no añadida al repo):

| Variante                                             | Diferencias a tamaño de uso (70–100 px)                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Preset **por defecto** de SVGO                       | Hasta **29,5 % de píxeles** distintos (media Δ 0,8/255); `logo.svg` pasaba de 645 a 22 paths y perdía `stroke-width="1"` |
| Configuración **adoptada** (`tools/svgo.config.mjs`) | Logo 25 px distintos de 14.900 (máx Δ 16/255), 0 px en 4 de los 8 archivos; a 400 px nunca más de 64 px (máx Δ 12)       |
| `floatPrecision: false` (descartada)                 | **Rompe el dibujo**: redondea a enteros (media Δ 22/255)                                                                 |
| `foto.webp` q88 vs `foto.png`                        | Δ medio 1,29/255 a 490 px (ruido propio del comparador: 0,126/255)                                                       |

Además, el HTML prerenderizado de las 6 rutas se comparó antes y después de
formatear todo el repo con Prettier: **5 de 6 archivos idénticos** tras
normalizar espacios y hashes volátiles, y la única diferencia en `index.html` es
exactamente el `<picture><source>` de la foto.

### 10.5 Verificaciones que **no** se ejecutaron

- Auditoría Lighthouse ni axe; solo comparación de píxeles y capturas.
- Navegador real (solo Edge headless) e instalación real de la PWA.
- Tests e2e: el proyecto no tiene framework de e2e.
- `Content-Security-Policy`: no definida (hay GTM/GA y debe probarse desplegado).
- `web-app-manifest-512x512.png` (231,1 KiB): sigue sin optimizar (solo se
  descarga al instalar la PWA).
