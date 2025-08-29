-- Step 1: Add missing columns to existing tables
-- This is a safe first step that only modifies existing tables

-- 1. Add missing columns to student_progress table
DO $$ 
BEGIN
    -- Add lesson_title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_progress' AND column_name = 'lesson_title') THEN
        ALTER TABLE student_progress ADD COLUMN lesson_title TEXT;
        RAISE NOTICE 'Added lesson_title column to student_progress table';
    ELSE
        RAISE NOTICE 'lesson_title column already exists in student_progress table';
    END IF;
END $$;

-- 2. Add missing columns to student_course_progress table
DO $$ 
BEGIN
    -- Add started_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_course_progress' AND column_name = 'started_at') THEN
        ALTER TABLE student_course_progress ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added started_at column to student_course_progress table';
    ELSE
        RAISE NOTICE 'started_at column already exists in student_course_progress table';
    END IF;

    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_course_progress' AND column_name = 'completed_at') THEN
        ALTER TABLE student_course_progress ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added completed_at column to student_course_progress table';
    ELSE
        RAISE NOTICE 'completed_at column already exists in student_course_progress table';
    END IF;
END $$;

-- 3. Add missing columns to student_activities table
DO $$ 
BEGIN
    -- Add activity_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_activities' AND column_name = 'activity_type') THEN
        ALTER TABLE student_activities ADD COLUMN activity_type TEXT;
        RAISE NOTICE 'Added activity_type column to student_activities table';
    ELSE
        RAISE NOTICE 'activity_type column already exists in student_activities table';
    END IF;
END $$;

-- 4. Update existing records to have proper values
UPDATE student_progress 
SET type = 'lesson_completed' 
WHERE type IS NULL OR type = '';

UPDATE student_activities 
SET activity_type = 'lesson_completed' 
WHERE activity_type IS NULL OR activity_type = '';

-- 5. Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_progress_composite ON student_progress(student_email, course_id, type);
CREATE INDEX IF NOT EXISTS idx_student_activities_composite ON student_activities(student_email, course_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_student_course_progress_composite ON student_course_progress(student_email, course_id);

-- Success message
SELECT 'Step 1 completed: Missing columns added to existing tables' as status;
