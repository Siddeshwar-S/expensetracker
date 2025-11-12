# Sessions Tab - Quick Start

## ✅ What's Done

A new "Sessions" tab has been added next to the "Users" tab in your admin panel!

## 🚀 Setup (2 Steps)

### Step 1: Run SQL Migration
In Supabase SQL Editor, run:
```sql
-- Copy and paste the entire contents of:
add-session-tracking.sql
```

### Step 2: Test It
1. Log in as an admin user
2. Go to Expense page
3. Click the "Sessions" tab (next to "Users")
4. You should see all active sessions!

## 📊 What You'll See

### Stats Cards (Top)
- **Active Sessions** - Total number of active sessions
- **Active Users** - Unique users currently logged in
- **Expiring Soon** - Sessions expiring within 1 hour
- **Avg Session Age** - How long sessions have been active

### Sessions Table (Bottom)
For each session:
- User name and email
- When they logged in
- Last activity time
- Time until session expires
- Status badge (Active/Expired)
- **Revoke button** - Sign them out immediately

## 🎯 Key Features

### View Sessions
- See who's currently logged in
- Monitor session activity
- Check expiration times

### Revoke Sessions
1. Click "Revoke" next to any user
2. Confirm the action
3. User is signed out from ALL devices
4. They must log in again

### Refresh Data
- Click "Refresh" button to reload
- Auto-updates when you revoke sessions

## 🔒 Security

- **Admin Only** - Only admins can see this tab
- **Logged** - All actions are recorded
- **Immediate** - Session revocation is instant
- **Complete** - Signs out from all devices

## 🧪 Test It

### Test 1: View Your Own Session
1. Open Sessions tab
2. Find your email in the list
3. You should see your current session

### Test 2: Revoke a Session
1. Create a test user account
2. Log in with test user (in another browser)
3. As admin, go to Sessions tab
4. Click "Revoke" for test user
5. Test user should be signed out immediately

### Test 3: Check Stats
1. Have multiple users log in
2. Check the stats cards update
3. Verify counts are accurate

## 📁 Files Created

- ✅ `src/components/SessionManagement.tsx` - Sessions component
- ✅ `src/components/ui/table.tsx` - Table UI
- ✅ `src/components/ui/alert-dialog.tsx` - Dialog UI
- ✅ Modified `src/pages/ExpensePage.tsx` - Added tab
- ✅ `add-session-tracking.sql` - Database setup

## 🐛 Troubleshooting

**Tab not visible?**
- Make sure you're logged in as admin
- Check `is_admin = true` in `user_profiles` table

**"Failed to load sessions" error?**
- Run `add-session-tracking.sql` in Supabase
- Check browser console for details

**Can't revoke sessions?**
- Verify SQL migration ran successfully
- Check you have admin privileges

## 💡 Tips

- Use "Refresh" button to see latest data
- Sessions expire after 1 hour by default
- Revoked sessions are logged for auditing
- Users can have multiple sessions (different devices)

## 🎉 You're Done!

The Sessions tab is ready to use. Just run the SQL migration and start monitoring your users' sessions!
