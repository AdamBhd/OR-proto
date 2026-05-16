import { Router } from 'express';
import { restaurantController } from '../controllers/restaurant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../models/User.model';

const router = Router();

router.get('/', (req, res, next) => restaurantController.list(req, res, next));
router.get('/:slug', (req, res, next) => restaurantController.getBySlug(req, res, next));

// PATCH is reserved for OWNER (their own doc) or ADMIN (any doc).
router.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.OWNER, UserRole.ADMIN),
  (req, res, next) => restaurantController.update(req, res, next)
);

export default router;
