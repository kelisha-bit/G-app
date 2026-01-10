# ⚡ Quick Deployment Guide

Fast-track deployment for Greater Works City Church app.

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

**Or use npx if installation fails:**
```bash
npx eas-cli --version
```

---

### Step 2: Login to Expo

```bash
eas login
```

Create free account at: https://expo.dev/signup if needed.

---

### Step 3: Set Up EAS Secrets

**IMPORTANT:** Environment variables from `.env` are NOT automatically included in EAS builds. You must set them as EAS secrets.

**Option A: Use Setup Script (Recommended)**
```bash
.\setup-eas-secrets.ps1
```

**Option B: Manual Setup**
```bash
# Set each Firebase variable as a secret
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-auth-domain"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-storage-bucket"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-app-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "your-measurement-id"
```

**Verify secrets:**
```bash
eas secret:list
```

---

### Step 4: Deploy Firebase Rules

**CRITICAL:** Must be done before production!

1. Go to: https://console.firebase.google.com/project/greater-works-city-churc-4a673/firestore/rules
2. Copy content from `firestore.rules`
3. Paste and click "Publish"

**Or use Firebase CLI:**
```bash
firebase deploy --only firestore:rules
```

---

### Step 5: Build & Deploy

**Android Preview (APK for testing):**
```bash
npm run build:preview
```

**Android Production (AAB for Play Store):**
```bash
npm run build:android
```

**iOS Production:**
```bash
npm run build:ios
```

**Monitor builds at:** https://expo.dev

---

## 📤 Submit to Stores

**Android (Google Play Store):**
```bash
npm run submit:android
```

**iOS (App Store):**
```bash
npm run submit:ios
```

---

## ✅ Pre-Deployment Checklist

Before building:

- [ ] `.env` file exists and has all Firebase values
- [ ] Firebase security rules deployed
- [ ] EAS secrets created (use `.\setup-eas-secrets.ps1`)
- [ ] Logged in to Expo (`eas login`)
- [ ] App version updated in `app.json` if needed
- [ ] Tested app locally (`npm start`)

---

## 🆘 Common Issues

### "Firebase configuration is missing" in build
**Solution:** EAS secrets not set. Run `.\setup-eas-secrets.ps1`

### "Invalid API key" error
**Solution:** Verify API key in `.env` matches Firebase Console

### Build fails with credentials error
**Solution:** Run `eas build:configure` to set up credentials

---

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions.

---

🎉 **Ready to deploy?** Start with Step 1!

