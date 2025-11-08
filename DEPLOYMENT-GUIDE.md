# Vercel Deployment Guide

## Quick Fix for Your Current Error

Your production app is trying to connect to `localhost:4000` because that URL was built into your bundle. Here's how to fix it:

### Step 1: Deploy Backend First

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New Project"
3. Import your repository
4. Set **Root Directory** to `backend`
5. Add these environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpb2lwbnBiZWN4bm1tbHlteGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTM5NTcsImV4cCI6MjA3NzU4OTk1N30.DddDYlOmBW8454_Kq8qg1nQWYg3M50yD8dflDBse080
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpb2lwbnBiZWN4bm1tbHlteGV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAxMzk1NywiZXhwIjoyMDc3NTg5OTU3fQ.iwklqwAnfs0m1uw6_i8PpcZykPfEm76YnGcfHUyBoU0
API_SECRET_KEY=siddeshwar10_secret_key_2024
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
```

6. Deploy and copy the backend URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Update Frontend Environment Variables

1. Go to your frontend Vercel project settings
2. Go to Settings → Environment Variables
3. Add/Update these variables:

```
VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpb2lwbnBiZWN4bm1tbHlteGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTM5NTcsImV4cCI6MjA3NzU4OTk1N30.DddDYlOmBW8454_Kq8qg1nQWYg3M50yD8dflDBse080
VITE_ACCESS_KEY=siddeshwar10
VITE_API_URL=https://your-backend-url.vercel.app/api
```

**IMPORTANT:** Replace `https://your-backend-url.vercel.app` with your actual backend URL from Step 1

### Step 3: Redeploy Frontend

1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Make sure it uses the new environment variables

### Step 4: Update Backend ALLOWED_ORIGINS

1. Go back to backend Vercel project
2. Settings → Environment Variables
3. Update `ALLOWED_ORIGINS` with your actual frontend URL:
   ```
   ALLOWED_ORIGINS=https://your-actual-frontend.vercel.app
   ```
4. Redeploy backend

## Project Structure

You need **TWO separate Vercel projects**:

1. **Frontend Project** - Root directory (/)
2. **Backend Project** - Backend directory (/backend)

## Environment Variables Summary

### Frontend (.env for local, Vercel settings for production)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_ACCESS_KEY` - Your custom access key
- `VITE_API_URL` - Backend API URL (localhost for dev, Vercel URL for prod)

### Backend (backend/.env.local for local, Vercel settings for production)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `API_SECRET_KEY` - Your API secret key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed frontend URLs
- `NODE_ENV` - Set to "production" for Vercel

## Troubleshooting

### Still getting localhost:4000 errors?
- Make sure you added `VITE_API_URL` to Vercel environment variables
- Redeploy the frontend after adding the variable
- Clear your browser cache

### CORS errors?
- Update `ALLOWED_ORIGINS` in backend with your actual frontend URL
- Redeploy backend after updating

### Backend not responding?
- Check backend deployment logs in Vercel
- Test backend health endpoint: `https://your-backend.vercel.app/api/health`
