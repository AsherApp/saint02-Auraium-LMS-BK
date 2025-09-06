-- =====================================================
-- CREATE UNIFIED USER PROFILES VIEW
-- =====================================================
-- This migration creates a unified view that combines teachers and students
-- into a single user profiles table for easy access to user information

-- Create a unified user profiles view
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    'teacher' as user_type,
    id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at,
    NULL as student_code,
    NULL as enrollment_date
FROM teachers
WHERE email IS NOT NULL

UNION ALL

SELECT 
    'student' as user_type,
    id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at,
    student_code,
    enrollment_date
FROM students
WHERE email IS NOT NULL;

-- Note: Cannot create index on view directly
-- Indexes on underlying tables (teachers.email, students.email) will be used automatically

-- Create a function to get user profile by email
CREATE OR REPLACE FUNCTION get_user_profile(user_email TEXT)
RETURNS TABLE (
    user_type TEXT,
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    student_code TEXT,
    enrollment_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_type,
        up.id,
        up.email,
        up.first_name,
        up.last_name,
        CONCAT(COALESCE(up.first_name, ''), ' ', COALESCE(up.last_name, '')) as full_name,
        up.student_code,
        up.enrollment_date
    FROM user_profiles up
    WHERE LOWER(up.email) = LOWER(user_email);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This creates a unified view for user profiles that can be used
-- throughout the application to get consistent user information
-- =====================================================
