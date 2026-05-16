import { Router } from 'express';
import { globalConfigController } from '../controllers/globalConfig.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

// Public read — every storefront fetches this on boot.
router.get('/', (req, res, next) => globalConfigController.get(req, res, next));

// Admin-only write.
router.put(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN),
  (req, res, next) => globalConfigController.update(req, res, next)
);

export default router;
