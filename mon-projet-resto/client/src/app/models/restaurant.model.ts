/**
 * Mirror of the Mongoose Restaurant document, minus server-only secrets.
 * Keep this file the single source of truth for Restaurant typing on the client.
 */
export type MenuLayout = 'GRID' | 'LIST' | 'MAGAZINE';

export interface RestaurantUiConfig {
  heroImageUrl: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  menuLayout: MenuLayout;
  showStickyCategoryNav: boolean;
}

export interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  category: string;
  shopifyVariantId?: string;
  isAvailable: boolean;
  tags: string[];
}

export interface RestaurantAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Restaurant {
  _id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  cuisineTypes: string[];
  phone: string;
  email: string;
  address: RestaurantAddress;
  uiConfig: RestaurantUiConfig;
  shopifyShopUrl: string;
  menuCategories: string[];
  menuItems: MenuItem[];
  isPublished: boolean;
}

export interface ApiEnvelope<T> {
  data: T;
}
