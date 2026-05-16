/**
 * Flat translation dictionaries — one per supported language.
 * Add a new locale by exporting another object with the same keys
 * and listing it in `LANGUAGES`.
 */
export type Lang = 'en' | 'fr';

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

export type TranslationDict = Record<string, string>;

const en: TranslationDict = {
  // Navigation
  'nav.restaurants': 'Restaurants',
  'nav.admin': 'Admin',
  'nav.myRestaurant': 'My restaurant',
  'nav.account': 'Account',
  'nav.signIn': 'Sign in',
  'nav.signOut': 'Sign out',

  // Home / restaurant list
  'home.heroTitle': 'Eat well. Locally.',
  'home.heroSubtitle':
    'Discover restaurants in your neighbourhood — order through their own Shopify checkout.',
  'home.viewMenu': 'View menu →',
  'home.empty':
    'No restaurants yet. Run npm run seed in /server to populate the database.',

  // Restaurant detail (storefront)
  'detail.loading': 'Loading restaurant…',
  'detail.allCategories': 'All',
  'detail.order': 'Order on Shopify',
  'detail.soldOut': 'Sold out',
  'detail.empty': 'No items in this category yet.',
  'detail.backHome': '← Back to all restaurants',

  // Login
  'login.title': 'Sign in',
  'login.subtitle': 'Use a seeded account to explore the dashboards.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.submitLoading': 'Signing in…',
  'login.seededCreds': 'Seeded credentials',
  'login.back': '← Back to home',
  'login.errorNetwork':
    'Cannot reach the API. Is the server running? (cd server && npm run dev)',
  'login.errorInvalid': 'Invalid email or password.',
  'login.errorGeneric': 'Login failed',

  // Admin dashboard
  'admin.title': 'Super Admin',
  'admin.subtitle': 'Global feature flags & cross-tenant banner.',
  'admin.signedInAs': 'Signed in as',
  'admin.bannerSection': 'Global banner',
  'admin.bannerEnabled': 'Enabled — shown on every storefront',
  'admin.bannerPlaceholder': 'e.g. Free delivery this week',
  'admin.flagsSection': 'Feature flags',
  'admin.flagsHint':
    'Each flag drives the storefront UI for every tenant. Force default skips the A/B split (useful as a kill-switch).',
  'admin.flagEnabled': 'Enabled',
  'admin.flagDisabled': 'Disabled',
  'admin.forceDefault': 'Force default',
  'admin.defaultVariant': 'Default variant:',
  'admin.save': 'Save changes',
  'admin.saving': 'Saving…',
  'admin.savedAt': 'Saved at',
  'admin.loading': 'Loading global config…',

  // Owner dashboard
  'owner.title': 'Restaurant partner',
  'owner.subtitle': 'Edit your storefront content and visual identity.',
  'owner.basicInfo': 'Basic info',
  'owner.name': 'Name',
  'owner.tagline': 'Tagline',
  'owner.description': 'Description',
  'owner.phone': 'Phone',
  'owner.email': 'Email',
  'owner.visualIdentity': 'Visual identity',
  'owner.heroImage': 'Hero image URL',
  'owner.logo': 'Logo URL',
  'owner.primary': 'Primary',
  'owner.secondary': 'Secondary',
  'owner.accent': 'Accent',
  'owner.headingFont': 'Heading font',
  'owner.bodyFont': 'Body font',
  'owner.menuLayout': 'Default menu layout',
  'owner.layoutGrid': 'Grid',
  'owner.layoutList': 'List',
  'owner.layoutMagazine': 'Magazine',
  'owner.shopify': 'Shopify (headless checkout)',
  'owner.shopifyHint':
    'Customers redirect to this Shopify store for cart & payment.',
  'owner.shopUrl': 'Shop URL',
  'owner.loading': 'Loading…',

  // Customer dashboard
  'customer.title': 'My account',
  'customer.subtitle': 'Your profile and recent activity.',
  'customer.profile': 'Profile',
  'customer.displayName': 'Display name',
  'customer.role': 'Role',
  'customer.orderHistory': 'Order history',
  'customer.orderHistoryHint':
    "Orders happen on each restaurant's Shopify checkout — order history will arrive once we wire the Shopify customer API.",
  'customer.browse': '← Browse restaurants',

  // Misc
  'forbidden.title': '403',
  'forbidden.subtitle': "You don't have access to this page.",
  'forbidden.back': '← Back home',
};

