import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../services/auth';

/** Requiere sesión activa, sin importar el rol. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.parseUrl('/ingeniero/login');
};

/** Solo ingenieros de servicio. Un admin autenticado que caiga aquí se
 * manda a su propio dashboard en vez de a un login que no necesita. */
export const engineerGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isEngineer()) return true;
  if (auth.isAdmin()) return router.parseUrl('/admin/dashboard');
  return router.parseUrl('/ingeniero/login');
};

/** Solo administradores. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  if (auth.isEngineer()) return router.parseUrl('/ingeniero/inicio');
  return router.parseUrl('/admin/login');
};
