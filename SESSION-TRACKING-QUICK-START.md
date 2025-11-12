# Session Tracking Quick Start

## Where Sessions Are Stored NOW

### Database (Supabase Managed)
- **`auth.sessions`** - Active sessions (managed by Supabase)
- **`auth.refresh_tokens`** - Refresh tokens (managed by Supabase)

### Browser (Client-Side)
- **Local Storage** - Key: `supabase.auth.token`
- Contains: Access token, refresh token, expiration

## Add Session Tracking (Optional)

Run this SQL file to add session monitoring:

```bash
# In Supabase SQL Editor, run:
add-session-tracking.sql
```

This adds:
- ✅ View to see active sessions
- ✅ Table to track session history
- ✅ Functions to manage sessions
- ✅ Enhanced logging when users are deleted

## Quick Queries

### View All Active Sessions
```sql
SELECT * FROM active_user_sessions;
```

### View Your Session Statistics
```sql
SELECT * FROM user_session_stats WHERE email = 'your@email.com';
```

### Get Overall Session Stats
```sql
SELECT * FROM get_session_stats();
```

### View Recent Session Events
```sql
SELECT * FROM user_session_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Revoke All Sessions for a User (Admin Only)
```sql
SELECT admin_revoke_user_sessions('USER_UUID_HERE');
```

## What You Get

### 1. `active_user_sessions` View
Shows all currently active sessions with:
- User email and name
- Session start time
- Last activity
- Time until expiry
- Status (Active/Expired)

### 2. `user_session_logs` Table
Tracks all session events:
- Login
- Logout
- Refresh
- Expired
- Revoked
- Deleted user

### 3. Helper Functions
- `log_session_event()` - Log custom events
- `admin_revoke_user_sessions()` - Revoke user sessions
- `get_session_stats()` - Get session statistics

## Integration with Your App

### Log Login Events (Optional)
```typescript
// After successful login
await supabase.rpc('log_session_event', {
  p_action: 'login',
  p_ip_address: userIpAddress,
  p_user_agent: navigator.userAgent
});
```

### Log Logout Events (Optional)
```typescript
// Before logout
await supabase.rpc('log_session_event', {
  p_action: 'logout'
});
```

### Admin: View All Sessions
```typescript
// In your admin panel
const { data: sessions } = await supabase
  .from('active_user_sessions')
  .select('*')
  .order('session_started', { ascending: false });
```

### Admin: Revoke User Sessions
```typescript
// Revoke all sessions for a user
const { data, error } = await supabase.rpc('admin_revoke_user_sessions', {
  target_user_id: userId
});

console.log(`Revoked ${data} sessions`);
```

## Do You Need This?

**You DON'T need session tracking if:**
- You just want basic authentication
- The frontend validation (already applied) is sufficient
- You don't need session analytics

**You SHOULD add session tracking if:**
- You want to monitor active users
- You need security auditing
- You want to see session history
- You need to manually revoke sessions
- You want analytics on user activity

## Current Status

✅ **Already Fixed:**
- Frontend validates user exists on load
- Frontend checks every 5 minutes
- Users are auto-signed out if deleted

🔧 **Optional Enhancement:**
- Run `add-session-tracking.sql` for session monitoring
- Run `fix-deleted-user-access.sql` for database-level session revocation

## Files Created

1. **AUTH-SESSIONS-GUIDE.md** - Complete documentation
2. **add-session-tracking.sql** - SQL to add session tracking
3. **SESSION-TRACKING-QUICK-START.md** - This quick reference
