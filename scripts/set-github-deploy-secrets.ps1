# Sets GitHub Actions secrets for .github/workflows/deploy.yml
# Prerequisite: winget install GitHub.cli  (or https://cli.github.com)
# Then once:  gh auth login
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\set-github-deploy-secrets.ps1

$ErrorActionPreference = "Stop"
$repo = git remote get-url origin 2>$null
if (-not $repo) { throw "Run from git repo root" }
if ($repo -match "github\.com[:/]([^/]+)/([^/.]+)") {
    $owner = $Matches[1]
    $name = $Matches[2] -replace "\.git$", ""
    $slug = "$owner/$name"
} else {
    throw "Could not parse GitHub repo from origin: $repo"
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) not found. Install: winget install GitHub.cli"
}

$pub = Join-Path $env:USERPROFILE ".ssh\id_ed25519"
if (-not (Test-Path $pub)) {
    throw "Expected private key at $pub (deploy workflow uses same key as authorized_keys 'github' line)"
}

Write-Host "Setting secrets for $slug ..."

gh secret set SSH_HOST --body "92.249.46.104" -R $slug
gh secret set SSH_PORT --body "65002" -R $slug
gh secret set SSH_USER --body "u442232604" -R $slug
gh secret set DEPLOY_PATH --body "/home/u442232604/domains/travelwithuno.com/public_html/website" -R $slug
Get-Content -Raw $pub | gh secret set SSH_PRIVATE_KEY -R $slug

Write-Host "Done. Verify: gh secret list -R $slug"
