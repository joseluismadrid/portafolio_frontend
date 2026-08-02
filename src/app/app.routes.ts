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
    title: 'Home'
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
    title: 'About'
  },
  {
    path: 'projects',
    component: Projects,
    pathMatch: 'full',
    title: 'Projects'
  },
  {
    path: 'skills',
    component: Skills,
    pathMatch: 'full',
    title: 'Skills'
  },
  {
    path: 'contact',
    component: Contact,
    pathMatch: 'full',
    title: 'Contact'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
