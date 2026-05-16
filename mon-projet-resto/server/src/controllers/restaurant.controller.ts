import { Request, Response, NextFunction } from 'express';
import { restaurantService } from '../services/restaurant.service';
import { AuthenticatedRequest } from '../middleware/rbac.middleware';
import { UserRole } from '../models/User.model';

/**
 * Thin HTTP layer — delegates all logic to RestaurantService.
 * Never expose the raw Shopify storefrontAccessToken to anonymous clients.
 */
export class RestaurantController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await restaurantService.findAllPublished();
      res.json({ data: items.map(stripSecrets) });
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const r = await restaurantService.findBySlug(req.params.slug);
      if (!r) return res.status(404).json({ error: 'Restaurant not found' });
      res.json({ data: stripSecrets(r) });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/restaurants/:id
   * OWNER may only patch their own document; ADMIN may patch any.
   * Owners cannot flip `isPublished` (Admin-gated lifecycle).
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const user = req.user!; // authenticate ran before this
      if (user.role === UserRole.OWNER && user.restaurantId !== id) {
        return res.status(403).json({ error: 'Owners can only edit their own restaurant' });
      }

      const patch = { ...req.body } as Record<string, unknown>;
      if (user.role === UserRole.OWNER) {
        delete patch.isPublished;
        delete patch.slug; // slug change is admin-only (URL stability)
      }

      const updated = await restaurantService.updateById(id, patch);
      if (!updated) return res.status(404).json({ error: 'Restaurant not found' });
      res.json({ data: stripSecrets(updated) });
    } catch (err) {
      next(err);
    }
  }
}

/** Remove fields that should never travel to anonymous customer clients. */
function stripSecrets<T extends { storefrontAccessToken?: string }>(doc: T): T {
  const clone = { ...doc };
  delete clone.storefrontAccessToken;
  return clone;
}

export const restaurantController = new RestaurantController();
