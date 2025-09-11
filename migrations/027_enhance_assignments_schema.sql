-- =====================================================
-- ENHANCE ASSIGNMENTS SCHEMA FOR COMPREHENSIVE SYSTEM
-- =====================================================
-- This migration enhances the existing assignments and submissions tables
-- to support all assignment types and features

-- =====================================================
-- ENHANCE ASSIGNMENTS TABLE
-- =====================================================

-- Add missing columns to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'essay' CHECK (type IN ('essay', 'file_upload', 'quiz', 'project', 'discussion', 'presentation', 'code_submission', 'peer_review')),
ADD COLUMN IF NOT EXISTS scope JSONB DEFAULT '{"level": "course"}',
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS late_penalty_percent INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS require_rubric BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rubric JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "allow_comments": true,
  "show_grades_immediately": false,
  "anonymous_grading": false,
  "plagiarism_check": false,
  "group_assignment": false,
  "max_group_size": 4,
  "self_assessment": false,
  "peer_review": false,
  "peer_review_count": 2
}',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived'));

-- Rename due_date to due_at for consistency
ALTER TABLE assignments RENAME COLUMN due_date TO due_at;

-- =====================================================
-- ENHANCE SUBMISSIONS TABLE
-- =====================================================

-- Add missing columns to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'late')),
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS graded_by TEXT,
ADD COLUMN IF NOT EXISTS grade NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS rubric_scores JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_submission BOOLEAN DEFAULT false;

-- Rename submitted_at to match our API
ALTER TABLE submissions RENAME COLUMN submitted_at TO submitted_at;

-- =====================================================
-- CREATE ASSIGNMENT RESOURCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS assignment_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('file', 'link', 'video', 'document')),
    url TEXT NOT NULL,
    description TEXT,
    size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE SUBMISSION ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS submission_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE RUBRIC CRITERIA TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    max_points INTEGER NOT NULL,
    levels JSONB DEFAULT '[]',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE RUBRIC SCORES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rubric_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    points INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, criteria_id)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(type);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at ON assignments(due_at);
CREATE INDEX IF NOT EXISTS idx_assignments_available_from ON assignments(available_from);
CREATE INDEX IF NOT EXISTS idx_assignments_available_until ON assignments(available_until);

-- Submission indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_attempt_number ON submissions(attempt_number);
CREATE INDEX IF NOT EXISTS idx_submissions_grade ON submissions(grade);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_at ON submissions(graded_at);
CREATE INDEX IF NOT EXISTS idx_submissions_late_submission ON submissions(late_submission);

