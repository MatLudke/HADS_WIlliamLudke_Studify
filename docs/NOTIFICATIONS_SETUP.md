# Simple Notifications Setup Guide

This guide explains the **simplified** notification system using browser-native notifications and EmailJS.

## ✅ Browser Notifications (No Setup Required!)

Browser notifications work out of the box - no configuration needed!

### How to Use:

1. Go to **Dashboard → Settings → Notifications**
2. Click **"Enable Browser Notifications"**
3. Click **"Allow"** when your browser prompts
4. Done! You'll now receive notifications for:
   - Timer completions
   - Break reminders
   - Study reminders
   - Goal updates

### Test It:

- Click the **"Test Notification"** button
- You should see a desktop notification immediately

---

## 📧 Email Notifications (Optional - 5 Minute Setup)

Email notifications use EmailJS - a free service that sends emails directly from the browser.

### Step 1: Create Free EmailJS Account

1. Go to https://www.emailjs.com
2. Click **"Sign Up"** (free plan includes 200 emails/month)
3. Verify your email address

### Step 2: Create Email Service

1. In EmailJS dashboard, click **"Email Services"** → **"Add New Service"**
2. **Choose one of these simple options** (they work without SMTP configuration):
   
   **Option A: Outlook/Hotmail (Easiest - no extra setup)**
   - Select **"Outlook"** or **"Hotmail"**
   - Click **"Connect Account"**
   - Sign in with your Microsoft account
   - Done! No SMTP configuration needed
   
   **Option B: Yahoo Mail**
   - Select **"Yahoo"**
   - Click **"Connect Account"**
   - Sign in with your Yahoo account
   - Done! No SMTP configuration needed
   
   **⚠️ AVOID:**
   - Gmail (causes 412 authentication errors)
   - "Custom SMTP Server" (requires manual host/port/password setup)

3. After connecting, note your **Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template

1. Click **"Email Templates"** → **"Create New Template"**
2. Use this template content:

**Template Name:** `studify_notification`

**Subject:** `{{subject}}`

**Content:**

```
Hi {{to_name}},

{{message}}

Best regards,
Studify
```

3. Note your **Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key

1. Click **"Account"** → **"General"**
2. Find your **Public Key** (e.g., `abc123XYZ456`)

### Step 5: Add to Environment Variables

Create/update `.env.local` in your project root:

```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abc123XYZ456
```

### Step 6: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 7: Test It!

1. Go to **Settings → Notifications**
2. Enable **"Email Reminders"**
3. Click **"Test Email"**
4. Check your inbox!

---

## 🎯 What You Get

### Browser Notifications:

- ✅ No setup required
- ✅ Works offline
- ✅ Instant delivery
- ✅ No rate limits

### Email Notifications:

- ✅ 5-minute setup
- ✅ Free tier: 200 emails/month
- ✅ Works from any device
- ✅ Delivered to inbox

---

## 🔧 Troubleshooting

### Browser Notifications Not Working:

**"Permission Denied"**

- Click the lock icon in your browser's address bar
- Set "Notifications" to "Allow"
- Refresh the page

**No notification appears**

- Check your OS notification settings
- Make sure "Do Not Disturb" is off
- Try a different browser

### Email Not Received:

**"412 Gmail_API: Request had insufficient authentication scopes"** or **"Asking for SMTP host/port/password"**

- This means you selected Gmail or Custom SMTP Server
- Solution: Go back to EmailJS dashboard → Email Services
- Delete the current service
- Add a new service and choose **"Outlook"** or **"Yahoo"** instead
- These options work with OAuth (just click "Connect Account")
- Use the new Service ID in your `.env.local`

**"EmailJS not configured"**

- Make sure all 3 environment variables are set
- Restart the dev server after adding them
- Check for typos in the keys

**Email goes to spam**

- Check your spam folder
- Mark emails from EmailJS as "Not Spam"
- EmailJS service emails are less likely to go to spam than Gmail

**"Quota exceeded"**

- Free tier: 200 emails/month
- Upgrade EmailJS account for more

---

## 🚀 Production Deployment

### Vercel/Netlify:

1. Add environment variables in your hosting dashboard
2. Redeploy your app
3. Done!

### Environment Variables Needed:

```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=abc123XYZ456
```

---

## 💡 Tips

- Browser notifications work even without email setup
- Email notifications are optional - use them if you want summaries/reminders
- EmailJS free tier is plenty for personal use
- You can customize the email template in EmailJS dashboard
