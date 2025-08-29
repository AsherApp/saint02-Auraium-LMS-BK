-- Fix enrollment constraint issue
-- This migration adds the missing unique constraint that the trigger function expects

-- 1. Add unique constraint to student_course_progress table
-- This is needed for the ON CONFLICT clause in the trigger function
DO $$ 
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_course_progress_student_email_course_id_key'
    ) THEN
        -- Add unique constraint
        ALTER TABLE student_course_progress 
        ADD CONSTRAINT student_course_progress_student_email_course_id_key 
        UNIQUE (student_email, course_id);
        
        RAISE NOTICE 'Added unique constraint to student_course_progress table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on student_course_progress table';
    END IF;
END $$;

-- 2. Also ensure the enrollments table has the proper unique constraint
DO $$ 
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'enrollments_course_id_student_email_key'
    ) THEN
        -- Add unique constraint
        ALTER TABLE enrollments 
        ADD CONSTRAINT enrollments_course_id_student_email_key 
        UNIQUE (course_id, student_email);
        
        RAISE NOTICE 'Added unique constraint to enrollments table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on enrollments table';
    END IF;
END $$;

-- 3. Verify the trigger function is working correctly
-- Drop and recreate the trigger to ensure it's using the correct constraint
DROP TRIGGER IF EXISTS trigger_create_course_progress_on_enrollment ON enrollments;

CREATE TRIGGER trigger_create_course_progress_on_enrollment
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION create_course_progress_on_enrollment();

RAISE NOTICE 'Recreated enrollment trigger successfully';
