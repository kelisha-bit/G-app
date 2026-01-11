# Git Remote Setup Script
# This script will add your GitHub repository as a remote and push your code

# Replace YOUR_REPO_URL with your actual GitHub repository URL
# Example: https://github.com/yourusername/G-app.git
# Or: git@github.com:yourusername/G-app.git

param(
    [Parameter(Mandatory=$true)]
    [string]$RepositoryUrl
)

Write-Host "Setting up Git remote..." -ForegroundColor Cyan

# Add the remote repository
git remote add origin $RepositoryUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Remote 'origin' added successfully" -ForegroundColor Green
    
    # Push to the remote repository
    Write-Host "`nPushing code to GitHub..." -ForegroundColor Cyan
    git push -u origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Code pushed successfully!" -ForegroundColor Green
        Write-Host "Your repository is now available at: $RepositoryUrl" -ForegroundColor Cyan
    } else {
        Write-Host "`n✗ Error pushing to remote. Please check your authentication." -ForegroundColor Red
        Write-Host "You may need to authenticate with GitHub using:" -ForegroundColor Yellow
        Write-Host "  - Personal Access Token (recommended)" -ForegroundColor Yellow
        Write-Host "  - GitHub Desktop" -ForegroundColor Yellow
        Write-Host "  - SSH keys" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Error: Remote already exists or invalid URL" -ForegroundColor Red
    Write-Host "To view existing remotes, run: git remote -v" -ForegroundColor Yellow
    Write-Host "To remove existing remote, run: git remote remove origin" -ForegroundColor Yellow
}

