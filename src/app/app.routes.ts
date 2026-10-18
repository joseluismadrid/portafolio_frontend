import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Projects } from './pages/projects/projects';
import { Skills } from './pages/skills/skills';
import { Contact } from './pages/contact/contact';
import { NotFound } from './pages/not-found/not-found';

/**
 * Cada ruta define su `title` y su `description`. El `SeoService` los aplica al
 * documento para que las páginas prerenderizadas no compartan los metadatos del
 * root (canónica, `og:url` y metadescripción duplicados).
 */
export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
    title: 'Inicio | José Luis Madrid Londoño - Desarrollador Full Stack',
    data: {
      description:
        'Portafolio de José Luis Madrid Londoño, desarrollador de software Full Stack especializado en desarrollo web, APIs REST, arquitectura de software y UI/UX.',
    },
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'about',
    component: About,
    pathMatch: 'full',
    title: 'Sobre mí | José Luis Madrid Londoño - Desarrollador Full Stack',
    data: {
      description:
        'Perfil profesional de José Luis Madrid Londoño: desarrollador Full Stack con formación en análisis, diseño y desarrollo de aplicaciones web, APIs y bases de datos.',
    },
  },
  {
    path: 'projects',
    component: Projects,
    pathMatch: 'full',
    title: 'Proyectos | José Luis Madrid Londoño - Software Developer',
    data: {
      description:
        'Proyectos de desarrollo de software: modernización de interfaces web, sistemas de gestión de solicitudes, administración documental y portales de servicios digitales.',
    },
  },
  {
    path: 'skills',
    component: Skills,
    pathMatch: 'full',
    title: 'Habilidades | José Luis Madrid Londoño - Desarrollador de Software',
    data: {
      description:
        'Habilidades técnicas y profesionales: frontend con componentes reutilizables, diseño de APIs REST, arquitectura por capas, bases de datos y buenas prácticas de desarrollo.',
    },
  },
  {
    path: 'contact',
    component: Contact,
    pathMatch: 'full',
    title: 'Contacto | José Luis Madrid Londoño - Desarrollador Full Stack',
    data: {
      description:
        'Contáctame para desarrollo de aplicaciones, sitios web, automatización de procesos, APIs e integraciones. Cuéntame tu proyecto o envíame tu hoja de vida.',
    },
  },
  {
    path: '**',
    component: NotFound,
    title: 'Página no encontrada | José Luis Madrid Londoño',
    data: {
      description:
        'La dirección solicitada no existe en el portafolio de José Luis Madrid Londoño. Vuelve al inicio para explorar los proyectos, habilidades y datos de contacto.',
      // La página 404 responde con estado 404: no debe declarar canónica propia.
      noCanonical: true,
    },
  },
];
