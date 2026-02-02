# 📱 How to Share Your App with Users

Complete guide to distributing your Greater Works City Church app to your congregation.

---

## 🚀 Quick Start - Choose Your Method

### ⚡ Fastest Method: PWA (Progressive Web App) - **RECOMMENDED**

**Time:** 10-15 minutes  
**Cost:** FREE  
**Works on:** All devices (iOS, Android, Desktop)

This is the **easiest and fastest** way to get your app to users immediately!

---

## 📋 Method Comparison

| Method | Time | Cost | Approval | Best For |
|--------|------|------|----------|----------|
| **PWA (Web App)** ⭐ | 10-15 min | FREE | None | **Fastest deployment** |
| **Direct APK** | 20-30 min | FREE | None | Android direct install |
| **Google Play Store** | 2-4 days | $25 | 1-3 days | Wide Android reach |
| **Apple App Store** | 2-4 days | $99/year | 1-3 days | iOS users |

---

## 🌐 Method 1: PWA (Progressive Web App) - **START HERE!**

### Why PWA?
- ✅ **FREE** - No app store fees
- ✅ **Instant** - Deploy immediately, no approval wait
- ✅ **Works everywhere** - Phones, tablets, desktops
- ✅ **Installable** - Users can install it like a native app
- ✅ **Easy updates** - Just redeploy, users get updates automatically

### Step-by-Step Instructions

#### Step 1: Build the Web Version

```bash
npm run build:web
```

This creates a `dist` folder with your PWA-ready app.

#### Step 2: Deploy to Netlify (Easiest Option)

**Option A: Via Netlify Dashboard (Recommended for beginners)**

