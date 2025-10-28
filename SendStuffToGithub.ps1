# Quick Git Commit & Push Script for Studify
# Usage: .\SendStuffToGithub.ps1 "Your commit message here"

param(
  [string]$CommitMessage = "chore: update code"
)

# Go to project root
cd "C:\Development\BroughtFromFirebaseStudio\ExportingFromFIrebaseStudio"

Write-Host "=== Studify Git Push Script ===" -ForegroundColor Cyan
Write-Host ""

# 1) Ensure .env.local is ignored
if (-not (Test-Path .gitignore)) { New-Item -Path .gitignore -ItemType File | Out-Null }
if (-not (Select-String -Path .gitignore -Pattern '^\s*\.env\.local\s*$' -Quiet)) {
  Add-Content .gitignore "`n.env.local"
  Write-Host "✓ .env.local added to .gitignore" -ForegroundColor Green
} else {
  Write-Host "✓ .env.local already in .gitignore" -ForegroundColor Green
}

# 2) Remove .env.local from tracking if it was tracked
git rm --cached .env.local -f 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ .env.local removed from Git tracking" -ForegroundColor Green
}

# 3) Ensure we're on main branch
Write-Host ""
Write-Host "Switching to main branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
  git checkout main 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Switched to main branch" -ForegroundColor Green
  } else {
    Write-Host "✗ Could not switch to main" -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "✓ Already on main branch" -ForegroundColor Green
}

# 4) Show status
Write-Host ""
Write-Host "Current changes:" -ForegroundColor Yellow
git status --short

# 5) Stage all changes
Write-Host ""
Write-Host "Staging changes..." -ForegroundColor Yellow
git add .
Write-Host "✓ All changes staged" -ForegroundColor Green

# 6) Commit
Write-Host ""
Write-Host "Committing with message: '$CommitMessage'" -ForegroundColor Yellow
git commit -m "$CommitMessage"
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Changes committed" -ForegroundColor Green
} else {
  Write-Host "✓ No changes to commit" -ForegroundColor Yellow
}

# 7) Ensure remote is configured
$remoteUrl = "https://github.com/MatLudke/HADS_WIlliamLudke_Studify.git"
$currentRemote = git remote get-url origin 2>$null
if ($currentRemote -ne $remoteUrl) {
  if ($currentRemote) {
    git remote set-url origin $remoteUrl
    Write-Host "✓ Updated remote origin" -ForegroundColor Green
  } else {
    git remote add origin $remoteUrl
    Write-Host "✓ Added remote origin" -ForegroundColor Green
  }
}

# 8) Push to main
Write-Host ""
Write-Host "Pushing to GitHub (main branch)..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✓ Successfully pushed to GitHub! 🚀" -ForegroundColor Green
  Write-Host ""
} else {
  Write-Host ""
  Write-Host "✗ Push failed. You may need to pull first:" -ForegroundColor Red
  Write-Host "  git pull origin main --rebase" -ForegroundColor Yellow
  Write-Host "  Then run this script again" -ForegroundColor Yellow
  exit 1
}
