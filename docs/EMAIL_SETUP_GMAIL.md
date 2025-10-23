# Gmail Email Setup Guide

This guide explains how to set up email notifications using your Gmail account with Nodemailer.

## Prerequisites

- A Gmail account
- Access to Google Account settings

## Step 1: Enable 2-Step Verification

1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2-Step Verification if not already enabled

## Step 2: Generate an App Password

Since Gmail doesn't allow direct password login for third-party apps, you need to create an App Password:

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. Click **Select app** → Choose **Mail**
3. Click **Select device** → Choose **Other (Custom name)**
4. Enter a name like "Studify App" or "Next.js Email Service"
5. Click **Generate**
6. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)
   - You won't be able to see it again!
   - Remove the spaces when copying to `.env.local`

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Email Service with Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with your 16-character App Password (no spaces!)
- Don't commit `.env.local` to git (it's already in `.gitignore`)

## Step 4: Test the Email Functionality

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in to your app at http://localhost:9002

3. Go to **Dashboard → Settings → Notifications**

4. Enable **Email Reminders**

5. Click the **Test Email** button

6. Check your inbox for a test email from your Gmail account

## How It Works

- **Sender**: Your Gmail address (`GMAIL_USER`)
- **Recipient**: The logged-in user's email (from Firebase Auth)
- **Service**: Gmail SMTP via Nodemailer
- **Security**: App Password (not your regular password)

## Troubleshooting

### "Invalid login" error
- Make sure 2-Step Verification is enabled
- Verify you're using the App Password, not your regular Gmail password
- Check that there are no spaces in the App Password

### "Less secure app" error
- This shouldn't happen with App Passwords
- If it does, use App Passwords instead of regular password

### Emails not sending
- Check the console logs for detailed error messages
- Verify both `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env.local`
- Make sure you restarted the dev server after adding environment variables

### Rate limits
- Gmail has sending limits (~500 emails/day for free accounts)
- For production with high volume, consider a dedicated email service like SendGrid or Postmark

## Email Types Supported

1. **Test Email**: Weekly summary with mock data
2. **Study Reminder**: Notification for scheduled activities
3. **Missed Goal**: Reminder when study goals aren't met
4. **Achievement**: Celebration emails for milestones

## Production Considerations

For production deployment:
- Consider using a dedicated email service (SendGrid, Postmark, AWS SES)
- Gmail has daily sending limits
- App Passwords are secure but dedicated services offer better deliverability
- Add proper SPF/DKIM records if using a custom domain

## Security Notes

- ✅ App Passwords are safer than using your main password
- ✅ App Passwords only work with your account
- ✅ You can revoke them anytime from Google Account settings
- ❌ Never commit your App Password to git
- ❌ Don't share your App Password
