# Dynamic Redirect URL Configuration

## Overview

Your app now uses dynamic redirect URLs that automatically work in both development and production without hardcoding domains.

## How It Works

### Signup
```typescript
const redirectUrl = `${window.location.origin}/auth/callback`;
// Dev:  http://localhost:5173/auth/callback
// Prod: https://your-app.vercel.app/auth/callback
```

### Password Reset
```typescript
const redirectUrl = `${window.location.origin}/reset-password`;
// Dev:  http://localhost:5173/reset-password
// Prod: https://your-app.vercel.app/reset-password
```

## Supabase Configuration Required

Even though your code uses dynamic URLs, you still need to whitelist them in Supabase.

### Step 1: Configure Redirect URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qioipnpbecxnmmlymxet)
2. Navigate to: **Authentication** → **URL Configuration**

3. **Site URL** (primary):
   ```
   https://your-production-domain.vercel.app
   ```

4. **Redirect URLs** (whitelist):
   ```
   http://localhost:5173/**
   http://localhost:8080/**
   http://localhost:4173/**
   https://your-production-domain.vercel.app/**
   https://*.vercel.app/**
   ```

### Why Both?

- **Site URL**: Default redirect for email links
- **Redirect URLs**: Whitelist of allowed redirects
- **Your code**: Dynamically chooses the right URL from the whitelist

## How It Works in Different Environments

### Local Development
```
User signs up on: http://localhost:5173
Code sets redirect: http://localhost:5173/auth/callback
Supabase checks: Is this in whitelist? ✅ Yes (http://localhost:5173/**)
Redirects to: http://localhost:5173/auth/callback
```

### Production
```
User signs up on: https://your-app.vercel.app
Code sets redirect: https://your-app.vercel.app/auth/callback
Supabase checks: Is this in whitelist? ✅ Yes (https://your-app.vercel.app/**)
Redirects to: https://your-app.vercel.app/auth/callback
```

### Vercel Preview Deployments
```
User signs up on: https://your-app-git-feature-user.vercel.app
Code sets redirect: https://your-app-git-feature-user.vercel.app/auth/callback
Supabase checks: Is this in whitelist? ✅ Yes (https://*.vercel.app/**)
Redirects to: https://your-app-git-feature-user.vercel.app/auth/callback
```

## No Environment Variables Needed!

The code automatically detects the current domain using `window.location.origin`:

```typescript
// No need for this:
// const redirectUrl = import.meta.env.VITE_APP_URL + '/auth/callback';

// Just use this:
const redirectUrl = `${window.location.origin}/auth/callback`;
```

**Benefits:**
- ✅ Works in dev automatically
- ✅ Works in prod automatically
- ✅ Works in preview deployments automatically
- ✅ No environment variables to manage
- ✅ No hardcoded URLs

## Testing

### Test in Development
1. Run app: `npm run dev`
2. Sign up with email
3. Check email for verification link
4. Click link → Should redirect to `http://localhost:5173/auth/callback`

### Test in Production
1. Deploy to Vercel
2. Sign up with email
3. Check email for verification link
4. Click link → Should redirect to `https://your-app.vercel.app/auth/callback`

## Troubleshooting

### Error: "Invalid redirect URL"

**Cause:** URL not in Supabase whitelist

**Fix:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add the URL to Redirect URLs
3. Make sure to include `/**` at the end

### Email link goes to wrong domain

**Cause:** Site URL is set incorrectly

**Fix:**
1. Set Site URL to your production domain
2. Add all other domains to Redirect URLs
3. The code will handle the rest

### Preview deployments not working

**Cause:** Vercel preview URLs not whitelisted

**Fix:**
Add this to Redirect URLs:
```
https://*.vercel.app/**
```

This allows all Vercel preview deployments.

## Summary

✅ **No hardcoded URLs** - Uses `window.location.origin`
✅ **Works everywhere** - Dev, prod, preview deployments
✅ **No env variables** - Automatically detects domain
✅ **Simple setup** - Just configure Supabase whitelist once

The redirect URL is now fully dynamic and will work in any environment!
