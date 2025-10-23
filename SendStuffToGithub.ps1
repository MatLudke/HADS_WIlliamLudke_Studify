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
git commit -m "feat(notifications): sistema de notificações simplificado com Browser API + EmailJS" `
  -m "REFATORAÇÃO COMPLETA: Substituição do sistema complexo (FCM + Resend/Nodemailer) por solução simplificada" `
  -m "" `
  -m "Motivação:" `
  -m "- Sistema anterior: FCM com service workers causava bugs no Edge (loops de permissão, SW não ativo)" `
  -m "- Resend → Nodemailer + Gmail: configuração complexa (App Passwords, 2FA, SMTP)" `
  -m "- EmailJS com Gmail: erro 412 (insufficient OAuth scopes)" `
  -m "- Objetivo: implementar notificações funcionais, simples e sem configurações complexas" `
  -m "" `
  -m "Implementação:" `
  -m "1. Browser Notifications (nativo):" `
  -m "   - Substituição completa do Firebase Cloud Messaging" `
  -m "   - API nativa 'Notification' do navegador" `
  -m "   - Sem service workers, sem tokens FCM, sem configuração" `
  -m "   - Funciona imediatamente após permissão do usuário" `
  -m "   - Timer complete, break reminders, study reminders, goal updates" `
  -m "" `
  -m "2. Email Notifications (EmailJS):" `
  -m "   - Substituição de Resend API e Nodemailer" `
  -m "   - Cliente: @emailjs/browser (envio direto do navegador)" `
  -m "   - Configuração: 3 variáveis de ambiente (service ID, template ID, public key)" `
  -m "   - Serviços suportados: Outlook/Yahoo (OAuth simples), evitar Gmail/Custom SMTP" `
  -m "   - Template HTML customizado com branding Studify" `
  -m "   - Emails: teste, missed goals, weekly summaries" `
  -m "" `
  -m "Arquivos Criados:" `
  -m "- src/lib/simple-notifications.ts: classe SimpleNotificationService" `
  -m "  * Browser: requestPermission(), showNotification(), tipos específicos" `
  -m "  * Email: sendEmail(), sendTestEmail(), sendMissedGoalEmail(), sendWeeklySummary()" `
  -m "  * Template params: to_email, to_name, subject, message" `
  -m "  * Logging detalhado para debug (message, text, status)" `
  -m "- src/components/dashboard/notification-settings-simple.tsx:" `
  -m "  * UI simplificada com conditional rendering (isEmailConfigured)" `
  -m "  * Test buttons para browser e email" `
  -m "  * Setup instructions inline quando EmailJS não configurado" `
  -m "  * Error handling com mensagens específicas (Gmail 412 error)" `
  -m "- docs/NOTIFICATIONS_SETUP.md: guia completo step-by-step" `
  -m "  * Browser notifications: zero setup" `
  -m "  * EmailJS: 5 minutos, 7 passos, troubleshooting detalhado" `
  -m "  * Avisos sobre Gmail/SMTP vs Outlook/Yahoo" `
  -m "- docs/emailjs-template.html: template HTML bonito" `
  -m "  * Design responsivo com tabelas" `
  -m "  * Header gradient roxo (Studify branding)" `
  -m "  * Variáveis: {{to_name}}, {{subject}}, {{message}}" `
  -m "  * CTA button, footer com settings link" `
  -m "- docs/EMAIL_SETUP_GMAIL.md: guia Gmail (legacy, para referência)" `
  -m "- src/app/api/send-email/route.ts: API route (mantida para compatibilidade)" `
  -m "- src/app/api/test-email-config/route.ts: endpoint de debug" `
  -m "" `
  -m "Arquivos Modificados:" `
  -m "- src/app/dashboard/settings/page.tsx:" `
  -m "  * Import alterado: notification-settings → notification-settings-simple" `
  -m "- src/lib/notifications.ts:" `
  -m "  * Melhorias no FCM: retry logic, skip waiting, controller checks" `
  -m "  * Service worker lifecycle completo (mantido para referência)" `
  -m "- src/lib/email-service.ts:" `
  -m "  * Migração Resend → Nodemailer + Gmail SMTP" `
  -m "  * Logging detalhado de configuração" `
  -m "  * Mantido como fallback/referência" `
  -m "- public/firebase-messaging-sw.js:" `
  -m "  * Adicionado message handler para SKIP_WAITING" `
  -m "  * Immediate activate event para claim clients" `
  -m "- .env.local:" `
  -m "  * Adicionado: NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_54qhtjp" `
  -m "  * Adicionado: NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_qpkghil" `
  -m "  * Adicionado: NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=8HnFfTeyAwkLeGPt3" `
  -m "  * Mantido: GMAIL_USER, GMAIL_APP_PASSWORD (legacy)" `
  -m "  * Mantido: NEXT_PUBLIC_FCM_VAPID_KEY (legacy)" `
  -m "- .env.example: documentação atualizada com EmailJS" `
  -m "- package.json:" `
  -m "  * Adicionado: @emailjs/browser@^4.4.1" `
  -m "  * Adicionado: nodemailer@^7.0.9, @types/nodemailer@^7.0.2" `
  -m "" `
  -m "Debug & Troubleshooting Realizado:" `
  -m "- Edge: loops de permissão FCM (requestPermission após cada refresh)" `
  -m "- Service Worker: 'no active Service Worker' ao obter token" `
  -m "- EmailJS Gmail: erro 412 'insufficient authentication scopes'" `
  -m "  * Causa: Gmail service requer OAuth scopes completas" `
  -m "  * Solução: usar Outlook/Yahoo com OAuth simples" `
  -m "- Custom SMTP: pedindo host/port/user/password" `
  -m "  * Causa: selecionou 'Custom SMTP Server' no EmailJS" `
  -m "  * Solução: usar serviços pré-configurados (Outlook/Yahoo)" `
  -m "- Environment variables não carregando:" `
  -m "  * Causa: caching do Next.js/Turbopack" `
  -m "  * Solução: hard refresh (Ctrl+Shift+R), restart dev server" `
  -m "- Setup instructions mostrando apesar de configurado:" `
  -m "  * Causa: faltava state isEmailConfigured" `
  -m "  * Solução: conditional rendering baseado em env vars" `
  -m "- Template variable mismatch:" `
  -m "  * Causa: usuário usou template 'Contact Us' (from_name, message_html)" `
  -m "  * Solução: template customizado (to_email, to_name, subject, message)" `
  -m "  * Template simplificado fornecido ao usuário" `
  -m "" `
  -m "Estado Atual:" `
  -m "- Browser notifications: ✅ funcionais (testado)" `
  -m "- EmailJS configurado: ✅ credenciais no .env.local" `
  -m "- Template: ⚠️  PENDENTE - usuário precisa atualizar no dashboard EmailJS" `
  -m "  * Usar template HTML simplificado fornecido" `
  -m "  * Set 'To Email' = {{to_email}}" `
  -m "  * Set 'Subject' = {{subject}}" `
  -m "  * Deletar conteúdo do template 'Contact Us'" `
  -m "  * Colar HTML simplificado" `
  -m "- Email delivery: ⏳ aguardando correção de template" `
  -m "" `
  -m "Tecnologias:" `
  -m "- Browser Notification API (nativo)" `
  -m "- EmailJS (https://www.emailjs.com)" `
  -m "- Outlook OAuth service (service_54qhtjp)" `
  -m "- Next.js 15.5.2 com Turbopack" `
  -m "- React client-side rendering" `
  -m "" `
  -m "Próximos Passos:" `
  -m "1. Usuário atualizar template EmailJS (template_qpkghil)" `
  -m "2. Testar envio de email end-to-end" `
  -m "3. Testar goal-based reminders" `
  -m "4. Atualizar Cloud Function para usar EmailJS (functions/index.js)" `
  -m "5. Deploy production com env vars no hosting" `
  -m "6. Atualizar localhost URLs para production no template" `
  -m "" `
  -m "Breaking Changes:" `
  -m "- Sistema antigo (FCM + Resend/Nodemailer) NÃO removido, apenas não usado" `
  -m "- Arquivos legacy mantidos para referência: notifications.ts, email-service.ts" `
  -m "- Configuração anterior: .env vars do Gmail/FCM ainda presentes" `
  -m "- Para usar sistema novo: import simple-notifications.ts" `
  -m "- Para usar sistema antigo: import notifications.ts" `
  -m "" `
  -m "Docs:" `
  -m "- README.md: (não atualizado neste commit)" `
  -m "- NOTIFICATIONS_SETUP.md: guia completo do sistema simplificado" `
  -m "- EMAIL_SETUP_GMAIL.md: guia Gmail legacy (referência)" `
  -m "- emailjs-template.html: template HTML de referência" `
  -m "" `
  -m "Co-authored-by: GitHub Copilot <noreply@github.com>"

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