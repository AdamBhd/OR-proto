import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.model';

/**
 * Foundational RBAC guard. The auth middleware (to be wired with JWT)
 * is expected to attach `req.user = { id, role, restaurantId? }`.
 * This guard then enforces the role contract for protected routes.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    restaurantId?: string;
  };
}

export function requireRole(...allowed: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

/** Owner can only mutate their own restaurant — caller passes the target id. */
export function requireOwnerOf(targetRestaurantId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (req.user.role === UserRole.ADMIN) return next();
    if (
      req.user.role === UserRole.OWNER &&
      req.user.restaurantId === targetRestaurantId
    ) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}
