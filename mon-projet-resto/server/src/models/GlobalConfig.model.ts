import { Schema, model, Document } from 'mongoose';

/**
 * A single A/B (or multi-variant) feature flag.
 * Variants weight 0-100 and should sum to 100 across the variant list.
 */
export interface IFeatureFlag {
  key: string;             // e.g. "menu.layout"
  description: string;
  enabled: boolean;
  /** When true, every tenant uses defaultVariant — A/B is paused. */
  forceDefault: boolean;
  defaultVariant: string;
  variants: Array<{
    name: string;          // e.g. "GRID"
    weight: number;        // 0-100
    payload?: Record<string, unknown>;
  }>;
}

/**
 * Singleton document holding global, cross-tenant flags.
 * Mutated by the Super Admin and applied to every restaurant template
 * (e.g. flip menu layout for all tenants in one click).
 */
export interface IGlobalConfig extends Document {
  /** Always "global" — enforces singleton semantics via unique index. */
  scope: 'global';
  flags: IFeatureFlag[];
  /** Sticky banner for promotions / outages, shown on all storefronts. */
  globalBannerText: string;
  globalBannerEnabled: boolean;
  updatedBy?: string; // Admin user id (string, not populated for portability)
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    forceDefault: { type: Boolean, default: false },
    defaultVariant: { type: String, required: true },
    variants: {
      type: [
        {
          name: { type: String, required: true },
          weight: { type: Number, required: true, min: 0, max: 100 },
          payload: { type: Schema.Types.Mixed },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const GlobalConfigSchema = new Schema<IGlobalConfig>(
  {
    scope: {
      type: String,
      enum: ['global'],
      required: true,
      unique: true,
      default: 'global',
    },
    flags: { type: [FeatureFlagSchema], default: [] },
    globalBannerText: { type: String, default: '' },
    globalBannerEnabled: { type: Boolean, default: false },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const GlobalConfigModel = model<IGlobalConfig>('GlobalConfig', GlobalConfigSchema);
