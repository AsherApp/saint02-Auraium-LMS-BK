-- =============================================================================
-- AURAIUM LMS SUPPORT SYSTEM - COMPLETE DATABASE SETUP
-- =============================================================================
-- Run this file manually in your Supabase SQL editor or PostgreSQL client
-- This creates all tables, policies, and functions needed for the support system
-- =============================================================================

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS support_categories CASCADE;
DROP TABLE IF EXISTS support_staff CASCADE;
DROP TABLE IF EXISTS knowledge_base_articles CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS documentation_sections CASCADE;
DROP TABLE IF EXISTS video_tutorials CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================================================
-- 1. UTILITY FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- 2. SUPPORT STAFF TABLE
-- =============================================================================

CREATE TABLE support_staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'support_agent', 'manager')) DEFAULT 'support_agent',
    department text,
    is_active boolean NOT NULL DEFAULT true,
    avatar_url text,
    bio text,
    specializations text[],
    max_concurrent_tickets integer DEFAULT 10,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for support_staff
CREATE TRIGGER update_support_staff_updated_at
    BEFORE UPDATE ON support_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. SUPPORT CATEGORIES TABLE
-- =============================================================================

CREATE TABLE support_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    color text DEFAULT '#6b7280',
    icon text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for support_categories
CREATE TRIGGER update_support_categories_updated_at
    BEFORE UPDATE ON support_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. SUPPORT TICKETS TABLE
-- =============================================================================

CREATE TABLE support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number text NOT NULL UNIQUE,
    user_email text NOT NULL,
    user_role text NOT NULL CHECK (user_role IN ('teacher', 'student')),
    category_id uuid REFERENCES support_categories(id),
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status text NOT NULL CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')) DEFAULT 'open',
    subject text NOT NULL,
    description text NOT NULL,
    assigned_to uuid REFERENCES support_staff(id),
    tags text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    resolution_notes text,
    resolution_time interval,
    customer_satisfaction integer CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    first_response_at timestamptz,
    resolved_at timestamptz,
    closed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for support_tickets
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Generate unique ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := 'AU-';
    i integer;
BEGIN
    -- Generate format: AU-ABC123-DEF456
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    result := result || '-';
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        LOOP
            NEW.ticket_number := generate_ticket_number();
            EXIT WHEN NOT EXISTS (SELECT 1 FROM support_tickets WHERE ticket_number = NEW.ticket_number);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_support_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- =============================================================================
-- 5. SUPPORT MESSAGES TABLE
-- =============================================================================

CREATE TABLE support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_email text NOT NULL,
    sender_role text NOT NULL CHECK (sender_role IN ('teacher', 'student', 'support_agent', 'admin')),
    sender_name text,
    message_type text NOT NULL CHECK (message_type IN ('message', 'note', 'status_change', 'assignment')) DEFAULT 'message',
    content text NOT NULL,
    attachments jsonb DEFAULT '[]',
    is_internal boolean NOT NULL DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for support_messages
CREATE TRIGGER update_support_messages_updated_at
    BEFORE UPDATE ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. KNOWLEDGE BASE ARTICLES TABLE
-- =============================================================================

CREATE TABLE knowledge_base_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text NOT NULL,
    excerpt text,
    category text NOT NULL,
    tags text[] DEFAULT '{}',
    featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    view_count integer NOT NULL DEFAULT 0,
    helpful_count integer NOT NULL DEFAULT 0,
    not_helpful_count integer NOT NULL DEFAULT 0,
    author_email text,
    author_name text,
    seo_title text,
    seo_description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for knowledge_base_articles
CREATE TRIGGER update_knowledge_base_articles_updated_at
    BEFORE UPDATE ON knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. FAQS TABLE
-- =============================================================================

CREATE TABLE faqs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question text NOT NULL,
    answer text NOT NULL,
    category text NOT NULL,
    tags text[] DEFAULT '{}',
    is_featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    view_count integer NOT NULL DEFAULT 0,
    helpful_count integer NOT NULL DEFAULT 0,
    not_helpful_count integer NOT NULL DEFAULT 0,
    sort_order integer DEFAULT 0,
    author_email text,
    author_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for faqs
CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. DOCUMENTATION SECTIONS TABLE
-- =============================================================================

CREATE TABLE documentation_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text NOT NULL,
    category text NOT NULL,
    parent_id uuid REFERENCES documentation_sections(id),
    sort_order integer DEFAULT 0,
    is_published boolean NOT NULL DEFAULT true,
    view_count integer NOT NULL DEFAULT 0,
    author_email text,
    author_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for documentation_sections
CREATE TRIGGER update_documentation_sections_updated_at
    BEFORE UPDATE ON documentation_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. VIDEO TUTORIALS TABLE
-- =============================================================================

CREATE TABLE video_tutorials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    thumbnail_url text,
    duration integer, -- in seconds
    category text NOT NULL,
    tags text[] DEFAULT '{}',
    difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    is_featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    view_count integer NOT NULL DEFAULT 0,
    like_count integer NOT NULL DEFAULT 0,
    sort_order integer DEFAULT 0,
    author_email text,
    author_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger for video_tutorials
CREATE TRIGGER update_video_tutorials_updated_at
    BEFORE UPDATE ON video_tutorials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Support tickets indexes
