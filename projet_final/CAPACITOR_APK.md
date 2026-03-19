# Guide : Générer l'APK Android avec Capacitor

## Prérequis
- Node.js 18+
- Android Studio installé
- Java JDK 17+

## Étapes

### 1. Installer les dépendances
```bash
npm install
```

### 2. Builder le projet web
```bash
npm run build
```

### 3. Ajouter la plateforme Android
```bash
npx cap add android
```

### 4. Synchroniser le code web vers Android
```bash
npx cap sync android
```

### 5. Ouvrir dans Android Studio
```bash
npx cap open android
```

### 6. Dans Android Studio
- Build > Generate Signed Bundle / APK
- Choisir APK
- Créer un keystore : addressweb.keystore
- Alias : addressweb
- Build > Release

### Commandes rapides
```bash
# Build complet + sync
npm run build:android

# Lancer sur émulateur/device
npm run cap:run:android
```

## Icônes Android
Copier les fichiers depuis `public/icons/` vers :
- `android/app/src/main/res/mipmap-mdpi/`     → icon-48.png
- `android/app/src/main/res/mipmap-hdpi/`     → icon-72.png
- `android/app/src/main/res/mipmap-xhdpi/`    → icon-96.png
- `android/app/src/main/res/mipmap-xxhdpi/`   → icon-144.png
- `android/app/src/main/res/mipmap-xxxhdpi/`  → icon-192.png

## Splash Screen
Couleur de fond : #1B4F8A
Logo centré blanc sur fond bleu

## App ID
`app.addressweb.mobile`
