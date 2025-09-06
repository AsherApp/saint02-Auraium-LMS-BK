-- =====================================================
-- CONSOLIDATED FUNCTIONS AND TRIGGERS
-- =====================================================
-- This file consolidates all the database functions and triggers
-- that are actually used in the system.

-- =====================================================
-- COURSE COMPLETION FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_course_completion() CASCADE;

-- Create the course completion function
CREATE OR REPLACE FUNCTION check_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_data RECORD;
    total_lessons INTEGER;
    completed_lessons INTEGER;
    total_assignments INTEGER;
    completed_assignments INTEGER;
    total_quizzes INTEGER;
    passed_quizzes INTEGER;
    completion_percentage NUMERIC;
BEGIN
    -- Get completion statistics for the student and course
    SELECT 
        COALESCE(lesson_count.total, 0) as total_lessons,
        COALESCE(completed_lesson_count.total, 0) as completed_lessons,
        COALESCE(assignment_count.total, 0) as total_assignments,
        COALESCE(completed_assignment_count.total, 0) as completed_assignments,
        COALESCE(quiz_count.total, 0) as total_quizzes,
        COALESCE(passed_quiz_count.total, 0) as passed_quizzes
    INTO completion_data
    FROM (
        SELECT COUNT(DISTINCT l.id) as total
        FROM courses c
        LEFT JOIN modules m ON m.course_id = c.id
        LEFT JOIN lessons l ON l.module_id = m.id
        WHERE c.id = NEW.course_id
    ) lesson_count
    CROSS JOIN (
        -- Count completed lessons from student_progress
        SELECT COUNT(DISTINCT sp.lesson_id) as total
        FROM student_progress sp
        WHERE sp.student_email = NEW.student_email 
        AND sp.course_id = NEW.course_id 
        AND sp.lesson_id IS NOT NULL
        AND sp.progress_type = 'lesson_completed'
        AND sp.status = 'completed'
    ) completed_lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM assignments a
        WHERE a.course_id = NEW.course_id
    ) assignment_count
    CROSS JOIN (
        -- Count submitted assignments
        SELECT COUNT(DISTINCT s.assignment_id) as total
        FROM submissions s
        WHERE s.student_email = NEW.student_email 
        AND s.course_id = NEW.course_id 
        AND s.status = 'submitted'
    ) completed_assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quizzes q
        WHERE q.course_id = NEW.course_id
    ) quiz_count
    CROSS JOIN (
        -- Count passed quizzes
        SELECT COUNT(DISTINCT qr.quiz_id) as total
        FROM quiz_responses qr
        WHERE qr.student_email = NEW.student_email 
        AND qr.passed = true
    ) passed_quiz_count;

    -- Calculate completion percentage
    total_lessons := completion_data.total_lessons;
    completed_lessons := completion_data.completed_lessons;
    total_assignments := completion_data.total_assignments;
    completed_assignments := completion_data.completed_assignments;
    total_quizzes := completion_data.total_quizzes;
    passed_quizzes := completion_data.passed_quizzes;

    -- Calculate percentage (lessons + assignments + quizzes)
    IF (total_lessons + total_assignments + total_quizzes) > 0 THEN
        completion_percentage := (
            (completed_lessons + completed_assignments + passed_quizzes)::NUMERIC / 
            (total_lessons + total_assignments + total_quizzes)::NUMERIC
        ) * 100;
    ELSE
        completion_percentage := 0;
    END IF;

    -- Update or insert course completion record
    INSERT INTO course_completions (
        student_email, 
        student_id,
        course_id, 
        completion_percentage,
        total_lessons,
        completed_lessons,
        total_assignments,
        completed_assignments,
        total_quizzes,
        passed_quizzes,
        completed_at
    ) VALUES (
        NEW.student_email,
        (SELECT id FROM students WHERE email = NEW.student_email),
        NEW.course_id,
        completion_percentage,
        total_lessons,
        completed_lessons,
        total_assignments,
        completed_assignments,
        total_quizzes,
        passed_quizzes,
        CASE WHEN completion_percentage >= 100 THEN NOW() ELSE NULL END
    )
    ON CONFLICT (student_email, course_id) 
    DO UPDATE SET
        student_id = EXCLUDED.student_id,
        completion_percentage = EXCLUDED.completion_percentage,
        total_lessons = EXCLUDED.total_lessons,
        completed_lessons = EXCLUDED.completed_lessons,
        total_assignments = EXCLUDED.total_assignments,
        completed_assignments = EXCLUDED.completed_assignments,
        total_quizzes = EXCLUDED.total_quizzes,
        passed_quizzes = EXCLUDED.passed_quizzes,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR COURSE COMPLETION
