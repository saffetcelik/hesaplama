# GitHub Pages Deployment PowerShell Script
# Bu script GitHub Actions workflow'unu tetikler ve deployment durumunu takip eder

param(
    [string]$RepoOwner = "saffetcelik",
    [string]$RepoName = "hesaplama",
    [string]$Branch = "main"
)

# Renkli output için fonksiyonlar
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Info "GitHub Pages Deployment Script Başlatılıyor..."
Write-Info "Repository: $RepoOwner/$RepoName"
Write-Info "Branch: $Branch"

# Git durumunu kontrol et
Write-Info "Git durumu kontrol ediliyor..."
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "Uncommitted değişiklikler bulundu:"
        git status --short
        
        $response = Read-Host "Değişiklikleri commit etmek istiyor musunuz? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Info "Değişiklikler commit ediliyor..."
            git add .
            $commitMessage = Read-Host "Commit mesajı girin (boş bırakırsanız otomatik mesaj kullanılır)"
            if ([string]::IsNullOrWhiteSpace($commitMessage)) {
                $commitMessage = "GitHub Pages deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            }
            git commit -m $commitMessage
            Write-Success "Değişiklikler commit edildi"
        }
    } else {
        Write-Success "Working directory temiz"
    }
} catch {
    Write-Error "Git durumu kontrol edilemedi: $($_.Exception.Message)"
    exit 1
}

# Remote repository'yi kontrol et
Write-Info "Remote repository kontrol ediliyor..."
try {
    $remoteUrl = git remote get-url origin
    Write-Info "Remote URL: $remoteUrl"
} catch {
    Write-Error "Remote repository bulunamadı. Git remote ayarlarını kontrol edin."
    exit 1
}

# Push işlemi
Write-Info "Değişiklikler GitHub'a push ediliyor..."
try {
    git push origin $Branch
    Write-Success "Push işlemi başarılı"
} catch {
    Write-Error "Push işlemi başarısız: $($_.Exception.Message)"
    exit 1
}

# GitHub CLI kurulu mu kontrol et
Write-Info "GitHub CLI kontrol ediliyor..."
try {
    $ghVersion = gh --version
    Write-Success "GitHub CLI bulundu"
} catch {
    Write-Warning "GitHub CLI bulunamadı. Manuel olarak GitHub Actions'ı kontrol etmeniz gerekebilir."
    Write-Info "GitHub CLI kurulum: https://cli.github.com/"
    
    # Browser'da Actions sayfasını aç
    $actionsUrl = "https://github.com/$RepoOwner/$RepoName/actions"
    Write-Info "Actions sayfası açılıyor: $actionsUrl"
    Start-Process $actionsUrl
    
    # Browser'da Pages sayfasını aç
    $pagesUrl = "https://github.com/$RepoOwner/$RepoName/settings/pages"
    Write-Info "Pages ayarları açılıyor: $pagesUrl"
    Start-Process $pagesUrl
    
    Write-Info "Manuel kontrol için:"
    Write-Info "1. Actions sayfasında workflow'un çalıştığını kontrol edin"
    Write-Info "2. Pages ayarlarında Source'un 'GitHub Actions' olduğunu kontrol edin"
    Write-Info "3. Deployment tamamlandıktan sonra siteyi kontrol edin: https://$RepoOwner.github.io/$RepoName"
    
    Read-Host "Devam etmek için Enter'a basın"
    exit 0
}

# GitHub CLI ile workflow'u tetikle
Write-Info "GitHub Actions workflow tetikleniyor..."
try {
    gh workflow run "Deploy static content to Pages" --repo "$RepoOwner/$RepoName"
    Write-Success "Workflow tetiklendi"
} catch {
    Write-Warning "Workflow tetiklenemedi, ancak push işlemi otomatik tetiklemiş olabilir"
}

# Workflow durumunu takip et
Write-Info "Workflow durumu takip ediliyor..."
Start-Sleep -Seconds 5

try {
    $runs = gh run list --repo "$RepoOwner/$RepoName" --workflow="Deploy static content to Pages" --limit=1 --json status,conclusion,url
    $latestRun = $runs | ConvertFrom-Json | Select-Object -First 1
    
    if ($latestRun) {
        Write-Info "Son workflow durumu: $($latestRun.status)"
        Write-Info "Workflow URL: $($latestRun.url)"
        
        # Workflow tamamlanana kadar bekle
        $timeout = 300 # 5 dakika
        $elapsed = 0
        
        while ($latestRun.status -eq "in_progress" -and $elapsed -lt $timeout) {
            Write-Info "Workflow devam ediyor... ($elapsed/$timeout saniye)"
            Start-Sleep -Seconds 10
            $elapsed += 10
            
            $runs = gh run list --repo "$RepoOwner/$RepoName" --workflow="Deploy static content to Pages" --limit=1 --json status,conclusion,url
            $latestRun = $runs | ConvertFrom-Json | Select-Object -First 1
        }
        
        if ($latestRun.status -eq "completed") {
            if ($latestRun.conclusion -eq "success") {
                Write-Success "Deployment başarılı!"
                Write-Success "Site URL: https://$RepoOwner.github.io/$RepoName"
                
                # Site URL'ini aç
                $siteUrl = "https://$RepoOwner.github.io/$RepoName"
                $response = Read-Host "Siteyi açmak istiyor musunuz? (Y/n)"
                if ($response -ne 'n' -and $response -ne 'N') {
                    Start-Process $siteUrl
                }
            } else {
                Write-Error "Deployment başarısız: $($latestRun.conclusion)"
                Write-Info "Detaylar için: $($latestRun.url)"
            }
        } else {
            Write-Warning "Workflow timeout oldu veya hala devam ediyor"
            Write-Info "Manuel kontrol için: $($latestRun.url)"
        }
    }
} catch {
    Write-Warning "Workflow durumu takip edilemedi: $($_.Exception.Message)"
    Write-Info "Manuel kontrol için GitHub Actions sayfasını ziyaret edin"
}

Write-Info "Script tamamlandı"