-- Resource indexes
CREATE INDEX IF NOT EXISTS idx_assignment_resources_assignment_id ON assignment_resources(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_resources_type ON assignment_resources(type);

-- Attachment indexes
CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission_id ON submission_attachments(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_attachments_type ON submission_attachments(type);

-- Rubric indexes
CREATE INDEX IF NOT EXISTS idx_rubric_criteria_assignment_id ON rubric_criteria(assignment_id);
CREATE INDEX IF NOT EXISTS idx_rubric_scores_submission_id ON rubric_scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_rubric_scores_criteria_id ON rubric_scores(criteria_id);

-- =====================================================
-- UPDATE EXISTING DATA
-- =====================================================

-- Update existing assignments with default values
UPDATE assignments 
SET 
    instructions = COALESCE(instructions, description),
    type = COALESCE(type, 'essay'),
    scope = COALESCE(scope, '{"level": "course"}'),
    points = COALESCE(points, 100),
    allow_late_submissions = COALESCE(allow_late_submissions, true),
    late_penalty_percent = COALESCE(late_penalty_percent, 10),
    max_attempts = COALESCE(max_attempts, 1),
    require_rubric = COALESCE(require_rubric, false),
    rubric = COALESCE(rubric, '[]'),
    resources = COALESCE(resources, '[]'),
    settings = COALESCE(settings, '{
        "allow_comments": true,
        "show_grades_immediately": false,
        "anonymous_grading": false,
        "plagiarism_check": false,
        "group_assignment": false,
        "max_group_size": 4,
        "self_assessment": false,
        "peer_review": false,
        "peer_review_count": 2
    }'),
    status = COALESCE(status, 'active')
WHERE instructions IS NULL 
   OR type IS NULL 
   OR scope IS NULL 
   OR points IS NULL 
   OR allow_late_submissions IS NULL 
   OR late_penalty_percent IS NULL 
   OR max_attempts IS NULL 
   OR require_rubric IS NULL 
   OR rubric IS NULL 
   OR resources IS NULL 
   OR settings IS NULL 
   OR status IS NULL;

-- Update existing submissions with default values
UPDATE submissions 
SET 
    student_name = COALESCE(student_name, 'Unknown Student'),
    attempt_number = COALESCE(attempt_number, 1),
    status = COALESCE(status, 'submitted'),
    content = COALESCE(content, '{}'),
    attachments = COALESCE(attachments, '[]'),
    rubric_scores = COALESCE(rubric_scores, '[]'),
    time_spent_minutes = COALESCE(time_spent_minutes, 0),
    late_submission = COALESCE(late_submission, false)
WHERE student_name IS NULL 
   OR attempt_number IS NULL 
   OR status IS NULL 
   OR content IS NULL 
   OR attachments IS NULL 
   OR rubric_scores IS NULL 
   OR time_spent_minutes IS NULL 
   OR late_submission IS NULL;

-- =====================================================
-- CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- Assignment with stats view
CREATE OR REPLACE VIEW assignment_stats AS
SELECT 
    a.*,
    COUNT(s.id) as total_submissions,
    COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_submissions,
    COUNT(CASE WHEN s.status = 'returned' THEN 1 END) as returned_submissions,
    COUNT(CASE WHEN s.status = 'submitted' AND s.grade IS NULL THEN 1 END) as pending_grading,
    COUNT(CASE WHEN s.late_submission = true THEN 1 END) as late_count,
    ROUND(AVG(s.grade), 2) as average_grade,
    ROUND(
        CASE 
            WHEN COUNT(s.id) > 0 THEN (COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)::DECIMAL / COUNT(s.id)) * 100
            ELSE 0 
        END, 2
    ) as completion_rate,
    ROUND(
        CASE 
            WHEN COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) > 0 THEN (COUNT(CASE WHEN s.status = 'graded' THEN 1 END)::DECIMAL / COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)) * 100
            ELSE 0 
        END, 2
    ) as grading_progress
FROM assignments a
LEFT JOIN submissions s ON a.id = s.assignment_id
GROUP BY a.id;

-- =====================================================
-- CREATE FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to calculate assignment stats
CREATE OR REPLACE FUNCTION calculate_assignment_stats(assignment_uuid UUID)
RETURNS TABLE (
    total_submissions BIGINT,
    submitted_count BIGINT,
    graded_submissions BIGINT,
    returned_submissions BIGINT,
    pending_grading BIGINT,
    late_count BIGINT,
    average_grade NUMERIC,
    completion_rate NUMERIC,
    grading_progress NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(s.id) as total_submissions,
        COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_submissions,
        COUNT(CASE WHEN s.status = 'returned' THEN 1 END) as returned_submissions,
        COUNT(CASE WHEN s.status = 'submitted' AND s.grade IS NULL THEN 1 END) as pending_grading,
        COUNT(CASE WHEN s.late_submission = true THEN 1 END) as late_count,
        ROUND(AVG(s.grade), 2) as average_grade,
        ROUND(
            CASE 
                WHEN COUNT(s.id) > 0 THEN (COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)::DECIMAL / COUNT(s.id)) * 100
                ELSE 0 
            END, 2
        ) as completion_rate,
        ROUND(
            CASE 
                WHEN COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) > 0 THEN (COUNT(CASE WHEN s.status = 'graded' THEN 1 END)::DECIMAL / COUNT(CASE WHEN s.status = 'submitted' THEN 1 END)) * 100
                ELSE 0 
            END, 2
        ) as grading_progress
    FROM submissions s
    WHERE s.assignment_id = assignment_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignment_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON submission_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rubric_criteria TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rubric_scores TO authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on views
GRANT SELECT ON assignment_stats TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION calculate_assignment_stats(UUID) TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
INSERT INTO migrations (version, description, applied_at) 
VALUES ('027', 'Enhance assignments schema for comprehensive system', NOW())
ON CONFLICT (version) DO NOTHING;
