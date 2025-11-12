# Authentication Debug Guide

## Errors You're Seeing

1. **401 Unauthorized** on `/api/payment-methods`, `/api/categories`, `/api/transactions`
   - Backend can't verify your auth token
   
2. **406 Not Acceptable** on Supabase direct calls
   - Missing or invalid auth headers

## Root Cause

After signing in through the backend, the session needs to be properly set in the Supabase client so that:
1. Frontend can make authenticated requests to backend
2. Frontend can make authenticated requests to Supabase directly

## What I Fixed

### 1. Backend Signin Response
Updated to return clean session data:
```typescript
return NextResponse.json({
  success: true,
  session: {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    expires_at: data.session.expires_at,
    token_type: data.session.token_type,
  },
  user: { ... }
});
```

### 2. Frontend Session Handling
Added debugging to see what's happening:
```typescript
console.log('Backend signin response:', result);
console.log('Session established successfully:', data.session);
```

## Testing Steps

### 1. Clear Everything
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

### 2. Sign In Again
1. Open browser DevTools (F12)
2. Go to Console tab
3. Sign in with your credentials
4. Watch for these logs:
   ```
   Backend signin response: { success: true, session: {...}, user: {...} }
   Session established successfully: { access_token: "...", ... }
   ```

### 3. Check Session
```javascript
// In browser console, run:
const { data } = await supabase.auth.getSession();
console.log('Current session:', data.session);

// Should show:
// {
//   access_token: "eyJ...",
//   refresh_token: "...",
//   expires_at: 1234567890
// }
```

### 4. Test API Calls
After successful signin, the API calls should work:
```javascript
// In browser console:
const token = (await supabase.auth.getSession()).data.session?.access_token;
console.log('Token:', token);

// Test backend API:
fetch('http://localhost:4000/api/categories', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

## Common Issues

### Issue 1: Session Not Persisting
**Symptom:** Session works but disappears on refresh

**Solution:** Check Supabase client configuration
```typescript
// src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,  // ← Make sure this is true
    detectSessionInUrl: true
  }
})
```

### Issue 2: Token Not Being Sent
**Symptom:** 401 errors even with valid session

**Check:** API client is getting token
```typescript
// src/lib/api-client.ts
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Getting token, session:', session); // Add this
  return session?.access_token || null;
}
```

### Issue 3: Backend Can't Verify Token
**Symptom:** Backend logs show "Auth verification error"

**Check:** Backend has correct Supabase URL and keys
```bash
# backend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Must be service_role key, not anon key
```

### Issue 4: CORS Errors
**Symptom:** Network errors when calling backend

**Solution:** Update ALLOWED_ORIGINS in backend
```bash
# backend/.env.local
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

## Debugging Checklist

- [ ] Backend is running (`cd backend && npm run dev`)
- [ ] Frontend is running (`npm run dev`)
- [ ] Cleared browser storage
- [ ] Signed in successfully
- [ ] Console shows "Session established successfully"
- [ ] `supabase.auth.getSession()` returns valid session
- [ ] Session has `access_token` and `refresh_token`
- [ ] API calls include `Authorization: Bearer <token>` header
- [ ] Backend `.env.local` has correct Supabase credentials
- [ ] Backend `ALLOWED_ORIGINS` includes frontend URL

## Quick Fix Commands

### Clear and Restart
```bash
# Terminal 1: Restart backend
cd backend
rm -rf .next
npm run dev

# Terminal 2: Restart frontend
rm -rf node_modules/.vite
npm run dev

# Browser: Clear storage and refresh
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check Backend Auth
```bash
# In backend terminal, you should see:
# POST /api/auth/signin 200
# GET /api/categories 200  ← Should be 200, not 401
```

### Check Frontend Session
```javascript
// Browser console:
const session = await supabase.auth.getSession();
console.log('Session valid:', !!session.data.session);
console.log('Token:', session.data.session?.access_token?.substring(0, 20) + '...');
```

## Expected Flow

1. **User signs in**
   ```
   Frontend → POST /api/auth/signin → Backend
   Backend → Verify credentials → Supabase
   Backend → Return session tokens → Frontend
   Frontend → Set session in Supabase client
   ```

2. **User makes API call**
   ```
   Frontend → Get token from Supabase session
   Frontend → Add Authorization header
   Frontend → Call backend API
   Backend → Verify token with Supabase
   Backend → Return data
   ```

3. **User makes direct Supabase call**
   ```
   Frontend → Supabase client uses stored session
   Supabase → Verify token
   Supabase → Return data
   ```

## Still Not Working?

If you're still seeing 401 errors after following all steps:

1. **Check browser console** for any error messages
2. **Check backend logs** for auth verification errors
3. **Verify email is confirmed** in Supabase Dashboard
4. **Check user is active** in `user_profiles` table
5. **Try signing out and in again**
6. **Check if token is expired** (expires_at timestamp)

Run this in browser console for full debug info:
```javascript
const { data } = await supabase.auth.getSession();
console.log('=== AUTH DEBUG ===');
console.log('Has session:', !!data.session);
console.log('Access token:', data.session?.access_token?.substring(0, 30) + '...');
console.log('Expires at:', new Date(data.session?.expires_at * 1000));
console.log('Is expired:', data.session?.expires_at < Date.now() / 1000);
console.log('User ID:', data.session?.user?.id);
console.log('Email:', data.session?.user?.email);
```
