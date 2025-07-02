# GitHub Pages Otomatik Deployment Script
# Bu script HTML degisikliklerini GitHub'a commit eder ve GitHub Actions ile otomatik deployment yapar

param(
    [string]$CommitMessage = "",
    [switch]$SetupWorkflow = $false,
    [switch]$Help = $false
)

# Renkli cikti icin fonksiyonlar
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Yardim mesaji
if ($Help) {
    Write-Host "GitHub Pages Deployment Script" -ForegroundColor White
    Write-Host "==============================" -ForegroundColor White
    Write-Host ""
    Write-Host "Kullanim:" -ForegroundColor Yellow
    Write-Host "  .\github-pages-deploy.ps1                    # Otomatik commit ve deploy"
    Write-Host "  .\github-pages-deploy.ps1 -CommitMessage 'Ozel mesaj'  # Ozel commit mesaji ile"
    Write-Host "  .\github-pages-deploy.ps1 -SetupWorkflow     # Ilk kurulum (workflow dosyasi olustur)"
    Write-Host "  .\github-pages-deploy.ps1 -Help              # Bu yardim mesajini goster"
    Write-Host ""
    Write-Host "Ozellikler:" -ForegroundColor Yellow
    Write-Host "- Otomatik Git commit ve push"
    Write-Host "- GitHub Actions workflow olusturma"
    Write-Host "- GitHub Pages otomatik deployment"
    Write-Host "- Tarih/saat damgali commit mesajlari"
    Write-Host "- Hata kontrolu ve geri bildirim"
    Write-Host ""
    exit 0
}

# Ana fonksiyon
function Main {
    Write-Info "GitHub Pages Deployment Script baslatiliyor..."
    
    # Git repository kontrolu
    if (-not (Test-Path ".git")) {
        Write-Error "Bu dizin bir Git repository degil!"
        Write-Info "Once 'git init' komutunu calistirin."
        exit 1
    }

    # GitHub Actions workflow kurulumu
    if ($SetupWorkflow) {
        Setup-GitHubWorkflow
        return
    }

    # Ana deployment islemi
    Deploy-ToGitHub
}

# GitHub Actions workflow dosyasi olusturma
function Setup-GitHubWorkflow {
    Write-Info "GitHub Actions workflow kurulumu baslatiliyor..."
    
    # .github/workflows dizini olustur
    $workflowDir = ".github/workflows"
    if (-not (Test-Path $workflowDir)) {
        New-Item -ItemType Directory -Path $workflowDir -Force | Out-Null
        Write-Success ".github/workflows dizini olusturuldu"
    }

    # Workflow dosyasi icerigi
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

    # Workflow dosyasini yaz
    $workflowFile = "$workflowDir/deploy-pages.yml"
    $workflowContent | Out-File -FilePath $workflowFile -Encoding UTF8
    Write-Success "GitHub Actions workflow dosyasi olusturuldu: $workflowFile"
    
    # .nojekyll dosyasi olustur (Jekyll build'i atlamak icin)
    if (-not (Test-Path ".nojekyll")) {
        "" | Out-File -FilePath ".nojekyll" -Encoding UTF8
        Write-Success ".nojekyll dosyasi olusturuldu"
    }

    Write-Info "Workflow kurulumu tamamlandi!"
    Write-Warning "GitHub repository ayarlarindan Pages source'u 'GitHub Actions' olarak ayarlamayi unutmayin!"
    Write-Info "Repository Settings > Pages > Source > GitHub Actions"
}

# GitHub'a deployment
function Deploy-ToGitHub {
    Write-Info "Deployment islemi baslatiliyor..."
    
    # Git durumu kontrolu
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Warning "Commit edilecek degisiklik bulunamadi."
        return
    }

    # Commit mesaji olustur
    if (-not $CommitMessage) {
        $timestamp = Get-Date -Format "dd.MM.yyyy HH:mm:ss"
        $CommitMessage = "Guncelleme Islemi - $timestamp"
    }

    try {
        # Git islemleri
        Write-Info "Degisiklikler stage'e aliniyor..."
        git add .
        
        Write-Info "Commit olusturuluyor: $CommitMessage"
        git commit -m $CommitMessage
        
        # Remote repository kontrolu
        $remotes = git remote
        if (-not $remotes) {
            Write-Error "Remote repository tanimlanmamis!"
            Write-Info "Once 'git remote add origin <repository-url>' komutunu calistirin."
            exit 1
        }

        Write-Info "GitHub'a push ediliyor..."
        git push origin HEAD
        
        Write-Success "Kod basariyla GitHub'a gonderildi!"
        Write-Info "GitHub Actions otomatik olarak calisacak ve siteniz guncellenecek."
        
        # Repository URL'sini bul ve GitHub Pages URL'sini goster
        $remoteUrl = git config --get remote.origin.url
        if ($remoteUrl -match "github\.com[:/]([^/]+)/([^/.]+)") {
            $owner = $matches[1]
            $repo = $matches[2] -replace "\.git$", ""
            $pagesUrl = "https://$owner.github.io/$repo"
            Write-Info "GitHub Pages URL: $pagesUrl"
            Write-Info "Actions durumu: https://github.com/$owner/$repo/actions"
        }
        
    } catch {
        Write-Error "Git islemi sirasinda hata olustu: $($_.Exception.Message)"
        exit 1
    }
}

# Script'i calistir
Main
