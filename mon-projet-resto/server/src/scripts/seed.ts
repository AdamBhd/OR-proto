/* eslint-disable no-console */
/**
 * Seed script — wipes & repopulates fixtures.
 *
 * Run with:  npm run seed     (from /server)
 *
 * What it creates:
 *  - 1 GlobalConfig singleton (with A/B flags)
 *  - 2 Restaurants (Talkin' Tacos style + Shandmas style)
 *  - 1 Admin user
 *  - 1 Owner user attached to the first restaurant
 *  - 1 Customer user
 */
import { connectDatabase, disconnectDatabase } from '../config/database';
import { RestaurantModel } from '../models/Restaurant.model';
import { GlobalConfigModel } from '../models/GlobalConfig.model';
import { UserModel, UserRole } from '../models/User.model';
import { authService } from '../services/auth.service';

const RESTAURANT_FIXTURES = [
  {
    slug: 'talkin-tacos-miami',
    name: "Talkin' Tacos",
    tagline: 'Birria, tacos and good vibes — straight outta Miami.',
    description:
      'Bold flavours, hand-pressed tortillas, slow-braised meats. Built for sharing.',
    cuisineTypes: ['Mexican', 'Tacos', 'Latin'],
    phone: '+1-305-555-0182',
    email: 'hello@talkintacos.local',
    address: {
      street: '123 Calle del Sabor',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'USA',
    },
    uiConfig: {
      heroImageUrl:
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1600&q=80',
      logoUrl: '',
      primaryColor: '#111111',
      secondaryColor: '#FFF8F0',
      accentColor: '#E63946',
      headingFont: '"Anton", sans-serif',
      bodyFont: '"Inter", sans-serif',
      menuLayout: 'GRID' as const,
      showStickyCategoryNav: true,
    },
    shopifyShopUrl: 'talkintacos-demo.myshopify.com',
    storefrontAccessToken: 'demo-storefront-token-change-me',
    menuCategories: ['Tacos', 'Bowls', 'Sides', 'Drinks'],
    menuItems: [
      {
        name: 'Birria Quesataco',
        description: 'Slow-braised beef, melted Oaxaca cheese, consommé dip.',
        priceCents: 650,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=900&q=80',
        category: 'Tacos',
        shopifyVariantId: 'gid://shopify/ProductVariant/1001',
        isAvailable: true,
        tags: ['signature', 'beef'],
      },
      {
        name: 'Al Pastor',
        description: 'Marinated pork, charred pineapple, cilantro, onion.',
        priceCents: 550,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=900&q=80',
        category: 'Tacos',
        shopifyVariantId: 'gid://shopify/ProductVariant/1002',
        isAvailable: true,
        tags: ['pork'],
      },
      {
        name: 'Crispy Cauli',
        description: 'Cauliflower, chipotle crema, pickled red onion.',
        priceCents: 525,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&q=80',
        category: 'Tacos',
        shopifyVariantId: 'gid://shopify/ProductVariant/1003',
        isAvailable: true,
        tags: ['vegan', 'spicy'],
      },
      {
        name: 'Carne Asada Bowl',
        description: 'Grilled steak, cilantro rice, black beans, salsa verde.',
        priceCents: 1250,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1543353071-873f17a7a088?w=900&q=80',
        category: 'Bowls',
        shopifyVariantId: 'gid://shopify/ProductVariant/1004',
        isAvailable: true,
        tags: ['protein-rich'],
      },
      {
        name: 'Elote',
        description: 'Charred corn, lime, cotija, tajín.',
        priceCents: 600,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1625937329935-bb6efb12d6b1?w=900&q=80',
        category: 'Sides',
        shopifyVariantId: 'gid://shopify/ProductVariant/1005',
        isAvailable: true,
        tags: ['vegetarian'],
      },
      {
        name: 'Horchata',
        description: 'Cinnamon-rice cooler. House-made, lightly sweet.',
        priceCents: 450,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=900&q=80',
        category: 'Drinks',
        shopifyVariantId: 'gid://shopify/ProductVariant/1006',
        isAvailable: true,
        tags: [],
      },
    ],
    isPublished: true,
  },

  {
    slug: 'shandmas-bakery',
    name: "Shandma's",
    tagline: 'Warm bakes, bold spices, comfort first.',
    description: 'A neighbourhood bakery with a Caribbean soul.',
    cuisineTypes: ['Bakery', 'Caribbean', 'Comfort'],
    phone: '+1-718-555-0042',
    email: 'hello@shandmas.local',
    address: {
      street: '88 Sunrise Ave',
      city: 'Brooklyn',
      state: 'NY',
      postalCode: '11221',
      country: 'USA',
    },
    uiConfig: {
      heroImageUrl:
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80',
      logoUrl: '',
      primaryColor: '#3A1E0F',
      secondaryColor: '#FAF3E7',
      accentColor: '#D9A441',
      headingFont: '"Playfair Display", serif',
      bodyFont: '"Inter", sans-serif',
      menuLayout: 'MAGAZINE' as const,
      showStickyCategoryNav: true,
    },
    shopifyShopUrl: 'shandmas-demo.myshopify.com',
    storefrontAccessToken: 'demo-storefront-token-change-me',
    menuCategories: ['Pastries', 'Hot Plates', 'Drinks'],
    menuItems: [
      {
        name: 'Spiced Bun',
        description: 'Allspice, raisins, glazed top. The everyday classic.',
        priceCents: 425,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900&q=80',
        category: 'Pastries',
        shopifyVariantId: 'gid://shopify/ProductVariant/2001',
        isAvailable: true,
        tags: ['vegetarian'],
      },
      {
        name: 'Coco Bread',
        description: 'Soft, slightly sweet — pairs with everything.',
        priceCents: 350,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=900&q=80',
        category: 'Pastries',
        shopifyVariantId: 'gid://shopify/ProductVariant/2002',
        isAvailable: true,
        tags: [],
      },
      {
        name: 'Curry Goat & Rice',
        description: 'Slow-cooked goat, rice & peas, fried plantain.',
        priceCents: 1495,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1604908554007-0b6c46a2d1f6?w=900&q=80',
        category: 'Hot Plates',
        shopifyVariantId: 'gid://shopify/ProductVariant/2003',
        isAvailable: true,
        tags: ['signature', 'spicy'],
      },
      {
        name: 'Sorrel Cooler',
        description: 'Hibiscus, ginger, cane sugar. Served chilled.',
        priceCents: 425,
        currency: 'USD',
        imageUrl:
          'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900&q=80',
        category: 'Drinks',
        shopifyVariantId: 'gid://shopify/ProductVariant/2004',
        isAvailable: true,
        tags: ['vegan'],
      },
    ],
    isPublished: true,
  },
];

