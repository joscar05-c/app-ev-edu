import { Routes } from '@angular/router';
import { authGuard, adminGuard, loginGuard } from './guards/auth.guard';

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
    canMatch: [loginGuard],
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'mission-play/:id',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/mission-play/mission-play.page').then( m => m.MissionPlayPage)
  },
  {
    path: 'admin/dashboard',
    canMatch: [adminGuard],
    loadComponent: () => import('./admin/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'admin/crear-mision',
    canMatch: [adminGuard],
    loadComponent: () => import('./admin/crear-mision/crear-mision.page').then( m => m.CrearMisionPage)
  },
  {
    path: 'profile',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
];
