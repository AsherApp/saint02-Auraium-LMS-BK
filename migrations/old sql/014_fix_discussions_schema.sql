-- Fix Discussions Schema Migration
-- This migration adds missing fields to the discussions table

-- Add missing columns to discussions table
ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS allow_student_posts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;

-- Add missing columns to discussion_posts table
ALTER TABLE discussion_posts 
ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Update existing records to have default values
UPDATE discussions 
SET 
  description = COALESCE(description, ''),
  allow_student_posts = COALESCE(allow_student_posts, true),
  require_approval = COALESCE(require_approval, false),
  is_active = COALESCE(is_active, true)
WHERE description IS NULL OR allow_student_posts IS NULL OR require_approval IS NULL OR is_active IS NULL;

UPDATE discussion_posts 
SET 
  author_role = COALESCE(author_role, 'student'),
  is_approved = COALESCE(is_approved, true)
WHERE author_role IS NULL OR is_approved IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_discussions_is_active ON discussions(is_active);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson_id ON discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_is_approved ON discussion_posts(is_approved);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_author_role ON discussion_posts(author_role);

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS discussions_teacher_rw ON discussions;
DROP POLICY IF EXISTS discussions_student_read ON discussions;
DROP POLICY IF EXISTS discussions_student_create ON discussions;

-- Recreate RLS policies with updated logic
CREATE POLICY discussions_teacher_rw ON discussions FOR ALL USING (
  EXISTS(select 1 from courses c where c.id = discussions.course_id and c.teacher_email = auth.email())
) WITH CHECK (
  EXISTS(select 1 from courses c where c.id = discussions.course_id and c.teacher_email = auth.email())
);

CREATE POLICY discussions_student_read ON discussions FOR SELECT USING (
  is_active = true AND
  EXISTS(select 1 from enrollments e where e.course_id = discussions.course_id and e.student_email = auth.email())
);

CREATE POLICY discussions_student_create ON discussions FOR INSERT WITH CHECK (
  is_active = true AND
  EXISTS(select 1 from enrollments e where e.course_id = discussions.course_id and e.student_email = auth.email())
);

-- Update discussion_posts policies
DROP POLICY IF EXISTS discussion_posts_teacher_rw ON discussion_posts;
DROP POLICY IF EXISTS discussion_posts_student_read ON discussion_posts;
DROP POLICY IF EXISTS discussion_posts_student_create ON discussion_posts;

-- Recreate discussion_posts policies
CREATE POLICY discussion_posts_teacher_rw ON discussion_posts FOR ALL USING (
  EXISTS(select 1 from discussions d join courses c on c.id = d.course_id where d.id = discussion_posts.discussion_id and c.teacher_email = auth.email())
) WITH CHECK (
  EXISTS(select 1 from discussions d join courses c on c.id = d.course_id where d.id = discussion_posts.discussion_id and c.teacher_email = auth.email())
);

CREATE POLICY discussion_posts_student_read ON discussion_posts FOR SELECT USING (
  is_approved = true AND
  EXISTS(select 1 from discussions d join enrollments e on e.course_id = d.course_id where d.id = discussion_posts.discussion_id and e.student_email = auth.email())
);

CREATE POLICY discussion_posts_student_create ON discussion_posts FOR INSERT WITH CHECK (
  EXISTS(select 1 from discussions d join enrollments e on e.course_id = d.course_id where d.id = discussion_posts.discussion_id and e.student_email = auth.email())
);

-- Add some sample discussions for testing
INSERT INTO discussions (title, description, course_id, created_by, allow_student_posts, require_approval, is_active) 
SELECT 
  'Welcome to the Course!',
  'This is a general discussion thread for the course. Feel free to introduce yourself and ask any questions.',
  c.id,
  c.teacher_email,
  true,
  false,
  true
FROM courses c
WHERE NOT EXISTS (
  SELECT 1 FROM discussions d WHERE d.course_id = c.id AND d.title = 'Welcome to the Course!'
)
LIMIT 5;

-- Add some sample discussion posts
INSERT INTO discussion_posts (discussion_id, content, author_email, author_role, is_approved)
SELECT 
  d.id,
  'Welcome everyone! I''m excited to start this course with you all.',
  d.created_by,
  'teacher',
  true
FROM discussions d
WHERE d.title = 'Welcome to the Course!'
AND NOT EXISTS (
  SELECT 1 FROM discussion_posts dp WHERE dp.discussion_id = d.id AND dp.content LIKE 'Welcome everyone!%'
);
