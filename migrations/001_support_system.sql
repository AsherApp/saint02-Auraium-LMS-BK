-- Support System Database Schema
-- Migration 001: Create support system tables

-- Support staff table (extends user system)
CREATE TABLE support_staff (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'support_agent')) DEFAULT 'support_agent',
    password_hash text NOT NULL,
    department text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Support categories for organizing tickets
CREATE TABLE support_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    color text DEFAULT '#6B7280',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Support tickets table
CREATE TABLE support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number text NOT NULL UNIQUE, -- Human-readable ticket number like #TICKET-001
    user_email text NOT NULL,
    user_role text NOT NULL CHECK (user_role IN ('teacher', 'student')),
    category_id uuid REFERENCES support_categories(id),
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status text NOT NULL CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')) DEFAULT 'open',
    subject text NOT NULL,
    description text NOT NULL,
    assigned_to uuid REFERENCES support_staff(id),
    tags text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}', -- Store additional context like course_id, student_id, etc.
    first_response_at timestamptz,
    resolved_at timestamptz,
    closed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Support messages/responses table
CREATE TABLE support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_email text NOT NULL,
    sender_role text NOT NULL CHECK (sender_role IN ('teacher', 'student', 'admin', 'support_agent')),
    message text NOT NULL,
    is_internal boolean NOT NULL DEFAULT false, -- Internal notes between support staff
    attachments jsonb DEFAULT '[]', -- Array of file paths/URLs
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Knowledge base articles table
CREATE TABLE knowledge_base_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    excerpt text,
    category text NOT NULL,
    tags text[] DEFAULT '{}',
    difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    type text CHECK (type IN ('article', 'video', 'download')) DEFAULT 'article',
    author text NOT NULL,
    status text CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    is_featured boolean DEFAULT false,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    helpful_count integer DEFAULT 0,
    estimated_time integer DEFAULT 5, -- Reading time in minutes
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- FAQ table
CREATE TABLE faqs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question text NOT NULL,
    answer text NOT NULL,
    category text NOT NULL,
    tags text[] DEFAULT '{}',
    is_popular boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    not_helpful_count integer DEFAULT 0,
    author text NOT NULL,
    related_articles text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Documentation sections table
