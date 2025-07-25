-- Script to clean up any duplicate profiles that might exist

-- First, let's see if there are any duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT id, COUNT(*) as cnt
        FROM profiles
        GROUP BY id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Found % users with duplicate profiles', duplicate_count;
    
    -- If duplicates exist, keep only the most recent one for each user
    IF duplicate_count > 0 THEN
        -- Delete older duplicate profiles, keeping the most recent one
        DELETE FROM profiles 
        WHERE ctid NOT IN (
            SELECT DISTINCT ON (id) ctid
            FROM profiles
            ORDER BY id, created_at DESC
        );
        
        RAISE NOTICE 'Cleaned up duplicate profiles';
    END IF;
END $$;

-- Also clean up any profiles that don't have corresponding auth users
DELETE FROM profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users
);

-- Ensure all existing auth users have profiles
INSERT INTO profiles (id, email, full_name, role, points)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
    COALESCE(u.raw_user_meta_data->>'role', 'learner')::user_role,
    0
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
