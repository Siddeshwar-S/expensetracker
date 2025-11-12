# Resend Email Setup - Same for Dev & Prod

## Overview

The email system now works the same way in both development and production using Resend. You can optionally configure it for development, or just use it in production.

## How It Works

### Without Resend API Key (Development Default)
- Emails are logged to backend console
- No actual emails sent
- Verification links printed in terminal
- Free and instant testing

### With Resend API Key (Optional Dev, Required Prod)
- Real emails sent to inbox
- Works in both development and production
- Same code, same behavior
- Free tier: 100 emails/day, 3,000/month

## Quick Setup (5 Minutes)

### Step 1: Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up (free account)
3. Go to [API Keys](https://resend.com/api-keys)
4. Click "Create API Key"
5. Name it: "Finance Tracker"
6. Copy the key (starts with `re_`)

### Step 2: Add to Environment Variables

**For Local Development (Optional):**
```bash
# backend/.env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
```

**For Production (Required):**
```bash
# Vercel → Backend Project → Settings → Environment Variables
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
```

### Step 3: Test It

**Without API Key:**
```bash
# Sign up → Check backend terminal for link
```

**With API Key:**
```bash
# Sign up → Check your email inbox
```

That's it! ✅

## Resend Free Tier

Perfect for personal projects:
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ No credit card required
- ✅ Custom domain support
- ✅ Email analytics

## Email From Address

### Default (No Setup Required)
```
EMAIL_FROM=onboarding@resend.dev
```
- Works immediately
- Shows "via resend.dev" in email
- Good for testing

### Custom Domain (Recommended for Production)
```
EMAIL_FROM=noreply@yourdomain.com
```

**Setup:**
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain: `yourdomain.com`
4. Add DNS records (SPF, DKIM, DMARC)
5. Wait for verification (usually 5-10 minutes)
6. Update `EMAIL_FROM` in environment variables

## Testing

### Test Without API Key (Console Only)
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev

# Browser: Sign up
# Check backend terminal for verification link
```

### Test With API Key (Real Email)
```bash
# Add RESEND_API_KEY to backend/.env.local
# Restart backend
cd backend && npm run dev

# Sign up with your real email
# Check your inbox (and spam folder)
```

## Troubleshooting

### Issue: No Email Received

**Check 1: API Key Set?**
```bash
# backend/.env.local should have:
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Check 2: Backend Logs**
```bash
# Backend terminal should show:
✅ Email sent successfully via Resend: abc123
# or
❌ Resend API error: ...
```

**Check 3: Spam Folder**
- Check spam/junk folder
- Mark as "Not Spam"
- Add sender to contacts

**Check 4: Resend Dashboard**
- Go to [Resend Logs](https://resend.com/emails)
- Check if email was sent
- Check delivery status

### Issue: API Key Invalid

**Error:** `❌ Resend API error: Invalid API key`

**Fix:**
1. Check API key is correct (starts with `re_`)
2. No extra spaces or quotes
3. Restart backend after adding key

### Issue: Rate Limit Exceeded

**Error:** `❌ Resend API error: Rate limit exceeded`

**Fix:**
- Free tier: 100 emails/day
- Wait 24 hours or upgrade plan
- Use console-only mode for testing

### Issue: Email Bounced

**Check:**
- Email address is valid
- Domain accepts emails
- Not a disposable email service

## Development Workflow

### Option 1: Console Only (Fastest)
```bash
# Don't set RESEND_API_KEY
# Links printed to console
# Copy/paste to test
```

### Option 2: Real Emails (Most Realistic)
```bash
# Set RESEND_API_KEY
# Real emails sent
# Test like production
```

## Production Deployment

### Vercel Setup

1. **Deploy Backend**
   ```bash
   # Vercel → Backend Project → Settings → Environment Variables
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com  # or onboarding@resend.dev
   NEXT_PUBLIC_SITE_URL=https://your-frontend.vercel.app
   ```

2. **Deploy Frontend**
   ```bash
   # Vercel → Frontend Project → Settings → Environment Variables
   VITE_API_URL=https://your-backend.vercel.app/api
   ```

3. **Test**
   - Sign up on production
   - Check email inbox
   - Click verification link
   - Should work! ✅

## Email Template Customization

The email template is in `backend/lib/email.ts`:

```typescript
export function generateVerificationEmail(
  email: string,
  verificationUrl: string,
  fullName?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <!-- Customize this HTML -->
    </html>
  `;
}
```

You can customize:
- Colors and styling
- Logo and branding
- Text and copy
- Button design
- Footer content

## Cost Comparison

### Resend (Recommended)
- Free: 3,000 emails/month
- Pro: $20/month for 50,000 emails
- Simple API, great docs

### SendGrid
- Free: 100 emails/day
- Essentials: $20/month for 50,000 emails
- More complex setup

### AWS SES
- $0.10 per 1,000 emails
- Requires AWS account
- More configuration needed

## Migration from Console to Resend

No code changes needed! Just:

1. Add `RESEND_API_KEY` to environment
2. Restart backend
3. Emails now sent for real

To go back to console-only:
1. Remove `RESEND_API_KEY`
2. Restart backend
3. Back to console logging

## Summary

✅ **Same code for dev and prod**
✅ **Optional in development** (console fallback)
✅ **Required in production** (real emails)
✅ **Free tier available** (3,000 emails/month)
✅ **5-minute setup** (just add API key)
✅ **No package installation** (uses fetch API)

**Without API Key:**
- Emails logged to console
- Verification links in terminal
- Perfect for quick testing

**With API Key:**
- Real emails sent to inbox
- Same behavior everywhere
- Production-ready
