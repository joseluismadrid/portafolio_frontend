import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Las rutas del portafolio se generan en el build (SSG) para servirse ya
 * renderizadas; cualquier otra URL se renderiza bajo demanda y responde con
 * estado 404 real en lugar de entregar la página de inicio (soft-404).
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'home',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'about',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'projects',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'skills',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'contact',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
  },
];
