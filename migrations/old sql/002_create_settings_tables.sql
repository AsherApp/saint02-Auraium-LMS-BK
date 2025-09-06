-- Create settings tables for teachers and students
-- This migration adds the missing settings tables that the backend is trying to access

-- Teacher Settings Table
CREATE TABLE IF NOT EXISTS teacher_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark',
  notifications JSONB NOT NULL DEFAULT '{
    "email": true,
    "push": true,
    "assignments": true,
    "announcements": true,
    "live_class": true,
    "student_questions": true,
    "course_announcements": true,
    "live_session_reminders": true
  }',
  privacy JSONB NOT NULL DEFAULT '{
    "profile_visibility": "public",
    "show_email_to_students": false,
    "allow_student_messages": true
  }',
  preferences JSONB NOT NULL DEFAULT '{
    "language": "en",
    "timezone": "UTC",
    "date_format": "MM/DD/YYYY"
  }',
  course_settings JSONB NOT NULL DEFAULT '{
    "default_course_duration": 60,
    "auto_publish_courses": false,
    "allow_student_discussions": true
  }',
  grading_settings JSONB NOT NULL DEFAULT '{
    "default_grading_scale": "percentage",
    "allow_late_submissions": true,
    "late_submission_penalty": 10,
    "auto_grade_quizzes": true
  }',
  live_class_settings JSONB NOT NULL DEFAULT '{
    "default_session_duration": 60,
    "allow_recording": true,
    "require_approval_to_join": false,
    "max_participants": 50
  }',
  advanced_settings JSONB NOT NULL DEFAULT '{
    "data_export_enabled": true,
    "analytics_tracking": true,
    "beta_features": false
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student Settings Table
CREATE TABLE IF NOT EXISTS student_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark',
  notifications JSONB NOT NULL DEFAULT '{
    "email": true,
    "push": true,
    "assignments": true,
    "announcements": true,
    "live_class": true
  }',
  privacy JSONB NOT NULL DEFAULT '{
    "profile_visible": true,
    "show_email": false,
    "show_bio": true
  }',
  preferences JSONB NOT NULL DEFAULT '{
    "language": "en",
    "timezone": "UTC",
    "date_format": "MM/DD/YYYY"
  }',
  learning_preferences JSONB NOT NULL DEFAULT '{
    "auto_play_videos": false,
    "show_subtitles": true,
    "preferred_learning_style": "visual"
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_settings_teacher_id ON teacher_settings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_settings_student_id ON student_settings(student_id);

-- Enable RLS (Row Level Security)
ALTER TABLE teacher_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_settings
CREATE POLICY "Teachers can view their own settings" ON teacher_settings
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert their own settings" ON teacher_settings
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own settings" ON teacher_settings
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own settings" ON teacher_settings
  FOR DELETE USING (teacher_id = auth.uid());

-- RLS Policies for student_settings
CREATE POLICY "Students can view their own settings" ON student_settings
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own settings" ON student_settings
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own settings" ON student_settings
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Students can delete their own settings" ON student_settings
  FOR DELETE USING (student_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teacher_settings_updated_at 
  BEFORE UPDATE ON teacher_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_settings_updated_at 
  BEFORE UPDATE ON student_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
