import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaLogueado()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaLogueado() && auth.esAdmin()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const loginGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaLogueado()) {
    return true;
  }

  // Si es admin logueado, redirigir al dashboard admin
  if (auth.esAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  // Si es estudiante logueado, permitir paso (la página login muestra su dashboard)
  return true;
};
