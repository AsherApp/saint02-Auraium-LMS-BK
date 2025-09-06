-- =====================================================
-- FIX STUDENT_ID MIGRATION ISSUES
-- =====================================================
-- This migration fixes the issues with adding student_id columns
-- and updating existing data from student_email to student_id

-- =====================================================
-- STEP 1: ADD student_id COLUMNS (IF NOT EXISTS)
-- =====================================================

-- Add student_id column to student_progress
ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Add student_id column to submissions  
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Add student_id column to live_participants
ALTER TABLE live_participants ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Add student_id column to student_activities
ALTER TABLE student_activities ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Add student_id column to student_grades
ALTER TABLE student_grades ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Add student_id column to live_notes
ALTER TABLE live_notes ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Add student_id column to live_classwork_submissions
ALTER TABLE live_classwork_submissions ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Add student_id column to poll_responses
ALTER TABLE poll_responses ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: UPDATE EXISTING DATA
-- =====================================================

-- Update student_progress table
UPDATE student_progress 
SET student_id = (SELECT id FROM students WHERE email = student_progress.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- Update submissions table
UPDATE submissions 
SET student_id = (SELECT id FROM students WHERE email = submissions.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- Update live_participants table
UPDATE live_participants 
SET student_id = (SELECT id FROM students WHERE email = live_participants.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- Update student_activities table
UPDATE student_activities 
SET student_id = (SELECT id FROM students WHERE email = student_activities.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- Update student_grades table
UPDATE student_grades 
SET student_id = (SELECT id FROM students WHERE email = student_grades.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- Update live_notes table
UPDATE live_notes 
SET student_id = (SELECT id FROM students WHERE email = live_notes.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- Update live_classwork_submissions table
UPDATE live_classwork_submissions 
SET student_id = (SELECT id FROM students WHERE email = live_classwork_submissions.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- Update poll_responses table
UPDATE poll_responses 
SET student_id = (SELECT id FROM students WHERE email = poll_responses.student_email) 
WHERE student_id IS NULL AND student_email IS NOT NULL;

-- =====================================================
-- STEP 3: CHECK FOR ORPHANED RECORDS
-- =====================================================

-- Check if there are any records that couldn't be updated
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Check student_progress
    SELECT COUNT(*) INTO orphaned_count 
    FROM student_progress 
    WHERE student_id IS NULL AND student_email IS NOT NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'WARNING: % records in student_progress could not be updated (no matching student)', orphaned_count;
    END IF;
    
    -- Check submissions
    SELECT COUNT(*) INTO orphaned_count 
    FROM submissions 
    WHERE student_id IS NULL AND student_email IS NOT NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'WARNING: % records in submissions could not be updated (no matching student)', orphaned_count;
    END IF;
    
    -- Check live_participants
    SELECT COUNT(*) INTO orphaned_count 
    FROM live_participants 
    WHERE student_id IS NULL AND student_email IS NOT NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'WARNING: % records in live_participants could not be updated (no matching student)', orphaned_count;
    END IF;
END $$;

-- =====================================================
-- STEP 4: MAKE student_id NOT NULL (ONLY IF NO NULLS)
-- =====================================================

-- Only make NOT NULL if there are no NULL values
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Check student_progress
    SELECT COUNT(*) INTO null_count FROM student_progress WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE student_progress ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'student_progress.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'student_progress.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
    
    -- Check submissions
    SELECT COUNT(*) INTO null_count FROM submissions WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE submissions ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'submissions.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'submissions.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
    
    -- Check live_participants
    SELECT COUNT(*) INTO null_count FROM live_participants WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE live_participants ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'live_participants.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'live_participants.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
    
    -- Check student_activities
    SELECT COUNT(*) INTO null_count FROM student_activities WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE student_activities ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'student_activities.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'student_activities.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
    
    -- Check student_grades
    SELECT COUNT(*) INTO null_count FROM student_grades WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE student_grades ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'student_grades.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'student_grades.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
    
    -- Check live_notes
    SELECT COUNT(*) INTO null_count FROM live_notes WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE live_notes ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'live_notes.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'live_notes.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
    
    -- Check live_classwork_submissions
    SELECT COUNT(*) INTO null_count FROM live_classwork_submissions WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE live_classwork_submissions ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'live_classwork_submissions.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'live_classwork_submissions.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
    
    -- Check poll_responses
    SELECT COUNT(*) INTO null_count FROM poll_responses WHERE student_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE poll_responses ALTER COLUMN student_id SET NOT NULL;
        RAISE NOTICE 'poll_responses.student_id set to NOT NULL';
    ELSE
        RAISE NOTICE 'poll_responses.student_id has % NULL values - NOT setting to NOT NULL', null_count;
    END IF;
END $$;

-- =====================================================
-- STEP 5: ADD INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_live_participants_student_id ON live_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_student_id ON student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_student_id ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_live_notes_student_id ON live_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_live_classwork_submissions_student_id ON live_classwork_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_student_id ON poll_responses(student_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration safely adds student_id columns and updates existing data
-- It handles orphaned records gracefully and only sets NOT NULL when safe
-- All indexes are added for optimal performance
-- =====================================================
