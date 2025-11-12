# User Management Guide

## Disable User Functionality

### What It Does

When you "disable" or "deactivate" a user:

1. **Sets `is_active = false`** in the `user_profiles` table
2. **User cannot sign in** - Backend blocks authentication
3. **User's data remains** - All transactions, categories, etc. are preserved
4. **Reversible** - Can be re-enabled anytime

### How It Works

**Backend Check (in signin):**
```typescript
// Check if user is active
const { data: profile } = await supabase
  .from('user_profiles')
  .select('is_active')
  .eq('id', user.id)
  .single();

if (profile && !profile.is_active) {
  return { error: 'Your account has been deactivated. Please contact an administrator.' };
}
```

**What User Sees:**
```
Sign In Failed
Your account has been deactivated. Please contact an administrator.
```

## How to Disable a User

### Option 1: Via Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qioipnpbecxnmmlymxet)
2. Navigate to: **Table Editor** → `user_profiles`
3. Find the user by email
4. Set `is_active` to `false`
5. Click Save

### Option 2: Via SQL

```sql
-- Disable user by email
UPDATE user_profiles 
SET is_active = false,
    deactivated_at = NOW(),
    deactivated_by = 'YOUR_ADMIN_USER_ID'
WHERE email = 'user@example.com';
```

### Option 3: Via Backend API (If Implemented)

```typescript
// POST /api/admin/users/{userId}/deactivate
await fetch(`${API_URL}/admin/users/${userId}/deactivate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## How to Re-Enable a User

### Option 1: Via Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qioipnpbecxnmmlymxet)
2. Navigate to: **Table Editor** → `user_profiles`
3. Find the user by email
4. Set `is_active` to `true`
5. Clear `deactivated_at` and `deactivated_by` (optional)
6. Click Save

### Option 2: Via SQL

```sql
-- Re-enable user by email
UPDATE user_profiles 
SET is_active = true,
    deactivated_at = NULL,
    deactivated_by = NULL
WHERE email = 'user@example.com';
```

### Option 3: Via Backend API (If Implemented)

```typescript
// POST /api/admin/users/{userId}/activate
await fetch(`${API_URL}/admin/users/${userId}/activate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## User Experience

### When Disabled

**User tries to sign in:**
```
1. Enters email and password
2. Backend verifies credentials ✓
3. Backend checks is_active ✗
4. Returns error: "Account deactivated"
5. User cannot access app
```

**User's data:**
- ✅ All data preserved
- ✅ Transactions remain
- ✅ Categories remain
- ✅ Settings remain
- ❌ Cannot access anything

### When Re-Enabled

**User tries to sign in:**
```
1. Enters email and password
2. Backend verifies credentials ✓
3. Backend checks is_active ✓
4. User signed in successfully
5. User can access app normally
```

**User's data:**
- ✅ All data still there
- ✅ Nothing lost
- ✅ Can continue where they left off

## Admin Management

### Making a User Admin

**Via Supabase Dashboard:**
1. Go to **Table Editor** → `user_profiles`
2. Find user by email
3. Set `is_admin` to `true`
4. Click Save

**Via SQL:**
```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

### Removing Admin Privileges

**Via Supabase Dashboard:**
1. Go to **Table Editor** → `user_profiles`
2. Find user by email
3. Set `is_admin` to `false`
4. Click Save

**Via SQL:**
```sql
UPDATE user_profiles 
SET is_admin = false 
WHERE email = 'user@example.com';
```

## Recommendation: Remove Admin Toggle from UI

Since you want to manage admins manually (via database), you should NOT have a "Make Admin" button in the UI. This prevents:

- ❌ Users accidentally making others admin
- ❌ Security risks
- ❌ Unauthorized privilege escalation

**Best Practice:**
- ✅ Manage admins via Supabase Dashboard
- ✅ Or via SQL queries
- ✅ Keep admin management separate from UI

## Database Schema

### user_profiles Table

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Columns

- **is_admin**: Whether user has admin privileges
- **is_active**: Whether user can sign in
- **deactivated_at**: When user was deactivated
- **deactivated_by**: Which admin deactivated them

## Use Cases

### Temporary Suspension

```sql
-- Suspend user for 30 days
UPDATE user_profiles 
SET is_active = false,
    deactivated_at = NOW()
WHERE email = 'user@example.com';

-- Re-enable after 30 days
UPDATE user_profiles 
SET is_active = true,
    deactivated_at = NULL
WHERE email = 'user@example.com';
```

### Permanent Ban

```sql
-- Permanently disable
UPDATE user_profiles 
SET is_active = false,
    deactivated_at = NOW(),
    deactivated_by = 'ADMIN_USER_ID'
WHERE email = 'banned@example.com';

-- Optionally delete their data
DELETE FROM transactions WHERE user_id = 'USER_ID';
```

### Bulk Operations

```sql
-- Disable multiple users
UPDATE user_profiles 
SET is_active = false 
WHERE email IN ('user1@example.com', 'user2@example.com');

-- Re-enable all disabled users
UPDATE user_profiles 
SET is_active = true 
WHERE is_active = false;
```

## Monitoring

### View All Disabled Users

```sql
SELECT id, email, full_name, deactivated_at, deactivated_by
FROM user_profiles
WHERE is_active = false
ORDER BY deactivated_at DESC;
```

### View All Admins

```sql
SELECT id, email, full_name, is_active
FROM user_profiles
WHERE is_admin = true
ORDER BY email;
```

### View User Status

```sql
SELECT 
  email,
  is_admin,
  is_active,
  deactivated_at,
  created_at
FROM user_profiles
WHERE email = 'user@example.com';
```

## Security Considerations

### Protect Admin Accounts

```sql
-- Prevent admins from being deactivated accidentally
ALTER TABLE user_profiles 
ADD CONSTRAINT prevent_admin_deactivation 
CHECK (NOT (is_admin = true AND is_active = false));
```

### Audit Trail

```sql
-- Create audit log table
CREATE TABLE user_status_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  changed_by UUID REFERENCES user_profiles(id),
  old_status BOOLEAN,
  new_status BOOLEAN,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    INSERT INTO user_status_changes (user_id, old_status, new_status)
    VALUES (NEW.id, OLD.is_active, NEW.is_active);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_status_change
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();
```

## Summary

### Disable User
- ✅ Sets `is_active = false`
- ✅ Blocks signin
- ✅ Preserves all data
- ✅ Reversible

### Re-Enable User
- ✅ Sets `is_active = true`
- ✅ Allows signin
- ✅ Restores full access
- ✅ No data lost

### Admin Management
- ✅ Manage via database only
- ✅ Don't expose in UI
- ✅ More secure
- ✅ Prevents accidents

**Recommendation:** Keep admin management in the database, not in the UI!
