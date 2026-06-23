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
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'mission-play/:id',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/mission-play/mission-play.page').then(m => m.MissionPlayPage)
  },
  {
    path: 'profile',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadComponent: () => import('./admin/admin-layout/admin-layout.page').then(m => m.AdminLayoutPage),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'misiones',
        loadComponent: () => import('./admin/misiones/misiones.page').then(m => m.MisionesPage)
      },
      {
        path: 'crear-mision',
        loadComponent: () => import('./admin/crear-mision/crear-mision.page').then(m => m.CrearMisionPage)
      },
      {
        path: 'editar-mision/:id',
        loadComponent: () => import('./admin/crear-mision/crear-mision.page').then(m => m.CrearMisionPage)
      },
      {
        path: 'estudiantes',
        loadComponent: () => import('./admin/estudiantes/estudiantes.page').then(m => m.EstudiantesPage)
      },
      {
        path: 'instituciones',
        loadComponent: () => import('./admin/instituciones/instituciones.page').then(m => m.InstitucionesPage)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./admin/usuarios/usuarios.page').then(m => m.UsuariosPage)
      },
      {
        path: 'materias',
        loadComponent: () => import('./admin/materias/materias.page').then(m => m.MateriasPage)
      },
    ]
  },
];
