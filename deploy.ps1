# GitHub Pages Deployment Script
# Automatically commits changes and deploys to GitHub Pages

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
    Write-Host "GitHub Pages Deployment Script" -ForegroundColor White
    Write-Host "==============================" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1                              # Auto commit and deploy"
    Write-Host "  .\deploy.ps1 -CommitMessage 'Custom msg'  # Custom commit message"
    Write-Host "  .\deploy.ps1 -SetupWorkflow               # Initial setup (create workflow)"
    Write-Host "  .\deploy.ps1 -Help                        # Show this help"
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Yellow
    Write-Host "- Automatic Git commit and push"
    Write-Host "- GitHub Actions workflow creation"
    Write-Host "- GitHub Pages automatic deployment"
    Write-Host "- Timestamped commit messages"
    Write-Host "- Error checking and feedback"
    Write-Host ""
    exit 0
}

# Main function
function Main {
    Write-Info "Starting GitHub Pages Deployment Script..."
    
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

    # Workflow file content
    $workflowContent = @"
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
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
    environment:
      name: github-pages
      url: `${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
"@

    # Write workflow file
    $workflowFile = "$workflowDir/deploy-pages.yml"
    $workflowContent | Out-File -FilePath $workflowFile -Encoding UTF8
    Write-Success "Created GitHub Actions workflow: $workflowFile"
    
    # Create .nojekyll file (to skip Jekyll build)
    if (-not (Test-Path ".nojekyll")) {
        "" | Out-File -FilePath ".nojekyll" -Encoding UTF8
        Write-Success "Created .nojekyll file"
    }

    Write-Info "Workflow setup completed!"
    Write-Warning "Don't forget to set Pages source to 'GitHub Actions' in repository settings!"
    Write-Info "Go to: Repository Settings > Pages > Source > GitHub Actions"
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
        Write-Info "GitHub Actions will automatically run and update your site."
        
        # Find repository URL and show GitHub Pages URL
        $remoteUrl = git config --get remote.origin.url
        if ($remoteUrl -match "github\.com[:/]([^/]+)/([^/.]+)") {
            $owner = $matches[1]
            $repo = $matches[2] -replace "\.git$", ""
            $pagesUrl = "https://$owner.github.io/$repo"
            Write-Info "GitHub Pages URL: $pagesUrl"
            Write-Info "Actions status: https://github.com/$owner/$repo/actions"
        }
        
    } catch {
        Write-Error "Git operation failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run the script
Main
