# 🔄 Fix: Changes Not Showing in Deployed Web App

If your changes aren't appearing in the deployed web app, follow these steps:

---

## ✅ Quick Fix Checklist

1. ✅ **Rebuild** after making changes
2. ✅ **Redeploy** after rebuilding
3. ✅ **Clear browser cache**
4. ✅ **Hard refresh** the page
5. ✅ **Check deployment** was successful

---

## 🔧 Step-by-Step Solution

### Step 1: Rebuild Your Web App

**IMPORTANT:** After making code changes, you MUST rebuild:

```powershell
npm run build:web
```

This creates a fresh `web-build` folder with your latest changes.

**Verify the build:**
```powershell
# Check build timestamp
Get-ChildItem web-build/index.html | Select-Object LastWriteTime
```

---

### Step 2: Redeploy to Firebase

After rebuilding, deploy again:

```powershell
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
```

**Wait for deployment to complete!** You should see:
```
✔  hosting[greater-works-city-churc-4a673]: deploy complete!
```

---

### Step 3: Clear Browser Cache

Your browser might be showing cached files. Clear it:

**Chrome/Edge:**
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"
- Or use `Ctrl + F5` for hard refresh

**Firefox:**
- Press `Ctrl + Shift + Delete`
- Select "Cache"
- Click "Clear Now"
- Or use `Ctrl + F5` for hard refresh

**Safari:**
- Press `Cmd + Option + E` (Mac)
- Or `Ctrl + Shift + Delete` (Windows)

---

### Step 4: Hard Refresh the Page

After clearing cache, do a hard refresh:

- **Windows:** `Ctrl + F5` or `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

This forces the browser to download fresh files.

---

### Step 5: Disable Service Worker (PWA Cache)

If you installed the app as a PWA, it might be using cached files:

1. **Open DevTools** (`F12`)
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Click "Service Workers"**
4. **Click "Unregister"** for your site
5. **Refresh the page**

Or clear all site data:
1. **Application tab** → **Clear storage**
2. **Check all boxes**
3. **Click "Clear site data"**

---

## 🎯 Complete Update Workflow

Every time you make changes, follow this workflow:

```powershell
# 1. Make your code changes
# (edit files in src/, etc.)

# 2. Rebuild web version
npm run build:web

# 3. Verify build was created
Test-Path web-build/index.html

# 4. Deploy to Firebase
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting

# 5. Wait for deployment (usually 1-2 minutes)

# 6. Clear browser cache and hard refresh
# (Ctrl + Shift + Delete, then Ctrl + F5)
```

---

## 🔍 Verify Deployment

### Check Deployment Status

```powershell
firebase hosting:channel:list
```

This shows your deployment history.

### Check File Timestamps

After deployment, check if files were updated:

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/greater-works-city-churc-4a673/hosting

2. **Click on your site**
3. **Check "Deployments" tab**
4. **Verify latest deployment timestamp**

### Check File Content

You can also verify the deployed files:

1. **Open your site:** https://greater-works-city-churc-4a673.web.app
2. **View page source** (`Ctrl + U`)
3. **Check if your changes are in the HTML/JS**

---

## 🐛 Common Issues & Solutions

### Issue 1: "I rebuilt but changes aren't there"

**Solution:**
- Make sure you actually saved your code changes
- Check that `npm run build:web` completed without errors
- Verify `web-build` folder was updated (check timestamps)

---

### Issue 2: "I deployed but still see old version"

**Solution:**
- Wait 1-2 minutes after deployment (CDN propagation)
- Clear browser cache completely
- Try incognito/private browsing mode
- Check if deployment actually succeeded (check Firebase Console)

---

### Issue 3: "Service Worker is caching old files"

**Solution:**
1. **Unregister service worker** (see Step 5 above)
2. **Clear all site data**
3. **Hard refresh**
4. **Or update service worker version** in `public/service-worker.js`:
   ```javascript
   const CACHE_NAME = 'gwcc-app-v2'; // Change version number
   ```

---

### Issue 4: "Changes show locally but not deployed"

**Solution:**
- Make sure you're looking at the deployed site, not localhost
- Check the URL: `https://greater-works-city-churc-4a673.web.app`
- Verify you actually ran `firebase deploy` (not just `npm run build:web`)

