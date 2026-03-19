# 🚀 Guide de démarrage rapide - Address-Web

## ✅ Prototype 100% fonctionnel

L'application est **prête à l'emploi** ! Aucune configuration supplémentaire requise.

## 📋 Checklist de démarrage

- ✅ Tous les packages sont installés
- ✅ React Router configuré
- ✅ Leaflet (cartes) intégré
- ✅ LocalStorage pour persistance
- ✅ Adresses d'exemple pré-chargées
- ✅ UI responsive (mobile + desktop)
- ✅ Error boundaries en place
- ✅ Outils de débogage inclus

## 🎯 Test rapide - 3 étapes

### 1. Page d'accueil (/)
- Voir la page d'accueil avec présentation
- Cliquer sur les adresses d'exemple
- Tester la navigation

### 2. Créer une adresse (/create)
- Cliquer sur "Créer mon adresse"
- Cliquer sur la carte pour placer un marqueur
- OU utiliser le bouton de géolocalisation
- Remplir les détails (ville, repère)
- Créer l'adresse

### 3. Voir une adresse (/:code)
- Exemple : `/AW-ABJ-12345`
- Voir la carte avec le marqueur
- Tester les boutons de partage
- Copier le code/lien
- Afficher le QR code
- Naviguer vers Google Maps

## 🛠️ Outils de débogage

Ouvrez la console du navigateur et utilisez :

```javascript
// Lister toutes les adresses
AddressWebDebug.listAll()

// Créer une adresse de test
AddressWebDebug.createTest('Dakar', 14.7167, -17.4677, 'Place de l\'Indépendance')

// Créer 10 adresses de test
AddressWebDebug.createBulk(10)

// Voir les infos de stockage
AddressWebDebug.storageInfo()

// Nettoyer toutes les adresses
AddressWebDebug.clearAll()
```

## 📱 Test mobile

L'application est responsive ! Testez sur :
- Mobile (< 640px)
- Tablette (640px - 1024px)
- Desktop (> 1024px)

### Fonctionnalités mobiles
- ✅ Carte tactile
- ✅ Géolocalisation GPS
- ✅ Boutons adaptés
- ✅ Navigation fluide

## 🗺️ Villes reconnues

Le système détecte automatiquement :
- **Abidjan** (5.36, -4.00) - Côte d'Ivoire
- **Dakar** (14.71, -17.46) - Sénégal
- **Lagos** (6.52, 3.37) - Nigeria
- **Accra** (5.60, -0.20) - Ghana
- **Kinshasa** (-4.32, 15.31) - RDC
- **Nairobi** (-1.28, 36.82) - Kenya

## 🔧 Résolution de problèmes

### La carte ne s'affiche pas
- ✅ Vérifiez la console pour les erreurs
- ✅ Rafraîchissez la page (Ctrl+R)
- ✅ Videz le cache du navigateur

### Le marqueur ne s'affiche pas
- ✅ Les icônes Leaflet sont chargées depuis un CDN
- ✅ Vérifiez votre connexion internet
- ✅ La carte doit être cliquable

### La géolocalisation ne fonctionne pas
- ✅ Autorisez l'accès à la localisation dans le navigateur
- ✅ Utilisez HTTPS (requis pour la géolocalisation)
- ✅ Utilisez le clic manuel comme alternative

### Les adresses ne sont pas sauvegardées
- ✅ Vérifiez que localStorage est activé
- ✅ Mode navigation privée peut désactiver localStorage
- ✅ Vérifiez dans Dev Tools > Application > Local Storage

## 📊 Données de test

Au premier lancement, 3 adresses sont créées :

```javascript
AW-ABJ-12345 - Maison bleue à côté de la grande mosquée
AW-ABJ-67890 - Boutique Orange Money près du marché
AW-ABJ-54321 - Restaurant Le Palmier, deuxième étage
```

## 🎨 Personnalisation

### Changer la ville par défaut
```typescript
// src/app/components/MapPicker.tsx (ligne 30)
const defaultCenter: [number, number] = [5.3600, -4.0083]; // Abidjan
// Remplacez par vos coordonnées
```

### Ajouter plus de villes
```typescript
// src/app/utils/addressService.ts
// Ajoutez des conditions dans getCityFromCoordinates()
```

### Modifier les couleurs
```css
/* src/styles/theme.css */
/* Personnalisez les couleurs du thème */
```

## 🚢 Déploiement

L'application est prête pour :

### Vercel / Netlify
```bash
npm run build
# Deploy le dossier dist/
```

### GitHub Pages
```bash
npm run build
# Configure base path dans vite.config.ts
```

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## 📈 Prochaines étapes

### MVP actuel ✅
- [x] Page d'accueil
- [x] Création d'adresse
- [x] Affichage d'adresse
- [x] Partage (WhatsApp, lien, QR)
- [x] Navigation GPS
- [x] LocalStorage

### Version 2.0 (suggestions)
- [ ] Backend API (Node.js/Laravel/Django)
- [ ] Base de données (PostgreSQL + PostGIS)
- [ ] Authentification utilisateur
- [ ] Recherche d'adresses
- [ ] Analytics
- [ ] API publique
- [ ] Application mobile (React Native)

## 🎓 Ressources

### Documentation
- [React Router](https://reactrouter.com/)
- [Leaflet](https://leafletjs.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)

### Support technique
- Consultez les erreurs dans la console
- Vérifiez le README.md pour plus de détails
- Utilisez les outils de débogage

## ✨ Fonctionnalités bonus

- **Error Boundary** : Gestion gracieuse des erreurs
- **Loading states** : Indicateurs de chargement
- **Toast notifications** : Feedback utilisateur
- **Responsive design** : Adapté à tous les écrans
- **Debug tools** : Console pour les tests
- **Demo addresses** : Exemples pré-chargés

---

**Status** : ✅ 100% Fonctionnel  
**Dernière mise à jour** : 16 Mars 2026  
**Prêt pour la production** : Oui (avec backend)
