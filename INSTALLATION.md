# 🚀 Address-Web v2 — Guide d'installation

## Ce qui a été ajouté

| Étape | Fonctionnalité | Statut |
|-------|---------------|--------|
| 1 | Nominatim — Reverse geocoding (toute l'Afrique) | ✅ |
| 2 | Supabase — Backend + base de données persistante | ✅ |
| 3 | Interface livreur — Tableau de bord livraisons | ✅ |
| 4 | PWA — Installer l'app sur smartphone | ✅ |

---

## 📦 Installation

### 1. Installer les dépendances

```bash
npm install
# ou
pnpm install
```

---

## 🗄️ Configurer Supabase (10 minutes)

### 1. Créer un projet Supabase
1. Va sur **https://supabase.com** → "New Project"
2. Choisis un nom (ex: `address-web`) et une région (choisir **EU West** ou **US East**)
3. Note ton mot de passe de base de données

### 2. Créer les tables
1. Dans Supabase → **SQL Editor** → "New Query"
2. Colle le contenu de `supabase/schema.sql`
3. Clique **Run**

### 3. Récupérer les clés API
1. Dans Supabase → **Settings** → **API**
2. Copie :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 4. Créer le fichier .env
```bash
cp .env.example .env
```
Puis édite `.env` avec tes vraies valeurs :
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🏃 Lancer le projet

```bash
npm run dev
```

L'app tourne sur **http://localhost:5173**

---

## 📱 Interface livreur

La page livreur est accessible sur `/livreur`

Pour créer une livraison de test, utilise l'API Supabase directement :
```sql
-- Dans Supabase SQL Editor
INSERT INTO deliveries (address_id, statut, notes)
SELECT id, 'en_attente', 'Livraison test'
FROM addresses LIMIT 1;
```

---

## 🌍 Fonctionnement du géocodage (Nominatim)

- **Gratuit** — Pas de clé API nécessaire
- **Toute l'Afrique** couverte via OpenStreetMap
- **Cache automatique** — Pas de requêtes en double
- **Fallback** — Si Nominatim est indisponible, retour sur les 16 villes principales

---

## 📲 PWA — Installer sur mobile

L'app peut être installée directement sur Android/iOS :

1. Ouvre l'app dans Chrome/Safari sur mobile
2. Android : Cliquez "Ajouter à l'écran d'accueil"
3. iOS : Icône partage → "Sur l'écran d'accueil"

**Pour activer la PWA en production**, ajoute des icônes dans `/public/icons/` :
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

---

## 🚀 Déploiement (Vercel recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

Ajoute tes variables d'environnement dans Vercel Dashboard → Settings → Environment Variables.

---

## 📁 Structure du projet v2

```
src/app/
├── pages/
│   ├── HomePage.tsx              ← Inchangée
│   ├── CreateAddressPage.tsx     ← ✨ Nominatim + Supabase
│   ├── AddressDetailsPage.tsx    ← ✨ Supabase + vue count
│   ├── LivreurDashboardPage.tsx  ← ✨ NOUVEAU
│   └── NotFound.tsx
├── components/
│   ├── MapPicker.tsx             ← Inchangé
│   └── AddressMap.tsx            ← Inchangé
├── utils/
│   ├── geocodingService.ts       ← ✨ NOUVEAU (Nominatim)
│   ├── supabaseService.ts        ← ✨ NOUVEAU (remplace addressService)
│   └── addressService.ts         ← Ancien (gardé pour compatibilité)
└── routes.tsx                    ← ✨ Route /livreur ajoutée

supabase/
└── schema.sql                    ← ✨ NOUVEAU (SQL à exécuter)

public/
├── manifest.json                 ← ✨ NOUVEAU (PWA)
└── sw.js                         ← ✨ NOUVEAU (Service Worker)
```

---

## ⚠️ Note sur le free tier Supabase

Le projet Supabase se **met en pause après 7 jours d'inactivité** sur le plan gratuit.

Pour éviter ça :
- Option 1 : Mettre en prod avec de vrais utilisateurs
- Option 2 : Configurer un ping automatique (ex: cron GitHub Actions toutes les 24h)
- Option 3 : Passer au plan Pro ($25/mois) une fois que tu as des utilisateurs
