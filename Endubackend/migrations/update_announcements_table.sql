-- Update announcements table to include missing fields
-- Add title, course_id, priority, and created_at fields

-- Add new columns to announcements table
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Announcement',
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing announcements to have a title if they don't have one
UPDATE announcements 
SET title = 'Announcement' 
WHERE title IS NULL OR title = '';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_teacher_email ON announcements(teacher_email);
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- Update RLS policies to include course_id
DROP POLICY IF EXISTS announcements_teacher_rw ON announcements;
CREATE POLICY announcements_teacher_rw ON announcements 
FOR ALL USING (lower(teacher_email) = lower(auth.email())) 
WITH CHECK (lower(teacher_email) = lower(auth.email()));

-- Update student read policy to include course-specific announcements
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
