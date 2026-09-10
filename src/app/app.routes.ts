import { Routes } from '@angular/router';

import { adminGuard, authGuard, engineerGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'ingeniero/login',
  },
  {
    path: 'ingeniero/login',
    loadComponent: () =>
      import('./features/auth/engineer-login/engineer-login').then((m) => m.EngineerLogin),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/auth/admin-login/admin-login').then((m) => m.AdminLogin),
  },
  {
    path: 'ingeniero/inicio',
    canActivate: [engineerGuard],
    loadComponent: () =>
      import('./features/orders/engineer-home/engineer-home').then((m) => m.EngineerHome),
  },
  {
    path: 'ordenes/nueva',
    canActivate: [engineerGuard],
    loadComponent: () =>
      import('./features/orders/order-wizard/order-wizard').then((m) => m.OrderWizard),
  },
  {
    // Sirve tanto para el ingeniero (solo ve sus propias órdenes) como
    // para el admin (ve cualquiera); el backend ya filtra eso por rol,
    // aquí solo hace falta estar autenticado.
    path: 'ordenes/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/order-detail/order-detail').then((m) => m.OrderDetail),
  },
  {
    path: 'ordenes/:id/enviada',
    canActivate: [engineerGuard],
    loadComponent: () =>
      import('./features/orders/order-success/order-success').then((m) => m.OrderSuccess),
  },
  {
    path: 'admin/dashboard',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'legal/aviso-de-privacidad',
    loadComponent: () =>
      import('./features/legal/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: 'legal/terminos-y-condiciones',
    loadComponent: () =>
      import('./features/legal/terms/terms').then((m) => m.Terms),
  },
  {
    path: '**',
    redirectTo: 'ingeniero/login',
  },
];
