# PowerShell script to set up EAS secrets for Firebase configuration
# This is required because .env files are not automatically included in EAS builds
# Run this script after setting up your .env file

Write-Host "🔐 Setting up EAS Secrets for Firebase Configuration" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file first using .env.example as a template." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run: Copy-Item .env.example .env" -ForegroundColor White
    exit 1
}

# Check if eas CLI is installed
$easInstalled = $null
try {
    $easInstalled = Get-Command eas -ErrorAction Stop
} catch {
    Write-Host "⚠️  EAS CLI not found!" -ForegroundColor Yellow
    Write-Host "Installing EAS CLI..." -ForegroundColor Cyan
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI. Please install manually:" -ForegroundColor Red
        Write-Host "   npm install -g eas-cli" -ForegroundColor White
        exit 1
    }
}

Write-Host "✅ EAS CLI found" -ForegroundColor Green
Write-Host ""

# Load .env file
$envContent = Get-Content .env | Where-Object { $_ -match '^[^#]' -and $_ -match '=' }

$firebaseVars = @(
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'
)

Write-Host "📋 Checking Firebase environment variables in .env file..." -ForegroundColor Cyan
Write-Host ""

$missingVars = @()
$foundVars = @{}

foreach ($var in $firebaseVars) {
    $found = $false
    foreach ($line in $envContent) {
        if ($line -match "^${var}=(.*)$") {
            $value = $matches[1].Trim()
            if ($value -and $value -ne "your_firebase_api_key_here" -and $value -notmatch "your-.*-here") {
                $foundVars[$var] = $value
                $found = $true
                break
            }
        }
    }
    if (-not $found) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing or incomplete Firebase configuration!" -ForegroundColor Red
    Write-Host "Missing variables:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Please update your .env file with actual Firebase values from:" -ForegroundColor Yellow
    Write-Host "   https://console.firebase.google.com/" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ All Firebase variables found in .env file" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
Write-Host "This script will create EAS secrets for your Firebase configuration." -ForegroundColor Cyan
Write-Host "These secrets will be used during EAS builds." -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Do you want to continue? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Setup cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Creating EAS secrets..." -ForegroundColor Cyan
Write-Host ""

# Check if logged in to EAS
Write-Host "Checking EAS login status..." -ForegroundColor Cyan
$loginCheck = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to EAS. Please log in first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   eas login" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in to EAS" -ForegroundColor Green
Write-Host ""

# Create secrets
$successCount = 0
$failCount = 0

foreach ($var in $firebaseVars) {
    $value = $foundVars[$var]
    Write-Host "Setting secret: $var..." -ForegroundColor Cyan
    
    # Create the secret using eas secret:create
    $result = eas secret:create --scope project --name $var --value $value --type string --force 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $var set successfully" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "   ⚠️  Failed to set $var (may already exist)" -ForegroundColor Yellow
        Write-Host "   Attempting to update..." -ForegroundColor Cyan
        
        # Try to delete and recreate
        eas secret:delete --scope project --name $var --force 2>&1 | Out-Null
        $retry = eas secret:create --scope project --name $var --value $value --type string 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $var updated successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ❌ Failed to set $var" -ForegroundColor Red
            $failCount++
        }
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✅ All EAS secrets created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Build your app: npm run build:android" -ForegroundColor White
    Write-Host "   2. Or build iOS: npm run build:ios" -ForegroundColor White
    Write-Host "   3. View secrets: eas secret:list" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some secrets failed to create." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can manually create secrets using:" -ForegroundColor Cyan
    Write-Host "   eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value YOUR_VALUE" -ForegroundColor White
    Write-Host ""
}

Write-Host "View all secrets:" -ForegroundColor Cyan
Write-Host "   eas secret:list" -ForegroundColor White
Write-Host ""

