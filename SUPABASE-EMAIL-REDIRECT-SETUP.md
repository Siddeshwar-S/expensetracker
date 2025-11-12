# Supabase Email Redirect Configuration

## The Issue

Supabase email templates use the redirect URL configured in your Supabase Dashboard, not from environment variables in your code. This means you need to configure it properly for both dev and prod.

## Solution: Use Wildcard Redirects

### Step 1: Configure Redirect URLs in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qioipnpbecxnmmlymxet)
2. Navigate to: **Authentication** → **URL Configuration**

3. Set **Site URL** (primary redirect):
   ```
   https://your-production-domain.vercel.app
   ```

4. Add **Redirect URLs** (whitelist for all environments):
   ```
   http://localhost:5173/**
   http://localhost:8080/**
   http://localhost:4173/**
   https://your-production-domain.vercel.app/**
   https://*.vercel.app/**
   ```

The `**` wildcard allows all paths under that domain.
The `*.vercel.app` allows all Vercel preview deployments.

### Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Click on **"Confirm signup"** template

3. The template uses this variable for redirect:
   ```
   {{ .SiteURL }}
   ```

This automatically uses:
- **Site URL** for email links (your production domain)
- But allows redirects to any URL in the **Redirect URLs** list

### Step 3: How It Works

When a user clicks the verification link:
1. Link goes to Supabase first
2. Supabase verifies the token
3. Supabase redirects to the URL where the signup originated
4. As long as that URL is in the Redirect URLs list, it works

**Example:**
- User signs up on `http://localhost:5173` → Redirects to `http://localhost:5173`
- User signs up on `https://your-app.vercel.app` → Redirects to `https://your-app.vercel.app`

## Dynamic Redirect (Advanced)

If you want more control, you can pass a custom redirect URL during signup:

<function_calls>
<invoke name="strReplace">
<parameter name="oldStr">  // Sign up new user (direct Supabase)
  static async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!data.user) {
        return { data: null, error: 'Failed to create user', success: false };
      }

      return { data: data.user, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }