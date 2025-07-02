# GitHub Pages Simple Deployment Script - Branch Based
# En basit ve guvenilir yontem

param(
    [string]$CommitMessage = "",
    [switch]$Help = $false
)

# Color output functions
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Help message
if ($Help) {
    Write-Host "GitHub Pages Simple Deployment Script" -ForegroundColor White
    Write-Host "=====================================" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-simple.ps1                              # Auto commit and deploy"
    Write-Host "  .\deploy-simple.ps1 -CommitMessage 'Custom msg'  # Custom commit message"
    Write-Host "  .\deploy-simple.ps1 -Help                        # Show this help"
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Yellow
    Write-Host "- Simple branch-based deployment (no Actions needed)"
    Write-Host "- No environment protection rules issues"
    Write-Host "- Direct push to main branch"
    Write-Host "- Automatic GitHub Pages deployment"
    Write-Host ""
    Write-Host "Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to Repository Settings > Pages"
    Write-Host "2. Set Source to 'Deploy from a branch'"
    Write-Host "3. Select 'main' branch and '/ (root)' folder"
    Write-Host ""
    exit 0
}

# Main function
function Main {
    Write-Info "Starting Simple GitHub Pages Deployment..."
    
    # Check if Git repository
    if (-not (Test-Path ".git")) {
        Write-Error "This directory is not a Git repository!"
        Write-Info "Please run 'git init' first."
        exit 1
    }

    # Remove GitHub Actions workflows to avoid conflicts
    if (Test-Path ".github") {
        Write-Info "Removing GitHub Actions workflows to avoid conflicts..."
        Remove-Item -Path ".github" -Recurse -Force
        Write-Success "Removed .github directory"
    }

    # Create .nojekyll file (to skip Jekyll build)
    if (-not (Test-Path ".nojekyll")) {
        "" | Out-File -FilePath ".nojekyll" -Encoding UTF8
        Write-Success "Created .nojekyll file"
    }

    # Deploy to GitHub
    Deploy-ToGitHub
}

# Deploy to GitHub
function Deploy-ToGitHub {
    Write-Info "Starting deployment process..."
    
    # Check Git status
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Warning "No changes to commit found."
        return
    }

    # Create commit message with Turkish format as requested
    if (-not $CommitMessage) {
        $timestamp = Get-Date -Format "dd.MM.yyyy HH:mm:ss"
        $CommitMessage = "Guncelleme Islemi - $timestamp"
    }

    try {
        # Git operations
        Write-Info "Staging changes..."
        git add .
        
        Write-Info "Creating commit: $CommitMessage"
        git commit -m $CommitMessage
        
        # Check remote repository
        $remotes = git remote
        if (-not $remotes) {
            Write-Error "No remote repository configured!"
            Write-Info "Please run 'git remote add origin <repository-url>' first."
            exit 1
        }

        Write-Info "Pushing to GitHub..."
        git push origin HEAD
        
        Write-Success "Code successfully pushed to GitHub!"
        Write-Info "GitHub Pages will automatically deploy from main branch."
        
        # Find repository URL and show GitHub Pages URL
        $remoteUrl = git config --get remote.origin.url
        if ($remoteUrl -match "github\.com[:/]([^/]+)/([^/.]+)") {
            $owner = $matches[1]
            $repo = $matches[2] -replace "\.git$", ""
            $pagesUrl = "https://$owner.github.io/$repo"
            Write-Info "GitHub Pages URL: $pagesUrl"
            Write-Info "Repository Settings: https://github.com/$owner/$repo/settings/pages"
        }
        
        Write-Warning "IMPORTANT: Make sure GitHub Pages is set to deploy from 'main' branch!"
        Write-Info "Go to Repository Settings > Pages > Source > Deploy from a branch > main"
        
    } catch {
        Write-Error "Git operation failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run the script
Main