const fr: TranslationDict = {
  // Navigation
  'nav.restaurants': 'Restaurants',
  'nav.admin': 'Admin',
  'nav.myRestaurant': 'Mon restaurant',
  'nav.account': 'Mon compte',
  'nav.signIn': 'Se connecter',
  'nav.signOut': 'Se déconnecter',

  // Home / restaurant list
  'home.heroTitle': 'Bien manger. Local.',
  'home.heroSubtitle':
    'Découvrez les restaurants de votre quartier — commandez via leur paiement Shopify.',
  'home.viewMenu': 'Voir le menu →',
  'home.empty':
    "Aucun restaurant pour l'instant. Lancez npm run seed dans /server pour remplir la base.",

  // Restaurant detail
  'detail.loading': 'Chargement du restaurant…',
  'detail.allCategories': 'Tout',
  'detail.order': 'Commander sur Shopify',
  'detail.soldOut': 'Épuisé',
  'detail.empty': 'Aucun article dans cette catégorie pour le moment.',
  'detail.backHome': '← Retour aux restaurants',

  // Login
  'login.title': 'Connexion',
  'login.subtitle':
    'Utilisez un compte de démonstration pour explorer les tableaux de bord.',
  'login.email': 'Adresse e-mail',
  'login.password': 'Mot de passe',
  'login.submit': 'Se connecter',
  'login.submitLoading': 'Connexion…',
  'login.seededCreds': 'Identifiants de démonstration',
  'login.back': "← Retour à l'accueil",
  'login.errorNetwork':
    "Impossible de joindre l'API. Le serveur est-il démarré ? (cd server && npm run dev)",
  'login.errorInvalid': 'Adresse e-mail ou mot de passe invalide.',
  'login.errorGeneric': 'Échec de la connexion',

  // Admin dashboard
  'admin.title': 'Super administrateur',
  'admin.subtitle': 'Drapeaux de fonctionnalités globaux et bannière inter-tenants.',
  'admin.signedInAs': 'Connecté en tant que',
  'admin.bannerSection': 'Bannière globale',
  'admin.bannerEnabled': 'Activée — visible sur toutes les vitrines',
  'admin.bannerPlaceholder': 'ex. Livraison offerte cette semaine',
  'admin.flagsSection': 'Drapeaux de fonctionnalités',
  'admin.flagsHint':
    "Chaque drapeau pilote l'interface pour chaque restaurant. Forcer le défaut ignore l'A/B test (utile comme coupe-circuit).",
  'admin.flagEnabled': 'Activé',
  'admin.flagDisabled': 'Désactivé',
  'admin.forceDefault': 'Forcer la valeur par défaut',
  'admin.defaultVariant': 'Variante par défaut :',
  'admin.save': 'Enregistrer',
  'admin.saving': 'Enregistrement…',
  'admin.savedAt': 'Enregistré à',
  'admin.loading': 'Chargement de la configuration…',

  // Owner dashboard
  'owner.title': 'Restaurateur partenaire',
  'owner.subtitle': "Modifiez le contenu et l'identité visuelle de votre vitrine.",
  'owner.basicInfo': 'Informations',
  'owner.name': 'Nom',
  'owner.tagline': 'Accroche',
  'owner.description': 'Description',
  'owner.phone': 'Téléphone',
  'owner.email': 'E-mail',
  'owner.visualIdentity': 'Identité visuelle',
  'owner.heroImage': "URL de l'image principale",
  'owner.logo': 'URL du logo',
  'owner.primary': 'Primaire',
  'owner.secondary': 'Secondaire',
  'owner.accent': 'Accent',
  'owner.headingFont': 'Police des titres',
  'owner.bodyFont': 'Police du texte',
  'owner.menuLayout': 'Mise en page par défaut',
  'owner.layoutGrid': 'Grille',
  'owner.layoutList': 'Liste',
  'owner.layoutMagazine': 'Magazine',
  'owner.shopify': 'Shopify (paiement headless)',
  'owner.shopifyHint':
    'Les clients sont redirigés vers cette boutique Shopify pour le panier et le paiement.',
  'owner.shopUrl': 'URL de la boutique',
  'owner.loading': 'Chargement…',

  // Customer dashboard
  'customer.title': 'Mon compte',
  'customer.subtitle': 'Votre profil et votre activité récente.',
  'customer.profile': 'Profil',
  'customer.displayName': "Nom d'affichage",
  'customer.role': 'Rôle',
  'customer.orderHistory': 'Historique des commandes',
  'customer.orderHistoryHint':
    "Les commandes sont passées sur le Shopify de chaque restaurant — l'historique arrivera quand l'API client Shopify sera branchée.",
  'customer.browse': '← Parcourir les restaurants',

  // Misc
  'forbidden.title': '403',
  'forbidden.subtitle': "Vous n'avez pas accès à cette page.",
  'forbidden.back': "← Retour à l'accueil",
};

export const TRANSLATIONS: Record<Lang, TranslationDict> = { en, fr };
