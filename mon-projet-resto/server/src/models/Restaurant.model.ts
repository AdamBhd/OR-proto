import { Schema, model, Document } from 'mongoose';

/**
 * Per-restaurant visual configuration.
 * Mirrors the bold, image-led patterns of talkintacos.net & shandmas.com:
 * hero image, accent palette, typography pair, and a chosen menu layout.
 */
export interface IRestaurantUiConfig {
  heroImageUrl: string;
  logoUrl: string;
  primaryColor: string;   // hex, e.g. "#E63946"
  secondaryColor: string; // hex
  accentColor: string;    // hex — used for CTAs / category pills
  headingFont: string;    // e.g. "Anton, sans-serif"
  bodyFont: string;       // e.g. "Inter, sans-serif"
  /** Card layout for menu items. Driven by Super Admin A/B flags too. */
  menuLayout: 'GRID' | 'LIST' | 'MAGAZINE';
  showStickyCategoryNav: boolean;
}

export interface IMenuItem {
  name: string;
  description: string;
  priceCents: number;
  currency: string; // ISO 4217 (e.g. "USD")
  imageUrl: string;
  category: string;
  /** Maps to a Shopify product variant — used for headless checkout redirect. */
  shopifyVariantId?: string;
  isAvailable: boolean;
  tags: string[]; // e.g. ["vegan", "spicy"]
}

export interface IRestaurant extends Document {
  // --- Basic info ---
  slug: string;       // URL key, e.g. "talkin-tacos-miami"
  name: string;
  tagline: string;
  description: string;
  cuisineTypes: string[];
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // --- Visual / UI config (per-tenant) ---
  uiConfig: IRestaurantUiConfig;

  // --- Headless commerce (Shopify) ---
  /** e.g. "talkintacos.myshopify.com" */
  shopifyShopUrl: string;
  /** Storefront API token — public-scope, safe for client redirects. */
  storefrontAccessToken: string;

  // --- Catalog ---
  menuCategories: string[]; // ordered display
  menuItems: IMenuItem[];

  // --- Lifecycle ---
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD', uppercase: true },
    imageUrl: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    shopifyVariantId: { type: String },
    isAvailable: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  { _id: true }
);

const UiConfigSchema = new Schema<IRestaurantUiConfig>(
  {
    heroImageUrl: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#111111' },
    secondaryColor: { type: String, default: '#FFFFFF' },
    accentColor: { type: String, default: '#E63946' },
    headingFont: { type: String, default: 'Anton, sans-serif' },
    bodyFont: { type: String, default: 'Inter, sans-serif' },
    menuLayout: {
      type: String,
      enum: ['GRID', 'LIST', 'MAGAZINE'],
      default: 'GRID',
    },
    showStickyCategoryNav: { type: Boolean, default: true },
  },
  { _id: false }
);

const RestaurantSchema = new Schema<IRestaurant>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    cuisineTypes: { type: [String], default: [] },
    phone: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    uiConfig: { type: UiConfigSchema, default: () => ({}) },
    shopifyShopUrl: { type: String, required: true, trim: true },
    storefrontAccessToken: { type: String, required: true },
    menuCategories: { type: [String], default: [] },
    menuItems: { type: [MenuItemSchema], default: [] },
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const RestaurantModel = model<IRestaurant>('Restaurant', RestaurantSchema);
