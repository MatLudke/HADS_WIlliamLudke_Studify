# 🔧 EmailJS Template Configuration Fix

## The Problem

Error: "The recipients address is empty"

This happens because EmailJS template needs the **"To Email" field** configured in the template settings.

## ✅ The Fix (2 minutes)

### Step 1: Go to EmailJS Dashboard

1. Open: https://dashboard.emailjs.com/admin/templates
2. Find your template: **template_2j4i098**
3. Click to **edit** it

### Step 2: Configure "To Email" Field

Look for the **template settings** at the top (before the HTML content):

```
Template Name: [your template name]
From Name: [optional]
From Email: [optional]
To Email: ← THIS IS WHAT YOU NEED!
Subject: {{subject}}
```

### Step 3: Set To Email

In the **"To Email"** field, enter EXACTLY:

```
{{to_email}}
```

**Important Notes:**

- Use double curly braces: `{{to_email}}`
- No spaces: `{{to_email}}` not `{{ to_email }}`
- Lowercase: `to_email` not `To_Email`

### Step 4: Save Template

Click **Save** button at the bottom of the page.

### Step 5: Test Again

1. Go back to Studify: http://localhost:9002/dashboard/settings
2. Hard refresh: `Ctrl + Shift + R`
3. Click **Send Test Email**
4. Success! 🎉

---

## 📸 Visual Guide

Your template settings should look like this:

```
┌─────────────────────────────────────┐
│ Template Settings                   │
├─────────────────────────────────────┤
│ Template Name: Studify Notification │
│ From Name:     Studify              │
│ From Email:    (leave empty)        │
│ To Email:      {{to_email}}    ← HERE!
│ Subject:       {{subject}}          │
└─────────────────────────────────────┘
```

---

## 🐛 Still Not Working?

### Check Template Variables

Make sure these variables are in your template:

**In Settings (top of page):**

- To Email: `{{to_email}}`
- Subject: `{{subject}}`

**In HTML Content:**

- `{{to_name}}` - for greeting
- `{{message}}` - for main content

### Console Logs

Open browser console (F12) and look for:

```
📧 Template params: {
  to_email: "your@email.com",  ← Should show YOUR email
  to_name: "Your Name",
  subject: "🧪 Studify Test Email",
  message: "...",
  reply_to: "your@email.com",
  to: "your@email.com",
  email: "your@email.com"
}
```

If `to_email` shows a real email but still fails, the issue is in EmailJS template settings.

---

## 🎯 Why This Happens

EmailJS has **two places** where recipient email is needed:

1. **Template Settings** (To Email field) - This is REQUIRED
2. **Template Variables** (in HTML) - This is for personalization

Both must be configured for emails to send successfully.

---

## ✅ Success Checklist

- [ ] Opened EmailJS template editor
- [ ] Found "To Email" field in template settings
- [ ] Set "To Email" to: `{{to_email}}`
- [ ] Set "Subject" to: `{{subject}}`
- [ ] Saved template
- [ ] Refreshed Studify app
- [ ] Test email sent successfully
- [ ] Email received in inbox

Once complete, you should receive a beautiful branded email! 📧✨
