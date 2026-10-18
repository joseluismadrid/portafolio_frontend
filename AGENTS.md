# AGENTS.md — guía para trabajar en este repositorio

Instrucciones para agentes de IA y colaboradores que modifiquen el portafolio.
Resumen del proyecto y de cómo ejecutarlo: [`README.md`](README.md).

---

## 1. Reglas no negociables

1. **Solo pnpm.** No usar `npm`/`yarn`, no regenerar ni borrar `pnpm-lock.yaml`.
2. **No añadir dependencias** sin justificar que no existe alternativa con lo que
   ya está instalado. Preferir CSS/SVG propios antes que una librería.
3. **No cambiar** framework, builder, modo de renderizado ni versiones mayores
   sin evidencia medible de que es necesario.
4. **Preservar la identidad visual**: colores, tipografía, espaciados y
   estructura. Solo se cambian ante un defecto concreto y documentado.
5. **TypeScript estricto**: nada de `any` (`unknown` cuando el dato es opaco),
   sin `@ts-ignore`/`@ts-expect-error` para silenciar errores.
6. **SCSS con tokens**: usar las variables de `src/styles/colores.scss` y
   `src/styles/typografia.scss`; nada de colores ni tamaños «a mano».
7. **No inventar resultados.** Si no se ejecutó una verificación, decir que no se
   ejecutó. Separar fallos preexistentes de fallos introducidos.
8. Cada cambio debe ser **pequeño, verificable y reversible**.

---

## 2. Comandos

```bash
pnpm exec tsc -p tsconfig.app.json --noEmit    # tipos app
pnpm exec tsc -p tsconfig.spec.json --noEmit   # tipos tests
pnpm lint                                       # ESLint (0 avisos)
pnpm format                                     # Prettier sobre todo el repo
pnpm format:check                               # comprueba formato sin escribir
pnpm test                                       # Vitest (watch=false en CI)
pnpm build:prod                                 # build + prerender
pnpm start                                      # dev server (SSR) :4200
```

Verificación de un build de producción en local:

```powershell
pnpm build:prod
$env:PORT=4125; node dist/portafolio/server/server.mjs
$env:PORT=4125; node tools/smoke-test-server.mjs   # compresión, cabeceras, caché
```

---

## 3. Mapa de archivos clave

| Necesito…                                 | Archivo                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Añadir/cambiar una ruta                   | `src/app/app.routes.ts` **y** `src/app/app.routes.server.ts`                                       |
| Metadatos SEO (canónica, OG, descripción) | `src/app/shared/service/seo.ts` + `data.description` de la ruta                                    |
| Llamar a la API                           | `src/app/shared/service/contact.ts` (único servicio de datos)                                      |
| Estilos globales                          | `src/styles.scss` (CSS) y `src/styles/*.scss` (tokens y mixins)                                    |
| Título animado de sección                 | `@include titulo-neon;` de `src/styles/titulos.scss`                                               |
| Hosts permitidos por el SSR               | `angular.json` → `security.allowedHosts`                                                           |
| Dominio del sitio                         | `src/app/shared/service/seo.ts` (`SITE_ORIGIN`), `src/assets/robots.txt`, `src/assets/sitemap.xml` |
| Compresión / cabeceras / caché            | `src/compression.ts` (gzip/Brotli) + `src/server.ts` (cabeceras, `Cache-Control`)                  |
| Reglas de ESLint                          | `eslint.config.mjs`                                                                                |
| Excluir algo de Prettier                  | `.prettierignore`                                                                                  |
| Optimizar un SVG de `src/assets/img`      | `pnpm dlx svgo --config tools/svgo.config.mjs -i <svg> -o <svg>`                                   |

`src/styles/*.scss` **no deben emitir CSS suelto** (solo variables y mixins),
salvo `titulos.scss`, que define los `@keyframes` compartidos.

---

## 4. Trampas conocidas (leer antes de tocar)

- **`allowedHosts` vacío rompe el SSR.** Con `security.allowedHosts: []` el
  servidor responde «Bad Request» a _todas_ las peticiones y el HTML
  prerenderizado nunca se entrega. Debe contener `www.joseluismadrid.com`,
  `joseluismadrid.com`, `localhost` y `127.0.0.1`.
- **Añadir una ruta exige tocar dos archivos.** Si se olvida
  `app.routes.server.ts`, la ruta se renderiza en cliente y pierde el SSG; el
  comodín `**` con `RenderMode.Server, status: 404` es el que evita el _soft-404_.
