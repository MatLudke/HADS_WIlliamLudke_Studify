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

# 3) Create a feature branch
git checkout -b feat/studify-core

# 4) Stage work (review changes first if you want: git status)
git add .

# 5) Commit with detailed Portuguese message (subject + body)
git commit -m "feat(studify): implementação avançada do sistema de estudo (timer, relatórios, sincronização e auth)" `
  -m "- RF01 (autenticação): integração completa de login com Email/Password (registro, verificação por e-mail, recuperação de senha) e preservado Google Sign-In" `
  -m "- RF02 (atividades): CRUD completo de atividades com prioridade, tags e sincronização em tempo real" `
  -m "- RF03 (timer/sessions): Pomodoro robusto com persistência de sessão ativa, recuperação, registro de duração real (pausas/stop), validação de atividades e prevenção de sessões órfãs" `
  -m "- RF05 (histórico/relatórios): histórico detalhado, filtros/pesquisa, gráficos, exportação CSV e formatação consistente de tempo" `
  -m "- Sincronização global: AppStateContext com updates otimistas e propagação imediata entre componentes" `
  -m "- UX/UI: redesign do timer, correções de dark mode, acessibilidade e animações" `
  -m "- Segurança/limpeza: exclusão completa de conta (LGPD) e tratamento correto de Timestamps do Firestore" `
  -m "- Correções técnicas: fix setState durante render, escala de gráficos e gravação de duração real nas sessões" `
  -m "Docs: README atualizado e .env.example/.env.local instruções"

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
git push -u origin feat/studify-core