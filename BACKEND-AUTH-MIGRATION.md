# Backend Authentication Migration

## What Changed

Authentication (signup and signin) now happens through your backend API instead of directly from the frontend to Supabase. This gives you better control and eliminates redirect confusion.

## Benefits

1. **No More Redirect Issues** - Backend handles user creation, no email confirmation redirects
2. **Auto-Confirmed Accounts** - Users can sign in immediately after signup
3. **Centralized Control** - All auth logic in one place (backend)
4. **Better Security** - Service role key stays on backend only
5. **Consistent Experience** - Same flow for local and production

## How It Works Now

### Signup Flow
1. User submits signup form (frontend)
2. Frontend calls `POST /api/auth/signup` (backend)
3. Backend creates regular user (email_confirm: false, is_admin: false)
4. Backend sends verification email to user
5. User clicks verification link in email
6. User is redirected to `/auth/callback` which confirms email
7. User can now sign in with verified email

### Signin Flow
1. User submits login form (frontend)
2. Frontend calls `POST /api/auth/signin` (backend)
3. Backend verifies credentials and checks if user is active
4. Backend returns session tokens
5. Frontend sets session in Supabase client
6. User is authenticated

## New Backend Endpoints

### POST /api/auth/signup
Creates a new user account and sends verification email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe" // optional
}
```

**Response (Success):**
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

**Response (Error):**
```json
{
  "error": "Email already registered"
}
```

### POST /api/auth/signin
Authenticates a user and returns session tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid email or password"
}
```

## Frontend Changes

The frontend `AuthService` now calls backend endpoints instead of Supabase directly:

```typescript
// OLD (Direct Supabase)
await supabase.auth.signUp({ email, password })

// NEW (Via Backend)
await fetch(`${API_URL}/auth/signup`, {
  method: 'POST',
  body: JSON.stringify({ email, password, fullName })
})
```

## Supabase Configuration

You still need to configure redirect URLs in Supabase for:
- Password reset emails
- Email change confirmations
- Other auth flows

But signup/signin no longer use these redirects.

## Testing

### Local Development
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Try signing up - should work immediately
4. Try signing in - should work without redirects

### Production
1. Deploy backend to Vercel
2. Set `VITE_API_URL` in frontend Vercel environment variables
3. Deploy frontend
4. Test signup/signin - should work seamlessly

## Email Verification

New users must verify their email before signing in:

1. User signs up
2. Verification email is sent automatically
3. User clicks link in email
4. Email is verified
5. User can now sign in

### Email Configuration

Make sure these are set in Supabase Dashboard → Authentication → Email Templates:

- **Confirm signup** template is enabled
- Email provider is configured (SMTP or default)

### Redirect URL

The verification email redirects to `/auth/callback` which handles the verification.

Make sure this URL is in your Supabase Redirect URLs:
- Local: `http://localhost:5173/auth/callback`
- Production: `https://your-app.vercel.app/auth/callback`

## Migration Notes

- Existing users can still sign in (no data migration needed)
- New signups require email verification
- New users are created as regular users (is_admin: false)
- To make a user admin, update the `user_profiles` table directly in Supabase:
  ```sql
  UPDATE user_profiles SET is_admin = true WHERE email = 'admin@example.com';
  ```

## Troubleshooting

### "Failed to create account"
- Check backend logs in Vercel
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in backend environment variables
- Make sure backend is running

### "Failed to establish session"
- Check that backend returns valid session tokens
- Verify frontend can reach backend API
- Check CORS settings in backend

### Users can't sign in after signup
- Check if user verified their email (look for verification email in inbox/spam)
- Verify user's `email_confirmed_at` is set in Supabase Dashboard → Authentication → Users
- Check `user_profiles` table has entry for the user
- Try resending verification email

### Verification email not received
- Check spam/junk folder
- Verify email provider is configured in Supabase
- Check Supabase logs for email sending errors
- Make sure "Confirm signup" email template is enabled