-- =====================================================

-- Create trigger for student_progress table
DROP TRIGGER IF EXISTS trigger_check_course_completion ON student_progress;
CREATE TRIGGER trigger_check_course_completion
    AFTER INSERT OR UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_course_completion();

-- Create trigger for submissions table (for assignment completions)
DROP TRIGGER IF EXISTS trigger_check_course_completion_submissions ON submissions;
CREATE TRIGGER trigger_check_course_completion_submissions
    AFTER INSERT OR UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION check_course_completion();

-- Create trigger for quiz_responses table (for quiz completions)
DROP TRIGGER IF EXISTS trigger_check_course_completion_quiz_responses ON quiz_responses;
CREATE TRIGGER trigger_check_course_completion_quiz_responses
    AFTER INSERT OR UPDATE ON quiz_responses
    FOR EACH ROW
    EXECUTE FUNCTION check_course_completion();

-- =====================================================
-- STUDENT_ID SYNC FUNCTION
-- =====================================================

-- Function to sync student_id when student_email is updated
CREATE OR REPLACE FUNCTION sync_student_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Update student_id based on student_email
    IF NEW.student_email IS NOT NULL THEN
        NEW.student_id := (SELECT id FROM students WHERE email = NEW.student_email);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR STUDENT_ID SYNC
-- =====================================================

-- Create triggers to automatically sync student_id
DROP TRIGGER IF EXISTS trigger_sync_student_id_submissions ON submissions;
CREATE TRIGGER trigger_sync_student_id_submissions
    BEFORE INSERT OR UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_student_progress ON student_progress;
CREATE TRIGGER trigger_sync_student_id_student_progress
    BEFORE INSERT OR UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_live_participants ON live_participants;
CREATE TRIGGER trigger_sync_student_id_live_participants
    BEFORE INSERT OR UPDATE ON live_participants
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_live_attendance_records ON live_attendance_records;
CREATE TRIGGER trigger_sync_student_id_live_attendance_records
    BEFORE INSERT OR UPDATE ON live_attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_live_notes ON live_notes;
CREATE TRIGGER trigger_sync_student_id_live_notes
    BEFORE INSERT OR UPDATE ON live_notes
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_live_classwork_submissions ON live_classwork_submissions;
CREATE TRIGGER trigger_sync_student_id_live_classwork_submissions
    BEFORE INSERT OR UPDATE ON live_classwork_submissions
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_poll_responses ON poll_responses;
CREATE TRIGGER trigger_sync_student_id_poll_responses
    BEFORE INSERT OR UPDATE ON poll_responses
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_quiz_attempts ON quiz_attempts;
CREATE TRIGGER trigger_sync_student_id_quiz_attempts
    BEFORE INSERT OR UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_course_completions ON course_completions;
CREATE TRIGGER trigger_sync_student_id_course_completions
    BEFORE INSERT OR UPDATE ON course_completions
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_module_completions ON module_completions;
CREATE TRIGGER trigger_sync_student_id_module_completions
    BEFORE INSERT OR UPDATE ON module_completions
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_student_activities ON student_activities;
CREATE TRIGGER trigger_sync_student_id_student_activities
    BEFORE INSERT OR UPDATE ON student_activities
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_student_grades ON student_grades;
CREATE TRIGGER trigger_sync_student_id_student_grades
    BEFORE INSERT OR UPDATE ON student_grades
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

DROP TRIGGER IF EXISTS trigger_sync_student_id_student_notes ON student_notes;
CREATE TRIGGER trigger_sync_student_id_student_notes
    BEFORE INSERT OR UPDATE ON student_notes
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_id();

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create triggers for updated_at on all tables that have it
DROP TRIGGER IF EXISTS trigger_update_updated_at_students ON students;
CREATE TRIGGER trigger_update_updated_at_students
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_teachers ON teachers;
CREATE TRIGGER trigger_update_updated_at_teachers
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_courses ON courses;
CREATE TRIGGER trigger_update_updated_at_courses
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_modules ON modules;
CREATE TRIGGER trigger_update_updated_at_modules
    BEFORE UPDATE ON modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_lessons ON lessons;
