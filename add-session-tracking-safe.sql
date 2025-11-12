-- Safe Session Tracking Setup
-- This version can be run multiple times without errors

-- ============================================
-- PART 1: View Active Sessions
-- ============================================

DROP VIEW IF EXISTS public.active_user_sessions CASCADE;

CREATE VIEW public.active_user_sessions AS
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

GRANT SELECT ON public.active_user_sessions TO authenticated;

-- ============================================
-- PART 2: Session History Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  action TEXT CHECK (action IN ('login', 'logout', 'refresh', 'expired', 'revoked', 'deleted_user')),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON user_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON user_session_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_session_logs_action ON user_session_logs(action);

ALTER TABLE user_session_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own session logs" ON user_session_logs;
DROP POLICY IF EXISTS "Admins can view all session logs" ON user_session_logs;
DROP POLICY IF EXISTS "System can insert session logs" ON user_session_logs;

CREATE POLICY "Users can view own session logs" ON user_session_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all session logs" ON user_session_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert session logs" ON user_session_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- PART 3: Helper Functions
-- ============================================

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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL AND p_session_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id FROM auth.sessions WHERE id = p_session_id;
  END IF;
  
  INSERT INTO public.user_session_logs (
    user_id, session_id, action, ip_address, user_agent, metadata
  )
  VALUES (
    v_user_id, p_session_id, p_action, p_ip_address, p_user_agent, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_revoke_user_sessions(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  is_admin BOOLEAN;
  session_count INTEGER;
BEGIN
  SELECT user_profiles.is_admin INTO is_admin
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can revoke user sessions';
  END IF;
  
  SELECT COUNT(*) INTO session_count 
  FROM auth.sessions 
  WHERE user_id = target_user_id;
  
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
  
  INSERT INTO public.user_session_logs (user_id, action, metadata)
  VALUES (
    target_user_id, 
    'revoked',
    jsonb_build_object('revoked_by', auth.uid(), 'session_count', session_count)
  );
  
  RETURN session_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ============================================
-- PART 4: Enhanced Session Revocation
-- ============================================

CREATE OR REPLACE FUNCTION public.revoke_user_sessions()
RETURNS TRIGGER AS $$
DECLARE
  session_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO session_count 
  FROM auth.sessions 
  WHERE user_id = OLD.id;
  
  RAISE NOTICE 'User % deleted, revoking % sessions', OLD.id, session_count;
  
  DELETE FROM auth.sessions WHERE user_id = OLD.id;
  DELETE FROM auth.refresh_tokens WHERE user_id = OLD.id;
  
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
-- PART 5: User Session Stats View
-- ============================================

DROP VIEW IF EXISTS public.user_session_stats CASCADE;

CREATE VIEW public.user_session_stats AS
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

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Session tracking setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Available:';
  RAISE NOTICE '  - View: active_user_sessions';
  RAISE NOTICE '  - View: user_session_stats';
  RAISE NOTICE '  - Table: user_session_logs';
  RAISE NOTICE '  - Function: log_session_event()';
  RAISE NOTICE '  - Function: admin_revoke_user_sessions()';
  RAISE NOTICE '  - Function: get_session_stats()';
  RAISE NOTICE '';
  RAISE NOTICE 'Test with: SELECT * FROM active_user_sessions;';
  RAISE NOTICE '';
END $$;
