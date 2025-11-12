# Custom Email Verification - No Manual Supabase Configuration Needed!

## Overview

The email verification system is now fully automated in the backend. You don't need to manually configure Supabase email templates or redirect URLs - everything is handled programmatically!

## What's Automated

✅ **Custom email templates** - Beautiful HTML emails generated in code
✅ **Verification links** - Generated programmatically via Supabase Admin API
✅ **Email sending** - Handled by backend (logs to console in dev, integrates with email service in prod)
✅ **Resend functionality** - Users can request new verification emails

## How It Works

### 1. Signup Flow
```
User signs up
    ↓
Backend creates user (unverified)
    ↓
Backend generates verification link
    ↓
Backend sends custom HTML email
    ↓
User clicks link in email
    ↓
Redirects to /auth/callback
    ↓
Email verified ✓
```

### 2. Development Mode
In development, emails are logged to the console instead of being sent:

```bash
=== EMAIL SENT ===
To: user@example.com
Subject: Verify Your Email - Finance Tracker
Body: [HTML content with verification link]
==================
```

**Copy the verification link from the console and paste it in your browser to test!**

### 3. Production Mode
For production, integrate with an email service (SendGrid, Resend, AWS SES, etc.)

## Setup Instructions

### Local Development (No Configuration Needed!)

1. **Start backend:**
   ```bash
   cd backend && npm run dev
   ```

2. **Start frontend:**
   ```bash
   npm run dev
   ```

3. **Sign up with any email** (doesn't need to be real in dev)

4. **Check backend console** for the verification link

5. **Copy and paste the link** in your browser

6. **Sign in** - Should work after verification!

### Production Setup

#### Step 1: Choose an Email Service

Pick one of these email services:

**Option A: Resend (Recommended - Simple & Free tier)**
```bash
npm install resend --prefix backend
```

**Option B: SendGrid**
```bash
npm install @sendgrid/mail --prefix backend
```

**Option C: AWS SES**
```bash
npm install @aws-sdk/client-ses --prefix backend
```

#### Step 2: Update Email Service Code

Edit `backend/lib/email.ts`:

**For Resend:**
```typescript
import { Resend } from 'resend';

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'development') {
      // ... existing dev code
    }

    // Production: Use Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
```

**For SendGrid:**
```typescript
import sgMail from '@sendgrid/mail';

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'development') {
      // ... existing dev code
    }

    // Production: Use SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    await sgMail.send({
      from: 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
```

#### Step 3: Add Environment Variables

**Backend `.env.local` (for Resend):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Backend Vercel Environment Variables:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://your-frontend.vercel.app
```

#### Step 4: Configure Your Domain (Optional but Recommended)

For production emails to work reliably:

1. Add your domain to your email service (Resend/SendGrid)
2. Add DNS records (SPF, DKIM, DMARC)
3. Update `from` email in `backend/lib/email.ts` to use your domain

## API Endpoints

### POST /api/auth/signup
Creates user and sends verification email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "requiresVerification": true
}
```

### POST /api/auth/resend-verification
Resends verification email to unverified users.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}
```

## Email Template

The custom email template includes:
- Beautiful gradient header
- Personalized greeting
- Clear call-to-action button
- Fallback link for copy/paste
- Professional styling
- Mobile responsive

You can customize it in `backend/lib/email.ts` → `generateVerificationEmail()`

## Testing

### Local Testing
1. Sign up with any email
2. Check backend console for verification link
3. Copy link and open in browser
4. Verify email is confirmed
5. Sign in successfully

### Production Testing
1. Sign up with real email
2. Check inbox (and spam folder)
3. Click verification link
4. Sign in successfully

## Troubleshooting

### Email not showing in console (dev)
- Check backend is running
- Look for "=== EMAIL SENT ===" in terminal
- Make sure `NODE_ENV` is not set to "production"

### Verification link doesn't work
- Check link hasn't expired (24 hours)
- Verify `/auth/callback` route exists in frontend
- Check browser console for errors

### Production emails not sending
- Verify email service API key is correct
- Check email service dashboard for errors
- Ensure domain is verified (if using custom domain)
- Check Vercel logs for email sending errors

### User still can't sign in after verification
- Check `email_confirmed_at` in Supabase Dashboard
- Try resending verification email
- Check backend logs for signin errors

## Benefits of This Approach

✅ **No manual Supabase configuration** - Everything is code
✅ **Custom email design** - Full control over email appearance
✅ **Easy testing** - Console logging in development
✅ **Flexible** - Switch email providers easily
✅ **Resend functionality** - Built-in resend endpoint
✅ **Production ready** - Just add email service API key

## Next Steps

1. ✅ Test locally (emails log to console)
2. ✅ Choose email service for production
3. ✅ Add email service integration
4. ✅ Deploy to Vercel
5. ✅ Test with real emails
