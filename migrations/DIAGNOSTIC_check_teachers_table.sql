-- ========================================
-- DIAGNOSTIC SCRIPT: Check Teachers Table
-- Run this to identify name rewriting issues
-- ========================================

-- 1. Check the teachers table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'teachers'
ORDER BY ordinal_position;

-- 2. Check for any triggers on teachers table
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'teachers';

-- 3. Check actual teacher data to see the pattern
SELECT
    id,
    email,
    SPLIT_PART(email, '@', 1) as email_prefix,
    first_name,
    last_name,
    name,
    CASE
        WHEN first_name = SPLIT_PART(email, '@', 1) AND last_name = 'User'
        THEN 'BAD: Email-based name'
        ELSE 'OK: Real name'
    END as name_status,
    created_at,
    updated_at
FROM teachers
ORDER BY created_at DESC
LIMIT 10;

-- 4. Count how many teachers have the email-based name issue
SELECT
    COUNT(*) as total_teachers,
    SUM(CASE WHEN first_name = SPLIT_PART(email, '@', 1) AND last_name = 'User' THEN 1 ELSE 0 END) as bad_names,
    SUM(CASE WHEN first_name != SPLIT_PART(email, '@', 1) OR last_name != 'User' THEN 1 ELSE 0 END) as good_names
FROM teachers;

-- 5. Check if there's a 'name' column with a default or computed value
SELECT
    column_name,
    column_default,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'teachers'
  AND column_name = 'name';

-- 6. Check for any functions that might be modifying names
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%teacher%'
   OR routine_name LIKE '%name%'
   OR routine_definition LIKE '%teachers%';
