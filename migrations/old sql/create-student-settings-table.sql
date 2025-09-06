-- Create student settings table
CREATE TABLE IF NOT EXISTS student_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications JSONB DEFAULT '{"email": true, "push": true, "assignments": true, "announcements": true, "live_class": true}',
  privacy JSONB DEFAULT '{"profile_visible": true, "show_email": false, "show_bio": true}',
  preferences JSONB DEFAULT '{"language": "en", "timezone": "UTC", "date_format": "MM/DD/YYYY"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_settings_email ON student_settings(student_email);

-- Create RLS policies
ALTER TABLE student_settings ENABLE ROW LEVEL SECURITY;

-- Students can view and update their own settings
CREATE POLICY "Students can manage their own settings" ON student_settings
  FOR ALL USING (student_email = current_user);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_student_settings_updated_at
  BEFORE UPDATE ON student_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_student_settings_updated_at();
