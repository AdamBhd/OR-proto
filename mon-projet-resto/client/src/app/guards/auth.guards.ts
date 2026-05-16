import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

/** Allow only authenticated users; bounce to /login otherwise. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/**
 * Role-aware guard factory.
 * Usage:  canActivate: [roleGuard('ADMIN')]  or roleGuard('ADMIN', 'OWNER')
 */
export function roleGuard(...allowed: UserRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
    }
    if (!auth.hasRole(...allowed)) {
      return router.createUrlTree(['/forbidden']);
    }
    return true;
  };
}
