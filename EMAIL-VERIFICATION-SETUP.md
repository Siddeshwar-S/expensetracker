# Email Verification Setup Complete

## What Was Added

Email verification is now required for all new signups. Users must verify their email before they can sign in.

## Changes Made

### Backend
1. **`backend/app/api/auth/signup/route.ts`** - Updated to:
   - Create users with `email_confirm: false` (requires verification)
   - Send verification email automatically
   - Create regular users (not admins)

2. **`backend/app/api/auth/signin/route.ts`** - Updated to:
   - Check if email is verified before allowing signin
   - Show helpful error message if email not verified

### Frontend
1. **`src/pages/auth/callback.tsx`** - New page to handle email verification redirects
2. **`src/App.tsx`** - Added `/auth/callback` route
3. **`src/lib/auth-context.tsx`** - Updated signup message

### Environment Variables
Added to `backend/.env.local` and `backend/.env.example`:
```
NEXT_PUBLIC_SITE_URL=http://localhost:5173
```

## How It Works

1. **User signs up** → Account created (unverified)
2. **Verification email sent** → User receives email with link
3. **User clicks link** → Redirected to `/auth/callback`
4. **Email verified** → User can now sign in
5. **User signs in** → Backend checks email is verified

## Supabase Configuration Required

### 1. Email Templates
Go to Supabase Dashboard → Authentication → Email Templates

Make sure **"Confirm signup"** template is enabled and configured.

### 2. Redirect URLs
Go to Supabase Dashboard → Authentication → URL Configuration

Add these to **Redirect URLs**:
```
http://localhost:5173/auth/callback
https://your-app.vercel.app/auth/callback
```

### 3. Site URL
Set **Site URL** to your production domain:
```
https://your-app.vercel.app
```

## Testing Locally

1. Start backend:
   ```bash
   cd backend && npm run dev
   ```

2. Start frontend:
   ```bash
   npm run dev
   ```

3. Sign up with a real email address

4. Check your email for verification link

5. Click the link → Should redirect to `/auth/callback`

6. Try signing in → Should work after verification

## Production Deployment

### Backend Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_SECRET_KEY=your_secret_key
NEXT_PUBLIC_SITE_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app
NODE_ENV=production
```

### Frontend Environment Variables (Vercel)
```
VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ACCESS_KEY=your_access_key
VITE_API_URL=https://your-backend.vercel.app/api
```

## User Flow

### New User Signup
1. User fills signup form
2. Sees: "Account created. Please check your email to verify."
3. Receives verification email
4. Clicks link in email
5. Sees: "Email verified successfully. You can now sign in."
6. Signs in successfully

### Unverified User Tries to Sign In
1. User tries to sign in
2. Sees: "Please verify your email address before signing in."
3. Must check email and click verification link first

## Troubleshooting

### Verification email not received
- Check spam/junk folder
- Verify email provider configured in Supabase
- Check Supabase logs for email errors
- Make sure "Confirm signup" template is enabled

### Verification link doesn't work
- Check redirect URLs are configured in Supabase
- Verify `/auth/callback` route exists in frontend
- Check browser console for errors

### User can't sign in after verification
- Check `email_confirmed_at` in Supabase Dashboard → Authentication → Users
- Should have a timestamp after verification
- If null, email wasn't verified properly

## Making a User Admin

Users are created as regular users. To make someone admin:

```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

Or in Supabase Dashboard:
1. Go to Table Editor → `user_profiles`
2. Find user by email
3. Set `is_admin` to `true`
