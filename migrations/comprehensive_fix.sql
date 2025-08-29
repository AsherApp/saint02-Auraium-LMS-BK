-- COMPREHENSIVE DATABASE FIX MIGRATION
-- This migration fixes all schema issues and adds missing data

-- 1. UPDATE ANNOUNCEMENTS TABLE TO MATCH NEW STRUCTURE
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Announcement',
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing announcements to have a title if they don't have one
UPDATE announcements 
SET title = 'Announcement' 
WHERE title IS NULL OR title = '';

-- 2. UPDATE SUBMISSIONS TABLE TO MATCH ASSIGNMENTPRO API STRUCTURE
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS graded_by TEXT,
ADD COLUMN IF NOT EXISTS rubric_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_submission BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing submissions to have proper timestamps
UPDATE submissions 
SET submitted_at = updated_at 
WHERE submitted_at IS NULL;

-- 3. UPDATE ASSIGNMENTS TABLE TO MATCH ASSIGNMENTPRO API STRUCTURE
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS rubric JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- 4. ADD MISSING TABLES FOR COMPLETE FUNCTIONALITY

-- Student Progress Tracking
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_email, course_id, COALESCE(module_id, '00000000-0000-0000-0000-000000000000'), COALESCE(lesson_id, '00000000-0000-0000-0000-000000000000'), COALESCE(assignment_id, '00000000-0000-0000-0000-000000000000'))
);

-- Quizzes (standalone, not just live)
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score NUMERIC,
  time_taken_minutes INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, student_email)
);

-- Polls (standalone, not just live)
CREATE TABLE IF NOT EXISTS course_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES course_polls(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, student_email)
);

-- Discussions
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADD INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_announcements_teacher_email ON announcements(teacher_email);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_email ON submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

CREATE INDEX IF NOT EXISTS idx_student_progress_student_email ON student_progress(student_email);
CREATE INDEX IF NOT EXISTS idx_student_progress_course_id ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_status ON student_progress(status);

CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_student_email ON quiz_responses(student_email);

CREATE INDEX IF NOT EXISTS idx_course_polls_course_id ON course_polls(course_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);

CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_discussion_id ON discussion_posts(discussion_id);

-- 6. INSERT SAMPLE DATA FOR TESTING

-- Insert a test student
INSERT INTO students (email, name, student_code, status) 
VALUES ('student@test.com', 'Test Student', 'STU001', 'active')
ON CONFLICT (email) DO NOTHING;

-- Enroll the student in the existing course
INSERT INTO enrollments (course_id, student_email)
SELECT c.id, 'student@test.com'
FROM courses c
WHERE c.teacher_email = 'lxbrw23@gmail.com'
LIMIT 1
ON CONFLICT (course_id, student_email) DO NOTHING;

-- Insert sample announcements
INSERT INTO announcements (teacher_email, title, message, course_id, priority, created_at)
SELECT 
  'lxbrw23@gmail.com',
  'Welcome to the Course!',
  'Welcome everyone! I hope you are excited to learn about AI. This course will cover fundamental concepts and practical applications.',
  c.id,
  'normal',
  NOW() - INTERVAL '2 days'
FROM courses c
WHERE c.teacher_email = 'lxbrw23@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO announcements (teacher_email, title, message, course_id, priority, created_at)
SELECT 
  'lxbrw23@gmail.com',
  'Important: Assignment Due Date Extended',
  'Due to popular request, I have extended the deadline for the first assignment by 2 days. Please take advantage of this extra time.',
  c.id,
  'high',
  NOW() - INTERVAL '1 day'
FROM courses c
WHERE c.teacher_email = 'lxbrw23@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample student progress
INSERT INTO student_progress (student_email, course_id, module_id, lesson_id, status, completed_at)
SELECT 
  'student@test.com',
  c.id,
  m.id,
  l.id,
  'completed',
  NOW() - INTERVAL '1 hour'
FROM courses c
JOIN modules m ON m.course_id = c.id
JOIN lessons l ON l.module_id = m.id
WHERE c.teacher_email = 'lxbrw23@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample quiz
INSERT INTO quizzes (course_id, title, description, questions, time_limit_minutes, max_attempts)
SELECT 
  c.id,
  'Introduction to AI Quiz',
  'Test your understanding of basic AI concepts',
  '[
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What does AI stand for?",
      "options": ["Artificial Intelligence", "Automated Information", "Advanced Integration", "Automated Intelligence"],
      "correct_answer": 0,
      "points": 10
    },
    {
      "id": 2,
      "type": "multiple_choice", 
      "question": "Which of the following is NOT a type of machine learning?",
      "options": ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Manual Learning"],
      "correct_answer": 3,
      "points": 10
    }
  ]'::jsonb,
  30,
  2
