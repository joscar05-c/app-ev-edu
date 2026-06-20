import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'mission-play/:id',
    loadComponent: () => import('./pages/mission-play/mission-play.page').then( m => m.MissionPlayPage)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./admin/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'admin/crear-mision',
    loadComponent: () => import('./admin/crear-mision/crear-mision.page').then( m => m.CrearMisionPage)
  },


];
