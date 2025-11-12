# Sign In Fix - Session Not Persisting

## What I Fixed

### 1. Added Session Verification
After setting the session, we now verify it was actually stored:
```typescript
// Set session
await supabase.auth.setSession({ access_token, refresh_token });

// Verify it was stored
const { data } = await supabase.auth.getSession();
console.log('Verified session:', data.session);
```

### 2. Manual State Update
The auth context now manually updates state immediately after signin:
```typescript
if (result.success && result.data) {
  // Don't wait for auth state change listener
  setSession(result.data);
  setUser(result.data.user);
  await loadProfile(result.data.user.id);
}
```

## Testing Steps

### 1. Clear Everything First
```javascript
// Browser console (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Sign In and Watch Console
You should see these logs in order:
```
Backend signin response: { success: true, session: {...} }
Session established successfully: { access_token: "...", ... }
Verified session after signin: { access_token: "...", ... }
```

### 3. Verify Session Persisted
After signin, run in console:
```javascript
// Check session
const { data } = await supabase.auth.getSession();
console.log('Current session:', data.session);

// Check token
const token = data.session?.access_token;
console.log('Token exists:', !!token);
console.log('Token preview:', token?.substring(0, 30) + '...');

// Test API call
fetch('http://localhost:4000/api/categories', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

### 4. Check Auth State
```javascript
// Should show authenticated user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

## If Still Getting 401 Errors

### Check 1: Session Storage
```javascript
// Browser console:
console.log('LocalStorage keys:', Object.keys(localStorage));
console.log('Supabase auth:', localStorage.getItem('sb-qioipnpbecxnmmlymxet-auth-token'));
```

### Check 2: Token Format
```javascript
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;

// Should start with "eyJ"
console.log('Token starts with eyJ:', token?.startsWith('eyJ'));

// Should have 3 parts separated by dots
console.log('Token parts:', token?.split('.').length); // Should be 3
```

### Check 3: Backend Can Verify Token
```bash
# In backend terminal, add this to backend/lib/auth.ts temporarily:
console.log('Verifying token:', token.substring(0, 30) + '...');
```

### Check 4: CORS Headers
```javascript
// Check if backend is sending proper CORS headers
fetch('http://localhost:4000/api/health')
  .then(r => {
    console.log('CORS headers:', {
      'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': r.headers.get('access-control-allow-credentials')
    });
    return r.json();
  })
  .then(console.log);
```

## Common Issues

### Issue: Session Not in LocalStorage
**Symptom:** `localStorage.getItem('sb-...')` returns null

**Fix:** Check Supabase client config has `persistSession: true`
```typescript
// src/lib/supabase.ts
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true, // ← Must be true
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
```

### Issue: Token Exists But 401 Errors
**Symptom:** Session exists but API calls fail

**Fix:** Check backend environment variables
```bash
# backend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Must be service_role, not anon
```

### Issue: 406 on Supabase Direct Calls
**Symptom:** Direct Supabase queries return 406

**Fix:** This means auth headers are missing. Check:
```javascript
// Should have session
const { data } = await supabase.auth.getSession();
console.log('Has session:', !!data.session);

// Supabase client should auto-add headers
// If not, session isn't set properly
```

## Nuclear Option: Complete Reset

If nothing works, do a complete reset:

### 1. Stop Everything
```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)
```

### 2. Clear All Caches
```bash
# Backend
cd backend
rm -rf .next node_modules/.cache

# Frontend
cd ..
rm -rf node_modules/.vite dist

# Browser
# F12 → Application → Clear storage → Clear site data
```

### 3. Restart
```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
npm run dev
```

### 4. Fresh Sign In
- Clear browser storage
- Sign in again
- Should work now

## Debug Script

Run this complete debug script in browser console after signin:

```javascript
async function debugAuth() {
  console.log('=== AUTH DEBUG ===');
  
  // 1. Check session
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('1. Has session:', !!sessionData.session);
  console.log('   Access token:', sessionData.session?.access_token?.substring(0, 30) + '...');
  console.log('   Expires at:', new Date((sessionData.session?.expires_at || 0) * 1000));
  console.log('   Is expired:', (sessionData.session?.expires_at || 0) < Date.now() / 1000);
  
  // 2. Check user
  const { data: userData } = await supabase.auth.getUser();
  console.log('2. Has user:', !!userData.user);
  console.log('   User ID:', userData.user?.id);
  console.log('   Email:', userData.user?.email);
  console.log('   Email confirmed:', !!userData.user?.email_confirmed_at);
  
  // 3. Check localStorage
  const storageKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
  console.log('3. LocalStorage keys:', storageKeys);
  
  // 4. Test backend API
  const token = sessionData.session?.access_token;
  if (token) {
    try {
      const response = await fetch('http://localhost:4000/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('4. Backend API test:', response.status, response.statusText);
      if (response.ok) {
        const data = await response.json();
        console.log('   Response:', data);
      } else {
        const error = await response.text();
        console.log('   Error:', error);
      }
    } catch (error) {
      console.log('4. Backend API error:', error);
    }
  } else {
    console.log('4. No token to test backend API');
  }
  
  // 5. Test Supabase direct
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    console.log('5. Supabase direct test:', error ? 'FAILED' : 'SUCCESS');
    if (error) console.log('   Error:', error);
    if (data) console.log('   Data:', data);
  } catch (error) {
    console.log('5. Supabase direct error:', error);
  }
  
  console.log('=== END DEBUG ===');
}

// Run it
debugAuth();
```

## Expected Output

After successful signin, the debug script should show:
```
=== AUTH DEBUG ===
1. Has session: true
   Access token: eyJhbGciOiJIUzI1NiIsImtpZCI6...
   Expires at: [future date]
   Is expired: false
2. Has user: true
   User ID: 9805bebc-08bc-41dd-b688-5332c1c4a7ba
   Email: user@example.com
   Email confirmed: true
3. LocalStorage keys: ["sb-qioipnpbecxnmmlymxet-auth-token"]
4. Backend API test: 200 OK
   Response: { data: [...], success: true }
5. Supabase direct test: SUCCESS
   Data: [...]
=== END DEBUG ===
```

If any step fails, that's where the problem is!
