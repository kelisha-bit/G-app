# 🚀 Quick Build Reference Card

## 📱 Android Push Notification Build Commands

### Development Build (Recommended for Testing)
```powershell
eas build --platform android --profile development
```
- ✅ Enables push notifications
- ✅ Hot reload during development
- ⏱️ Takes 10-20 minutes
- 📦 Builds once, use for all future development

### Preview Build (Quick Testing)
```powershell
eas build --platform android --profile preview
```
- ✅ Enables push notifications
- ⚡ Faster build than development
- 📦 APK format (easy to install)

### Production Build (For Release)
```powershell
eas build --platform android --profile production
```
- 📦 Creates app-bundle (for Play Store)
- 🚀 Production-ready build

---

## 📋 Build Workflow (Step-by-Step)

### First Time Setup
```powershell
# 1. Check if logged in
eas whoami

# 2. Build development build
eas build --platform android --profile development

# 3. Wait for build (10-20 minutes)

# 4. Download APK from build link

# 5. Install on Android device
```

### Daily Development Workflow
```powershell
# Terminal 1: Start dev server
npm start

# Terminal 2: (Optional) Monitor build status
eas build:list
```

---

## 🔍 Useful Commands

### Check Build Status
```powershell
# List all builds
eas build:list

# View specific build details
eas build:view [build-id]

# Cancel a running build
eas build:cancel [build-id]
```

### Dev Server Commands
```powershell
# Start dev server
npm start

# Start with tunnel (if Wi-Fi issues)
npm start --tunnel

# Start and clear cache
npm start --clear

# Android specific
npm run android

# iOS specific (Mac only)
npm run ios
```

### Login/Account
```powershell
# Login to Expo
eas login

# Check who you're logged in as
eas whoami

# Logout
eas logout
```

---

## 📱 After Building - Install & Test

### 1. Install APK on Device
```
- Download APK from build link
- Transfer to Android device (USB/email/cloud)
- Enable "Install from Unknown Sources" in Settings
- Tap APK to install
```

### 2. Test Push Notifications
```
1. Start dev server: npm start
2. Open your development build app (NOT Expo Go)
3. Login to app
4. Go to Settings → Notifications
5. Enable "Push Notifications"
6. Grant permission when prompted
7. ✅ Should work now!
```

---

## ⚡ Quick Troubleshooting

### Build Fails
```powershell
# Check build logs
eas build:view [build-id]

# Check configuration
eas build:configure

# Clear build cache (if needed)
eas build --platform android --profile development --clear-cache
```

### App Won't Connect to Dev Server
```powershell
# Use tunnel mode
npm start --tunnel

# Check Wi-Fi (same network)
# Check firewall settings
```

### Push Notifications Still Not Working
```
1. Verify you're using development build (not Expo Go)
2. Check device permissions: Settings → Apps → Your App → Notifications
3. Check console logs for detailed error
4. Ensure internet connection
```

---

## 🎯 Build Profiles Explained

| Profile | Use Case | Push Notifications | Hot Reload | Build Time |
|---------|----------|-------------------|------------|------------|
| `development` | Testing during development | ✅ Yes | ✅ Yes | 10-20 min |
| `preview` | Quick testing/QA | ✅ Yes | ❌ No | 5-10 min |
| `production` | Release to Play Store | ✅ Yes | ❌ No | 15-25 min |

---

## 📝 Common Workflows

### New Feature Development
```powershell
# 1. Make code changes
# 2. Code auto-reloads in development build
# 3. Test push notifications
# 4. When ready, build preview to test full app
eas build --platform android --profile preview
```

### Pre-Release Testing
```powershell
# 1. Build preview
eas build --platform android --profile preview

# 2. Install and test all features

# 3. Build production when ready
eas build --platform android --profile production
```

### Quick Push Notification Test
```powershell
# 1. Already have development build installed
# 2. Start dev server
npm start

# 3. Open app on device
# 4. Test push notifications
```

---

## 🔗 Helpful Links

- **EAS Build Dashboard**: https://expo.dev/accounts/[your-account]/builds
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Push Notifications Guide**: See `FIX_PUSH_NOTIFICATIONS.md`
- **Android SDK Setup**: See `ANDROID_SDK_SETUP.md`

---

## 💡 Pro Tips

1. **Build once, develop many times** - Development build stays on your device, code changes hot reload

2. **Use preview for quick tests** - Faster than development build when you need a full rebuild

3. **Check build status online** - Visit expo.dev to see all your builds

4. **Keep development build updated** - Rebuild when you add new native dependencies

5. **Use tunnel mode if Wi-Fi issues** - `npm start --tunnel` works over internet

---

**Need help?** Check the detailed guides:
- `FIX_PUSH_NOTIFICATIONS.md` - Complete push notification fix guide
- `ANDROID_SDK_SETUP.md` - Android SDK setup (if needed)

