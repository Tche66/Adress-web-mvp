# Address-Web 🗺️

Une plateforme d'adressage numérique pour l'Afrique permettant de créer et partager des adresses GPS précises via des codes uniques.

## 🎯 Fonctionnalités

- **Création d'adresses GPS** : Utilisez la carte interactive pour créer une adresse précise
- **Codes uniques** : Format `AW-VILLE-XXXXX` (ex: AW-ABJ-12345)
- **Partage facile** : WhatsApp, lien direct, QR Code
- **Navigation GPS** : Intégration avec Google Maps
- **Détection de ville** : Reconnaissance automatique des principales villes africaines
- **Interface multilingue** : Français par défaut
- **Responsive** : Optimisé mobile et desktop

## 🏗️ Architecture

### Technologies
- **React 18** avec TypeScript
- **React Router 7** pour la navigation
- **Leaflet** pour les cartes interactives (OpenStreetMap)
- **Tailwind CSS v4** pour le design
- **LocalStorage** pour la persistance (MVP)
- **QRCode.react** pour les QR codes

### Structure du projet
```
/src/app/
  ├── components/       # Composants réutilisables
  │   ├── AddressMap.tsx       # Carte d'affichage d'adresse
  │   ├── MapPicker.tsx        # Sélecteur de position
  │   ├── DemoAddresses.tsx    # Adresses d'exemple
  │   └── ui/                  # Composants UI (shadcn)
  ├── pages/           # Pages de l'application
  │   ├── HomePage.tsx         # Page d'accueil
  │   ├── CreateAddressPage.tsx # Création d'adresse
  │   ├── AddressDetailsPage.tsx # Détails et partage
  │   └── NotFound.tsx         # Page 404
  ├── utils/           # Services et utilitaires
  │   ├── addressService.ts    # Logique métier
  │   └── seedData.ts          # Données d'exemple
  ├── routes.tsx       # Configuration des routes
  └── App.tsx          # Point d'entrée
```

## 🚀 Démarrage rapide

L'application est prête à l'emploi avec des adresses d'exemple pré-chargées.

### Pages disponibles

1. **/** - Page d'accueil avec présentation
2. **/create** - Créer une nouvelle adresse
3. **/:code** - Voir les détails d'une adresse (ex: /AW-ABJ-12345)

### Adresses d'exemple

Au premier lancement, 3 adresses d'exemple sont créées à Abidjan :
- `AW-ABJ-12345` - Maison bleue à côté de la grande mosquée
- `AW-ABJ-67890` - Boutique Orange Money près du marché  
- `AW-ABJ-54321` - Restaurant Le Palmier, deuxième étage

## 📱 Utilisation

### Créer une adresse

1. Cliquez sur "Créer mon adresse"
2. **Étape 1 - Position** : 
   - Cliquez sur la carte pour placer un marqueur
   - OU utilisez le bouton de localisation GPS
3. **Étape 2 - Détails** :
   - Vérifiez/modifiez la ville
   - Ajoutez un point de repère (optionnel)
   - Cliquez sur "Créer mon adresse"

### Partager une adresse

Une fois créée, vous pouvez :
- Copier le code d'adresse
- Partager via WhatsApp
- Copier le lien direct
- Afficher le QR Code
- Naviguer vers l'adresse avec Google Maps

## 🌍 Villes supportées

Le système reconnaît automatiquement ces villes :
- Abidjan (Côte d'Ivoire)
- Dakar (Sénégal)
- Lagos (Nigeria)
- Accra (Ghana)
- Kinshasa (RDC)
- Nairobi (Kenya)

## 🔄 Migration vers backend

L'application est conçue pour faciliter la migration vers un vrai backend :

### LocalStorage → Base de données

Remplacez les fonctions dans `addressService.ts` :
- `saveAddress()` → API POST /addresses
- `getAllAddresses()` → API GET /addresses
- `getAddressByCode()` → API GET /addresses/:code

### Suggestions de stack backend
- **Node.js + Express + PostgreSQL + PostGIS**
- **Laravel + MySQL + Spatial Extensions**
- **Django + GeoDjango + PostgreSQL + PostGIS**

### Fonctionnalités futures
- Authentification utilisateur
- Géocodage inversé (API)
- Recherche d'adresses
- Analytics et statistiques
- API publique pour intégrations
- Webhooks pour notifications

## 🎨 Design System

L'application utilise un design moderne et accessible :

### Couleurs principales
- **Indigo** (#4F46E5) - Couleur primaire
- **Vert** (#16A34A) - Actions positives
- **Orange** (#EA580C) - Navigation

### Composants
- Basé sur shadcn/ui
- Tailwind CSS v4
- Icons : Lucide React

## 📦 Dépendances clés

```json
{
  "react": "18.3.1",
  "react-router": "7.13.0",
  "leaflet": "1.9.4",
  "qrcode.react": "4.2.0",
  "lucide-react": "0.487.0"
}
```

## ⚡ Performance

- **Code splitting** : Routes séparées
- **Lazy loading** : Composants optimisés
- **Lightweight** : Leaflet vanilla (pas react-leaflet)
- **Offline-ready** : LocalStorage pour la persistance

## 🔐 Sécurité

Pour la production :
- Implémenter HTTPS
- Valider les coordonnées GPS côté serveur
- Rate limiting sur les API
- Sanitization des inputs
- CORS configuré correctement

## 📄 Licence

Tous droits réservés © 2026 Address-Web

## 🤝 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Status** : ✅ Prototype MVP 100% fonctionnel
**Version** : 1.0.0
**Dernière mise à jour** : 16 Mars 2026