- **Angular encapsula los `@keyframes`** de cada componente renombrándolos a
  `_ngcontent-<scope>-<name>` y reescribiendo su `animation`. Por eso los mixins
  pueden declarar los keyframes en `titulos.scss` sin colisiones, y por eso
  `styles.scss` no los importa (sería CSS muerto).
- **`@use '…/formas.scss'` fue eliminado**: el parcial definía variables sobre un
  `var(--radius)` inexistente. No recrearlo; usar los tokens reales.
- **El formulario no se reinicia cuando el envío falla** (se conserva lo que
  escribió la persona) y **el botón de envío solo se deshabilita mientras
  `loading`**. Son decisiones deliberadas de accesibilidad/UX: no revertirlas
  «para restaurar el comportamiento anterior».
- **`loading` es un `signal`**; en plantilla se lee `loading()`. Es lo que permite
  prescindir de `ChangeDetectorRef` en una app _zoneless_.
- **Prettier sí está aplicado a todo el repo** (en un cambio exclusivo de
  formato): `pnpm format` es seguro. `pnpm-lock.yaml` queda excluido en
  `.prettierignore`; reformatearlo cambia miles de líneas sin cambiar ninguna
  resolución. No mezcles formato con cambios de comportamiento en el mismo paso.
- **El motor de SSR llama a `res.flushHeaders()`** antes de escribir el cuerpo
  (`writeResponseToNodeResponse`). `src/compression.ts` lo neutraliza para poder
  anunciar `Content-Encoding`; si lo quitas, el HTML vuelve a salir sin comprimir.
- **ESLint debe ignorar los directorios de salida** (`dist`, `.angular`): los
  paquetes preempaquetados del caché de Vite traen `eslint-disable` de reglas que
  aquí no existen y llenan la salida de errores.
- **La foto se sirve con un elemento picture**: `source` apunta al WebP y el `img`
  lleva el PNG como reserva. El CSS usa `.personimg img` (selector descendente),
  así que envolver la imagen no rompe estilos. Mantén las dos versiones.
- **Al optimizar un SVG usa `tools/svgo.config.mjs`**, no el preset por defecto:
  el preset fusiona paths y cambia píxeles de borde en los trazados (medido en
  `docs/refactor-plan.md` §10).
- **`environment.ts`** reexporta `development`; en producción `angular.json` lo
  reemplaza por `environment.prod.ts`. No crear archivos nuevos en `src/env/`.
- Los tests de componentes usan `vi.spyOn(Swal, 'fire')` para no depender del DOM
  de SweetAlert2. Mantener ese patrón al probar envíos.

---

## 5. Convenciones de código

- Componentes **standalone** con `selector: 'app-…'`, `templateUrl` y `styleUrl`.
- Estado derivado o asíncrono → `signal()`; no usar `ChangeDetectorRef`.
- Plantillas: control de flujo moderno (`@if`, `@for` con `track`), sin
  `CommonModule` ni `RouterModule` si el componente no los usa (añaden peso).
- Errores de formulario: exponer **getters tipados** por campo (patrón
  `nombreError` → `string | null` en `contact.ts`) en lugar de encadenar
  `form.get('x')?.errors?.['y']` en la plantilla.
- Accesibilidad mínima exigible: `alt` descriptivo, `aria-label` en regiones,
  `aria-invalid`/`aria-describedby` en campos con error, `<h1>` único por
  página, `prefers-reduced-motion` en animaciones infinitas.
- Nombres de campos y métodos en `camelCase` (no `Perfil`, no `PerfilNombre`).

---

## 6. Checklist antes de dar un cambio por terminado

1. `tsc --noEmit` (app y spec) sin errores.
2. `pnpm test` en verde (indicar el número de archivos/tests).
3. `pnpm build:prod` sin errores ni _budgets_ superados, con las rutas
   prerenderizadas.
4. Si toca SEO/rutas: comprobar el HTML generado en `dist/portafolio/browser/**/index.html`
   (canónica correcta y distinta por página) y, si aplica, con el servidor
   levantado (`curl`/`Invoke-WebRequest`).
5. Si toca accesibilidad: comprobar el HTML prerenderizado (no solo el código).
6. `pnpm lint` sin avisos y `pnpm format:check` en verde.
7. Si toca el servidor o los assets: levantar el build de producción y pasar
   `node tools/smoke-test-server.mjs` (compresión, cabeceras y caché).
8. Anotar en `docs/refactor-plan.md` el resultado real (métricas antes/después).
9. Informar de cualquier verificación que **no** se haya podido ejecutar.
