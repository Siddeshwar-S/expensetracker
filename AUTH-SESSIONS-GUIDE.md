# Authentication Sessions Storage Guide

## Where Sessions Are Stored

### 1. Supabase Auth Schema (Database)

Supabase stores authentication sessions in the `auth` schema, which is a protected schema managed by Supabase:

#### `auth.sessions` Table
- **Location**: `auth.sessions` (managed by Supabase)
- **Access**: Limited access, can be queried by admin
- **Columns**:
  - `id` - Session ID (UUID)
  - `user_id` - User ID (UUID)
  - `created_at` - When session was created
  - `updated_at` - Last session update
  - `factor_id` - For MFA (if enabled)
  - `aal` - Authentication Assurance Level
  - `not_after` - Session expiration time

#### `auth.refresh_tokens` Table
- **Location**: `auth.refresh_tokens` (managed by Supabase)
- **Purpose**: Stores refresh tokens for session renewal
- **Columns**:
  - `id` - Token ID
  - `token` - Hashed refresh token
  - `user_id` - User ID
  - `revoked` - Whether token is revoked
  - `created_at` - Creation timestamp
  - `updated_at` - Last update
  - `parent` - Parent token (for token rotation)

### 2. Client-Side Storage (Browser)

Sessions are also stored in the browser:

- **Location**: Browser's Local Storage
- **Key**: `supabase.auth.token`
- **Contains**:
  - Access token (JWT)
  - Refresh token
  - Expiration time
  - User metadata

## Viewing Active Sessions

### Option 1: Query via Supabase Dashboard

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- View all active sessions
SELECT 
  s.id as session_id,
  s.user_id,
  u.email,
  s.created_at,
  s.updated_at,
  s.not_after as expires_at,
  CASE 
    WHEN s.not_after > NOW() THEN 'Active'
    ELSE 'Expired'
  END as status
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC;

-- Count sessions per user
SELECT 
  u.email,
  COUNT(s.id) as session_count,
  MAX(s.created_at) as last_session
FROM auth.users u
LEFT JOIN auth.sessions s ON s.user_id = u.id
GROUP BY u.id, u.email
ORDER BY session_count DESC;
```

### Option 2: Create a Custom View (Recommended)

Add this to your database to easily track sessions:

```sql
-- Create a view for active sessions (admin only)
CREATE OR REPLACE VIEW public.active_user_sessions AS
SELECT 
  s.id as session_id,
  s.user_id,
  up.email,
  up.full_name,
  s.created_at as session_started,
  s.updated_at as last_activity,
  s.not_after as expires_at,
  EXTRACT(EPOCH FROM (s.not_after - NOW())) / 3600 as hours_until_expiry,
  CASE 
    WHEN s.not_after > NOW() THEN 'Active'
    ELSE 'Expired'
  END as status
FROM auth.sessions s
JOIN public.user_profiles up ON up.id = s.user_id
WHERE s.not_after > NOW()
ORDER BY s.created_at DESC;

-- Grant access to admins only
GRANT SELECT ON public.active_user_sessions TO authenticated;

-- Add RLS policy for admin-only access
ALTER VIEW public.active_user_sessions SET (security_invoker = on);
CREATE POLICY "Admins can view all sessions" ON public.active_user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

## Creating a Session Tracking Table (Optional)

If you want to track session history and analytics, create a custom table:

```sql
-- Create session tracking table
CREATE TABLE IF NOT EXISTS public.user_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  action TEXT CHECK (action IN ('login', 'logout', 'refresh', 'expired', 'revoked')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_session_logs_user_id ON user_session_logs(user_id);
CREATE INDEX idx_session_logs_created_at ON user_session_logs(created_at);

-- Enable RLS
ALTER TABLE user_session_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own session logs
CREATE POLICY "Users can view own session logs" ON user_session_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all session logs
CREATE POLICY "Admins can view all session logs" ON user_session_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to log session events
CREATE OR REPLACE FUNCTION public.log_session_event(
  p_action TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.user_session_logs (user_id, action, ip_address, user_agent)
  VALUES (auth.uid(), p_action, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Manually Revoking Sessions

### Revoke All Sessions for a User

```sql
-- Revoke all sessions for a specific user
DELETE FROM auth.sessions WHERE user_id = 'USER_UUID_HERE';
DELETE FROM auth.refresh_tokens WHERE user_id = 'USER_UUID_HERE';
```

### Revoke a Specific Session

```sql
-- Revoke a specific session
DELETE FROM auth.sessions WHERE id = 'SESSION_UUID_HERE';
```

### Create Admin Function to Revoke Sessions

```sql
-- Function for admins to revoke user sessions
CREATE OR REPLACE FUNCTION public.admin_revoke_user_sessions(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT user_profiles.is_admin INTO is_admin
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can revoke user sessions';
  END IF;
  
  -- Revoke all sessions
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
  
  -- Log the action
  PERFORM log_session_event('revoked', NULL, 'Admin action');
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Session Configuration

Sessions are configured in your Supabase project settings:

- **JWT Expiry**: Default 1 hour (3600 seconds)
- **Refresh Token Expiry**: Default 30 days
- **Location**: Supabase Dashboard → Authentication → Settings

## Checking Sessions in Your App

### Frontend Code to Check Current Session

```typescript
// In your React app
import { supabase } from './lib/supabase';

// Get current session
const { data: { session }, error } = await supabase.auth.getSession();

if (session) {
  console.log('Session ID:', session.access_token);
  console.log('User ID:', session.user.id);
  console.log('Expires at:', new Date(session.expires_at * 1000));
  console.log('Time until expiry:', 
    Math.round((session.expires_at * 1000 - Date.now()) / 1000 / 60), 
    'minutes'
  );
}
```

### Backend Code to Verify Session

```typescript
// In your Next.js API routes
import { supabaseAdmin } from '@/lib/supabase';

// Verify a session token
const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

if (user) {
  console.log('Valid session for user:', user.email);
}
```

## Best Practices

1. **Session Duration**: Keep JWT expiry short (1 hour) for security
2. **Refresh Tokens**: Use refresh tokens for seamless user experience
3. **Revoke on Logout**: Always revoke sessions on explicit logout
4. **Monitor Sessions**: Track active sessions for security auditing
5. **Limit Concurrent Sessions**: Consider limiting sessions per user
6. **IP Tracking**: Log IP addresses for security monitoring

## Security Notes

- Sessions are automatically cleaned up by Supabase
- Expired sessions are removed periodically
- The `auth` schema is protected and can only be accessed with proper permissions
- Always use HTTPS in production to protect session tokens
- Never expose session tokens in logs or error messages
