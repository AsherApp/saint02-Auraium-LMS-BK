-- Create user_profiles view
DROP VIEW IF EXISTS user_profiles;

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