---

## 🔄 Force Cache Refresh

### Update Service Worker Version

If you have a service worker, update its version to force cache refresh:

1. **Edit `public/service-worker.js`:**
   ```javascript
   const CACHE_NAME = 'gwcc-app-v2'; // Increment version
   ```

2. **Rebuild and redeploy:**
   ```powershell
   npm run build:web
   $env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
   ```

### Add Cache-Busting to HTML

The `firebase.json` is already configured to:
- Cache static assets (JS, CSS, images) for 1 year
- NOT cache HTML files (they're served fresh)

This means:
- ✅ HTML changes appear immediately
- ⚠️ JS/CSS changes might be cached (clear browser cache)

---

## 📊 Check What's Deployed

### View Deployed Files

```powershell
# List files in web-build
Get-ChildItem web-build -Recurse | Select-Object FullName, LastWriteTime
```

### Compare Local vs Deployed

1. **Check local build:**
   ```powershell
   Get-Content web-build/index.html | Select-String "your-change"
   ```

2. **Check deployed site:**
   - Open: https://greater-works-city-churc-4a673.web.app
   - View source (`Ctrl + U`)
   - Search for your change

---

## 🚀 Automated Update Script

Create a script to do everything at once:

```powershell
# update-and-deploy.ps1
Write-Host "🔄 Updating web deployment..." -ForegroundColor Cyan

# Build
Write-Host "📦 Building web version..." -ForegroundColor Yellow
npm run build:web

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Yellow
$env:NODE_OPTIONS="--no-warnings"
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Wait 1-2 minutes for CDN propagation" -ForegroundColor White
    Write-Host "   2. Clear browser cache (Ctrl + Shift + Delete)" -ForegroundColor White
    Write-Host "   3. Hard refresh (Ctrl + F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 View site: https://greater-works-city-churc-4a673.web.app" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
```

Save as `scripts/update-and-deploy.ps1` and run:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/update-and-deploy.ps1
```

---

## ✅ Verification Checklist

After deploying, verify:

- [ ] Build completed without errors
- [ ] Deployment completed successfully
- [ ] Waited 1-2 minutes for CDN propagation
- [ ] Cleared browser cache
- [ ] Hard refreshed the page (`Ctrl + F5`)
- [ ] Unregistered service worker (if PWA installed)
- [ ] Checked in incognito/private mode
- [ ] Verified changes in page source
- [ ] Checked Firebase Console for latest deployment

---

## 💡 Pro Tips

1. **Always rebuild after changes** - `npm run build:web` is required
2. **Check build output** - Make sure no errors occurred
3. **Wait for deployment** - CDN takes 1-2 minutes to update
4. **Use incognito mode** - To test without cache
5. **Check deployment logs** - In Firebase Console
6. **Version your service worker** - Update cache name when needed

---

## 🎯 Quick Reference

**Update workflow:**
```powershell
npm run build:web
$env:NODE_OPTIONS="--no-warnings" ; firebase deploy --only hosting
# Wait 1-2 minutes
# Clear cache + Hard refresh (Ctrl + F5)
```

**Check deployment:**
- Firebase Console: https://console.firebase.google.com/project/greater-works-city-churc-4a673/hosting
- Your site: https://greater-works-city-churc-4a673.web.app

---

## 📞 Still Not Working?

If changes still don't appear:

1. **Check Firebase Console** - Verify deployment succeeded
2. **Check build output** - Look for errors
3. **Check file timestamps** - Verify files were updated
4. **Try different browser** - Rule out browser-specific cache
5. **Check network tab** - See if files are being loaded from cache
6. **Contact support** - If all else fails

---

## ✅ Success!

Once you see your changes:
- ✅ Your workflow is correct
- ✅ Remember to rebuild + redeploy every time
- ✅ Clear cache if changes don't appear immediately

Happy deploying! 🚀

