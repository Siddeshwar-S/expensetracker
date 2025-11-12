# Session Duration Information

## Current Session Settings

### Default Supabase Session Duration

**Access Token (JWT):**
- **Duration**: 1 hour (3600 seconds)
- **Purpose**: Used for API authentication
- **Storage**: Browser local storage
- **Auto-refresh**: Yes, using refresh token

**Refresh Token:**
- **Duration**: 30 days (by default)
- **Purpose**: Used to get new access tokens
- **Storage**: Browser local storage
- **Rotation**: Yes, new refresh token issued on each refresh

### How Sessions Work

1. **User Signs In**
   - Access token valid for 1 hour
   - Refresh token valid for 30 days
   - Both stored in browser

2. **After 1 Hour**
   - Access token expires
   - Supabase automatically uses refresh token
   - New access token issued (valid for 1 hour)
   - New refresh token issued (valid for 30 days)

3. **After 30 Days of Inactivity**
   - Refresh token expires
   - User must sign in again

4. **Active Users**
   - As long as user is active, sessions auto-refresh
   - Effectively unlimited session (until manual logout)

## Checking Current Session Duration

### In Supabase Dashboard

1. Go to **Authentication** → **Settings**
2. Look for **JWT Expiry**
3. Default is 3600 seconds (1 hour)

### In Your Database

```sql
-- Check session expiration times
SELECT 
  user_id,
  created_at,
  updated_at,
  not_after as expires_at,
  EXTRACT(EPOCH FROM (not_after - NOW())) / 3600 as hours_until_expiry
FROM auth.sessions
WHERE user_id = 'YOUR_USER_ID';
```

## Changing Session Duration

### Option 1: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard**
2. **Authentication** → **Settings**
3. Find **JWT Expiry** setting
4. Change value (in seconds)
5. Click **Save**

Common values:
- 1 hour: `3600`
- 2 hours: `7200`
- 4 hours: `14400`
- 8 hours: `28800`
- 24 hours: `86400`

### Option 2: Environment Variables

In your Supabase project settings, you can set:

```bash
# JWT expiry (in seconds)
JWT_EXPIRY=3600

# Refresh token expiry (in seconds)
REFRESH_TOKEN_EXPIRY=2592000  # 30 days
```

## Session Validation in Your App

### Frontend Validation (Already Implemented)

Your app validates sessions:
- **On app load**: Checks if user exists
- **Every 5 minutes**: Validates user still exists
- **On auth state change**: Verifies user profile

### Session Refresh

Supabase handles this automatically:
```typescript
// Automatic in your app
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Session refreshed automatically');
  }
});
```

## Session Lifecycle

### Timeline for Active User

```
Sign In
  ↓
[0 min] Access token valid (1 hour)
  ↓
[60 min] Access token expires
  ↓
[60 min] Auto-refresh using refresh token
  ↓
[60 min] New access token issued (1 hour)
  ↓
[120 min] Access token expires again
  ↓
[120 min] Auto-refresh again
  ↓
... continues for 30 days ...
  ↓
[30 days] Refresh token expires
  ↓
User must sign in again
```

### Timeline for Inactive User

```
Sign In
  ↓
[0 min] Access token valid (1 hour)
  ↓
[60 min] Access token expires
  ↓
User closes browser/app
  ↓
... 30 days pass ...
  ↓
User returns
  ↓
Refresh token expired
  ↓
User must sign in again
```

## Recommended Settings

### For High Security Apps
- **JWT Expiry**: 15-30 minutes
- **Refresh Token**: 7 days
- **Reason**: Shorter sessions, more frequent re-authentication

### For User-Friendly Apps (Current)
- **JWT Expiry**: 1 hour (default)
- **Refresh Token**: 30 days (default)
- **Reason**: Balance between security and convenience

### For Internal Apps
- **JWT Expiry**: 4-8 hours
- **Refresh Token**: 90 days
- **Reason**: Less frequent re-authentication needed

## Session Security Features

### Already Implemented in Your App

1. **Automatic Validation**
   - Checks user exists every 5 minutes
   - Signs out deleted users

2. **Database Triggers**
   - Revokes sessions when users deleted
   - Cleans up refresh tokens

3. **Admin Controls**
   - View all active sessions
   - Manually revoke sessions
   - Monitor session activity

4. **Audit Trail**
   - All session events logged
   - Track login/logout/revocation

## Monitoring Sessions

### Check Your Current Session

```typescript
// In browser console
const { data: { session } } = await supabase.auth.getSession();
console.log('Expires at:', new Date(session.expires_at * 1000));
console.log('Time left:', Math.round((session.expires_at * 1000 - Date.now()) / 1000 / 60), 'minutes');
```

### Check All Active Sessions (Admin)

```sql
SELECT 
  COUNT(*) as total_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (not_after - NOW())) / 3600) as avg_hours_remaining
FROM auth.sessions
WHERE not_after > NOW();
```

## Best Practices

1. **Keep JWT Expiry Short** (1 hour is good)
   - Limits damage if token is stolen
   - Auto-refresh handles user experience

2. **Reasonable Refresh Token Duration** (30 days is good)
   - Not too short (annoying re-logins)
   - Not too long (security risk)

3. **Monitor Sessions**
   - Use the Sessions tab to track activity
   - Revoke suspicious sessions

4. **Log Session Events**
   - Already implemented in your app
   - Review logs periodically

5. **Educate Users**
   - Explain why they need to re-login
   - Provide clear error messages

## Current Status in Your App

✅ **JWT Expiry**: 1 hour (Supabase default)
✅ **Refresh Token**: 30 days (Supabase default)
✅ **Auto-refresh**: Enabled
✅ **Session validation**: Every 5 minutes
✅ **Admin monitoring**: Sessions tab available
✅ **Audit logging**: All events tracked
✅ **Deleted user protection**: Automatic sign-out

Your current settings are well-balanced for a personal finance app!
