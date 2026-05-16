import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.get('/me', authenticate, (req, res) => authController.me(req, res));

// Admin-only path to create OWNER / ADMIN accounts.
router.post(
  '/register-privileged',
  authenticate,
  requireRole(UserRole.ADMIN),
  (req, res, next) => authController.registerPrivileged(req, res, next)
);

export default router;
