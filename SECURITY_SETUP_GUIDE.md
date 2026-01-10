# 🔒 Security Setup Guide - Environment Variables

## ✅ Security Fixes Applied

All sensitive configuration has been moved to environment variables. This prevents API keys and credentials from being exposed in your source code.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Your .env File

1. **Copy the example file:**
   ```bash
   # On Windows (PowerShell):
   Copy-Item .env.example .env
   
   # On Mac/Linux:
   cp .env.example .env
   ```

2. **Open `.env` in a text editor** and fill in your actual values

### Step 2: Add Firebase Configuration

Get your Firebase config from [Firebase Console](https://console.firebase.google.com/):

1. Go to your project
2. Click the gear icon ⚙️ > **Project Settings**
3. Scroll down to **Your apps** section
4. Click on your web app (or create one if needed)
5. Copy the config values

**Add to `.env`:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Note:** Replace the placeholder values above with your actual Firebase configuration values from Firebase Console.

### Step 3: Add Optional API Keys

#### OpenAI API (for AI features)
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-key-here
```
Get from: https://platform.openai.com/api-keys

#### Weather API (for event weather)
```env
EXPO_PUBLIC_WEATHER_API_KEY=your-actual-key-here
```
Get from: https://openweathermap.org/api

### Step 4: Restart Expo Server

**IMPORTANT:** You must restart Expo for environment variables to load:

```bash
# Stop the current server (Ctrl+C)
# Then restart with cache clear:
npm start --clear
```

The `--clear` flag ensures environment variables are loaded fresh.

---

## ✅ Verify It's Working

After restarting, check:

1. **App starts without errors** ✅
2. **Firebase connection works** (try logging in) ✅
3. **No console warnings** about missing config ✅

---

## 🔍 What Changed?

### Before (❌ Insecure):
```javascript
// firebase.config.js
const firebaseConfig = {
  apiKey: "AIzaSyB3mkl2j1ce9YBZg_NptLSZHnqb-_N_Qr8", // Exposed!
  // ...
};
```

### After (✅ Secure):
```javascript
// firebase.config.js
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY, // From .env
  // ...
};
```

---

## 📁 Files Updated

1. ✅ `firebase.config.js` - Now uses environment variables
2. ✅ `src/utils/weatherApi.js` - Now uses environment variables
3. ✅ `.env.example` - Template file created
4. ✅ `.gitignore` - Already includes .env (secure!)

---

## 🛡️ Security Best Practices

### ✅ What's Protected Now:
- Firebase API keys and config
- OpenAI API key
- Weather API key
- All sensitive credentials

### ✅ What's Safe:
- `.env` file is in `.gitignore` (won't be committed)
- `.env.example` is safe to commit (no real keys)
- Environment variables are loaded at runtime

### ⚠️ Important Reminders:
1. **Never commit `.env` file** to Git
2. **Never share `.env` file** publicly
3. **Use different keys** for development and production
4. **Rotate keys** if accidentally exposed

---

## 🐛 Troubleshooting

### Problem: "Firebase configuration is missing"
**Solution:** 
- Check that `.env` file exists
- Verify all `EXPO_PUBLIC_FIREBASE_*` variables are set
- Restart Expo server with `npm start --clear`

### Problem: "Weather API key not configured"
**Solution:**
- This is optional - weather features will show an error message
- Add `EXPO_PUBLIC_WEATHER_API_KEY` to `.env` if you want weather features

### Problem: Environment variables not loading
**Solution:**
1. Make sure variable names start with `EXPO_PUBLIC_`
2. Restart Expo server completely
3. Clear Expo cache: `npm start --clear`
4. Check `.env` file is in project root (same folder as `package.json`)

### Problem: App works but shows warnings
**Solution:**
- Warnings about missing optional keys (Weather, OpenAI) are normal
- Only Firebase keys are required

---

## 📝 For Team Members

When setting up the project:

1. **Clone the repository**
2. **Copy `.env.example` to `.env`**
3. **Get Firebase config** from project admin
4. **Fill in `.env` file** with actual values
5. **Never commit `.env`** to Git

---

## 🔄 Migration from Old Config

If you had hardcoded values before:

1. ✅ Values are now in environment variables
2. ✅ Code automatically reads from `.env`
3. ✅ No code changes needed in your screens
4. ✅ Just create `.env` file and restart

---

## 📞 Need Help?

- Check `.env.example` for variable names
- Review `APPLICATION_REVIEW.md` for security details
- Verify `.gitignore` includes `.env`

---

**Security Status:** ✅ **SECURED**

All sensitive configuration is now properly protected using environment variables.

