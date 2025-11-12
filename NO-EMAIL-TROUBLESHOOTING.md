# No Email or Verification Link - Troubleshooting

## Quick Diagnosis

Run this test to see what's happening:

```bash
# Make sure you're in the project root
node test-signup.js
```

This will:
1. Test if backend is running
2. Try to create a test user
3. Show you the response

## Common Issues

### Issue 1: Backend Not Running

**Symptom:** Test script shows "Error: fetch failed" or connection refused

**Fix:**
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# You should see:
# ▲ Next.js 14.x.x
# - Local: http://localhost:4000
# ✓ Ready in X.Xs
```

**Keep this terminal open!** This is where emails will appear.

### Issue 2: Backend Running But No Email

**Check backend terminal for these logs:**

After signup, you should see:
```
📧 Generating verification link for: test@example.com
✅ Link generated successfully
📨 Preparing to send email...

╔════════════════════════════════════════════════════════════════╗
║                    📧 VERIFICATION EMAIL                       ║
╠════════════════════════════════════════════════════════════════╣
║ To: test@example.com                                           ║
║ Subject: Verify Your Email - Finance Tracker                   ║
╠════════════════════════════════════════════════════════════════╣
║ 🔗 VERIFICATION LINK:                                         ║
╠════════════════════════════════════════════════════════════════╣
║ http://localhost:5173/auth/callback#access_token=...          ║
╚════════════════════════════════════════════════════════════════╝

⚠️  SMTP not configured - email not sent (but link is logged above)
```

**If you don't see this:**
- Signup might be failing
- Check for error messages in backend terminal
- Run the test script to see the error

### Issue 3: Signup Failing

**Check backend terminal for errors:**

Common errors:
```
❌ Link generation error: ...
❌ No action link in linkData
❌ Failed to send verification email
```

**If you see "Link generation error":**
- Check Supabase credentials in `backend/.env.local`
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is correct

**Test Supabase connection:**
```bash
# In backend directory
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qioipnpbecxnmmlymxet.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
);
supabase.auth.admin.listUsers().then(console.log).catch(console.error);
"
```

### Issue 4: Looking at Wrong Terminal

**Common mistake:** Looking at frontend terminal instead of backend terminal

**Frontend terminal shows:**
```
VITE v5.x.x ready in X ms
➜ Local: http://localhost:5173/
```

**Backend terminal shows:**
```
▲ Next.js 14.x.x
- Local: http://localhost:4000
✓ Ready in X.Xs
```

**Emails appear in BACKEND terminal!**

### Issue 5: Email Box Not Visible

**Try:**
1. Scroll up in backend terminal
2. Look for the box with `╔═══` borders
3. Search for "VERIFICATION EMAIL"

**If terminal is too small:**
```bash
# Make terminal wider
# Or redirect to file:
cd backend
npm run dev > output.log 2>&1

# Then check file:
tail -f output.log
```

## Step-by-Step Debug

### Step 1: Verify Backend is Running

```bash
curl http://localhost:4000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

If not, start backend:
```bash
cd backend
npm run dev
```

### Step 2: Test Signup Endpoint

```bash
node test-signup.js
```

Should show:
```
Status: 200 OK
Response: {
  "success": true,
  "message": "Account created successfully...",
  ...
}

✅ Signup successful!
📧 Check your backend terminal for the verification email box
```

### Step 3: Check Backend Terminal

Look for:
```
POST /api/auth/signup 200 in XXXms
📧 Generating verification link for: test@example.com
✅ Link generated successfully
📨 Preparing to send email...
[Email box should appear here]
```

### Step 4: If Still No Email

Add this to `backend/lib/email.ts` at the very start of `sendEmail`:
```typescript
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('🔍 sendEmail called with:', { to: options.to, subject: options.subject });
  
  // ... rest of function
}
```

This will confirm if the function is being called.

## Manual Test

### Test Email Function Directly

Create `backend/test-email.js`:
```javascript
const { sendEmail, generateVerificationEmail } = require('./lib/email');

const html = generateVerificationEmail(
  'test@example.com',
  'http://localhost:5173/auth/callback#test',
  'Test User'
);

sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: html
}).then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
```

Run it:
```bash
cd backend
node test-email.js
```

Should show the email box in console.

## Environment Check

### Verify Environment Variables

```bash
# Check backend env
cat backend/.env.local | grep -E "SUPABASE|SMTP"

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# SMTP_HOST=... (if configured)
```

### Verify Frontend Env

```bash
# Check frontend env
cat .env | grep VITE_API_URL

# Should show:
# VITE_API_URL=http://localhost:4000/api
```

## Complete Reset

If nothing works, try a complete reset:

```bash
# 1. Stop everything (Ctrl+C in both terminals)

# 2. Clear caches
cd backend
rm -rf .next node_modules/.cache

cd ..
rm -rf node_modules/.vite

# 3. Restart backend
cd backend
npm run dev

# 4. Restart frontend (new terminal)
npm run dev

# 5. Try signup again
node test-signup.js

# 6. Check backend terminal for email
```

## Still Not Working?

### Collect Debug Info

Run these commands and share the output:

```bash
# 1. Check if backend is running
curl http://localhost:4000/api/health

# 2. Test signup
node test-signup.js

# 3. Check backend logs (last 50 lines)
# Copy from backend terminal

# 4. Check environment
cat backend/.env.local | grep -v "KEY=" | grep -v "PASS="

# 5. Check Node version
node --version
```

### Common Solutions

**Backend won't start:**
```bash
cd backend
rm -rf node_modules
npm install
npm run dev
```

**Port 4000 in use:**
```bash
# Find process
lsof -i :4000

# Kill it
kill -9 <PID>

# Or use different port
# Edit backend/.env.local:
PORT=4001

# Update frontend .env:
VITE_API_URL=http://localhost:4001/api
```

**Module not found:**
```bash
cd backend
npm install nodemailer
npm install --save-dev @types/nodemailer
npm run dev
```

## Expected Output

When everything works, you should see:

**Backend Terminal:**
```
POST /api/auth/signup 200 in 1234ms
📧 Generating verification link for: test@example.com
✅ Link generated successfully
📨 Preparing to send email...

╔════════════════════════════════════════════════════════════════╗
║                    📧 VERIFICATION EMAIL                       ║
╠════════════════════════════════════════════════════════════════╣
║ To: test@example.com                                           ║
║ Subject: Verify Your Email - Finance Tracker                   ║
╠════════════════════════════════════════════════════════════════╣
║ 🔗 VERIFICATION LINK:                                         ║
╠════════════════════════════════════════════════════════════════╣
║ http://localhost:5173/auth/callback#access_token=eyJhbGc...   ║
╚════════════════════════════════════════════════════════════════╝

⚠️  SMTP not configured - email not sent (but link is logged above)
```

**Test Script Output:**
```
Testing signup endpoint...

Status: 200 OK
Response: {
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "test@example.com"
  },
  "requiresVerification": true
}

✅ Signup successful!
📧 Check your backend terminal for the verification email box
```
