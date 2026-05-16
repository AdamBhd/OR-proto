import { RestaurantModel, IRestaurant } from '../models/Restaurant.model';

/**
 * Restaurant data access. Controllers should never touch the model directly —
 * keep persistence concerns isolated here (SRP).
 */
export class RestaurantService {
  async findAllPublished(): Promise<IRestaurant[]> {
    return RestaurantModel.find({ isPublished: true }).lean<IRestaurant[]>();
  }

  async findBySlug(slug: string): Promise<IRestaurant | null> {
    return RestaurantModel.findOne({ slug, isPublished: true }).lean<IRestaurant>();
  }

  async findById(id: string): Promise<IRestaurant | null> {
    return RestaurantModel.findById(id).lean<IRestaurant>();
  }

  async create(payload: Partial<IRestaurant>): Promise<IRestaurant> {
    const created = await RestaurantModel.create(payload);
    return created.toObject();
  }

  async updateById(id: string, patch: Partial<IRestaurant>): Promise<IRestaurant | null> {
    return RestaurantModel.findByIdAndUpdate(id, patch, { new: true }).lean<IRestaurant>();
  }
}

export const restaurantService = new RestaurantService();
