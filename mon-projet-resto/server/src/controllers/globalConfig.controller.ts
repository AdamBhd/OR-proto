import { Request, Response, NextFunction } from 'express';
import { globalConfigService } from '../services/globalConfig.service';

export class GlobalConfigController {
  /** Public read — clients hydrate feature flags on boot. */
  async get(_req: Request, res: Response, next: NextFunction) {
    try {
      const cfg = await globalConfigService.get();
      res.json({ data: cfg });
    } catch (err) {
      next(err);
    }
  }

  /** Admin-only — guarded by requireRole(ADMIN) in the route definition. */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const cfg = await globalConfigService.update(req.body);
      res.json({ data: cfg });
    } catch (err) {
      next(err);
    }
  }
}

export const globalConfigController = new GlobalConfigController();
