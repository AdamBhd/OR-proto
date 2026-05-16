import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from './rbac.middleware';

/**
 * Verifies the Bearer token and attaches `req.user`.
 * Must run before any `requireRole(...)` guard.
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  try {
    const payload = authService.verifyToken(header.slice('Bearer '.length));
    req.user = {
      id: payload.id,
      role: payload.role,
      restaurantId: payload.restaurantId,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Like authenticate(), but does not 401 if the token is missing/invalid.
 * Useful for routes that customise behaviour for logged-in users (e.g. analytics).
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = authService.verifyToken(header.slice('Bearer '.length));
      req.user = {
        id: payload.id,
        role: payload.role,
        restaurantId: payload.restaurantId,
      };
    } catch {
      /* ignore — anonymous request */
    }
  }
  next();
}
