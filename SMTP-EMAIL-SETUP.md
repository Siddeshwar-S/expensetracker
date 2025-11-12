# SMTP Email Setup Guide

## Overview

The email system now uses SMTP (Nodemailer) instead of Resend. This works with any email provider (Gmail, Yahoo, Outlook, etc.).

## Quick Setup

### Option 1: Gmail (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

#### Step 2: Create App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Name it: "Finance Tracker"
4. Click "Generate"
5. Copy the 16-character password

#### Step 3: Configure Environment
Edit `backend/.env.local`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App password from step 2
SMTP_FROM=Finance Tracker <your-email@gmail.com>
```

### Option 2: Yahoo Mail

#### Step 1: Generate App Password
1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Click "Generate app password"
3. Select "Other App"
4. Name it: "Finance Tracker"
5. Click "Generate"
6. Copy the password

#### Step 2: Configure Environment
Edit `backend/.env.local`:
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=siddeshwar.s@yahoo.com
SMTP_PASS=your-app-password  # From step 1
SMTP_FROM=Finance Tracker <siddeshwar.s@yahoo.com>
```

### Option 3: Outlook/Hotmail

Edit `backend/.env.local`:
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=Finance Tracker <your-email@outlook.com>
```

### Option 4: Custom SMTP Server

Edit `backend/.env.local`:
```bash
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_SECURE=false  # true for port 465
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=Finance Tracker <noreply@yourdomain.com>
```

## Testing

### Step 1: Restart Backend
```bash
cd backend
npm run dev
```

### Step 2: Sign Up
1. Go to your app
2. Sign up with a real email
3. Check backend terminal for email box
4. Check your inbox for the email

### Step 3: Verify
You should see in backend terminal:
```
╔════════════════════════════════════════════════════════════════╗
║                    📧 VERIFICATION EMAIL                       ║
║ To: your-email@example.com                                     ║
╠════════════════════════════════════════════════════════════════╣
║ 🔗 VERIFICATION LINK:                                         ║
║ http://localhost:5173/auth/callback#access_token=...          ║
╚════════════════════════════════════════════════════════════════╝

✅ Email sent successfully via SMTP: <message-id>
```

And receive email in your inbox!

## Troubleshooting

### Error: "Invalid login"

**Gmail:**
- Make sure 2FA is enabled
- Use App Password, not regular password
- App password has no spaces when entering

**Yahoo:**
- Use App Password, not regular password
- Make sure "Allow apps that use less secure sign in" is enabled

### Error: "Connection timeout"

**Check:**
- SMTP_HOST is correct
- SMTP_PORT is correct (587 for TLS, 465 for SSL)
- Firewall isn't blocking SMTP ports

**Try:**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587
# Should connect
```

### Error: "Self-signed certificate"

**Fix:**
Add to transporter config in `backend/lib/email.ts`:
```typescript
const transporter = nodemailer.createTransport({
  // ... existing config
  tls: {
    rejectUnauthorized: false
  }
});
```

### Email Goes to Spam

**Fix:**
1. Add sender to contacts
2. Mark as "Not Spam"
3. For production, set up SPF/DKIM records

### No Email Received

**Check:**
1. Backend terminal shows "✅ Email sent successfully"
2. Spam/Junk folder
3. Email address is correct
4. SMTP credentials are correct

**Test SMTP manually:**
```bash
# In backend directory
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'your-email@gmail.com',
  subject: 'Test',
  text: 'Test email'
}).then(console.log).catch(console.error);
"
```

## Environment Variables Reference

### Required (for sending emails)
- `SMTP_HOST` - SMTP server hostname
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password (use App Password)

### Optional
- `SMTP_PORT` - Default: 587
- `SMTP_SECURE` - Default: false (true for port 465)
- `SMTP_FROM` - Default: uses SMTP_USER

## Development vs Production

### Development (Optional)
If SMTP not configured:
- Emails logged to console only
- Verification links in terminal
- No actual emails sent

If SMTP configured:
- Real emails sent
- Same as production

### Production (Required)
Must configure SMTP:
- Real emails sent to users
- Professional email address recommended
- Use App Passwords for security

## Security Best Practices

### 1. Use App Passwords
Never use your actual email password. Always use App Passwords.

### 2. Environment Variables
Never commit SMTP credentials to git. Always use `.env.local`.

### 3. Secure Connection
Use TLS (port 587) or SSL (port 465), never plain text.

### 4. Rate Limiting
Gmail: 500 emails/day
Yahoo: 500 emails/day
Consider using a dedicated email service for high volume.

## Common SMTP Providers

### Gmail
- Host: `smtp.gmail.com`
- Port: 587 (TLS) or 465 (SSL)
- Requires: App Password
- Limit: 500 emails/day

### Yahoo
- Host: `smtp.mail.yahoo.com`
- Port: 587 (TLS) or 465 (SSL)
- Requires: App Password
- Limit: 500 emails/day

### Outlook/Hotmail
- Host: `smtp-mail.outlook.com`
- Port: 587 (TLS)
- Requires: Regular password
- Limit: 300 emails/day

### SendGrid (SMTP)
- Host: `smtp.sendgrid.net`
- Port: 587
- User: `apikey`
- Pass: Your SendGrid API key
- Limit: 100 emails/day (free)

### Mailgun (SMTP)
- Host: `smtp.mailgun.org`
- Port: 587
- User: Your Mailgun SMTP username
- Pass: Your Mailgun SMTP password
- Limit: 5,000 emails/month (free)

## Migration from Resend

No code changes needed! Just:

1. Remove Resend variables from `.env.local`
2. Add SMTP variables
3. Restart backend
4. Done!

## Summary

✅ **Works with any email provider**
✅ **No external service required**
✅ **Free (uses your email account)**
✅ **Optional in development** (console fallback)
✅ **Same code for dev and prod**
✅ **Secure with App Passwords**

**Without SMTP configured:**
- Emails logged to console
- Verification links in terminal
- Perfect for quick testing

**With SMTP configured:**
- Real emails sent to inbox
- Professional appearance
- Production-ready
