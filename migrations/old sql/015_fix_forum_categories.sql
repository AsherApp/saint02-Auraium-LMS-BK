-- Fix Forum Categories Migration
-- This migration ensures forum categories exist and are properly set up

-- Create forum_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on forum_categories
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for forum_categories
DROP POLICY IF EXISTS "forum_categories_select_policy" ON forum_categories;
DROP POLICY IF EXISTS "forum_categories_insert_policy" ON forum_categories;
DROP POLICY IF EXISTS "forum_categories_update_policy" ON forum_categories;
DROP POLICY IF EXISTS "forum_categories_delete_policy" ON forum_categories;

CREATE POLICY "forum_categories_select_policy" ON forum_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "forum_categories_insert_policy" ON forum_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_categories_update_policy" ON forum_categories
    FOR UPDATE USING (true);

CREATE POLICY "forum_categories_delete_policy" ON forum_categories
    FOR DELETE USING (true);

-- Insert default forum categories if they don't exist (using individual INSERT statements to avoid conflicts)
INSERT INTO forum_categories (name, description, created_by) 
SELECT 'General Discussion', 'General topics and discussions about the course', 'system'
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'General Discussion');

INSERT INTO forum_categories (name, description, created_by) 
SELECT 'Course Help', 'Questions and help related to course content', 'system'
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Course Help');

INSERT INTO forum_categories (name, description, created_by) 
SELECT 'Technical Support', 'Technical issues and support requests', 'system'
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Technical Support');

INSERT INTO forum_categories (name, description, created_by) 
SELECT 'Announcements', 'Important announcements and updates', 'system'
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Announcements');

INSERT INTO forum_categories (name, description, created_by) 
SELECT 'Student Life', 'Student-related discussions and activities', 'system'
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Student Life');

INSERT INTO forum_categories (name, description, created_by) 
SELECT 'Assignments', 'Discussion about assignments and projects', 'system'
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Assignments');

INSERT INTO forum_categories (name, description, created_by) 
SELECT 'Study Groups', 'Form study groups and collaborate with peers', 'system'
WHERE NOT EXISTS (SELECT 1 FROM forum_categories WHERE name = 'Study Groups');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_categories_is_active ON forum_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_forum_categories_name ON forum_categories(name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_forum_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_forum_categories_updated_at ON forum_categories;
CREATE TRIGGER update_forum_categories_updated_at
    BEFORE UPDATE ON forum_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_categories_updated_at();