FROM courses c
WHERE c.teacher_email = 'lxbrw23@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample poll
INSERT INTO course_polls (course_id, question, options, created_by)
SELECT 
  c.id,
  'How would you rate the difficulty of this course so far?',
  '["Too Easy", "Just Right", "Challenging", "Too Difficult"]'::jsonb,
  'lxbrw23@gmail.com'
FROM courses c
WHERE c.teacher_email = 'lxbrw23@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample discussion
INSERT INTO discussions (course_id, title, description, created_by)
SELECT 
  c.id,
  'AI Ethics Discussion',
  'Let''s discuss the ethical implications of AI in our daily lives. Share your thoughts and experiences.',
  'lxbrw23@gmail.com'
FROM courses c
WHERE c.teacher_email = 'lxbrw23@gmail.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 7. UPDATE RLS POLICIES

-- Update announcements RLS policies
DROP POLICY IF EXISTS announcements_teacher_rw ON announcements;
CREATE POLICY announcements_teacher_rw ON announcements 
FOR ALL USING (lower(teacher_email) = lower(auth.email())) 
WITH CHECK (lower(teacher_email) = lower(auth.email()));

DROP POLICY IF EXISTS announcements_student_read ON announcements;
CREATE POLICY announcements_student_read ON announcements 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_email = auth.email() 
    AND (announcements.course_id IS NULL OR announcements.course_id = c.id)
    AND c.teacher_email = announcements.teacher_email
  )
);

-- Enable RLS on new tables
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY student_progress_teacher_rw ON student_progress
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = student_progress.course_id
    AND c.teacher_email = auth.email()
  )
);

CREATE POLICY student_progress_student_rw ON student_progress
FOR ALL USING (student_email = auth.email());

CREATE POLICY quizzes_teacher_rw ON quizzes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = quizzes.course_id
    AND c.teacher_email = auth.email()
  )
);

CREATE POLICY quizzes_student_read ON quizzes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_id = quizzes.course_id
    AND e.student_email = auth.email()
  )
);

CREATE POLICY quiz_responses_student_rw ON quiz_responses
FOR ALL USING (student_email = auth.email());

CREATE POLICY quiz_responses_teacher_read ON quiz_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    JOIN courses c ON q.course_id = c.id
    WHERE q.id = quiz_responses.quiz_id
    AND c.teacher_email = auth.email()
  )
);

CREATE POLICY course_polls_teacher_rw ON course_polls
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = course_polls.course_id
    AND c.teacher_email = auth.email()
  )
);

CREATE POLICY course_polls_student_read ON course_polls
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_id = course_polls.course_id
    AND e.student_email = auth.email()
  )
);

CREATE POLICY poll_responses_student_rw ON poll_responses
FOR ALL USING (student_email = auth.email());

CREATE POLICY discussions_teacher_rw ON discussions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = discussions.course_id
    AND c.teacher_email = auth.email()
  )
);

CREATE POLICY discussions_student_read ON discussions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.course_id = discussions.course_id
    AND e.student_email = auth.email()
  )
);

CREATE POLICY discussion_posts_student_rw ON discussion_posts
FOR ALL USING (author_email = auth.email());

CREATE POLICY discussion_posts_teacher_rw ON discussion_posts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM discussions d
    JOIN courses c ON d.course_id = c.id
    WHERE d.id = discussion_posts.discussion_id
    AND c.teacher_email = auth.email()
  )
);

-- 8. FINAL CLEANUP AND VERIFICATION
-- Update any existing submissions to have proper structure
UPDATE submissions 
SET 
  content = payload,
  student_name = (SELECT name FROM students WHERE email = submissions.student_email),
  submitted_at = updated_at
WHERE content IS NULL OR content = '{}';

-- Ensure all assignments have proper structure
UPDATE assignments 
SET 
  max_attempts = 1,
  allow_late_submissions = TRUE,
  is_published = TRUE,
  points = 100
WHERE max_attempts IS NULL;

COMMIT;