CREATE INDEX idx_support_tickets_user_email ON support_tickets(user_email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_category_id ON support_tickets(category_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Support messages indexes
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_sender_email ON support_messages(sender_email);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);

-- Knowledge base indexes
CREATE INDEX idx_knowledge_base_articles_category ON knowledge_base_articles(category);
CREATE INDEX idx_knowledge_base_articles_published ON knowledge_base_articles(is_published);
CREATE INDEX idx_knowledge_base_articles_featured ON knowledge_base_articles(featured);
CREATE INDEX idx_knowledge_base_articles_slug ON knowledge_base_articles(slug);

-- FAQ indexes
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_published ON faqs(is_published);
CREATE INDEX idx_faqs_featured ON faqs(is_featured);

-- Documentation indexes
CREATE INDEX idx_documentation_sections_category ON documentation_sections(category);
CREATE INDEX idx_documentation_sections_published ON documentation_sections(is_published);
CREATE INDEX idx_documentation_sections_parent_id ON documentation_sections(parent_id);
CREATE INDEX idx_documentation_sections_slug ON documentation_sections(slug);

-- Video tutorials indexes
CREATE INDEX idx_video_tutorials_category ON video_tutorials(category);
CREATE INDEX idx_video_tutorials_published ON video_tutorials(is_published);
CREATE INDEX idx_video_tutorials_featured ON video_tutorials(is_featured);

-- =============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tutorials ENABLE ROW LEVEL SECURITY;

-- Support staff policies
CREATE POLICY "Support staff can view all staff" ON support_staff
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage support staff" ON support_staff
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE role = 'admin')
    );

-- Support categories policies
CREATE POLICY "Everyone can view active categories" ON support_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Support staff can manage categories" ON support_categories
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (
        user_email = auth.jwt() ->> 'email' OR
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own tickets" ON support_tickets
    FOR UPDATE USING (
        user_email = auth.jwt() ->> 'email' OR
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

-- Support messages policies
CREATE POLICY "Users can view messages for their tickets" ON support_messages
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM support_tickets 
            WHERE user_email = auth.jwt() ->> 'email'
        ) OR
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

CREATE POLICY "Users can create messages" ON support_messages
    FOR INSERT WITH CHECK (
        ticket_id IN (
            SELECT id FROM support_tickets 
            WHERE user_email = auth.jwt() ->> 'email'
        ) OR
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

-- Content policies (public read access)
CREATE POLICY "Everyone can view published knowledge base articles" ON knowledge_base_articles
    FOR SELECT USING (is_published = true);

CREATE POLICY "Support staff can manage knowledge base" ON knowledge_base_articles
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

CREATE POLICY "Everyone can view published FAQs" ON faqs
    FOR SELECT USING (is_published = true);

CREATE POLICY "Support staff can manage FAQs" ON faqs
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

CREATE POLICY "Everyone can view published documentation" ON documentation_sections
    FOR SELECT USING (is_published = true);

CREATE POLICY "Support staff can manage documentation" ON documentation_sections
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

CREATE POLICY "Everyone can view published video tutorials" ON video_tutorials
    FOR SELECT USING (is_published = true);

CREATE POLICY "Support staff can manage video tutorials" ON video_tutorials
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (SELECT email FROM support_staff WHERE is_active = true)
    );

-- =============================================================================
-- 12. SAMPLE DATA (OPTIONAL)
-- =============================================================================

-- Insert default support categories
INSERT INTO support_categories (name, description, color, icon) VALUES
('Technical', 'Technical issues and bugs', '#ef4444', 'Bug'),
('Billing', 'Billing and subscription questions', '#10b981', 'CreditCard'),
('General', 'General questions and support', '#6366f1', 'HelpCircle'),
('Feature Request', 'Requests for new features', '#8b5cf6', 'Lightbulb');

-- Insert default admin user (update email as needed)
INSERT INTO support_staff (email, name, role, department) VALUES
('admin@aurarium.com', 'Support Admin', 'admin', 'Support');

-- Insert sample knowledge base articles
INSERT INTO knowledge_base_articles (title, slug, content, excerpt, category, featured, author_email, author_name) VALUES
('Getting Started with AuraiumLMS', 'getting-started', 
'# Getting Started with AuraiumLMS

Welcome to AuraiumLMS! This guide will help you get started with our learning management system.

## Setting Up Your Account
1. Complete your profile information
2. Set up your first course
3. Invite students to join

## Creating Your First Course
Follow these steps to create your first course...', 
'Learn how to get started with AuraiumLMS and create your first course.',
'Getting Started', true, 'admin@aurarium.com', 'Support Admin'),

('How to Add Students', 'how-to-add-students',
'# Adding Students to Your Course

This article explains how to add students to your courses in AuraiumLMS.

## Method 1: Send Invitations
You can send email invitations to students...

## Method 2: Share Student Codes
Each student gets a unique code...', 
'Learn different ways to add students to your courses.',
'Courses', false, 'admin@aurarium.com', 'Support Admin');

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category, is_featured) VALUES
('How do I reset my password?', 'You can reset your password by clicking the "Forgot Password" link on the login page. Enter your email address and follow the instructions sent to your email.', 'Account', true),
('Can I have unlimited students?', 'The number of students depends on your subscription plan. Free accounts can have up to 5 students, while Pro accounts support up to 50 students.', 'Billing', true),
('How do I create a live session?', 'To create a live session, go to your course, click on "Live Sessions" and then "Schedule New Session". Fill in the details and your session will be created.', 'Live Sessions', false);

-- =============================================================================
-- END OF SETUP
-- =============================================================================

-- Verify installation
SELECT 'Support system database setup completed successfully!' as status;

-- Show table counts
SELECT 
    'support_staff' as table_name, COUNT(*) as record_count FROM support_staff
UNION ALL
SELECT 'support_categories', COUNT(*) FROM support_categories
UNION ALL
SELECT 'knowledge_base_articles', COUNT(*) FROM knowledge_base_articles
UNION ALL
SELECT 'faqs', COUNT(*) FROM faqs;