CREATE TRIGGER trigger_update_updated_at_lessons
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_enrollments ON enrollments;
CREATE TRIGGER trigger_update_updated_at_enrollments
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_assignments ON assignments;
CREATE TRIGGER trigger_update_updated_at_assignments
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_submissions ON submissions;
CREATE TRIGGER trigger_update_updated_at_submissions
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_quizzes ON quizzes;
CREATE TRIGGER trigger_update_updated_at_quizzes
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_quiz_responses ON quiz_responses;
CREATE TRIGGER trigger_update_updated_at_quiz_responses
    BEFORE UPDATE ON quiz_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_quiz_attempts ON quiz_attempts;
CREATE TRIGGER trigger_update_updated_at_quiz_attempts
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_student_progress ON student_progress;
CREATE TRIGGER trigger_update_updated_at_student_progress
    BEFORE UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_course_completions ON course_completions;
CREATE TRIGGER trigger_update_updated_at_course_completions
    BEFORE UPDATE ON course_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_module_completions ON module_completions;
CREATE TRIGGER trigger_update_updated_at_module_completions
    BEFORE UPDATE ON module_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_sessions ON live_sessions;
CREATE TRIGGER trigger_update_updated_at_live_sessions
    BEFORE UPDATE ON live_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_participants ON live_participants;
CREATE TRIGGER trigger_update_updated_at_live_participants
    BEFORE UPDATE ON live_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_attendance_records ON live_attendance_records;
CREATE TRIGGER trigger_update_updated_at_live_attendance_records
    BEFORE UPDATE ON live_attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_attendance_reports ON live_attendance_reports;
CREATE TRIGGER trigger_update_updated_at_live_attendance_reports
    BEFORE UPDATE ON live_attendance_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_attendance_settings ON live_attendance_settings;
CREATE TRIGGER trigger_update_updated_at_live_attendance_settings
    BEFORE UPDATE ON live_attendance_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_notes ON live_notes;
CREATE TRIGGER trigger_update_updated_at_live_notes
    BEFORE UPDATE ON live_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_classwork ON live_classwork;
CREATE TRIGGER trigger_update_updated_at_live_classwork
    BEFORE UPDATE ON live_classwork
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_live_classwork_submissions ON live_classwork_submissions;
CREATE TRIGGER trigger_update_updated_at_live_classwork_submissions
    BEFORE UPDATE ON live_classwork_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_recordings ON recordings;
CREATE TRIGGER trigger_update_updated_at_recordings
    BEFORE UPDATE ON recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_announcements ON announcements;
CREATE TRIGGER trigger_update_updated_at_announcements
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_discussions ON discussions;
CREATE TRIGGER trigger_update_updated_at_discussions
    BEFORE UPDATE ON discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_discussion_posts ON discussion_posts;
CREATE TRIGGER trigger_update_updated_at_discussion_posts
    BEFORE UPDATE ON discussion_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_polls ON polls;
CREATE TRIGGER trigger_update_updated_at_polls
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_poll_responses ON poll_responses;
CREATE TRIGGER trigger_update_updated_at_poll_responses
    BEFORE UPDATE ON poll_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_student_grades ON student_grades;
CREATE TRIGGER trigger_update_updated_at_student_grades
    BEFORE UPDATE ON student_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_notes ON notes;
CREATE TRIGGER trigger_update_updated_at_notes
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_student_notes ON student_notes;
CREATE TRIGGER trigger_update_updated_at_student_notes
    BEFORE UPDATE ON student_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_files ON Files;
CREATE TRIGGER trigger_update_updated_at_files
    BEFORE UPDATE ON Files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_notifications ON notifications;
CREATE TRIGGER trigger_update_updated_at_notifications
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_updated_at_invites ON invites;
CREATE TRIGGER trigger_update_updated_at_invites
    BEFORE UPDATE ON invites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This consolidated migration creates all the functions and triggers
-- that are actually used in the system.
-- 
-- Functions:
-- - check_course_completion(): Tracks course completion progress
-- - sync_student_id(): Automatically syncs student_id with student_email
-- - update_updated_at_column(): Automatically updates updated_at timestamps
-- 
-- Triggers:
-- - Course completion tracking triggers
-- - Student ID sync triggers
-- - Updated at timestamp triggers
-- =====================================================