const GLOBAL_CONFIG_FIXTURE = {
  scope: 'global' as const,
  globalBannerEnabled: true,
  globalBannerText: '🌮 Free delivery on orders over $25 — this week only.',
  flags: [
    {
      key: 'menu.layout',
      description: 'Override per-tenant menu layout (A/B test for the storefront grid).',
      enabled: true,
      forceDefault: false,
      defaultVariant: 'GRID',
      variants: [
        { name: 'GRID', weight: 50 },
        { name: 'MAGAZINE', weight: 30 },
        { name: 'LIST', weight: 20 },
      ],
    },
    {
      key: 'storefront.stickyCategoryNav',
      description: 'Show / hide the sticky category pill bar.',
      enabled: true,
      forceDefault: true,
      defaultVariant: 'ON',
      variants: [
        { name: 'ON', weight: 100 },
        { name: 'OFF', weight: 0 },
      ],
    },
    {
      key: 'storefront.heroEmphasis',
      description: 'Future flag — control hero density (full / minimal).',
      enabled: false,
      forceDefault: true,
      defaultVariant: 'FULL',
      variants: [
        { name: 'FULL', weight: 100 },
        { name: 'MINIMAL', weight: 0 },
      ],
    },
  ],
};

async function run(): Promise<void> {
  await connectDatabase();

  console.log('[seed] wiping fixtures…');
  await Promise.all([
    RestaurantModel.deleteMany({ slug: { $in: RESTAURANT_FIXTURES.map((r) => r.slug) } }),
    GlobalConfigModel.deleteMany({}),
    UserModel.deleteMany({
      email: { $in: ['admin@yva.local', 'owner@talkintacos.local', 'customer@yva.local'] },
    }),
  ]);

  console.log('[seed] inserting restaurants…');
  const restaurants = await RestaurantModel.insertMany(RESTAURANT_FIXTURES);
  restaurants.forEach((r) => console.log(`  • ${r.slug}  (${r._id})`));

  console.log('[seed] inserting global config…');
  const cfg = await GlobalConfigModel.create(GLOBAL_CONFIG_FIXTURE);
  console.log(`  • flags: ${cfg.flags.length}`);

  console.log('[seed] inserting users…');
  const admin = await authService.register({
    email: 'admin@yva.local',
    password: 'admin1234',
    displayName: 'Super Admin',
    role: UserRole.ADMIN,
  });
  const owner = await authService.register({
    email: 'owner@talkintacos.local',
    password: 'owner1234',
    displayName: "Talkin' Tacos Owner",
    role: UserRole.OWNER,
    restaurantId: String(restaurants[0]._id),
  });
  const customer = await authService.register({
    email: 'customer@yva.local',
    password: 'customer1234',
    displayName: 'Demo Customer',
    role: UserRole.CUSTOMER,
  });
  console.log(`  • ADMIN    ${admin.email}      / admin1234`);
  console.log(`  • OWNER    ${owner.email} / owner1234   (-> ${restaurants[0].slug})`);
  console.log(`  • CUSTOMER ${customer.email}    / customer1234`);

  console.log('\n[seed] done.');
  await disconnectDatabase();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] FAILED:', err);
  process.exit(1);
});
