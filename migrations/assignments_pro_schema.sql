-- Update assignments table to match AssignmentProAPI structure
-- Drop existing assignments table and recreate with new schema

DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;

-- Create updated assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('essay', 'file_upload', 'quiz', 'project', 'discussion', 'presentation', 'code_submission', 'peer_review')),
  scope JSONB NOT NULL DEFAULT '{"level": "course"}',
  points INTEGER NOT NULL DEFAULT 100,
  due_at TIMESTAMPTZ,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  allow_late_submissions BOOLEAN DEFAULT true,
  late_penalty_percent INTEGER DEFAULT 10,
  max_attempts INTEGER DEFAULT 1,
  time_limit_minutes INTEGER,
  require_rubric BOOLEAN DEFAULT false,
  rubric JSONB DEFAULT '[]',
  resources JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{
    "allow_comments": true,
    "show_grades_immediately": false,
    "anonymous_grading": false,
    "plagiarism_check": false,
    "group_assignment": false,
    "max_group_size": null,
    "self_assessment": false,
    "peer_review": false,
    "peer_review_count": null
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  student_name TEXT,
  attempt_number INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned', 'late')),
  content JSONB NOT NULL DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  graded_by TEXT REFERENCES teachers(email),
  grade INTEGER,
  feedback TEXT,
  rubric_scores JSONB DEFAULT '[]',
  time_spent_minutes INTEGER DEFAULT 0,
  late_submission BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_email, attempt_number)
);

-- Create indexes for better performance
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_type ON assignments(type);
CREATE INDEX idx_assignments_due_at ON assignments(due_at);
CREATE INDEX idx_assignments_available_from ON assignments(available_from);
CREATE INDEX idx_assignments_available_until ON assignments(available_until);

CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_email ON submissions(student_email);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_graded_at ON submissions(graded_at);

-- Create RLS policies
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own assignments
CREATE POLICY "Teachers can view their own assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = assignments.course_id
      AND c.teacher_email = current_user
    )
  );

-- Teachers can insert their own assignments
CREATE POLICY "Teachers can insert their own assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = assignments.course_id
      AND c.teacher_email = current_user
    )
  );

-- Teachers can update their own assignments
CREATE POLICY "Teachers can update their own assignments" ON assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = assignments.course_id
      AND c.teacher_email = current_user
    )
  );

-- Teachers can delete their own assignments
CREATE POLICY "Teachers can delete their own assignments" ON assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = assignments.course_id
      AND c.teacher_email = current_user
    )
  );

-- Students can view assignments from courses they're enrolled in
CREATE POLICY "Students can view assignments from enrolled courses" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = assignments.course_id
      AND e.student_email = current_user
    )
  );

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions" ON submissions
  FOR SELECT USING (student_email = current_user);

-- Students can insert their own submissions
CREATE POLICY "Students can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (student_email = current_user);

-- Students can update their own submissions
CREATE POLICY "Students can update their own submissions" ON submissions
  FOR UPDATE USING (student_email = current_user);

-- Teachers can view submissions for their assignments
CREATE POLICY "Teachers can view submissions for their assignments" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = submissions.assignment_id
      AND c.teacher_email = current_user
    )
  );

-- Teachers can update submissions for their assignments
CREATE POLICY "Teachers can update submissions for their assignments" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = submissions.assignment_id
      AND c.teacher_email = current_user
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignments_updated_at();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submissions_updated_at();

-- Insert sample data for testing
INSERT INTO assignments (
  course_id,
  title,
  description,
  instructions,
  type,
  scope,
  points,
  due_at,
  available_from,
  available_until,
  allow_late_submissions,
  late_penalty_percent,
  max_attempts,
  time_limit_minutes,
  require_rubric,
  rubric,
  resources,
  settings
) VALUES 
(
  '56881257-6dd1-420a-a30e-d553045a3f36',
  'Sample Essay Assignment',
  'Write a comprehensive essay on the given topic',
  'Please write a 1000-word essay on the impact of technology on education. Include proper citations and follow APA format.',
  'essay',
  '{"level": "course"}',
  100,
  NOW() + INTERVAL '7 days',
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  10,
  1,
  NULL,
  false,
  '[]',
  '[]',
  '{
    "allow_comments": true,
    "show_grades_immediately": false,
    "anonymous_grading": false,
    "plagiarism_check": true,
    "group_assignment": false,
    "self_assessment": false,
    "peer_review": false
  }'
),
(
  '56881257-6dd1-420a-a30e-d553045a3f36',
  'Project Submission',
  'Submit your final project files',
  'Upload your project files including source code, documentation, and presentation slides.',
  'file_upload',
  '{"level": "course"}',
  150,
  NOW() + INTERVAL '14 days',
  NOW(),
  NOW() + INTERVAL '14 days',
  true,
  15,
  2,
  NULL,
  true,
  '[{"id":"1","name":"Code Quality","description":"Well-structured and readable code","maxPoints":30,"levels":[{"level":1,"description":"Poor","points":0},{"level":2,"description":"Fair","points":15},{"level":3,"description":"Good","points":30}]}]',
  '[]',
  '{
    "allow_comments": true,
    "show_grades_immediately": false,
    "anonymous_grading": false,
    "plagiarism_check": false,
    "group_assignment": true,
    "max_group_size": 3,
    "self_assessment": true,
    "peer_review": false
  }'
);
