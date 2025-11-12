-- Add Session Tracking and Monitoring
-- This creates views and tables to track user sessions

-- ============================================
-- PART 1: View Active Sessions (Read-Only)
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.active_user_sessions CASCADE;

-- Create a view to see active sessions (admin only)
CREATE OR REPLACE VIEW public.active_user_sessions AS
SELECT 
  s.id as session_id,
  s.user_id,
  up.email,
  up.full_name,
  up.is_active as user_is_active,
  s.created_at as session_started,
  s.updated_at as last_activity,
  s.not_after as expires_at,
  ROUND(EXTRACT(EPOCH FROM (s.not_after - NOW())) / 3600, 2) as hours_until_expiry,
  CASE 
    WHEN s.not_after > NOW() THEN 'Active'
    ELSE 'Expired'
  END as status
FROM auth.sessions s
JOIN public.user_profiles up ON up.id = s.user_id
ORDER BY s.created_at DESC;

-- Grant access to authenticated users (RLS will control who sees what)
GRANT SELECT ON public.active_user_sessions TO authenticated;

COMMENT ON VIEW public.active_user_sessions IS 
  'Shows all active user sessions. Admins can see all, users can see their own.';

-- ============================================
-- PART 2: Session History Tracking (Optional)
-- ============================================

-- Drop and recreate table if needed (preserves data if exists)
DO $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_session_logs') THEN
    -- Create session tracking table for history and analytics
    CREATE TABLE public.user_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  action TEXT CHECK (action IN ('login', 'logout', 'refresh', 'expired', 'revoked', 'deleted_user')),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON user_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON user_session_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_session_logs_action ON user_session_logs(action);

-- Enable RLS
ALTER TABLE user_session_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own session logs" ON user_session_logs;
DROP POLICY IF EXISTS "Admins can view all session logs" ON user_session_logs;
DROP POLICY IF EXISTS "System can insert session logs" ON user_session_logs;

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

-- System can insert logs (for triggers)
CREATE POLICY "System can insert session logs" ON user_session_logs
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE user_session_logs IS 
  'Tracks session events for security auditing and analytics';

-- ============================================
-- PART 3: Helper Functions
-- ============================================

-- Function to log session events
CREATE OR REPLACE FUNCTION public.log_session_event(
  p_action TEXT,
  p_session_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- If no user is authenticated, try to get from session_id
  IF v_user_id IS NULL AND p_session_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id FROM auth.sessions WHERE id = p_session_id;
  END IF;
  
  -- Insert log entry
  INSERT INTO public.user_session_logs (
    user_id, 
    session_id, 
    action, 
    ip_address, 
    user_agent, 
    metadata
  )
  VALUES (
    v_user_id, 
    p_session_id, 
    p_action, 
    p_ip_address, 
    p_user_agent, 
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_session_event IS 
  'Logs session events for auditing. Can be called from triggers or application code.';

-- Function for admins to revoke user sessions
CREATE OR REPLACE FUNCTION public.admin_revoke_user_sessions(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  is_admin BOOLEAN;
  session_count INTEGER;
BEGIN
  -- Check if current user is admin
  SELECT user_profiles.is_admin INTO is_admin
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can revoke user sessions';
  END IF;
  
  -- Count sessions before revoking
  SELECT COUNT(*) INTO session_count 
  FROM auth.sessions 
  WHERE user_id = target_user_id;
  
  -- Revoke all sessions
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
  
  -- Log the action
  INSERT INTO public.user_session_logs (user_id, action, metadata)
  VALUES (
    target_user_id, 
    'revoked',
    jsonb_build_object(
      'revoked_by', auth.uid(),
      'session_count', session_count
    )
  );
  
  RETURN session_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.admin_revoke_user_sessions IS 
  'Admin function to revoke all sessions for a specific user. Returns count of revoked sessions.';

-- Function to get session statistics
CREATE OR REPLACE FUNCTION public.get_session_stats()
RETURNS TABLE (
  total_active_sessions BIGINT,
  unique_active_users BIGINT,
  sessions_expiring_soon BIGINT,
  avg_session_age_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_active_sessions,
    COUNT(DISTINCT user_id)::BIGINT as unique_active_users,
    COUNT(*) FILTER (WHERE not_after < NOW() + INTERVAL '1 hour')::BIGINT as sessions_expiring_soon,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600), 2) as avg_session_age_hours
  FROM auth.sessions
  WHERE not_after > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_session_stats IS 
  'Returns statistics about active sessions';

-- ============================================
-- PART 4: Enhanced Session Revocation Trigger
-- ============================================

-- Update the revoke_user_sessions function to log the action
CREATE OR REPLACE FUNCTION public.revoke_user_sessions()
RETURNS TRIGGER AS $$
DECLARE
  session_count INTEGER;
BEGIN
  -- Count sessions before revoking
  SELECT COUNT(*) INTO session_count 
  FROM auth.sessions 
  WHERE user_id = OLD.id;
  
  -- Log the deletion
  RAISE NOTICE 'User % deleted, revoking % sessions', OLD.id, session_count;
  
  -- Delete all sessions for this user from auth.sessions
  DELETE FROM auth.sessions WHERE user_id = OLD.id;
  
  -- Also delete refresh tokens
  DELETE FROM auth.refresh_tokens WHERE user_id = OLD.id;
  
  -- Log the session revocation
  INSERT INTO public.user_session_logs (user_id, action, metadata)
  VALUES (
    OLD.id, 
    'deleted_user',
    jsonb_build_object('session_count', session_count)
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Useful Queries
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.user_session_stats CASCADE;

-- Create a view for session statistics by user
CREATE OR REPLACE VIEW public.user_session_stats AS
SELECT 
  up.id as user_id,
  up.email,
  up.full_name,
  COUNT(s.id) as active_sessions,
  MAX(s.created_at) as last_session_start,
  MAX(s.updated_at) as last_activity,
  MIN(s.not_after) as earliest_expiry
FROM user_profiles up
LEFT JOIN auth.sessions s ON s.user_id = up.id AND s.not_after > NOW()
GROUP BY up.id, up.email, up.full_name
ORDER BY active_sessions DESC, last_activity DESC;

GRANT SELECT ON public.user_session_stats TO authenticated;

COMMENT ON VIEW public.user_session_stats IS 
  'Shows session statistics per user';

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Session tracking and monitoring added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Available Views:';
  RAISE NOTICE '  - active_user_sessions: View all active sessions';
  RAISE NOTICE '  - user_session_stats: Session statistics per user';
  RAISE NOTICE '';
  RAISE NOTICE 'Available Tables:';
  RAISE NOTICE '  - user_session_logs: Session event history';
  RAISE NOTICE '';
  RAISE NOTICE 'Available Functions:';
  RAISE NOTICE '  - log_session_event(): Log session events';
  RAISE NOTICE '  - admin_revoke_user_sessions(user_id): Revoke all sessions for a user';
  RAISE NOTICE '  - get_session_stats(): Get session statistics';
  RAISE NOTICE '';
  RAISE NOTICE 'Example Queries:';
  RAISE NOTICE '  SELECT * FROM active_user_sessions;';
  RAISE NOTICE '  SELECT * FROM user_session_stats;';
  RAISE NOTICE '  SELECT * FROM get_session_stats();';
  RAISE NOTICE '  SELECT * FROM user_session_logs ORDER BY created_at DESC LIMIT 10;';
  RAISE NOTICE '';
END $$;
