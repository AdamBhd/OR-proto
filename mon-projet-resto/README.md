# OpenRate — Documentation technique

Plateforme **multi-tenant** d'agrégation de restaurants distribuée sous la marque
**OpenRate**. Chaque restaurant est un tenant disposant de sa propre boutique
Shopify ; notre application est une **vitrine headless** : le client navigue
chez nous, mais le panier et le paiement se déroulent sur le Shopify du
restaurant. Côté direction, un Super Admin peut piloter l'apparence et le
comportement de **toutes les vitrines en même temps** via un système de
*feature flags* / A/B tests global.

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Structure du dépôt](#structure-du-dépôt)
4. [Pré-requis](#pré-requis)
5. [Installation initiale](#installation-initiale)
6. [Configuration de la base de données](#configuration-de-la-base-de-données)
7. [Lancer l'application](#lancer-lapplication)
8. [Comptes pré-créés (seed)](#comptes-pré-créés-seed)
9. [Rôles et contrôle d'accès (RBAC)](#rôles-et-contrôle-daccès-rbac)
10. [Modèle de données (MongoDB)](#modèle-de-données-mongodb)
11. [API backend](#api-backend)
12. [Routes frontend](#routes-frontend)
13. [Système d'A/B testing et de feature flags](#système-dab-testing-et-de-feature-flags)
14. [Ajouter un restaurant](#ajouter-un-restaurant)
15. [Le pattern « UI pilotée par les données »](#le-pattern--ui-pilotée-par-les-données-)
16. [Internationalisation (FR / EN)](#internationalisation-fr--en)
17. [Authentification et sécurité](#authentification-et-sécurité)
18. [Checkout Shopify headless](#checkout-shopify-headless)
19. [Identité visuelle OpenRate](#identité-visuelle-openrate)
20. [Build de production](#build-de-production)
21. [Dépannage](#dépannage)

---

## Vue d'ensemble

L'application est composée de **trois portails** distincts qui partagent la
même base de code Angular et la même API :

| Portail            | Pour qui                       | Ce qu'il permet de faire                                                  |
|--------------------|--------------------------------|----------------------------------------------------------------------------|
| **Client public**  | Visiteurs anonymes / clients   | Parcourir les restaurants, voir un menu, déclencher un paiement Shopify   |
| **Espace partenaire** (Owner) | Restaurateur               | Éditer le contenu et l'identité visuelle de **son** restaurant            |
| **Super Admin**    | OpenRate (vous)                | Piloter les feature flags globaux, la bannière inter-tenants, l'A/B test  |

Le client n'a **jamais** de panier interne : chaque bouton « Commander » du
menu redirige vers `https://<boutique>.myshopify.com/cart/<variantId>:1`. La
boutique Shopify gère le panier, le paiement, le suivi, les e-mails de
confirmation, etc. Cela évite toute logique PCI dans notre app.

Côté UI, **un seul composant Angular** (`RestaurantDetailComponent`) sert
toutes les vitrines. La palette, les polices, la disposition du menu, le logo
et le contenu viennent du document MongoDB du restaurant. C'est ce qui permet
au Super Admin de modifier **toutes les vitrines en même temps** en
changeant un flag global (ex. passer toutes les vitrines en mise en page
« magazine » d'un clic).

---

## Stack technique

| Couche        | Outils                                                                                  |
|---------------|------------------------------------------------------------------------------------------|
| Frontend      | **Angular 17** (standalone components, signals, SSR + hydration), SCSS, Inter / Anton    |
| Backend       | **Node.js + Express + TypeScript**, architecture en couches (controllers / services / models / routes / middleware) |
| Base de données | **MongoDB** via **Mongoose 8**                                                         |
| Auth          | **bcryptjs** (hash des mots de passe) + **jsonwebtoken** (JWT, 7 jours)                  |
| i18n          | Service maison à base de signals + pipe `| translate` (bascule instantanée FR/EN sans rechargement) |
| Multi-process | **concurrently** (lance client + serveur en parallèle)                                    |
| Sécurité HTTP | **helmet**, **cors** (origine épinglée), JSON 1 Mo                                       |
| Logs HTTP     | **morgan** (`dev` en dev, `combined` en prod)                                            |

---

## Structure du dépôt

```
mon-projet-resto/
├── client/                   Application Angular 17 (SSR activé)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   restaurant-list, restaurant-detail, login,
│   │   │   │                 admin-dashboard, owner-dashboard,
│   │   │   │                 customer-dashboard, brand-logo, forbidden
│   │   │   ├── services/     restaurant.service, auth.service,
│   │   │   │                 global-config.service
│   │   │   ├── i18n/         language.service, translate.pipe, translations
│   │   │   ├── guards/       auth.guards (authGuard, roleGuard)
│   │   │   ├── interceptors/ auth.interceptor (ajoute Bearer)
│   │   │   ├── models/       restaurant, auth, global-config
│   │   │   ├── app.routes.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.component.{ts,html,scss}
│   │   ├── environments/     environment.ts (prod) + environment.development.ts
│   │   ├── favicon.svg       Logo OpenRate (SVG inline)
│   │   ├── index.html
│   │   └── styles.scss
│   ├── angular.json          (fileReplacements env)
│   └── package.json
│
├── server/                   API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/           env.ts, database.ts (connexion Mongo)
│   │   ├── models/           User.model, Restaurant.model, GlobalConfig.model
│   │   ├── services/         restaurant.service, globalConfig.service, auth.service
│   │   ├── controllers/      restaurant.controller, globalConfig.controller, auth.controller
│   │   ├── routes/           index, restaurant.routes, globalConfig.routes, auth.routes
│   │   ├── middleware/       error, rbac, auth (JWT)
│   │   ├── scripts/          seed.ts (peuplement initial)
│   │   ├── app.ts            createApp() — l'express app sans le .listen
│   │   └── index.ts          bootstrap() — connecte la BDD puis écoute
│   ├── .env.example
│   └── package.json
│
├── package.json              Scripts racines (concurrently)
└── README.md                 Ce document
```

Cette séparation respecte le principe **SRP** : la connexion BDD, l'app
Express et le démarrage sont dans trois fichiers distincts ; un service ne
parle jamais à HTTP, un controller ne parle jamais à Mongoose.

---

## Pré-requis

- **Node.js ≥ 18** (testé sur 18.17, fonctionne avec 20+)
- **npm ≥ 9**
- Un **MongoDB** accessible : MongoDB Atlas (gratuit, recommandé) ou Mongo
  local (Docker ou natif)
- Optionnel : **Git**, **VS Code**

---

## Installation initiale

Depuis la racine du dépôt (`mon-projet-resto/`) :

```bash
npm run install:all
```

Ce script enchaîne trois `npm install` : à la racine (pour `concurrently`),
puis dans `client/`, puis dans `server/`.

---

## Configuration de la base de données

### 1. Copier le fichier d'environnement

```bash
cp server/.env.example server/.env
```

### 2. Remplir `server/.env`

```
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/openrate?retryWrites=true&w=majority

CLIENT_ORIGIN=http://localhost:4200

JWT_SECRET=<chaîne aléatoire de 96 caractères hexadécimaux>
```

Générer un JWT secret robuste :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

⚠ **Important** : il faut un nom de base **explicite** dans l'URI (`/openrate`
avant le `?`). Sans cela, Mongo écrit dans la base par défaut `test`.

### 3. Créer les collections + données initiales

```bash
npm --prefix server run seed
```

Le script `seed.ts` :

- **vide** les fixtures précédentes (idempotent : on peut le relancer)
- crée la collection `restaurants` avec deux fixtures (`talkin-tacos-miami`,
  `shandmas-bakery`), index unique sur `slug`
- crée la collection `globalconfigs` avec un singleton, trois flags, et la
  bannière globale
- crée la collection `users` avec un admin, un propriétaire (lié au premier
  restaurant) et un client, mots de passe **hachés** par bcrypt
- affiche en console les identifiants prêts à l'emploi

### 4. Vérification

```bash
npm --prefix server run dev
```

Vous devez voir :

```
[db] connected to mongodb+srv://...
[api] listening on http://localhost:3000 (development)
```

Puis dans un autre terminal :

```bash
curl http://localhost:3000/api/health           # {"status":"ok"}
curl http://localhost:3000/api/restaurants      # liste les deux restos seedés
```

---

## Lancer l'application

Depuis la racine :

```bash
npm run dev
```

Cela lance les **deux processus en parallèle** via `concurrently` :

- `[CLIENT]` → Angular dev server sur **http://localhost:4200**
- `[SERVER]` → Express + ts-node-dev sur **http://localhost:3000**

Si vous préférez deux terminaux distincts :

```bash
npm run dev:client
npm run dev:server
```

---

## Comptes pré-créés (seed)

Les mots de passe sont stockés **hachés** (bcrypt, 12 rounds). Vous vous
connectez avec le mot de passe **en clair** ci-dessous ; bcrypt re-hache la
saisie et compare au hash en BDD.

| Rôle      | Email                       | Mot de passe   | Accès                                                   |
|-----------|-----------------------------|----------------|----------------------------------------------------------|
| ADMIN     | `admin@yva.local`           | `admin1234`    | `/admin` (feature flags, bannière)                       |
| OWNER     | `owner@talkintacos.local`   | `owner1234`    | `/owner` (édite le restaurant Talkin' Tacos)             |
| CUSTOMER  | `customer@yva.local`        | `customer1234` | `/me` (profil)                                            |

Le formulaire de login (`/login`) est pré-rempli avec les identifiants admin
pour aller vite.

---

## Rôles et contrôle d'accès (RBAC)

Trois rôles, déclarés dans une `enum` côté serveur
(`server/src/models/User.model.ts`) et un type union côté client
(`client/src/app/models/auth.model.ts`).

### `ADMIN` — Super Admin OpenRate

**Capacités :**

- Lire / modifier le document `GlobalConfig` (singleton)
- Activer / désactiver chaque feature flag
- Forcer la valeur par défaut d'un flag (kill-switch d'A/B test)
- Choisir le variant par défaut
- Activer / désactiver la bannière globale (affichée sur **toutes** les
  vitrines)
- Modifier **n'importe quel** restaurant (`PATCH /api/restaurants/:id`)
- Créer des comptes OWNER ou ADMIN (`POST /api/auth/register-privileged`)

**Garde :** route Angular `/admin` protégée par `roleGuard('ADMIN')`. Côté
API, `requireRole(UserRole.ADMIN)`.

### `OWNER` — Restaurateur partenaire

**Capacités :**

- Modifier **uniquement son** restaurant (text, contact, identité visuelle,
  URL Shopify, layout par défaut)
- Lire la liste publique des restaurants
- Ne peut **pas** changer `isPublished` (réservé à l'admin pour le cycle de
  vie)
- Ne peut **pas** changer son `slug` (stabilité des URLs)

**Garde :** route Angular `/owner` protégée par `roleGuard('OWNER', 'ADMIN')`.
Côté API, `PATCH /api/restaurants/:id` chaîne `authenticate` →
`requireRole(OWNER, ADMIN)` → vérification dans le controller que
`req.user.restaurantId === :id`.

Un OWNER est lié à un restaurant via le champ `User.restaurantId`. La
validation Mongoose dans `User.model.ts` impose ce champ pour les owners.

### `CUSTOMER` — Client final

**Capacités :**

- S'inscrire seul (`POST /api/auth/register` ne permet que CUSTOMER)
- Consulter son profil (`/me`)
- Parcourir / commander (la commande se déroule sur Shopify, pas chez nous)

**Garde :** route Angular `/me` protégée par `authGuard` (peu importe le
rôle, doit juste être connecté).

### Garde frontale réutilisable

```ts
// client/src/app/guards/auth.guards.ts
roleGuard('ADMIN')                   // un seul rôle
roleGuard('OWNER', 'ADMIN')          // plusieurs rôles
authGuard                            // juste authentifié
```

Tout utilisateur non autorisé est redirigé :

- vers `/login?redirect=<chemin>` s'il n'est pas connecté
- vers `/forbidden` s'il est connecté mais pas le bon rôle

---

## Modèle de données (MongoDB)

Trois collections, créées automatiquement par Mongoose au premier insert
(le seed se charge de l'initialisation).

### `users`

| Champ          | Type                          | Notes                                                |
|----------------|-------------------------------|-------------------------------------------------------|
| `email`        | `string`, unique, lowercase   | Index unique                                          |
| `passwordHash` | `string`                      | bcrypt 12 rounds                                      |
| `displayName`  | `string`                      |                                                       |
| `role`         | `'ADMIN' \| 'OWNER' \| 'CUSTOMER'` | Index                                            |
| `restaurantId` | `ObjectId → Restaurant`       | **Obligatoire pour OWNER** (validation Mongoose)      |
| `createdAt`, `updatedAt` | `Date`              | `timestamps: true`                                    |

### `restaurants`

| Champ                    | Type                                  | Notes                                            |
|--------------------------|---------------------------------------|---------------------------------------------------|
| `slug`                   | `string`, unique, lowercase           | Clé d'URL (ex. `talkin-tacos-miami`)              |
| `name`, `tagline`, `description` | `string`                      |                                                   |
| `cuisineTypes`           | `string[]`                            | ex. `['Mexican','Tacos']`                          |
| `phone`, `email`         | `string`                              |                                                   |
| `address`                | objet (street, city, state, postalCode, country) |                                       |
| `uiConfig`               | sous-document (cf. plus bas)          | Identité visuelle par tenant                       |
| `shopifyShopUrl`         | `string`, requis                      | ex. `ma-boutique.myshopify.com`                    |
| `storefrontAccessToken`  | `string`, requis                      | **Jamais** renvoyé au client public               |
| `menuCategories`         | `string[]`                            | Ordre d'affichage des catégories                   |
| `menuItems`              | sous-documents (cf. plus bas)         |                                                   |
| `isPublished`            | `boolean`                             | Index ; seuls les `true` apparaissent au public    |

Sous-document **`uiConfig`** :

```ts
{
  heroImageUrl: string;
  logoUrl: string;
  primaryColor: string;      // hex
  secondaryColor: string;    // hex
  accentColor: string;       // hex
  headingFont: string;       // CSS font-family
  bodyFont: string;
  menuLayout: 'GRID' | 'LIST' | 'MAGAZINE';
  showStickyCategoryNav: boolean;
}
```

Sous-document **`menuItems[]`** :

```ts
{
  name: string;
  description: string;
  priceCents: number;          // toujours en cents pour éviter les flottants
  currency: string;            // ISO 4217 ('USD', 'CAD', 'EUR')
  imageUrl: string;
  category: string;            // doit matcher une entrée de menuCategories
  shopifyVariantId?: string;   // pour le checkout headless
  isAvailable: boolean;
  tags: string[];              // ex. ['vegan','spicy']
}
```

### `globalconfigs`

**Singleton** garanti par un index unique sur `scope: 'global'`. Une seule
ligne dans cette collection à tout moment.

| Champ                  | Type                  | Notes                                            |
|------------------------|-----------------------|---------------------------------------------------|
| `scope`                | `'global'`            | Toujours `'global'`, unique                       |
| `flags`                | `FeatureFlag[]`       | Voir section A/B testing                          |
| `globalBannerEnabled`  | `boolean`             | Affiche / masque la bannière                      |
| `globalBannerText`     | `string`              | Texte affiché en haut de chaque vitrine           |
| `updatedBy`            | `string` (user id)    | Trace l'admin ayant modifié                       |

---

## API backend

Toutes les routes sont préfixées par `/api`. Les réponses suivent l'enveloppe
`{ data: ... }` ; les erreurs sont `{ error: '...' }` avec un code HTTP
correct.

| Méthode | Chemin                            | Auth requise              | Rôle requis     | Effet                                            |
|---------|-----------------------------------|---------------------------|-----------------|---------------------------------------------------|
| GET     | `/api/health`                     | —                         | —               | Liveness probe                                   |
| POST    | `/api/auth/register`              | —                         | —               | Inscription CUSTOMER uniquement                  |
| POST    | `/api/auth/login`                 | —                         | —               | Retourne `{ token, user }`                       |
| GET     | `/api/auth/me`                    | Bearer                    | Tous            | Profil de l'utilisateur courant                  |
| POST    | `/api/auth/register-privileged`   | Bearer                    | ADMIN           | Créer un OWNER ou un ADMIN                       |
| GET     | `/api/restaurants`                | —                         | —               | Liste les restaurants publiés                    |
| GET     | `/api/restaurants/:slug`          | —                         | —               | Renvoie un restaurant complet (sans token Shopify) |
| PATCH   | `/api/restaurants/:id`            | Bearer                    | OWNER ou ADMIN  | OWNER ne modifie que le sien ; ADMIN n'importe quel |
| GET     | `/api/global-config`              | —                         | —               | Lecture des feature flags / bannière             |
| PUT     | `/api/global-config`              | Bearer                    | ADMIN           | Mise à jour complète du singleton                |

### Filtrage côté serveur

Le `RestaurantController.stripSecrets()` supprime systématiquement le champ
`storefrontAccessToken` des réponses publiques. Aucune route GET publique
n'expose ce token.

---

## Routes frontend

| Chemin                  | Composant                       | Garde                         |
|-------------------------|---------------------------------|-------------------------------|
| `/`                     | `RestaurantListComponent`       | —                             |
| `/restaurants/:slug`    | `RestaurantDetailComponent`     | —                             |
| `/login`                | `LoginComponent`                | —                             |
| `/admin`                | `AdminDashboardComponent`       | `roleGuard('ADMIN')`          |
| `/owner`                | `OwnerDashboardComponent`       | `roleGuard('OWNER','ADMIN')`  |
| `/me`                   | `CustomerDashboardComponent`    | `authGuard`                   |
| `/forbidden`            | `ForbiddenComponent`            | —                             |
| `**` (catch-all)        | redirection vers `/`            | —                             |

Toutes les routes sont **lazy-loadées** (`loadComponent`) → chaque dashboard
est un chunk JS séparé téléchargé uniquement quand l'utilisateur y va.

---

## Système d'A/B testing et de feature flags

### Concept

Un **flag** est une décision configurable côté serveur qui influence l'UI
côté client. Tous les flags vivent dans le document singleton `GlobalConfig`.
Changer un flag dans le dashboard `/admin` modifie le rendu de **toutes les
vitrines** à la prochaine hydratation (recharge ou navigation).

### Structure d'un flag

```ts
{
  key: 'menu.layout',                    // identifiant unique
  description: '...',                    // affiché dans /admin
  enabled: true,                          // false → flag ignoré
  forceDefault: false,                    // true → tout le monde a defaultVariant
  defaultVariant: 'GRID',                 // fallback
  variants: [
    { name: 'GRID',     weight: 50 },
    { name: 'MAGAZINE', weight: 30 },
    { name: 'LIST',     weight: 20 },
  ]
}
```

### Flags actuellement seedés

| Clé                                  | Variants                       | Effet                                            |
|--------------------------------------|--------------------------------|---------------------------------------------------|
| `menu.layout`                         | GRID, MAGAZINE, LIST           | Disposition de la grille du menu de chaque vitrine |
| `storefront.stickyCategoryNav`        | ON, OFF                        | Affiche / masque la barre de catégories collantes  |
| `storefront.heroEmphasis`             | FULL, MINIMAL                  | (Désactivé, réservé à un futur A/B)               |

### Cycle de vie au runtime

1. **Au boot de l'app Angular**, `APP_INITIALIZER` appelle
   `GlobalConfigService.loadOnce()` qui fait un GET sur `/api/global-config`
   et stocke le résultat dans un `signal`.
2. **À chaque rendu** d'un composant qui dépend d'un flag (ex. le storefront
   pour `menu.layout`), un `computed` appelle
   `globalConfig.resolveVariant('menu.layout', restaurant.slug)`.
3. La résolution applique cette logique :
   - flag absent / `enabled: false` → `null` (le composant retombe sur la
     valeur du tenant)
   - `forceDefault: true` → renvoie `defaultVariant`
   - sinon, **bucketing déterministe** basé sur le `slug` du restaurant : la
     même vitrine voit toujours la même variante (sticky), mais la
     distribution globale respecte les poids
4. Quand l'admin change un flag et clique « Enregistrer », un `PUT
   /api/global-config` met à jour le singleton. Le service refresh sa copie
   locale, et tous les `computed` qui en dépendent recalculent.

Le bucketing utilise un hash FNV-1a sur `flag.key + ':' + seed`, modulo
1 000 000. C'est déterministe, rapide, et garantit qu'on n'a pas besoin de
stocker l'assignation d'une variante par client.

### Ajouter un nouveau flag

**1.** Côté **serveur** (`server/src/scripts/seed.ts`), ajouter le flag dans
le tableau `GLOBAL_CONFIG_FIXTURE.flags`, puis relancer `npm run seed`. Ou,
plus simple, l'ajouter via l'interface admin (à venir : pour l'instant
nécessite un PUT direct sur l'API).

**2.** Côté **client**, dans le composant concerné, lire le flag :

```ts
readonly myVariant = computed<'A' | 'B'>(() => {
  const v = this.globalConfig.resolveVariant('my.flag', 'some-seed');
  return v === 'A' || v === 'B' ? v : 'A';
});
```

Puis brancher la classe / le ngIf / le style sur `myVariant()`.

### Piloter un flag depuis l'interface

1. Se connecter en `admin@yva.local` / `admin1234`
2. Aller sur `/admin`
3. Pour chaque flag : toggle « Activé », toggle « Forcer la valeur par
   défaut », et choisir le variant par défaut dans le select
4. Cliquer **Enregistrer**
5. Recharger n'importe quelle vitrine → la disposition / le contenu reflète
   le nouveau choix

**Astuce kill-switch :** cocher `forceDefault` permet de désactiver l'A/B sans
toucher aux poids — utile pour figer tout le monde sur une variante pendant
un incident.

### Bannière inter-tenants

C'est le même mécanisme dans une autre case : `globalBannerEnabled` (bool) +
`globalBannerText` (string). La bannière s'affiche en haut de la page d'accueil
et en haut de chaque vitrine. Idéal pour une promotion globale ou un message
d'urgence.

---

## Ajouter un restaurant

### Option A — Modifier le seed (le plus rapide en dev)

1. Ouvrir `server/src/scripts/seed.ts`
2. Ajouter un objet au tableau `RESTAURANT_FIXTURES` :

   ```ts
   {
     slug: 'mon-resto',          // doit être unique
     name: 'Mon Resto',
     tagline: '...',
     description: '...',
     cuisineTypes: ['Pizza'],
     phone: '+33 1 23 45 67 89',
     email: 'contact@mon-resto.local',
     address: { street: '...', city: '...', state: '', postalCode: '75001', country: 'FR' },
     uiConfig: {
       heroImageUrl: 'https://...',
       logoUrl: '',
       primaryColor: '#0A1F44',
       secondaryColor: '#FFFFFF',
       accentColor: '#1E88E5',
       headingFont: '"Inter", sans-serif',
       bodyFont: '"Inter", sans-serif',
       menuLayout: 'GRID',
       showStickyCategoryNav: true,
     },
     shopifyShopUrl: 'mon-resto.myshopify.com',
     storefrontAccessToken: '...',     // depuis Shopify Admin → Apps → API
     menuCategories: ['Pizzas', 'Boissons'],
     menuItems: [
       {
         name: 'Margherita',
         description: 'Tomate, mozzarella, basilic',
         priceCents: 1200,
         currency: 'EUR',
         imageUrl: 'https://...',
         category: 'Pizzas',
         shopifyVariantId: 'gid://shopify/ProductVariant/...',
         isAvailable: true,
         tags: ['vegetarian'],
       },
     ],
     isPublished: true,
   }
   ```

3. Relancer `npm --prefix server run seed` (attention : cela vide les
   fixtures précédentes — voir option B pour une approche additive).
4. La nouvelle vitrine est accessible à `/restaurants/mon-resto`.

### Option B — Insertion directe (additive, en prod)

Soit via MongoDB Atlas → Browse Collections → Insert Document, soit par
appel API (à venir avec l'interface ADMIN « Create restaurant »). En attendant,
on peut utiliser `mongosh` :

```js
use openrate
db.restaurants.insertOne({ /* le même objet */ })
```

### Lier un propriétaire à un restaurant

```js
db.users.insertOne({
  email: 'owner@mon-resto.local',
  passwordHash: '<bcrypt hash>',
  displayName: 'Propriétaire Mon Resto',
  role: 'OWNER',
  restaurantId: ObjectId('<id du resto>'),
})
```

Plus simple : `POST /api/auth/register-privileged` avec un token admin et
le body `{ email, password, displayName, role: 'OWNER', restaurantId }`. Le
serveur fait le hash bcrypt automatiquement.

---

## Le pattern « UI pilotée par les données »

C'est l'idée centrale du projet : **un seul composant Angular sert toutes
les vitrines**. Aucune logique du genre `if (restaurant === 'talkin-tacos')`.

Comment ça marche concrètement :

1. **Palette + polices par CSS variables.** Le composant injecte
   `--brand-primary`, `--brand-secondary`, `--brand-accent`, `--font-heading`,
   `--font-body` sur son host à partir de `restaurant.uiConfig`. Le SCSS ne
   référence que ces variables. Changer le `accentColor` dans MongoDB →
   reload → tout est repeint sans recompilation.

2. **Disposition pilotée par flag.** La classe CSS
   `.menu--grid` / `.menu--list` / `.menu--magazine` est appliquée selon
   `effectiveLayout()`, lequel lit en priorité le flag global
   `menu.layout`, et retombe sur `uiConfig.menuLayout` du tenant si le flag
   est absent.

3. **Catégories et items.** `menuCategories[]` rend les pilules de la nav
   collante ; `menuItems[]` rend les cartes ; tout est tri-able / filtrable
   en signals.

4. **Bouton Commander.** Calcule l'URL Shopify à la volée en assemblant
   `https://${shopifyShopUrl}/cart/${item.shopifyVariantId}:1`. Aucun panier
   chez nous, aucune écriture en BDD pour une commande.

Le tout est en **OnPush + signals** : pas de souscription RxJS à nettoyer
dans les composants, pas de `ngOnDestroy`.

---

## Internationalisation (FR / EN)

### Architecture

```
client/src/app/i18n/
  translations.ts     dictionnaires plats : Record<string,string> en / fr
  language.service.ts signal de la langue active + computed du dict + t()
  translate.pipe.ts   '{{ "nav.signIn" | translate }}'
```

Le `LanguageService` :

- détecte la langue initiale : `localStorage` > `navigator.language` >
  défaut (`en`)
- expose `lang()` (signal lecture seule), `setLang()`, `toggle()`,
  `otherLanguage()` (signal pour le bouton « EN / FR »)
- met à jour `document.documentElement.lang` pour l'accessibilité et le SEO

Le pipe `translate` est `pure: false` car il dépend d'un signal externe à
son input. Avec OnPush + signals, le coût reste négligeable.

### Bouton de bascule

Toujours présent dans le topbar, à droite. Cliquer fait passer la langue
**instantanément** dans toute l'application, sans rechargement. Le choix
est persisté dans `localStorage` sous la clé `yva.lang`.

### Ajouter une chaîne traduite

1. Choisir une clé (ex. `'home.featured'`)
2. Ajouter la clé **dans les deux** dictionnaires `en` et `fr` de
   `translations.ts`
3. L'utiliser : `{{ 'home.featured' | translate }}`

Si une clé manque dans le dict, le pipe renvoie la clé elle-même — pratique
pour spotter les oublis.

### Ajouter une nouvelle langue

1. Ajouter le code dans le type `Lang` et dans `LANGUAGES` de
   `translations.ts`
2. Ajouter un nouveau dictionnaire avec les mêmes clés
3. Étendre la bascule en dropdown si on veut plus de deux langues

---

## Authentification et sécurité

### Côté serveur

- **Hash des mots de passe :** bcrypt, 12 rounds. Configuré dans
  `AuthService.bcryptRounds`.
- **JWT :** signé HS256 avec `JWT_SECRET`, durée de 7 jours. Payload :
  `{ id, role, restaurantId? }`.
- **Inscription :** `POST /api/auth/register` ne crée **que** des CUSTOMER.
  Tenter d'envoyer un autre `role` renvoie un 403. Pour créer un OWNER ou un
  ADMIN, il faut être ADMIN et utiliser `/register-privileged`.
- **Middleware `authenticate`** : extrait le Bearer, vérifie la signature et
  attache `req.user`.
- **Middleware `requireRole(...)`** : refuse 401 si non authentifié, 403 si
  rôle non autorisé.
- **CORS** épinglé sur `CLIENT_ORIGIN` (défaut `http://localhost:4200`).
- **Helmet** par défaut.
- Les **secrets Shopify** ne sortent jamais des réponses publiques (filtre
  systématique dans `stripSecrets()`).

### Côté client

- **`AuthService`** stocke `{ token, user }` dans un signal et dans
  `localStorage` (SSR-safe via `isPlatformBrowser`).
- **`authInterceptor`** ajoute automatiquement `Authorization: Bearer <token>`
  à chaque requête HTTP si un token est présent.
- **`authGuard`** redirige vers `/login?redirect=<chemin>` si non connecté.
- **`roleGuard(...)`** redirige vers `/forbidden` si le rôle ne convient pas.

### Rotation d'un secret

- **JWT_SECRET** : changer la valeur dans `.env` → tous les JWT existants
  deviennent invalides (effet : tout le monde doit se reconnecter). Aucune
  action en BDD nécessaire.
- **Mot de passe Atlas** : changer dans la console Atlas → mettre à jour
  `MONGODB_URI` dans `.env` → redémarrer le serveur.

---

## Checkout Shopify headless

L'app **ne gère pas** de panier. Quand un client clique « Commander » sur
une carte de menu :

```ts
// client/src/app/services/restaurant.service.ts
buildCheckoutUrl(restaurant, item, quantity = 1): string | null {
  if (!item.shopifyVariantId || !restaurant.shopifyShopUrl) return null;
  const shop = restaurant.shopifyShopUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  return `https://${shop}/cart/${item.shopifyVariantId}:${quantity}`;
}
```

L'utilisateur arrive directement sur le **panier Shopify** du restaurant
avec l'article déjà ajouté. À partir de là, c'est Shopify qui gère :

- les options (taille, suppléments)
- les promo codes
- la livraison / le retrait
- le paiement (PCI-DSS de Shopify, pas le nôtre)
- l'e-mail de confirmation
- le suivi de commande

Chaque restaurant fournit deux choses :

- **`shopifyShopUrl`** : ex. `talkintacos.myshopify.com`
- **`storefrontAccessToken`** : généré côté Shopify (Settings → Apps → API).
  Stocké en BDD mais **jamais** renvoyé au navigateur. Réservé à de futurs
  appels server-to-server vers la Storefront API.

Chaque `menuItem` doit avoir un **`shopifyVariantId`** valide (format
`gid://shopify/ProductVariant/...`). Sans cela, le bouton « Commander » est
désactivé.

---

## Identité visuelle OpenRate

### Palette

| Rôle                       | Hex        | Usage                                          |
|----------------------------|------------|------------------------------------------------|
| Deep navy                  | `#0A1F44`  | Background du topbar                            |
| Brand blue                 | `#1E88E5`  | Accent (links actifs, hover, focus, CTAs)       |
| Gradient top               | `#3DA5F5`  | Haut du dégradé du logo                         |
| Gradient bottom            | `#0D47A1`  | Bas du dégradé du logo                          |
| Background app             | `#FAF7F2`  | Fond crème de la page d'accueil et des vitrines |
| Texte principal            | `#1A1A1A`  |                                                 |
| Erreur (sémantique)        | `#A4161A`  | Inchangé, reste rouge                           |

### Logo

Composant Angular `<app-brand-logo [size]="34" [showWordmark]="true" />`
défini dans `client/src/app/components/brand-logo/brand-logo.component.ts`.
Rend un SVG inline (pas de fetch image, scale propre, accessibilité native)
représentant un monogramme « OR » dans un cercle avec le dégradé bleu, suivi
du wordmark « OpenRate » en Inter Bold.

Le favicon `client/src/favicon.svg` reprend exactement la même géométrie.

### Polices

- **Inter** (400, 500, 600, 700) : UI, texte courant, wordmark
- **Anton** : titres « display » des vitrines (utilisé via les valeurs
  `uiConfig.headingFont` du seed Talkin' Tacos)
- **Playfair Display** : titres serif (Shandmas)

Chargées depuis Google Fonts dans `client/src/styles.scss`.

---

## Build de production

```bash
npm run build
```

- Client → `client/dist/client/` (browser + server bundles, SSR-ready)
- Serveur → `server/dist/` (JS compilé depuis TypeScript)

Pour démarrer le serveur en prod :

```bash
NODE_ENV=production npm --prefix server run start
```

Pour démarrer le SSR Angular :

```bash
node client/dist/client/server/server.mjs
```

Ou déployer les `dist/` séparément (Render, Railway, Vercel, etc.).

---

## Dépannage

### `EADDRINUSE: address already in use :::3000`

Un process Node tient le port. Trouver et tuer :

```bash
netstat -ano | findstr :3000      # Windows
taskkill /F /PID <PID>            # Windows
# ----
lsof -ti:3000 | xargs kill -9     # macOS / Linux
```

### `Login failed` mais l'admin existe

Vérifier que **le serveur tourne** sur le port 3000 (la page de login le
détecte et affiche un message explicite si non).

### Le storefront reste sur « Loading restaurant… »

Soit la BDD est vide (relancer `npm --prefix server run seed`), soit le slug
de l'URL n'existe pas en base. Vérifier :

```bash
curl http://localhost:3000/api/restaurants
```

### NG0203 `inject() must be called from an injection context`

Si vous ajoutez un `APP_INITIALIZER`, l'appel à `inject(...)` doit avoir
lieu **dans le corps de la factory**, pas dans la fonction renvoyée :

```ts
useFactory: () => {
  const svc = inject(MyService);    // ✅
  return () => svc.init();
}
```

### Le bouton de langue ne s'affiche pas

Vérifier que `LanguageService` et `TranslatePipe` sont importés dans le
composant. Le service est en `providedIn: 'root'` donc accessible partout
sans provider explicite.

### Mongoose : `MongooseServerSelectionError`

`MONGODB_URI` invalide, IP non whitelistée sur Atlas, ou mot de passe avec
caractères spéciaux non URL-encodés (`@` → `%40`, etc.).

---

**Crédits techniques.** Architecture en couches SOLID, gestion des
secrets, séparation client/serveur, conception multi-tenant, internationalisation
runtime, A/B testing par bucketing déterministe.
