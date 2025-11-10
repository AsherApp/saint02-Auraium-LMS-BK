-- ========================================
-- FIX SCRIPT: Teacher Name Issues
-- Run this AFTER identifying the root cause
-- ========================================

-- ========================================
-- FIX 1: Remove problematic 'name' column if it exists
-- (The app constructs name from first_name + last_name)
-- ========================================

-- Check if 'name' column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'teachers'
          AND column_name = 'name'
    ) THEN
        -- Drop the name column if it exists
        ALTER TABLE teachers DROP COLUMN name;
        RAISE NOTICE 'Dropped name column from teachers table';
    ELSE
        RAISE NOTICE 'No name column found in teachers table';
    END IF;
END $$;

-- ========================================
-- FIX 2: Drop any triggers that might be modifying names
-- ========================================

-- List all triggers first (for reference)
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'teachers'
    LOOP
        RAISE NOTICE 'Found trigger: %', trigger_rec.trigger_name;
        -- Uncomment the line below to actually drop triggers
        -- EXECUTE format('DROP TRIGGER IF EXISTS %I ON teachers', trigger_rec.trigger_name);
    END LOOP;
END $$;

-- If you identified a specific trigger, drop it here:
-- DROP TRIGGER IF EXISTS [trigger_name] ON teachers;

-- ========================================
-- FIX 3: Update existing bad names to NULL
-- (Users will need to update their profiles)
-- ========================================

-- Show teachers with bad names first
SELECT
    id,
    email,
    first_name,
    last_name,
    'BAD NAME' as status
FROM teachers
WHERE first_name = SPLIT_PART(email, '@', 1)
  AND last_name = 'User';

-- Set bad names to NULL so teachers are forced to update
-- UPDATE teachers
-- SET
--     first_name = NULL,
--     last_name = NULL
-- WHERE first_name = SPLIT_PART(email, '@', 1)
--   AND last_name = 'User';

-- ========================================
-- FIX 4: Alternative - Set to placeholder that teachers can change
-- ========================================

-- UPDATE teachers
-- SET
--     first_name = 'Please',
--     last_name = 'Update'
-- WHERE first_name = SPLIT_PART(email, '@', 1)
--   AND last_name = 'User';

-- ========================================
-- VERIFICATION: Check that the fix worked
-- ========================================

SELECT
    COUNT(*) as total_teachers,
    SUM(CASE WHEN first_name = SPLIT_PART(email, '@', 1) AND last_name = 'User' THEN 1 ELSE 0 END) as bad_names_remaining,
    SUM(CASE WHEN first_name IS NULL OR last_name IS NULL THEN 1 ELSE 0 END) as null_names,
    SUM(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND (first_name != SPLIT_PART(email, '@', 1) OR last_name != 'User') THEN 1 ELSE 0 END) as good_names
FROM teachers;
