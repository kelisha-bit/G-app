# Firebase Deployment Fix Script
# This script fixes authentication and hosting configuration issues

Write-Host "`n🔧 Fixing Firebase Deployment Issues...`n" -ForegroundColor Cyan

# Step 1: Re-authenticate with Firebase
Write-Host "Step 1: Re-authenticating with Firebase..." -ForegroundColor Yellow
firebase login --reauth

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Authentication failed. Please try again.`n" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Authentication successful!`n" -ForegroundColor Green

# Step 2: Check if hosting is initialized
Write-Host "Step 2: Checking Firebase hosting configuration..." -ForegroundColor Yellow

# Get the default site for the project
$projectId = "greater-works-city-churc-4a673"
Write-Host "Project ID: $projectId" -ForegroundColor Gray

# Step 3: Try to deploy with site specification
Write-Host "`nStep 3: Attempting deployment...`n" -ForegroundColor Yellow

# Use NODE_OPTIONS workaround for Node.js v22 compatibility
$env:NODE_OPTIONS = "--no-warnings"
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Deployment failed. Trying alternative method...`n" -ForegroundColor Yellow
    
    # Alternative: Initialize hosting if not properly set up
    Write-Host "You may need to run: firebase init hosting" -ForegroundColor Yellow
    Write-Host "Then select your project and configure hosting.`n" -ForegroundColor Yellow
}

