-- =====================================================
-- CREATE UNIFIED USER PROFILES VIEW (SIMPLE VERSION)
-- =====================================================
-- This migration creates a unified view that combines teachers and students
-- into a single user profiles table for easy access to user information

-- Drop the view if it exists
DROP VIEW IF EXISTS user_profiles;

-- Create a unified user profiles view
CREATE VIEW user_profiles AS
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

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This creates a unified view for user profiles that can be used
-- throughout the application to get consistent user information
-- =====================================================
