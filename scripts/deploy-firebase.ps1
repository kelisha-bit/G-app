# Firebase Deployment Script
# Builds the web app and deploys to Firebase Hosting

Write-Host "`n🚀 Starting Firebase Deployment...`n" -ForegroundColor Cyan

# Step 1: Build web app
Write-Host "Step 1: Building web app..." -ForegroundColor Yellow
npm run build:web

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed. Please fix errors and try again.`n" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!`n" -ForegroundColor Green

# Step 2: Check if web-build directory exists
if (-not (Test-Path "web-build")) {
    Write-Host "❌ Error: web-build directory not found!" -ForegroundColor Red
    Write-Host "   Make sure 'npm run build:web' completed successfully.`n" -ForegroundColor Yellow
    exit 1
}

# Step 3: Deploy to Firebase with Node.js v22 workaround
Write-Host "Step 2: Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "   (Using NODE_OPTIONS workaround for Node.js v22 compatibility)`n" -ForegroundColor Gray

$env:NODE_OPTIONS = "--no-warnings"
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!`n" -ForegroundColor Green
    Write-Host "🌐 Your app is live at:" -ForegroundColor Cyan
    Write-Host "   https://greater-works-city-churc-4a673.web.app" -ForegroundColor White
    Write-Host "   https://greater-works-city-churc-4a673.firebaseapp.com`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed!`n" -ForegroundColor Red
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Authentication expired - Run: firebase login --reauth" -ForegroundColor Gray
    Write-Host "  2. Hosting not initialized - Run: firebase init hosting" -ForegroundColor Gray
    Write-Host "  3. Check Firebase Console for errors`n" -ForegroundColor Gray
    Write-Host "See FIREBASE_DEPLOYMENT_AUTH_FIX.md for detailed troubleshooting.`n" -ForegroundColor Yellow
    exit 1
}

