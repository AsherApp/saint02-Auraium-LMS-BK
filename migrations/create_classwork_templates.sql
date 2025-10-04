-- Create classwork_templates table
CREATE TABLE IF NOT EXISTS classwork_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('assignment', 'quiz', 'discussion', 'poll', 'resource')),
    content JSONB,
    estimated_duration INTEGER DEFAULT 15,
    teacher_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_classwork_templates_teacher ON classwork_templates(teacher_email);
CREATE INDEX IF NOT EXISTS idx_classwork_templates_type ON classwork_templates(type);
CREATE INDEX IF NOT EXISTS idx_classwork_templates_created_at ON classwork_templates(created_at);

-- Add RLS policies
ALTER TABLE classwork_templates ENABLE ROW LEVEL SECURITY;

-- Policy for teachers to manage their own templates
CREATE POLICY "Teachers can manage their own templates" ON classwork_templates
    FOR ALL USING (teacher_email = auth.jwt() ->> 'email');

-- Policy for teachers to view templates
CREATE POLICY "Teachers can view their templates" ON classwork_templates
    FOR SELECT USING (teacher_email = auth.jwt() ->> 'email');
