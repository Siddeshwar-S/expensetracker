# Setup Checklist

## ✅ Already Done (Automatic)

- [x] Frontend session validation added
- [x] Auth service enhanced
- [x] Sessions tab created
- [x] UI components added
- [x] Admin-only access configured

## 🔧 You Need To Do (2 SQL Migrations)

### Step 1: Run Session Revocation Migration
```bash
# In Supabase Dashboard → SQL Editor
# Copy and paste the entire contents of:
fix-deleted-user-access.sql
```

**What this does:**
- Automatically revokes sessions when users are deleted
- Adds database-level protection

### Step 2: Run Session Tracking Migration
```bash
# In Supabase Dashboard → SQL Editor
# Copy and paste the entire contents of:
add-session-tracking-safe.sql
```

**Note:** Use `add-session-tracking-safe.sql` - it can be run multiple times without errors.

**What this does:**
- Creates session monitoring views
- Adds session management functions
- Enables the Sessions tab to work

## 🧪 Testing

### After Running SQL Migrations:

1. **Test Sessions Tab**
   - Log in as admin
   - Go to Expense page
   - Click "Sessions" tab
   - Should see active sessions

2. **Test Session Revocation**
   - Create test user
   - Log in as test user (different browser)
   - As admin, revoke test user's session
   - Test user should be signed out

3. **Test Deleted User Protection**
   - Create test user
   - Log in as test user
   - As admin, delete test user
   - Test user should be signed out within 5 minutes

## 📊 What You Get

### Sessions Tab Features:
- ✅ View all active sessions
- ✅ See session statistics
- ✅ Monitor user activity
- ✅ Revoke sessions manually
- ✅ Real-time updates

### Security Features:
- ✅ Deleted users auto-signed out
- ✅ Sessions validated every 5 minutes
- ✅ Database-level session revocation
- ✅ Complete audit trail
- ✅ Admin control panel

## 🎯 Quick Access

**To view sessions:**
1. Log in as admin
2. Expense page → Sessions tab

**To revoke a session:**
1. Sessions tab → Find user
2. Click "Revoke" → Confirm

**To view session logs:**
```sql
SELECT * FROM user_session_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

## ✨ You're All Set!

Once you run the two SQL migrations, everything will work automatically. The Sessions tab will appear for admin users, and deleted users will be immediately signed out.
