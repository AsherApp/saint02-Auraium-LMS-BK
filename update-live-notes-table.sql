-- Update live_notes table to support enhanced note features
-- This script adds the missing columns needed for the note-taking functionality

-- First, drop the unique constraint that prevents multiple notes per user per session
ALTER TABLE live_notes DROP CONSTRAINT IF EXISTS live_notes_session_id_author_email_key;

-- Add missing columns
ALTER TABLE live_notes ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE live_notes ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;
ALTER TABLE live_notes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing records to have a default title if title is null
UPDATE live_notes SET title = 'Note ' || to_char(created_at, 'YYYY-MM-DD HH24:MI') WHERE title IS NULL;

-- Make title required for new records
ALTER TABLE live_notes ALTER COLUMN title SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_notes_session_id ON live_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_live_notes_author_email ON live_notes(author_email);
CREATE INDEX IF NOT EXISTS idx_live_notes_is_shared ON live_notes(is_shared);
CREATE INDEX IF NOT EXISTS idx_live_notes_created_at ON live_notes(created_at DESC);

-- Update RLS policies to support the new structure
DROP POLICY IF EXISTS notes_self_rw ON live_notes;
DROP POLICY IF EXISTS notes_teacher_read ON live_notes;

-- Users can read/write their own notes
CREATE POLICY "notes_self_rw" ON live_notes 
  FOR ALL USING (lower(author_email) = lower(auth.email())) 
  WITH CHECK (lower(author_email) = lower(auth.email()));

-- Teachers can read shared notes from sessions they host
CREATE POLICY "notes_teacher_read_shared" ON live_notes 
  FOR SELECT USING (
    is_shared = true AND 
    EXISTS (
      SELECT 1 FROM live_sessions s 
      WHERE s.id = live_notes.session_id 
      AND s.host_email = auth.email()
    )
  );

-- Students can read shared notes from sessions they're enrolled in
CREATE POLICY "notes_student_read_shared" ON live_notes 
  FOR SELECT USING (
    is_shared = true AND 
    EXISTS (
      SELECT 1 FROM live_sessions s
      JOIN enrollments e ON e.course_id = s.course_id
      WHERE s.id = live_notes.session_id 
      AND e.student_email = auth.email()
    )
  );
