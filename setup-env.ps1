# PowerShell script to set up .env file from .env.example
# Run this script to create your .env file

Write-Host "🔒 Setting up environment variables..." -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path .env) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled. Keeping existing .env file." -ForegroundColor Red
        exit
    }
}

# Check if .env.example exists
if (-not (Test-Path .env.example)) {
    Write-Host "❌ .env.example file not found!" -ForegroundColor Red
    Write-Host "Please make sure .env.example exists in the project root." -ForegroundColor Yellow
    exit 1
}

# Copy .env.example to .env
Copy-Item .env.example .env

Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Open .env in a text editor" -ForegroundColor White
Write-Host "2. Fill in your Firebase configuration values" -ForegroundColor White
Write-Host "3. Add optional API keys (OpenAI, Weather) if needed" -ForegroundColor White
Write-Host "4. Save the file" -ForegroundColor White
Write-Host "5. Restart Expo: npm start --clear" -ForegroundColor White
Write-Host ""
Write-Host "📚 See SECURITY_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan

