import { GlobalConfigModel, IGlobalConfig } from '../models/GlobalConfig.model';

/**
 * Reads / writes the singleton GlobalConfig document.
 * Used to drive global A/B feature flags consumed by every storefront.
 */
export class GlobalConfigService {
  /** Returns the singleton, creating it on first access. */
  async get(): Promise<IGlobalConfig> {
    const existing = await GlobalConfigModel.findOne({ scope: 'global' });
    if (existing) return existing;
    return GlobalConfigModel.create({ scope: 'global', flags: [] });
  }

  async update(patch: Partial<IGlobalConfig>): Promise<IGlobalConfig> {
    return GlobalConfigModel.findOneAndUpdate(
      { scope: 'global' },
      patch,
      { new: true, upsert: true }
    ) as unknown as IGlobalConfig;
  }
}

export const globalConfigService = new GlobalConfigService();
