# GitHub Pages Deployment Script - GitHub Actions Version
# GitHub Actions ile uyumlu versiyon

param(
    [string]$CommitMessage = "",
    [switch]$SetupWorkflow = $false,
    [switch]$Help = $false
)

# Color output functions
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Help message
if ($Help) {
    Write-Host "GitHub Pages Deployment Script - GitHub Actions Version" -ForegroundColor White
    Write-Host "=======================================================" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-actions.ps1                              # Auto commit and deploy"
    Write-Host "  .\deploy-actions.ps1 -CommitMessage 'Custom msg'  # Custom commit message"
    Write-Host "  .\deploy-actions.ps1 -SetupWorkflow               # Create workflow file"
    Write-Host "  .\deploy-actions.ps1 -Help                        # Show this help"
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Yellow
    Write-Host "- Works with GitHub Actions source setting"
    Write-Host "- No environment protection rules issues"
    Write-Host "- Latest GitHub Actions versions"
    Write-Host ""
    exit 0
}

# Main function
function Main {
    Write-Info "Starting GitHub Actions Deployment..."
    
    # Check if Git repository
    if (-not (Test-Path ".git")) {
        Write-Error "This directory is not a Git repository!"
        Write-Info "Please run 'git init' first."
        exit 1
    }

    # Setup GitHub Actions workflow
    if ($SetupWorkflow) {
        Setup-GitHubWorkflow
        return
    }

    # Main deployment process
    Deploy-ToGitHub
}

# Create GitHub Actions workflow file
function Setup-GitHubWorkflow {
    Write-Info "Setting up GitHub Actions workflow..."
    
    # Create .github/workflows directory
    $workflowDir = ".github/workflows"
    if (-not (Test-Path $workflowDir)) {
        New-Item -ItemType Directory -Path $workflowDir -Force | Out-Null
        Write-Success "Created .github/workflows directory"
    }

    # Simple workflow without environment protection
    $workflowContent = @"
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Pages
        uses: actions/configure-pages@v5
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
"@

    # Write workflow file
    $workflowFile = "$workflowDir/pages.yml"
    $workflowContent | Out-File -FilePath $workflowFile -Encoding UTF8
    Write-Success "Created GitHub Actions workflow: $workflowFile"
    
    # Create .nojekyll file
    if (-not (Test-Path ".nojekyll")) {
        "" | Out-File -FilePath ".nojekyll" -Encoding UTF8
        Write-Success "Created .nojekyll file"
    }

    Write-Info "Workflow setup completed!"
    Write-Info "Make sure GitHub Pages source is set to 'GitHub Actions'"
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

    # Create commit message
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
        Write-Info "GitHub Actions will automatically deploy your site."
        
        # Find repository URL and show GitHub Pages URL
        $remoteUrl = git config --get remote.origin.url
        if ($remoteUrl -match "github\.com[:/]([^/]+)/([^/.]+)") {
            $owner = $matches[1]
            $repo = $matches[2] -replace "\.git$", ""
            $pagesUrl = "https://$owner.github.io/$repo"
            Write-Info "GitHub Pages URL: $pagesUrl"
            Write-Info "Actions status: https://github.com/$owner/$repo/actions"
        }
        
        Write-Info "Make sure GitHub Pages source is set to 'GitHub Actions'"
        
    } catch {
        Write-Error "Git operation failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run the script
Main
