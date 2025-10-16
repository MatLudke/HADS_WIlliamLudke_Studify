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
git commit -m "feat(studify): implementação avançada do sistema de estudo (timer, relatórios, sincronização, auth e notificações) - WIP" `
  -m "- RF01 (autenticação): integração completa de login com Email/Password (registro, verificação por e-mail, recuperação de senha) e preservado Google Sign-In" `
  -m "- RF02 (atividades): CRUD completo de atividades com prioridade, tags e sincronização em tempo real" `
  -m "- RF03 (timer/sessions): Pomodoro robusto com persistência de sessão ativa, recuperação, registro de duração real (pausas/stop), validação de atividades e prevenção de sessões órfãs" `
  -m "- RF04 (notificações - PARCIAL/WIP): implementação inicial do sistema de notificações browser push (FCM) e e-mail (Resend)" `
  -m "  * Cliente: service worker, gerenciamento de permissões, notificações de timer/break/metas" `
  -m "  * Servidor: Cloud Function agendada para verificação de metas, envio de FCM push e e-mails" `
  -m "  * UI: configurações de notificações, criação/gerenciamento de metas de estudo" `
  -m "  * Status: funcionalidade básica implementada mas requer testes adicionais em diferentes browsers (Edge, Chrome, Firefox)" `
  -m "  * Pendente: validação end-to-end, deploy da Cloud Function, ajustes de timezone e melhorias de UX" `
  -m "- RF05 (histórico/relatórios): histórico detalhado, filtros/pesquisa, gráficos, exportação CSV e formatação consistente de tempo" `
  -m "- Sincronização global: AppStateContext com updates otimistas e propagação imediata entre componentes" `
  -m "- UX/UI: redesign do timer, correções de dark mode, acessibilidade e animações" `
  -m "- Segurança/limpeza: exclusão completa de conta (LGPD) e tratamento correto de Timestamps do Firestore" `
  -m "- Correções técnicas: fix setState durante render, escala de gráficos, gravação de duração real nas sessões, e loops de permissão de notificações no Edge" `
  -m "" `
  -m "NOTA: Este commit representa trabalho em progresso. O sistema de notificações está parcialmente implementado e requer:" `
  -m "- Testes extensivos em diferentes navegadores e cenários (browser fechado, permissões, tokens)" `
  -m "- Deploy e configuração da Cloud Function para lembretes automáticos" `
  -m "- Validação da integração FCM/Resend em produção" `
  -m "- Melhorias contínuas baseadas em feedback e testes de usuário" `
  -m "" `
  -m "Docs: README atualizado e .env.example/.env.local com configurações FCM/Resend"

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