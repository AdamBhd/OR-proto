import { Router } from 'express';
import restaurantRoutes from './restaurant.routes';
import globalConfigRoutes from './globalConfig.routes';
import authRoutes from './auth.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/global-config', globalConfigRoutes);

export default router;
