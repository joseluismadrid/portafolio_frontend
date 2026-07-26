import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Projects } from './pages/projects/projects';
import { Skills } from './pages/skills/skills';
import { Contact } from './pages/contact/contact';
import { Loader } from './shared/components/loader/loader'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',

  },
  {
    path: 'home',
    component: Home,
    pathMatch: 'full',
    title: 'Home'
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
    pathMatch: 'full'
  },
  {
    path: 'contact',
    component: Contact,
    pathMatch: 'full',
    title: 'Contact'

  },
];
