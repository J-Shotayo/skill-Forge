-- This script contains SQL commands that should be run in your Supabase dashboard
-- Go to Authentication > Settings in your Supabase dashboard and configure:

-- 1. Site URL: Set to your domain (e.g., http://localhost:3000 for development)
-- 2. Redirect URLs: Add these URLs to your allowed redirect URLs:
--    - http://localhost:3000/auth/callback
--    - http://localhost:3000/auth/confirm
--    - https://yourdomain.com/auth/callback (for production)
--    - https://yourdomain.com/auth/confirm (for production)

-- 3. Email confirmation settings:
--    - Enable "Confirm email" if you want users to verify their email
--    - Set "Confirm email redirect URL" to: http://localhost:3000/auth/callback

-- 4. Email templates: You can customize the email templates in Authentication > Email Templates

-- Note: These settings must be configured in the Supabase dashboard, not via SQL
-- This file is for reference only

-- However, we can create a function to help debug auth settings
CREATE OR REPLACE FUNCTION check_auth_config()
RETURNS TABLE (
  setting_name TEXT,
  current_value TEXT,
  recommended_value TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Email Confirmation'::TEXT as setting_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email_confirmed_at IS NULL 
        AND created_at > NOW() - INTERVAL '1 hour'
      ) 
      THEN 'Enabled' 
      ELSE 'Disabled or No Recent Signups' 
    END as current_value,
    'Enabled (recommended for production)'::TEXT as recommended_value,
    'Check Supabase Dashboard'::TEXT as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
