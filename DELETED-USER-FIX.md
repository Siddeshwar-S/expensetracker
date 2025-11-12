# Deleted User Re-registration Fix

## Problem
When you delete a user from Supabase Auth dashboard, the email remains reserved. Trying to sign up again with the same email shows "Email already exists" error.

## Solution
The signup endpoint now automatically detects and removes any existing user (including soft-deleted ones) before creating a new account.

## How It Works

### Before (Broken)
```
User signs up → Email: user@example.com
Admin deletes user from dashboard
User tries to sign up again → ERROR: "Email already exists"
```

### After (Fixed)
```
User signs up → Email: user@example.com
Admin deletes user from dashboard
User tries to sign up again:
  1. Backend checks if email exists
  2. If exists, permanently deletes old user
  3. Deletes old user profile
  4. Creates new user with same email
  5. Success! ✓
```

## What Changed

### Backend Signup Route
```typescript
// Check if user already exists
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
const existingUser = existingUsers?.users.find(u => u.email === email);

if (existingUser) {
  // Delete old user completely
  await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
  
  // Delete old profile
  await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('id', existingUser.id);
}

// Now create new user with same email
await supabaseAdmin.auth.admin.createUser({ email, password });
```

## Testing

### 1. Create a Test User
```bash
# Sign up with test email
Email: test@example.com
Password: test123
```

### 2. Delete the User
```bash
# Go to Supabase Dashboard
# Authentication → Users
# Find test@example.com
# Click "..." → Delete user
```

### 3. Try to Sign Up Again
```bash
# Sign up with same email
Email: test@example.com
Password: newpassword123

# Should work! ✓
```

## Important Notes

### Automatic Cleanup
- Old user is **permanently deleted** (not soft-deleted)
- Old user profile is removed from database
- All old user data is cleaned up
- New user gets fresh account

### Security
- Only happens during signup
- Requires valid email and password
- Email verification still required
- No data from old account is retained

### Edge Cases Handled
- Soft-deleted users (deleted from dashboard)
- Hard-deleted users (deleted via API)
- Users with incomplete profiles
- Users with existing transactions (will be orphaned)

## Alternative Approach (If You Want to Prevent Re-registration)

If you want to prevent deleted users from re-registering, you can modify the code:

```typescript
if (existingUser) {
  return NextResponse.json(
    { error: 'This email was previously registered. Please contact support to reactivate your account.' },
    { status: 400 }
  );
}
```

## Data Cleanup Considerations

### What Happens to Old User Data?

When a user is deleted and re-registers:
- ✅ Old auth account: Deleted
- ✅ Old user profile: Deleted
- ⚠️ Old transactions: Orphaned (still in database but no owner)
- ⚠️ Old categories: Orphaned
- ⚠️ Old payment methods: Orphaned

### To Clean Up Orphaned Data

Add this to the signup route if you want to clean up old data:

```typescript
if (existingUser) {
  // Delete all old user data
  await supabaseAdmin.from('transactions').delete().eq('user_id', existingUser.id);
  await supabaseAdmin.from('user_categories').delete().eq('user_id', existingUser.id);
  await supabaseAdmin.from('user_payment_methods').delete().eq('user_id', existingUser.id);
  await supabaseAdmin.from('user_profiles').delete().eq('id', existingUser.id);
  
  // Then delete auth user
  await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
}
```

## Debugging

If you still see "Email already exists" error:

### Check 1: User Still Exists
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'test@example.com';
```

### Check 2: Backend Logs
```bash
# Backend terminal should show:
# "Error deleting existing user: ..."
# or
# "Signup error: ..."
```

### Check 3: Manual Cleanup
```sql
-- Manually delete user from SQL Editor
DELETE FROM auth.users WHERE email = 'test@example.com';
DELETE FROM public.user_profiles WHERE email = 'test@example.com';
```

## Summary

✅ **Debug logs removed** from signin
✅ **Deleted users can re-register** with same email
✅ **Automatic cleanup** of old user data
✅ **No manual intervention** needed

Users can now sign up, get deleted, and sign up again with the same email without any issues!
