# 🔧 Fix EAS Build Dependencies Script
# Diagnoses and fixes "Install dependencies phase" build failures

Write-Host "🔍 Diagnosing EAS Build Dependency Issues..." -ForegroundColor Cyan
Write-Host ""

# Check Node version
Write-Host "1. Checking Node version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   Node version: $nodeVersion" -ForegroundColor Green

$nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeMajor -lt 20) {
    Write-Host "   ⚠️  WARNING: Node 20 or higher is required for React Native 0.81.5" -ForegroundColor Red
    Write-Host "   Please upgrade Node.js to version 20.19.4 or higher" -ForegroundColor Yellow
    Write-Host ""
}

# Check npm version
Write-Host "2. Checking npm version..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "   npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Check if package-lock.json exists
Write-Host "3. Checking package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    $lockFileSize = (Get-Item "package-lock.json").Length
    Write-Host "   ✅ package-lock.json exists ($([math]::Round($lockFileSize/1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "   ❌ package-lock.json not found!" -ForegroundColor Red
    Write-Host "   This will cause build failures. Generating now..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check eas.json configuration
Write-Host "4. Checking eas.json configuration..." -ForegroundColor Yellow
if (Test-Path "eas.json") {
    $easJson = Get-Content "eas.json" | ConvertFrom-Json
    $previewNode = $easJson.build.preview.node
    if ($previewNode) {
        Write-Host "   ✅ Preview profile Node version: $previewNode" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No Node version specified in preview profile" -ForegroundColor Yellow
    }
    
    $productionNode = $easJson.build.production.node
    if ($productionNode) {
        Write-Host "   ✅ Production profile Node version: $productionNode" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No Node version specified in production profile" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ eas.json not found!" -ForegroundColor Red
}
Write-Host ""

# Test npm ci locally (this is what EAS uses)
Write-Host "5. Testing 'npm ci' (what EAS uses)..." -ForegroundColor Yellow
Write-Host "   This will verify if package-lock.json is in sync..." -ForegroundColor Gray

# Backup node_modules if it exists
if (Test-Path "node_modules") {
    Write-Host "   Backing up node_modules..." -ForegroundColor Gray
    if (Test-Path "node_modules.backup") {
        Remove-Item "node_modules.backup" -Recurse -Force
    }
    Copy-Item "node_modules" "node_modules.backup" -Recurse
    Remove-Item "node_modules" -Recurse -Force
}

# Try npm ci
try {
    Write-Host "   Running 'npm ci'..." -ForegroundColor Gray
    $npmCiOutput = npm ci 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ npm ci succeeded! package-lock.json is valid." -ForegroundColor Green
        $npmCiPassed = $true
    } else {
        Write-Host "   ❌ npm ci failed!" -ForegroundColor Red
        Write-Host "   Error output:" -ForegroundColor Red
        Write-Host $npmCiOutput -ForegroundColor Red
        $npmCiPassed = $false
    }
} catch {
    Write-Host "   ❌ npm ci threw an error: $_" -ForegroundColor Red
    $npmCiPassed = $false
}
Write-Host ""

# Check for Expo SDK version conflicts
Write-Host "6. Checking for Expo SDK version conflicts..." -ForegroundColor Yellow
try {
    $expoCheckOutput = npx expo install --check 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ All Expo packages are compatible with SDK 54" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Potential version conflicts detected:" -ForegroundColor Yellow
        Write-Host $expoCheckOutput -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Run 'npx expo install --fix' to fix automatically" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Could not check Expo versions (this is okay)" -ForegroundColor Yellow
}
Write-Host ""

# Provide fix recommendations
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 DIAGNOSIS SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if (-not $npmCiPassed) {
    Write-Host "❌ ISSUE FOUND: package-lock.json is out of sync" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 RECOMMENDED FIX:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Step 1: Regenerate package-lock.json" -ForegroundColor White
    Write-Host "   Remove-Item package-lock.json" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Step 2: Test locally" -ForegroundColor White
    Write-Host "   Remove-Item node_modules -Recurse -Force" -ForegroundColor Gray
    Write-Host "   npm ci" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Step 3: Commit the updated lock file" -ForegroundColor White
    Write-Host "   git add package-lock.json" -ForegroundColor Gray
    Write-Host "   git commit -m 'Fix: Regenerate package-lock.json for EAS build'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Step 4: Try building again" -ForegroundColor White
    Write-Host "   eas build --platform android --profile preview" -ForegroundColor Gray
    Write-Host ""
    
    # Ask if user wants to apply the fix automatically
    $fixNow = Read-Host "Would you like to apply the fix now? (y/n)"
    if ($fixNow -eq "y" -or $fixNow -eq "Y") {
        Write-Host ""
        Write-Host "🔧 Applying fix..." -ForegroundColor Cyan
        
        # Regenerate package-lock.json
        Write-Host "   Removing old package-lock.json..." -ForegroundColor Gray
        Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
        
        Write-Host "   Running npm install to regenerate lock file..." -ForegroundColor Gray
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "   ✅ package-lock.json regenerated successfully!" -ForegroundColor Green
            
            # Test npm ci again
            Write-Host ""
            Write-Host "   Testing npm ci..." -ForegroundColor Gray
            Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
            npm ci
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "   ✅ npm ci test passed! The fix should work." -ForegroundColor Green
                Write-Host ""
                Write-Host "   📝 Next steps:" -ForegroundColor Cyan
                Write-Host "   1. Commit the updated package-lock.json:" -ForegroundColor White
                Write-Host "      git add package-lock.json" -ForegroundColor Gray
                Write-Host "      git commit -m 'Fix: Regenerate package-lock.json for EAS build'" -ForegroundColor Gray
                Write-Host ""
                Write-Host "   2. Try building again:" -ForegroundColor White
                Write-Host "      eas build --platform android --profile preview" -ForegroundColor Gray
            } else {
                Write-Host ""
                Write-Host "   ⚠️  npm ci still failed. There may be deeper issues." -ForegroundColor Yellow
                Write-Host "   Check the error output above for details." -ForegroundColor Yellow
            }
        } else {
            Write-Host ""
            Write-Host "   ❌ npm install failed. Please check the error above." -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ No major issues detected!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If builds are still failing, try:" -ForegroundColor Yellow
    Write-Host "1. Check the build logs: https://expo.dev/accounts/elishak/projects/greater-works-city-church/builds" -ForegroundColor White
    Write-Host "2. Verify all dependencies are compatible: npx expo install --check" -ForegroundColor White
    Write-Host "3. Clear npm cache: npm cache clean --force" -ForegroundColor White
    Write-Host "4. Regenerate lock file: Remove-Item package-lock.json; npm install" -ForegroundColor White
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Additional troubleshooting tips
Write-Host "📚 Additional Troubleshooting:" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the build still fails after fixing package-lock.json:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Check build logs at the URL shown in terminal" -ForegroundColor White
Write-Host "   Look for specific error messages in 'Install dependencies' phase" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify Node version in eas.json matches local Node version" -ForegroundColor White
Write-Host "   Currently configured: Node 20.19.4" -ForegroundColor Gray
Write-Host "   Your local version: Node $nodeVersion" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Clear all caches and reinstall:" -ForegroundColor White
Write-Host "   npm cache clean --force" -ForegroundColor Gray
Write-Host "   Remove-Item node_modules -Recurse -Force" -ForegroundColor Gray
Write-Host "   Remove-Item package-lock.json" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check for peer dependency warnings:" -ForegroundColor White
Write-Host "   npm install --dry-run" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Diagnosis complete!" -ForegroundColor Green
Write-Host ""