CREATE TABLE documentation_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    icon text DEFAULT 'file-text',
    color text DEFAULT 'text-blue-400 bg-blue-500/20',
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Documentation articles table
CREATE TABLE documentation_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid NOT NULL REFERENCES documentation_sections(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    type text CHECK (type IN ('guide', 'reference', 'tutorial', 'api')) DEFAULT 'guide',
    difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_time integer DEFAULT 10, -- Time in minutes
    is_popular boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Video tutorials table
CREATE TABLE video_tutorials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    thumbnail text,
    duration integer NOT NULL, -- Duration in seconds
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    category text NOT NULL,
    tags text[] DEFAULT '{}',
    difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    is_featured boolean DEFAULT false,
    is_popular boolean DEFAULT false,
    video_url text NOT NULL,
    transcript_available boolean DEFAULT false,
    resources text[] DEFAULT '{}', -- Array of resource names
    instructor text NOT NULL,
    series text,
    prerequisites text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audit log for tracking support actions
CREATE TABLE support_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid REFERENCES support_staff(id),
    action text NOT NULL, -- 'ticket_created', 'ticket_assigned', 'status_changed', etc.
    resource_type text NOT NULL, -- 'ticket', 'user', 'subscription', etc.
    resource_id text NOT NULL,
    details jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_user_email ON support_tickets(user_email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_knowledge_base_articles_category ON knowledge_base_articles(category);
CREATE INDEX idx_knowledge_base_articles_status ON knowledge_base_articles(status);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_documentation_articles_section_id ON documentation_articles(section_id);
CREATE INDEX idx_video_tutorials_category ON video_tutorials(category);
CREATE INDEX idx_support_audit_log_staff_id ON support_audit_log(staff_id);
CREATE INDEX idx_support_audit_log_created_at ON support_audit_log(created_at DESC);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_support_staff_updated_at BEFORE UPDATE ON support_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_base_articles_updated_at BEFORE UPDATE ON knowledge_base_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documentation_articles_updated_at BEFORE UPDATE ON documentation_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_tutorials_updated_at BEFORE UPDATE ON video_tutorials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number = 'TICKET-' || LPAD(nextval('ticket_number_seq')::text, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sequence for ticket numbers
CREATE SEQUENCE ticket_number_seq START 1;

-- Trigger for automatic ticket number generation
CREATE TRIGGER generate_ticket_number_trigger 
    BEFORE INSERT ON support_tickets 
    FOR EACH ROW 
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- Insert default support categories
INSERT INTO support_categories (name, description, color) VALUES
('General', 'General questions and support requests', '#6B7280'),
('Technical', 'Technical issues and bug reports', '#EF4444'),
('Billing', 'Subscription and payment related questions', '#10B981'),
('Course Management', 'Help with creating and managing courses', '#3B82F6'),
('Student Management', 'Student enrollment and management issues', '#8B5CF6'),
('Live Sessions', 'Live teaching session support', '#F59E0B'),
('Account', 'Account settings and profile management', '#06B6D4'),
('Feature Request', 'Suggestions for new features', '#84CC16');

-- Insert default documentation sections
INSERT INTO documentation_sections (title, description, icon, color, sort_order) VALUES
('Getting Started', 'Essential guides to help you start using AuraiumLMS effectively', 'zap', 'text-green-400 bg-green-500/20', 1),
('Teaching Tools', 'Master the tools that make online teaching effective', 'graduation-cap', 'text-blue-400 bg-blue-500/20', 2),
('Student Management', 'Effectively manage student enrollment, progress, and communication', 'users', 'text-purple-400 bg-purple-500/20', 3),
('Technical Documentation', 'Advanced features, integrations, and developer resources', 'code', 'text-orange-400 bg-orange-500/20', 4);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for public access to knowledge content (read-only)
CREATE POLICY "Knowledge base articles are viewable by everyone" ON knowledge_base_articles FOR SELECT USING (status = 'published');
CREATE POLICY "FAQs are viewable by everyone" ON faqs FOR SELECT USING (true);
CREATE POLICY "Documentation is viewable by everyone" ON documentation_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Documentation articles are viewable by everyone" ON documentation_articles FOR SELECT USING (true);
CREATE POLICY "Video tutorials are viewable by everyone" ON video_tutorials FOR SELECT USING (true);
CREATE POLICY "Support categories are viewable by everyone" ON support_categories FOR SELECT USING (is_active = true);

-- Policies for ticket access (users can only see their own tickets)
CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT USING (
    user_email = auth.jwt() ->> 'email' OR 
    (auth.jwt() ->> 'role' IN ('admin', 'support_agent'))
);

CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (
    user_email = auth.jwt() ->> 'email'
);

CREATE POLICY "Users can update their own tickets" ON support_tickets FOR UPDATE USING (
    user_email = auth.jwt() ->> 'email' OR 
    (auth.jwt() ->> 'role' IN ('admin', 'support_agent'))
);

-- Policies for ticket messages
CREATE POLICY "Users can view messages for their tickets" ON support_messages FOR SELECT USING (
    ticket_id IN (
        SELECT id FROM support_tickets 
        WHERE user_email = auth.jwt() ->> 'email' OR 
              (auth.jwt() ->> 'role' IN ('admin', 'support_agent'))
    )
);

CREATE POLICY "Users can add messages to their tickets" ON support_messages FOR INSERT WITH CHECK (
    ticket_id IN (
        SELECT id FROM support_tickets 
        WHERE user_email = auth.jwt() ->> 'email'
    ) OR 
    (auth.jwt() ->> 'role' IN ('admin', 'support_agent'))
);

-- Admin/Support staff policies (full access for management)
CREATE POLICY "Support staff can manage all content" ON knowledge_base_articles FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'support_agent')
);

CREATE POLICY "Support staff can manage FAQs" ON faqs FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'support_agent')
);

CREATE POLICY "Support staff can manage documentation" ON documentation_sections FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'support_agent')
);

CREATE POLICY "Support staff can manage documentation articles" ON documentation_articles FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'support_agent')
);

CREATE POLICY "Support staff can manage video tutorials" ON video_tutorials FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'support_agent')
);

-- Add sample admin user
INSERT INTO support_staff (email, name, role, password_hash, department) VALUES
('admin@aurarium.com', 'System Administrator', 'admin', '$2b$10$v1E8wGOXvb9t8qHxQ9Y5SuYWtZqJz5FY8vGHjKlMnOpQrStUvWxYG', 'Administration');
-- Password: 'admin123' (should be changed in production)