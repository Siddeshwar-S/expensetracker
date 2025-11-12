# Quick Fix for 403 Error

## The Problem

You're getting a 403 error and not seeing emails. This is likely because:
1. Backend isn't running
2. Or there's a CORS issue

## Quick Fix (2 Minutes)

### Step 1: Make Sure Backend is Running

```bash
# Open a new terminal
cd backend
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:4000
✓ Ready in X.Xs
```

**IMPORTANT:** Keep this terminal open! This is where emails will appear.

### Step 2: Test Backend

Open browser and go to:
```
http://localhost:4000/api/health
```

Should see:
```json
{"status":"ok","timestamp":"..."}
```

If you see an error or nothing, backend isn't running.

### Step 3: Sign Up Again

1. Go to your app: `http://localhost:5173`
2. Click "Sign Up"
3. Fill in the form
4. Click Submit

### Step 4: Check Backend Terminal

**Look at the terminal where backend is running** (not frontend!).

You should see:
```
╔════════════════════════════════════════════════════════════════╗
║                    📧 VERIFICATION EMAIL                       ║
╠════════════════════════════════════════════════════════════════╣
║ To: your-email@example.com                                     ║
║ Subject: Verify Your Email - Finance Tracker                   ║
╠════════════════════════════════════════════════════════════════╣
║ 🔗 VERIFICATION LINK:                                         ║
╠════════════════════════════════════════════════════════════════╣
║ http://localhost:5173/auth/callback#access_token=eyJ...        ║
╚════════════════════════════════════════════════════════════════╝

✅ Email sent successfully via Resend: abc123
```

### Step 5: Check Your Email Inbox

Since you have Resend configured with `siddeshwar.s@yahoo.com`, you should also receive a real email!

**Check:**
1. Your Yahoo inbox
2. Spam/Junk folder
3. Wait 1-2 minutes for delivery

## If Backend Won't Start

### Error: "Port 4000 already in use"

```bash
# Find what's using port 4000
lsof -i :4000

# Kill it
kill -9 <PID>

# Or use different port
# Edit backend/.env.local:
PORT=4001

# Then update frontend .env:
VITE_API_URL=http://localhost:4001/api
```

### Error: "Module not found"

```bash
cd backend
npm install
npm run dev
```

### Error: "Invalid Supabase credentials"

Check `backend/.env.local` has correct keys from Supabase dashboard.

## If Still Getting 403

### Check Frontend .env

```bash
cat .env

# Should have:
VITE_API_URL=http://localhost:4000/api
```

If missing or wrong, add it:
```bash
echo "VITE_API_URL=http://localhost:4000/api" >> .env
```

Then restart frontend:
```bash
npm run dev
```

## Resend Email Issues

### Email Not Received

**Check 1: Resend Dashboard**
Go to: https://resend.com/emails

You should see your sent emails there.

**Check 2: Email Address**
Make sure you're checking the right inbox: `siddeshwar.s@yahoo.com`

**Check 3: Spam Folder**
Yahoo sometimes marks Resend emails as spam.

**Check 4: Resend API Key**
Your key: `re_93bTtQtA_AehV32ug7w7AWSedGVG1X1EQ`

Test it:
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_93bTtQtA_AehV32ug7w7AWSedGVG1X1EQ' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "siddeshwar.s@yahoo.com",
    "subject": "Test Email",
    "html": "<p>This is a test</p>"
  }'
```

Should return:
```json
{"id":"abc123..."}
```

## Summary

**Most Common Issue:** Backend not running

**Fix:**
1. Open terminal
2. `cd backend`
3. `npm run dev`
4. Keep terminal open
5. Sign up again
6. Check that terminal for email box

**Email will appear in:**
- Backend terminal (always)
- Your Yahoo inbox (if Resend is working)
- Resend dashboard (https://resend.com/emails)
