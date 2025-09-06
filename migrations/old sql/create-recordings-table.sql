-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_email TEXT REFERENCES teachers(email) ON DELETE CASCADE,
  teacher_name TEXT,
  duration INTEGER DEFAULT 0, -- in seconds
  file_size INTEGER DEFAULT 0, -- in bytes
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  quality TEXT DEFAULT 'medium' CHECK (quality IN ('low', 'medium', 'high')),
  format TEXT DEFAULT 'mp4' CHECK (format IN ('mp4', 'webm', 'mov'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recordings_teacher_email ON recordings(teacher_email);
CREATE INDEX IF NOT EXISTS idx_recordings_course_id ON recordings(course_id);
CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_is_bookmarked ON recordings(is_bookmarked);

-- Create RLS policies
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own recordings
CREATE POLICY "Teachers can view their own recordings" ON recordings
  FOR SELECT USING (teacher_email = current_user);

-- Teachers can insert their own recordings
CREATE POLICY "Teachers can insert their own recordings" ON recordings
  FOR INSERT WITH CHECK (teacher_email = current_user);

-- Teachers can update their own recordings
CREATE POLICY "Teachers can update their own recordings" ON recordings
  FOR UPDATE USING (teacher_email = current_user);

-- Teachers can delete their own recordings
CREATE POLICY "Teachers can delete their own recordings" ON recordings
  FOR DELETE USING (teacher_email = current_user);

-- Students can view recordings from courses they're enrolled in
CREATE POLICY "Students can view recordings from enrolled courses" ON recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = recordings.course_id
      AND e.student_email = current_user
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_recordings_updated_at
  BEFORE UPDATE ON recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_recordings_updated_at();
