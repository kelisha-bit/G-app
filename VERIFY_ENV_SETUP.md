# ✅ Verify Environment Variables Setup

## Quick Verification Guide

This guide helps you verify that your environment variables are properly configured and loading correctly.

---

## 🔍 Step 1: Check .env File Exists

Make sure you have a `.env` file in your project root:

```bash
# Windows (PowerShell):
Test-Path .env

# Mac/Linux:
ls -la .env
```

**Expected:** Should return `True` or show the file exists.

**If missing:**
```bash
# Windows (PowerShell):
Copy-Item .env.example .env

# Mac/Linux:
cp .env.example .env
```

---

## 🔍 Step 2: Verify .env File Contents

Open your `.env` file and verify it contains:

```env
# Firebase Configuration (REQUIRED)
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional API Keys
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_key_here
```

**Check:**
- ✅ No spaces around `=` sign
- ✅ No quotes around values (unless part of the value itself)
- ✅ All Firebase values are filled in
- ✅ Values match your Firebase Console settings

---

## 🔍 Step 3: Check Code Uses Environment Variables

Verify these files are using environment variables:

### firebase.config.js
```javascript
// Should look like this:
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

**Should NOT have hardcoded values like:**
```javascript
// ❌ WRONG - Hardcoded:
apiKey: "AIzaSyB3mkl2j1ce9YBZg_NptLSZHnqb-_N_Qr8"
```

### src/utils/weatherApi.js
```javascript
// Should look like this:
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || null;
```

---

## 🔍 Step 4: Test Environment Variable Loading

### Method 1: Check Console on App Start

1. Start your app:
   ```bash
   npm start --clear
   ```

2. Look for these in the console:
   - ✅ **No errors** about missing Firebase config = Good
   - ❌ **"Firebase configuration is missing"** = Check .env file

### Method 2: Add Temporary Test Code

Add this temporarily to `App.js` (remove after testing):

```javascript
// Temporary test - remove after verification
console.log('=== Environment Variables Test ===');
console.log('Firebase API Key:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Firebase Project ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('Weather API Key:', process.env.EXPO_PUBLIC_WEATHER_API_KEY ? '✅ Set' : '❌ Not set (optional)');
console.log('OpenAI API Key:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? '✅ Set' : '❌ Not set (optional)');
```

**Expected Output:**
```
=== Environment Variables Test ===
Firebase API Key: ✅ Set
Firebase Project ID: ✅ Set
Weather API Key: ❌ Not set (optional)
OpenAI API Key: ❌ Not set (optional)
```

---

## 🔍 Step 5: Test Firebase Connection

1. **Start the app:**
   ```bash
   npm start --clear
   ```

2. **Try to log in:**
   - If login works = ✅ Firebase config is correct
   - If login fails with "Firebase configuration is missing" = ❌ Check .env file

3. **Check for console errors:**
   - Look for Firebase initialization errors
   - Should see no errors if config is correct

---

## 🐛 Troubleshooting

### Problem: "Firebase configuration is missing" Error

**Causes:**
1. `.env` file doesn't exist
2. Variable names are wrong (must start with `EXPO_PUBLIC_`)
3. Expo server wasn't restarted after creating .env

**Solutions:**
```bash
# 1. Verify .env exists
ls .env

# 2. Check variable names in .env
# Must be: EXPO_PUBLIC_FIREBASE_API_KEY (not FIREBASE_API_KEY)

# 3. Restart Expo with --clear
npm start --clear
```

### Problem: Variables show as undefined

**Causes:**
1. Variable names don't start with `EXPO_PUBLIC_`
2. .env file has syntax errors
3. Expo wasn't restarted

**Solutions:**
1. Ensure all variables start with `EXPO_PUBLIC_`
2. Check for spaces around `=` in .env
3. Restart: `npm start --clear`

### Problem: Firebase still uses old hardcoded values

**Solution:**
- Check `firebase.config.js` - should use `process.env.*`
- Clear Metro cache: `npm start --clear`
- Delete `.expo` folder and restart

---

## ✅ Verification Checklist

- [ ] `.env` file exists in project root
- [ ] `.env` file contains all `EXPO_PUBLIC_FIREBASE_*` variables
- [ ] Firebase values match your Firebase Console
- [ ] No hardcoded values in `firebase.config.js`
- [ ] No hardcoded values in `src/utils/weatherApi.js`
- [ ] Restarted Expo with `npm start --clear`
- [ ] No console errors about missing config
- [ ] App can connect to Firebase (test login)
- [ ] `.env` file is in `.gitignore` (not committed)

---

## 🔒 Security Verification

### ✅ Good Practices:
- [x] `.env` file exists locally
- [x] `.env.example` exists (safe to commit)
- [x] `.env` is in `.gitignore`
- [x] No credentials in source code
- [x] Using `process.env.EXPO_PUBLIC_*` pattern

### ❌ Security Issues:
- [ ] `.env` file committed to Git (check git status)
- [ ] Hardcoded API keys in source code
- [ ] Shared `.env` file publicly

---

## 📝 Quick Test Commands

```bash
# 1. Check .env exists
Test-Path .env  # Windows
ls .env         # Mac/Linux

# 2. Verify .env is in .gitignore
Select-String ".env" .gitignore  # Windows
grep ".env" .gitignore           # Mac/Linux

# 3. Start with cache clear
npm start --clear

# 4. Check for hardcoded values (should return nothing)
Select-String "AIzaSy" firebase.config.js  # Windows
grep "AIzaSy" firebase.config.js           # Mac/Linux
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Expo starts without "Firebase configuration is missing" error
2. ✅ App can connect to Firebase
3. ✅ Login/authentication works
4. ✅ No hardcoded credentials in console logs
5. ✅ `.env` file exists but is not in Git

---

**Need Help?** See `SECURITY_SETUP_GUIDE.md` for detailed setup instructions.

