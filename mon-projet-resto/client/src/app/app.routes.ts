import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guards';

/**
 * App-level route map.
 *
 * - Public: home (list), restaurant detail, login.
 * - Authenticated: customer profile, owner dashboard, admin dashboard
 *   (each gated by `roleGuard`).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/restaurant-list/restaurant-list.component').then(
        (m) => m.RestaurantListComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'restaurants/:slug',
    loadComponent: () =>
      import('./components/restaurant-detail/restaurant-detail.component').then(
        (m) => m.RestaurantDetailComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'owner',
    canActivate: [roleGuard('OWNER', 'ADMIN')],
    loadComponent: () =>
      import('./components/owner-dashboard/owner-dashboard.component').then(
        (m) => m.OwnerDashboardComponent,
      ),
  },
  {
    path: 'me',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/customer-dashboard/customer-dashboard.component').then(
        (m) => m.CustomerDashboardComponent,
      ),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./components/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  { path: '**', redirectTo: '' },
];
