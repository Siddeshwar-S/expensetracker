# Debug 403 Forbidden Error

## Common Causes

### 1. Backend Not Running
**Symptom:** 403 or connection refused errors

**Fix:**
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Should see:
# ▲ Next.js 14.x.x
# - Local: http://localhost:4000
# ✓ Ready in X.Xs
```

### 2. CORS Issues
**Symptom:** 403 Forbidden on API calls

**Check:** `backend/.env.local` has correct origins
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

### 3. Email Not Showing
**Symptom:** No email in console or inbox

**Check Backend Terminal:**
After signup, you should see:
```
╔════════════════════════════════════════════════════════════════╗
║                    📧 VERIFICATION EMAIL                       ║
╠════════════════════════════════════════════════════════════════╣
║ To: user@example.com                                           ║
║ Subject: Verify Your Email - Finance Tracker                   ║
╠════════════════════════════════════════════════════════════════╣
║ 🔗 VERIFICATION LINK:                                         ║
╠════════════════════════════════════════════════════════════════╣
║ http://localhost:5173/auth/callback#access_token=...          ║
╚════════════════════════════════════════════════════════════════╝
```

## Step-by-Step Debug

### Step 1: Check Backend is Running

```bash
# In terminal where you ran backend
# Should see "Ready" message
# If not, start it:
cd backend
npm run dev
```

### Step 2: Check Backend Health

Open browser and go to:
```
http://localhost:4000/api/health
```

Should see:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

If you see error or nothing, backend isn't running properly.

### Step 3: Check Frontend API URL

Open browser console (F12) and run:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

Should show:
```
API URL: http://localhost:4000/api
```

### Step 4: Test Signup

1. Open browser console (F12)
2. Go to Network tab
3. Try signing up
4. Look for failed requests (red)
5. Click on failed request
6. Check:
   - Request URL
   - Status code
   - Response

### Step 5: Check Backend Logs

After signup attempt, check backend terminal for:
- Any error messages
- The email box (should appear)
- Any warnings

## Quick Fixes

### Fix 1: Restart Everything

```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

# Clear caches
cd backend
rm -rf .next

cd ..
rm -rf node_modules/.vite

# Restart backend
cd backend
npm run dev

# Restart frontend (new terminal)
npm run dev
```

### Fix 2: Check Environment Variables

**Backend `.env.local`:**
```bash
cat backend/.env.local

# Should have:
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
API_SECRET_KEY=siddeshwar10_secret_key_2024
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:5173
```

**Frontend `.env`:**
```bash
cat .env

# Should have:
VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ACCESS_KEY=siddeshwar10
VITE_API_URL=http://localhost:4000/api
```

### Fix 3: Check Port Conflicts

```bash
# Check if port 4000 is in use
lsof -i :4000

# If something else is using it, kill it:
kill -9 <PID>

# Or change backend port in backend/.env.local:
PORT=4001
```

### Fix 4: Check CORS

If you see CORS errors in console:

**Update `backend/.env.local`:**
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:8082,http://localhost:4173
```

Restart backend after changing.

## Specific Error Messages

### "Failed to load resource: 403 (Forbidden)"

**Possible causes:**
1. Backend not running
2. Wrong API URL
3. CORS not configured
4. Auth token invalid

**Debug:**
```javascript
// Browser console
fetch('http://localhost:4000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### "No email in console"

**Check:**
1. Backend terminal (not frontend!)
2. Scroll up in terminal
3. Look for the box with 📧
4. Make sure you signed up (not signed in)

**If still not showing:**
```bash
# Check backend logs for errors
# Should see:
# POST /api/auth/signup 200
# [Email box should appear here]
```

### "Email sent but can't find link"

**The link is in the backend terminal!**

Look for:
```
╔════════════════════════════════════════════════════════════════╗
║ 🔗 VERIFICATION LINK:                                         ║
╠════════════════════════════════════════════════════════════════╣
║ http://localhost:5173/auth/callback#access_token=...          ║
╚════════════════════════════════════════════════════════════════╝
```

Copy the entire link and paste in browser.

## Complete Test Script

Run this in browser console after signup:

```javascript
async function debugSignup() {
  console.log('=== SIGNUP DEBUG ===');
  
  // 1. Check API URL
  const apiUrl = 'http://localhost:4000/api';
  console.log('1. API URL:', apiUrl);
  
  // 2. Test backend health
  try {
    const health = await fetch(`${apiUrl}/health`);
    console.log('2. Backend health:', health.status, await health.json());
  } catch (e) {
    console.log('2. Backend health: FAILED', e.message);
  }
  
  // 3. Test signup
  try {
    const signup = await fetch(`${apiUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123',
        fullName: 'Test User'
      })
    });
    console.log('3. Signup response:', signup.status);
    const result = await signup.json();
    console.log('   Result:', result);
  } catch (e) {
    console.log('3. Signup: FAILED', e.message);
  }
  
  console.log('=== Check backend terminal for email! ===');
}

debugSignup();
```

## Still Not Working?

### Check These:

1. **Backend terminal shows errors?**
   - Copy error message
   - Check if Supabase credentials are correct
   - Check if all env variables are set

2. **Frontend can't reach backend?**
   - Check firewall settings
   - Try `curl http://localhost:4000/api/health`
   - Check if backend is on correct port

3. **Email not in console?**
   - Make sure you're looking at BACKEND terminal
   - Not frontend terminal
   - Scroll up to find the box

4. **403 on specific endpoint?**
   - Check which endpoint is failing
   - Check if it requires authentication
   - Check if session is set properly

## Get Help

If still stuck, provide:
1. Backend terminal output (last 50 lines)
2. Browser console errors (screenshot)
3. Network tab showing failed request
4. Environment variables (without sensitive keys)
