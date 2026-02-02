# Firebase Hosting Deployment Script
# This script handles authentication and deployment to Firebase Hosting

Write-Host "🚀 Firebase Hosting Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if web-build exists
Write-Host "📦 Checking for web-build directory..." -ForegroundColor Yellow
if (-not (Test-Path "web-build")) {
    Write-Host "❌ web-build directory not found!" -ForegroundColor Red
    Write-Host "Building web version first..." -ForegroundColor Yellow
    npm run build:web
    
    if (-not (Test-Path "web-build")) {
        Write-Host "❌ Failed to create web-build. Please run 'npm run build:web' manually." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ web-build directory found" -ForegroundColor Green
Write-Host ""

# Step 2: Check Firebase authentication
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Yellow
$firebaseUser = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0 -or $firebaseUser -match "No authorized accounts") {
    Write-Host "⚠️  Not authenticated. Please authenticate..." -ForegroundColor Yellow
    firebase login --reauth
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Authentication failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Firebase authentication verified" -ForegroundColor Green
Write-Host ""

# Step 3: Verify project
Write-Host "📋 Verifying Firebase project..." -ForegroundColor Yellow
firebase use greater-works-city-churc-4a673
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set Firebase project!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Using project: greater-works-city-churc-4a673" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy with Node.js workaround
Write-Host "🚀 Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "   (Using NODE_OPTIONS workaround for Node.js v22 compatibility)" -ForegroundColor Gray
Write-Host ""

$env:NODE_OPTIONS = "--no-warnings"
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your site is live at:" -ForegroundColor Cyan
    Write-Host "   https://greater-works-city-churc-4a673.web.app" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "   Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}

