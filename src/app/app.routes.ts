import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Projects } from './pages/projects/projects';
import { Skills } from './pages/skills/skills';
import { Contact } from './pages/contact/contact';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
    title: 'Inicio | José Luis Madrid Londoño - Desarrollador Full Stack'
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'about',
    component: About,
    pathMatch: 'full',
    title: 'Sobre mí | José Luis Madrid Londoño - Desarrollador Full Stack'
  },
  {
    path: 'projects',
    component: Projects,
    pathMatch: 'full',
    title: 'Proyectos | José Luis Madrid Londoño - Software Developer'
  },
  {
    path: 'skills',
    component: Skills,
    pathMatch: 'full',
    title: 'Habilidades | José Luis Madrid Londoño - Desarrollador de Software'
  },
  {
    path: 'contact',
    component: Contact,
    pathMatch: 'full',
    title: 'Contacto | José Luis Madrid Londoño - Desarrollador Full Stack'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