1. **Go to Netlify:**
   - Visit: https://app.netlify.com
   - Sign up for free account (if you don't have one)

2. **Deploy:**
   - Click "Add new site" → "Deploy manually"
   - Drag and drop the `dist` folder
   - Wait for deployment (30-60 seconds)

3. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add all your Firebase variables from `.env`:
     - `EXPO_PUBLIC_FIREBASE_API_KEY`
     - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
     - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `EXPO_PUBLIC_FIREBASE_APP_ID`
     - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

4. **Redeploy:**
   - Go to Deploys → Trigger deploy → Deploy site
   - Your app is now live!

**Option B: Via Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
npm run build:web
netlify deploy --prod --dir=dist
```

#### Step 3: Configure Firebase Authorized Domains

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Select your project

2. **Add Authorized Domain:**
   - Go to: Authentication → Settings → Authorized domains
   - Click "Add domain"
   - Enter your Netlify URL (e.g., `your-app.netlify.app`)
   - Click "Add"

#### Step 4: Share with Users

**Your app is now live!** Share the URL with your congregation:

1. **Get your app URL:**
   - Netlify provides a URL like: `https://your-app-name.netlify.app`
   - You can customize it in Netlify settings

2. **Share the URL:**
   - Send via email
   - Post on church website
   - Share on social media
   - Create a QR code for easy access

3. **Users install the app:**
   - **Android:** Visit URL → "Add to Home Screen" banner appears
   - **iPhone:** Visit URL → Share button → "Add to Home Screen"
   - **Desktop:** Install button appears in browser address bar

### Alternative: Deploy to Firebase Hosting

Since you're already using Firebase, you can host there too:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting (if not done already)
firebase init hosting
# Select: dist as public directory
# Configure as SPA: Yes

# Build and deploy
npm run build:web
firebase deploy --only hosting
```

Your app will be available at: `https://your-project-id.web.app`

---

## 📱 Method 2: Direct APK Distribution (Android Only)

For Android users who prefer a native app without app store approval.

### Step 1: Build APK

```bash
# Make sure you're logged into Expo
eas login

# Set up EAS secrets (if not done)
.\setup-eas-secrets.ps1

# Build APK
eas build --platform android --profile preview
```

**Wait 10-20 minutes** for build to complete.

### Step 2: Download APK

1. **Get download link:**
   - EAS will provide a download link in terminal
   - Or visit: https://expo.dev → Your project → Builds

2. **Download APK file:**
   - Click download link
   - Save APK file to your computer

### Step 3: Share APK with Users

**Option A: Upload to Your Website**
- Upload APK to your church website
- Create a download page
- Share the download link

**Option B: Use File Sharing Service**
- Upload to Google Drive
- Share download link
- Or use Dropbox, OneDrive, etc.

**Option C: Email Distribution**
- Attach APK to email (if file size allows)
- Or send download link

### Step 4: User Installation Instructions

Send these instructions to users:

**For Android Users:**
1. Download the APK file
2. Go to Settings → Security → Enable "Install from Unknown Sources"
3. Open the downloaded APK file
4. Tap "Install"
5. Open the app and enjoy!

**Note:** Some Android devices may show security warnings. This is normal for apps not from Play Store.

---

## 🏪 Method 3: Google Play Store (Android)

For wider reach and automatic updates.

### Prerequisites
- Google Play Console account ($25 one-time fee)
- Production build (AAB file)

### Step 1: Build Production Version

```bash
# Build AAB for Play Store
eas build --platform android --profile production
```

**Wait 10-20 minutes** for build to complete.

### Step 2: Create Play Store Listing

1. **Go to Google Play Console:**
   - Visit: https://play.google.com/console
   - Create new app

2. **Fill in Store Listing:**
   - App name: "Greater Works City Church"
   - Short description
   - Full description
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (at least 2)

3. **Complete Required Information:**
   - Privacy policy URL (required)
   - Content rating
   - Target audience
   - Pricing (set to Free)

### Step 3: Upload and Submit

1. **Download AAB file** from EAS dashboard
2. **Go to:** Production → Create new release
3. **Upload AAB file**
4. **Add release notes**
5. **Review and rollout**

### Step 4: Wait for Approval

- Review usually takes 1-3 days
- Google will notify you of approval or issues
- Once approved, app is live on Play Store!

### Step 5: Share with Users

- Share Play Store link
- Users can search for "Greater Works City Church"
- Automatic updates via Play Store

---

## 🍎 Method 4: Apple App Store (iOS)

For iOS users.

### Prerequisites
- Apple Developer account ($99/year)
- Production build (IPA file)

### Step 1: Build Production Version

```bash
# Build IPA for App Store
eas build --platform ios --profile production
```

**Wait 15-30 minutes** for build to complete.

### Step 2: Submit to App Store

**Option A: Using EAS (Recommended)**

```bash
eas submit --platform ios
```

EAS will guide you through the submission process.

**Option B: Manual Submission**

1. Download IPA from EAS dashboard
2. Use Transporter app (Mac) or Xcode
3. Upload to App Store Connect

### Step 3: Complete App Store Connect

1. **Go to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com

2. **Fill in App Information:**
   - App name
   - Description
   - Keywords
   - Screenshots (various sizes)
   - App icon
   - Privacy policy URL

3. **Submit for Review:**
   - Review usually takes 1-3 days
   - Apple may request additional information

### Step 4: Share with Users

- Share App Store link
- Users can search for "Greater Works City Church"
- Automatic updates via App Store

---

## 🎯 Recommended Strategy

### Phase 1: Deploy PWA First (Do This Now!)

1. ✅ **Deploy PWA to Netlify** (10-15 minutes, FREE)
   - Get your app live immediately
   - Share URL with congregation
   - Users can install like native app

**Why start here?**
- Fastest way to get app to users
- No approval needed
- Works on all devices
- Easy to update

### Phase 2: Add Native Apps (Optional)

2. 📱 **Build Android APK** (if needed)
   - For users who prefer native Android app
   - Can distribute directly or via Play Store

3. 🍎 **Submit to App Stores** (if needed)
   - For wider reach and discoverability
   - Automatic updates
   - More trusted by users

---

## 📢 Sharing Your App

### Once Your App is Live

#### 1. Create a Landing Page

Create a simple page on your church website with:
- App download links
- QR code for easy access
- Installation instructions
- Screenshots

#### 2. Announce to Congregation

**Email Template:**
```
Subject: Download Our New Church App!

Dear Church Family,

We're excited to announce our new Greater Works City Church mobile app!

📱 Access the app here: [YOUR APP URL]

The app includes:
- Event registration
- Sermon library
- Check-in system
- Prayer requests
- And much more!

Installation:
- Visit the link above on your phone
- Tap "Add to Home Screen" to install
- Start using the app!

Questions? Contact us at [email/phone]

Blessings,
[Your Name]
```

#### 3. Create QR Code

- Use a QR code generator
- Link to your app URL
- Print and display at church
- Include in bulletins and flyers

#### 4. Social Media

- Post on Facebook, Instagram, Twitter
- Include app link
- Show screenshots
- Create a short video tutorial

#### 5. Church Announcements

- Announce during service
- Include in church bulletin
- Display on screens
- Train staff to help members

---

## 🔄 Updating Your App

### For PWA:
```bash
# Make your changes
# Then rebuild and redeploy
npm run build:web
netlify deploy --prod --dir=dist
# Users get updates automatically!
```

### For Native Apps:
1. Update version in `app.json`
2. Build new version
3. Submit to stores (if using stores)
4. Or share new APK (if direct distribution)

---

## ❓ Frequently Asked Questions

### Q: Which method should I use?
**A:** Start with PWA! It's free, instant, and works on all devices. Add native apps later if needed.

### Q: Do users need to download anything?
**A:** For PWA: Just visit the URL and install. For APK: Download and install the file.

### Q: Can I use multiple methods?
**A:** Yes! Many churches use PWA + Play Store for maximum reach.

### Q: How do I update the app?
**A:** PWA: Just redeploy. Native apps: Build new version and submit/redistribute.

### Q: What if users have problems installing?
**A:** Provide clear instructions and support contact. Most issues are simple (enabling unknown sources, etc.)

### Q: Is the PWA as good as a native app?
**A:** For most features, yes! PWAs can do almost everything native apps can do, including offline support and push notifications.

---

## 📞 Need Help?

### Resources
- **PWA Setup:** See `PWA_SETUP_GUIDE.md`
- **Full Deployment:** See `DEPLOYMENT_GUIDE.md`
- **Netlify Guide:** See `NETLIFY_DEPLOYMENT_GUIDE.md`

### Support
- Expo Docs: https://docs.expo.dev
- Netlify Docs: https://docs.netlify.com
- Firebase Docs: https://firebase.google.com/docs

---

## ✅ Quick Checklist

### For PWA Deployment:
- [ ] Built web version (`npm run build:web`)
- [ ] Deployed to Netlify/Firebase
- [ ] Added environment variables
- [ ] Added authorized domain in Firebase
- [ ] Tested app on mobile device
- [ ] Created shareable URL
- [ ] Announced to congregation

### For Native App:
- [ ] Set up EAS secrets
- [ ] Built APK/AAB/IPA
- [ ] Tested build on device
- [ ] Created store listing (if using stores)
- [ ] Submitted for review (if using stores)
- [ ] Shared download link/instructions

---

## 🎉 You're Ready!

Your app is ready to share with your congregation! Start with the PWA method for the fastest deployment, then add native apps if needed.

**Remember:** The best way to share is the one that gets your app to users fastest. PWA is usually the answer! 🚀

---

*Last Updated: January 2025*

