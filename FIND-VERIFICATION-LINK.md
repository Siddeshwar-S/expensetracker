# How to Find Verification Link in Development

## Where to Look

The verification email is **NOT sent to your actual email** in development mode. Instead, it's **printed in the backend terminal**.

## Step-by-Step Guide

### 1. Make Sure Backend is Running
```bash
cd backend
npm run dev
```

### 2. Sign Up with Any Email
```
Email: test@example.com  # Can be fake email in dev
Password: test123
Name: Test User
```

### 3. Check Backend Terminal
After clicking "Sign Up", look at your **backend terminal** (where you ran `npm run dev`).

You should see a box like this:

```
╔════════════════════════════════════════════════════════════════╗
║                    📧 VERIFICATION EMAIL                       ║
╠════════════════════════════════════════════════════════════════╣
║ To: test@example.com                                           ║
║ Subject: Verify Your Email - Finance Tracker                   ║
╠════════════════════════════════════════════════════════════════╣
║ 🔗 VERIFICATION LINK (Copy and paste in browser):             ║
╠════════════════════════════════════════════════════════════════╣
║ http://localhost:5173/auth/callback#access_token=eyJ...        ║
╚════════════════════════════════════════════════════════════════╝
```

### 4. Copy the Verification Link
- Copy the entire link from the backend terminal
- Paste it in your browser
- Press Enter

### 5. Email Will Be Verified
You should see:
- "Email verified successfully"
- Redirect to login page
- Now you can sign in!

## Troubleshooting

### Issue: No Email Box in Terminal
**Check:**
1. Backend is running (`cd backend && npm run dev`)
2. You signed up (not signed in)
3. Look for the box with `📧 VERIFICATION EMAIL`
4. Scroll up in terminal if needed

### Issue: Link Not Working
**Try:**
1. Copy the ENTIRE link (it's very long)
2. Make sure it starts with `http://localhost:5173/auth/callback`
3. Make sure frontend is running (`npm run dev`)
4. Check browser console for errors

### Issue: Link Expired
**Solution:**
1. Sign up again with same email
2. Backend will delete old user and create new one
3. Get new verification link from terminal
4. Use new link within 24 hours

## For Production

In production, you need to configure a real email service:

### Option 1: Resend (Recommended)
```bash
npm install resend --prefix backend
```

Update `backend/lib/email.ts`:
```typescript
import { Resend } from 'resend';

export async function sendEmail(options: EmailOptions) {
  if (process.env.NODE_ENV === 'production') {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  }
  // ... dev code
}
```

Add to Vercel environment variables:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Option 2: SendGrid
```bash
npm install @sendgrid/mail --prefix backend
```

Update `backend/lib/email.ts`:
```typescript
import sgMail from '@sendgrid/mail';

export async function sendEmail(options: EmailOptions) {
  if (process.env.NODE_ENV === 'production') {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    await sgMail.send({
      from: 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  }
  // ... dev code
}
```

Add to Vercel environment variables:
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

## Quick Test

### Test Signup Flow
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev

# Browser:
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Enter any email (doesn't need to be real)
4. Submit form
5. Check backend terminal for verification link
6. Copy link and paste in browser
7. Should see "Email verified"
8. Sign in with same credentials
```

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User fills signup form                                  │
│     ↓                                                        │
│  2. Frontend sends to backend                               │
│     ↓                                                        │
│  3. Backend creates user                                    │
│     ↓                                                        │
│  4. Backend generates verification link                     │
│     ↓                                                        │
│  5. Backend prints link to TERMINAL ← LOOK HERE!           │
│     ↓                                                        │
│  6. You copy link from terminal                             │
│     ↓                                                        │
│  7. You paste link in browser                               │
│     ↓                                                        │
│  8. Email verified! ✓                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Common Mistakes

❌ **Looking for email in inbox** - Won't work in dev mode
❌ **Checking spam folder** - Won't work in dev mode
❌ **Waiting for email** - It's instant in terminal
❌ **Using real email** - Not needed in dev mode

✅ **Check backend terminal** - This is where the link is!
✅ **Use any email** - test@test.com works fine
✅ **Copy entire link** - It's very long
✅ **Paste in browser** - Should work immediately

## Summary

**In Development:**
- Emails are NOT sent
- Links are printed in backend terminal
- Look for the box with 📧
- Copy the link and paste in browser

**In Production:**
- Configure email service (Resend/SendGrid)
- Real emails will be sent
- Users receive emails in their inbox
- Links work the same way
