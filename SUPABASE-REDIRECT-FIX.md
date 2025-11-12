# Fix Supabase Authentication Redirect

## Problem
Supabase is redirecting to `localhost:3000` after authentication, but your app runs on a different port. You're using the same Supabase instance for both local development and production.

## Solution - One Supabase for Local + Production

### 1. Update Supabase Dashboard Settings

Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/qioipnpbecxnmmlymxet):

1. Navigate to: **Authentication** → **URL Configuration**

2. **Site URL** - Set to your PRIMARY production URL:
   ```
   https://your-app.vercel.app
   ```
   (Replace with your actual Vercel URL once deployed)

3. **Redirect URLs** - Add ALL these URLs (one per line):
   ```
   http://localhost:5173/**
   http://localhost:8080/**
   http://localhost:8082/**
   http://localhost:4173/**
   https://your-app.vercel.app/**
   https://*.vercel.app/**
   ```

   The `**` wildcard allows all paths under that domain.
   The `*.vercel.app` allows all Vercel preview deployments.

4. Click **Save**

### 2. How It Works

- **Site URL**: The default redirect when no specific redirect is provided (use production URL)
- **Redirect URLs**: Whitelist of ALL allowed redirect URLs (local + production)
- Supabase will redirect to whichever URL the auth request came from, as long as it's in the whitelist

### 3. Update Your Code (Already Done)

The Supabase client is already configured to detect sessions in URLs:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### 4. Test Authentication

**Local Development:**
1. Clear your browser cookies/cache
2. Run `npm run dev` (should start on localhost:5173)
3. Try signing up or logging in
4. You should be redirected back to localhost:5173

**Production:**
1. Deploy to Vercel
2. Update the Site URL in Supabase to your actual Vercel URL
3. Test authentication on production
4. You should be redirected back to your production URL

## Common Issues

### Still redirecting to localhost:3000?
- Make sure you saved the changes in Supabase Dashboard
- Clear browser cache and cookies completely
- Wait 30 seconds for changes to propagate
- Check that `http://localhost:5173/**` is in the Redirect URLs list

### Local works but production doesn't?
- Make sure your production URL is in the Redirect URLs list
- Update Site URL to your production domain
- Include the `/**` wildcard: `https://your-app.vercel.app/**`

### Vercel preview deployments not working?
- Add `https://*.vercel.app/**` to Redirect URLs
- This allows all Vercel preview URLs

### Email confirmation links going to wrong URL?
- The Site URL determines where email links go
- Set it to your production URL for production emails
- For local testing, temporarily change it to `http://localhost:5173`

## Best Practice

**Site URL**: Always set to your production URL
**Redirect URLs**: Include all environments (local, staging, production, previews)

This way:
- Email links go to production (Site URL)
- Auth redirects work everywhere (Redirect URLs whitelist)
- Same Supabase instance works for all environments
