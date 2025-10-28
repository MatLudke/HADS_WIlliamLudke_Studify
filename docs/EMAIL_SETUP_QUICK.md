# 📧 EmailJS Setup - Quick Guide

## ✅ What We Fixed

Complete rewrite of the EmailJS integration with:

- ✨ Clean, simple code
- 🔧 Proper error handling
- 📝 Clear configuration checks
- 🎯 Auto-initialization

## 🚀 Setup (5 minutes)

### Step 1: EmailJS Account

1. Go to https://www.emailjs.com
2. Sign up (free - 200 emails/month)
3. Verify your email

### Step 2: Add Email Service

1. Dashboard → **Email Services** → **Add New Service**
2. **Choose: Outlook or Yahoo** (NOT Gmail!)
   - Click "Connect Account"
   - Sign in with your Microsoft/Yahoo account
   - Done! No SMTP config needed
3. Copy your **Service ID** (e.g., `service_abc123`)

### Step 3: Create Template

1. Dashboard → **Email Templates** → **Create New Template**
2. **Select "Welcome" template**
3. **Delete all default content**
4. Paste this simple template:

**To Email:** `{{to_email}}`

**Subject:** `{{subject}}`

**Content:**

```
Hi {{to_name}},

{{message}}

Best regards,
Studify
```

5. Save and copy your **Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key

1. Dashboard → **Account** → **General**
2. Copy your **Public Key** (e.g., `abc123XYZ`)

### Step 5: Add to .env.local

```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abc123XYZ
```

### Step 6: Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 7: Test!

1. Go to http://localhost:9002/dashboard/settings
2. Click **Notifications** tab
3. You should see "Configured ✓" badge
4. Click **Send Test Email**
5. Check your inbox! 📧

## 🎯 What You'll See

### Before Configuration:

- Badge: "Not Configured"
- Alert with setup instructions
- Configuration details hidden

### After Configuration:

- Badge: "Configured ✓"
- Email Reminders toggle
- Send Test Email button
- Configuration details showing Service ID, Template ID, Status

## 🐛 Troubleshooting

### "Not Configured" despite adding env vars:

1. Stop dev server completely
2. Hard refresh browser (Ctrl+Shift+R)
3. Restart: `npm run dev`
4. Clear browser cache if needed

### Email not received:

1. Check spam folder
2. Verify all 3 env vars are set correctly
3. Make sure no extra spaces in .env.local
4. Check EmailJS dashboard for any errors

### "Failed to send email":

1. Open browser console (F12)
2. Look for detailed error message
3. Common issues:
   - Wrong Service ID/Template ID
   - Template missing variables (to_email, to_name, subject, message)
   - Email service not properly connected

## 💡 How It Works

### New Architecture:

```
src/lib/email-notifications.ts
├── getEmailConfig() - Reads env vars
├── isEmailConfigured() - Validates setup
├── sendEmail() - Core email sending
├── sendTestEmail() - Quick test
└── Helper functions for different email types

src/components/dashboard/notification-settings-v3.tsx
├── Auto-checks configuration on mount
├── Shows setup instructions if not configured
├── Enables email features when configured
└── Clean UI with status badges
```

### Auto-Initialization:

EmailJS is automatically initialized when the module loads:

```typescript
emailjs.init(publicKey); // Happens once on import
```

### Configuration Check:

```typescript
const config = getEmailConfig();
// Returns: { serviceId, templateId, publicKey, isConfigured }
```

## ✅ Success Checklist

- [ ] EmailJS account created
- [ ] Email service connected (Outlook/Yahoo)
- [ ] Template created with correct variables
- [ ] All 3 env vars added to .env.local
- [ ] Dev server restarted
- [ ] Browser hard refreshed
- [ ] "Configured ✓" badge showing
- [ ] Test email sent and received

## 🎉 Next Steps

Once working:

1. Enable "Email Reminders" toggle
2. Set your preferred reminder time
3. Studify will automatically send:
   - Study reminders at your chosen time
   - Missed goal notifications
   - Weekly summaries (coming soon)

---

**Note:** The old `simple-notifications.ts` still handles browser notifications. The new `email-notifications.ts` ONLY handles emails. Clean separation of concerns! 🎯
