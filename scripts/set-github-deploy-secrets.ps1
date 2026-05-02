# Sets GitHub Actions secrets for .github/workflows/deploy.yml
#
# Pehle ek dafa login (apne PowerShell mein):
#   & "C:\Program Files\GitHub CLI\gh.exe" auth login
# Phir repo root se:
#   powershell -ExecutionPolicy Bypass -File .\scripts\set-github-deploy-secrets.ps1

$ErrorActionPreference = "Stop"

function Get-GhExecutable {
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "${env:ProgramFiles}\GitHub CLI\gh.exe",
        "${env:ProgramFiles(x86)}\GitHub CLI\gh.exe",
        "${env:LocalAppData}\Programs\GitHub CLI\gh.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    throw "GitHub CLI (gh.exe) nahi mila. PATH mein gh add karo ya winget install GitHub.cli dubara chalao."
}

$gh = Get-GhExecutable
Write-Host "Using: $gh"

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$null = & $gh auth status 2>&1
$authOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEap
if (-not $authOk) {
    Write-Host ""
    Write-Host "GitHub par login nahi hua. Pehle ye chalao (browser khulega):" -ForegroundColor Yellow
    Write-Host "  & `"$gh`" auth login" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

$repo = git remote get-url origin 2>$null
if (-not $repo) { throw "Git repo root se script chalao (jahan .git ho)." }
if ($repo -match "github\.com[:/]([^/]+)/([^/.]+)") {
    $owner = $Matches[1]
    $name = $Matches[2] -replace "\.git$", ""
    $slug = "$owner/$name"
} else {
    throw "origin URL se GitHub repo parse nahi hua: $repo"
}

$privateKey = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $privateKey)) {
    throw "Private key nahi mili: $privateKey"
}

Write-Host "Secrets set ho rahi hain: $slug ..."

& $gh secret set SSH_HOST --body "92.249.46.104" -R $slug
& $gh secret set SSH_PORT --body "65002" -R $slug
& $gh secret set SSH_USER --body "u442232604" -R $slug
& $gh secret set DEPLOY_PATH --body "/home/u442232604/domains/travelwithuno.com/public_html/website" -R $slug
Get-Content -Raw $privateKey | & $gh secret set SSH_PRIVATE_KEY -R $slug

Write-Host "Ho gaya. List: & `"$gh`" secret list -R $slug" -ForegroundColor Green
