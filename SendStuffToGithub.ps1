# Go to project root
cd "C:\Development\BroughtFromFirebaseStudio\ExportingFromFIrebaseStudio"

# 1) Ensure .env.local is ignored
if (-not (Test-Path .gitignore)) { New-Item -Path .gitignore -ItemType File | Out-Null }
if (-not (Select-String -Path .gitignore -Pattern '^\s*\.env\.local\s*$' -Quiet)) {
  Add-Content .gitignore "`n.env.local"
  Write-Host ".env.local added to .gitignore"
} else {
  Write-Host ".env.local already in .gitignore"
}

# 2) If .env.local was already tracked, remove it from the index (keeps local file)
git rm --cached .env.local -f 2>$null || Write-Host ".env.local not tracked or already removed from index"

# 3) Ensure we're on main branch
git checkout main 2>$null || git checkout -b main

# 4) Stage work (review changes first if you want: git status)
git add .

# 5) Commit with message
git commit -m "refactor(notifications): remove FCM, keep browser + email notifications only" `
  -m "LIMPEZA DE CÓDIGO: Remoção completa do Firebase Cloud Messaging" `
  -m "" `
  -m "Removido:" `
  -m "- src/lib/notifications.ts: código completo FCM + service workers" `
  -m "- FCM token storage: saveFCMToken(), getFCMToken() do firestore.ts" `
  -m "- fcmToken field do User type em types.ts" `
  -m "- VAPID key references e imports de firebase/messaging" `
  -m "" `
  -m "Mantido:" `
  -m "- Browser Notification API nativo (simple-notifications.ts)" `
  -m "- EmailJS para email notifications" `
  -m "- Firebase Auth e Firestore (não afetados)" `
  -m "" `
  -m "Justificativa:" `
  -m "- Sistema de notificações funcionando sem FCM" `
  -m "- Browser notifications nativas são mais simples e confiáveis" `
  -m "- EmailJS provê email notifications sem complexidade server-side" `
  -m "- Redução de dependências e código legado" `
  -m "" `
  -m "Próximos passos:" `
  -m "- Implementar goal tracking com prazos (daily/weekly/monthly)" `
  -m "- Email reminders automáticos quando atrás das metas" `
  -m "- Dashboard de progresso em Reports page"

# 6) Ensure remote points to the correct repository
$remoteUrl = "https://github.com/MatLudke/HADS_WIlliamLudke_Studify.git"
# If origin exists, update it; otherwise add it
if (git remote | Select-String -Pattern '^origin$' -Quiet) {
  git remote set-url origin $remoteUrl
  Write-Host "Updated remote origin to $remoteUrl"
} else {
  git remote add origin $remoteUrl
  Write-Host "Added remote origin $remoteUrl"
}

# 7) Push branch to origin
git push -u origin main
