import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UserRole } from '../models/User.model';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';

/**
 * Auth HTTP layer. Never returns the passwordHash to clients.
 */
export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName, role, restaurantId } = req.body ?? {};
      if (!email || !password || !displayName) {
        return res.status(400).json({ error: 'email, password and displayName are required' });
      }

      // SECURITY: anonymous self-signup may only create CUSTOMER accounts.
      // OWNER / ADMIN must be created by an ADMIN via /register-privileged.
      const safeRole = UserRole.CUSTOMER;
      if (role && role !== UserRole.CUSTOMER) {
        return res.status(403).json({
          error: 'Only ADMIN can create OWNER or ADMIN accounts (use /register-privileged).',
        });
      }

      const user = await authService.register({
        email,
        password,
        displayName,
        role: safeRole,
        restaurantId,
      });
      const token = authService.signToken(user);
      res.status(201).json({ data: { token, user: stripUser(user) } });
    } catch (err) {
      next(err);
    }
  }

  /** Admin-only — used to create OWNER / ADMIN accounts. */
  async registerPrivileged(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName, role, restaurantId } = req.body ?? {};
      if (!email || !password || !displayName || !role) {
        return res.status(400).json({ error: 'email, password, displayName and role are required' });
      }
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      const user = await authService.register({ email, password, displayName, role, restaurantId });
      res.status(201).json({ data: { user: stripUser(user) } });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
      }
      const result = await authService.login(email, password);
      if (!result) return res.status(401).json({ error: 'Invalid credentials' });
      res.json({ data: { token: result.token, user: stripUser(result.user) } });
    } catch (err) {
      next(err);
    }
  }

  /** Returns the currently authenticated user's profile. */
  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    res.json({ data: req.user });
  }
}

function stripUser(user: unknown): Record<string, unknown> {
  const u = user as { toObject?: () => Record<string, unknown> } & Record<string, unknown>;
  const obj = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  delete obj.passwordHash;
  return obj;
}

export const authController = new AuthController();
