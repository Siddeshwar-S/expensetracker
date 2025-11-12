# Fix Redirect URL - Goes to Wrong Port

## Problem

Email verification redirects to `http://localhost:8080` instead of your app's URL.

## Root Cause

Your Supabase Dashboard has the wrong Site URL configured.

## Quick Fix

### Step 1: Update Supabase Site URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qioipnpbecxnmmlymxet)
2. Navigate to: **Authentication** → **URL Configuration**
3. Change **Site URL** from:
   ```
   http://localhost:8080
   ```
   To:
   ```
   http://localhost:5173
   ```
   (Or your production URL if deploying)

4. Click **Save**

### Step 2: Update Redirect URLs

Make sure these are in your **Redirect URLs** list:
```
http://localhost:5173/**
http://localhost:8080/**
http://localhost:4173/**
https://your-production-domain.vercel.app/**
https://*.vercel.app/**
```

### Step 3: Test Again

1. Sign up with a new email
2. Check email for verification link
3. Click link
4. Should now redirect to `http://localhost:5173` (your app)

## What Changed in Code

The code now redirects to the home page (`/`) instead of `/auth/callback`:

```typescript
// Before
emailRedirectTo: `${window.location.origin}/auth/callback`

// After
emailRedirectTo: window.location.origin
```

This means after email verification, users go directly to your home page.

## How It Works Now

### Email Verification Flow
```
1. User signs up
2. Receives verification email
3. Clicks link in email
4. Supabase verifies email
5. Redirects to home page (/)
6. User is automatically signed in
7. App shows dashboard
```

### Password Reset Flow
```
1. User requests password reset
2. Receives reset email
3. Clicks link in email
4. Supabase validates token
5. Redirects to home page (/)
6. User can set new password
```

## Why Port 8080?

Supabase uses the **Site URL** from your dashboard as the default redirect. If you previously had your app running on port 8080, that's what got saved.

**Fix:** Update Site URL to match your current setup.

## For Production

When deploying to production:

1. Update **Site URL** to:
   ```
   https://your-app.vercel.app
   ```

2. Keep all redirect URLs (including localhost for local dev)

3. Deploy and test

## Summary

✅ **Changed redirect** - Now goes to home page instead of `/auth/callback`
✅ **No 404 errors** - Home page always exists
✅ **Simpler flow** - No need for callback route
⚠️ **Update Supabase** - Change Site URL to correct port

After updating Supabase Site URL, everything will work!
