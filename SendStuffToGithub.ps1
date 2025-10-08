# Run from PowerShell: .\scripts\create_submission.ps1

$srcRoot = "C:\Development\BroughtFromFirebaseStudio\ExportingFromFIrebaseStudio"
$dest = Join-Path $srcRoot "submission-mvp"

# Clean up previous snapshot if any
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }

# Create folder structure
New-Item -ItemType Directory -Path $dest -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dest "src\lib") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dest "src\components\dashboard") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dest "src\app\dashboard") -Force | Out-Null

# Files to include (adjust names if needed)
$files = @(
  "src\lib\types.ts",
  "src\lib\firestore.ts",
  "src\components\dashboard\study-timer.tsx",
  "src\components\dashboard\activity-list.tsx",
  "src\app\dashboard\page.tsx",
  "package.json"
)

Write-Host "Copying selected files..."
foreach ($f in $files) {
  $src = Join-Path $srcRoot $f
  $dst = Join-Path $dest $f
  $dstDir = Split-Path $dst -Parent
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "  COPIED: $f"
  } else {
    Write-Host "  MISSING: $f"
  }
}

# Add firebase example (sanitized) so teacher knows to add local config
@"
// src/lib/firebase.ts.example
// Create src/lib/firebase.ts from this template with your real Firebase config before running.
export const firebaseConfig = {
  apiKey: 'REDACTED',
  authDomain: 'REDACTED',
  projectId: 'REDACTED'
};
"@ | Out-File -FilePath (Join-Path $dest "src\lib\firebase.ts.example") -Encoding utf8

# Minimal README
@"
Submission snapshot — Early-stage MVP

Included:
- types, sanitized firestore helpers
- basic activity CRUD (if present)
- core study timer (if present)
- package.json

Important:
- Firebase config is NOT included. Copy src/lib/firebase.ts.example -> src/lib/firebase.ts and fill values before running.
- To run:
  1. npm install
  2. npm run dev

"@ | Out-File -FilePath (Join-Path $dest "README.md") -Encoding utf8

# Initialize git and push
Set-Location $dest
git init
git add .
git commit -m "chore(submission): minimal MVP snapshot (sanitized)"
git branch -M main

# Replace remote URL below if different
$remote = "https://github.com/MatLudke/FinalAssignment.git"
git remote add origin $remote

Write-Host "Pushing to remote $remote ..."
git push -u origin main

Write-Host "Done. Submission snapshot created at: $dest"