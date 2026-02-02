# Update and Deploy Script
# Rebuilds web version and deploys to Firebase Hosting

Write-Host "🔄 Updating Web Deployment" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build web version
Write-Host "📦 Building web version..." -ForegroundColor Yellow
npm run build:web

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Check errors above." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "web-build/index.html")) {
    Write-Host "❌ Build output not found! Check build errors." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Check Firebase authentication
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Yellow
$firebaseUser = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0 -or $firebaseUser -match "No authorized accounts") {
    Write-Host "⚠️  Not authenticated. Authenticating..." -ForegroundColor Yellow
    firebase login --reauth
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Authentication failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Firebase authentication verified" -ForegroundColor Green
Write-Host ""

# Step 3: Set Firebase project
Write-Host "📋 Setting Firebase project..." -ForegroundColor Yellow
firebase use greater-works-city-churc-4a673
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set Firebase project!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Using project: greater-works-city-churc-4a673" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy
Write-Host "🚀 Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "   (This may take 1-2 minutes)" -ForegroundColor Gray
Write-Host ""

$env:NODE_OPTIONS = "--no-warnings"
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Wait 1-2 minutes for CDN propagation" -ForegroundColor White
    Write-Host "   2. Clear browser cache (Ctrl + Shift + Delete)" -ForegroundColor White
    Write-Host "   3. Hard refresh the page (Ctrl + F5)" -ForegroundColor White
    Write-Host "   4. If using PWA, unregister service worker" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 View your site:" -ForegroundColor Cyan
    Write-Host "   https://greater-works-city-churc-4a673.web.app" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Check deployment:" -ForegroundColor Cyan
    Write-Host "   https://console.firebase.google.com/project/greater-works-city-churc-4a673/hosting" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "   Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}

