-- =====================================================
-- NOTIFICATION SYSTEM MIGRATION
-- =====================================================
-- This migration creates a comprehensive notification system
-- for email notifications and in-app notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('teacher', 'student')),
    type VARCHAR(100) NOT NULL, -- 'signup', 'password_reset', 'course_completion', 'module_completion', 'assignment_created', 'assignment_due', 'live_session', 'announcement', etc.
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional data like course_id, assignment_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table to track email sending
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_data JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_templates table for email templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_preferences table for user preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('teacher', 'student')),
    email_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    course_completion_emails BOOLEAN DEFAULT TRUE,
    module_completion_emails BOOLEAN DEFAULT TRUE,
    assignment_emails BOOLEAN DEFAULT TRUE,
    live_session_emails BOOLEAN DEFAULT TRUE,
    announcement_emails BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, user_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_data_gin ON notifications USING GIN(data);

CREATE INDEX IF NOT EXISTS idx_email_logs_notification_id ON email_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_email ON notification_preferences(user_email);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type ON notification_preferences(user_type);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject_template, html_template, text_template) VALUES
-- Signup notifications
('teacher_signup', 'signup', 'Welcome to AuraiumLMS - Teacher Account Created', 
'<h1>Welcome to AuraiumLMS!</h1><p>Dear {{teacher_name}},</p><p>Your teacher account has been successfully created. You can now start creating courses and managing your students.</p><p>Login at: <a href="{{login_url}}">{{login_url}}</a></p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Welcome to AuraiumLMS!\n\nDear {{teacher_name}},\n\nYour teacher account has been successfully created. You can now start creating courses and managing your students.\n\nLogin at: {{login_url}}\n\nBest regards,\nThe AuraiumLMS Team'),

('student_signup', 'signup', 'Welcome to AuraiumLMS - Student Account Created', 
'<h1>Welcome to AuraiumLMS!</h1><p>Dear {{student_name}},</p><p>Your student account has been successfully created. You can now access your courses and start learning.</p><p>Login at: <a href="{{login_url}}">{{login_url}}</a></p><p>Your student code: <strong>{{student_code}}</strong></p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Welcome to AuraiumLMS!\n\nDear {{student_name}},\n\nYour student account has been successfully created. You can now access your courses and start learning.\n\nLogin at: {{login_url}}\nYour student code: {{student_code}}\n\nBest regards,\nThe AuraiumLMS Team'),

-- Password reset notifications
('password_reset', 'password_reset', 'AuraiumLMS - Password Reset Request', 
'<h1>Password Reset Request</h1><p>Dear {{user_name}},</p><p>You have requested to reset your password. Click the link below to reset your password:</p><p><a href="{{reset_url}}">Reset Password</a></p><p>This link will expire in 24 hours.</p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Password Reset Request\n\nDear {{user_name}},\n\nYou have requested to reset your password. Click the link below to reset your password:\n\n{{reset_url}}\n\nThis link will expire in 24 hours.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe AuraiumLMS Team'),

('password_reset_success', 'password_reset', 'AuraiumLMS - Password Successfully Reset', 
'<h1>Password Successfully Reset</h1><p>Dear {{user_name}},</p><p>Your password has been successfully reset. You can now login with your new password.</p><p>Login at: <a href="{{login_url}}">{{login_url}}</a></p><p>If you did not make this change, please contact support immediately.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Password Successfully Reset\n\nDear {{user_name}},\n\nYour password has been successfully reset. You can now login with your new password.\n\nLogin at: {{login_url}}\n\nIf you did not make this change, please contact support immediately.\n\nBest regards,\nThe AuraiumLMS Team'),

-- Course completion notifications
('course_completion_student', 'course_completion', 'Congratulations! Course Completed - {{course_title}}', 
'<h1>Congratulations!</h1><p>Dear {{student_name}},</p><p>You have successfully completed the course <strong>{{course_title}}</strong>!</p><p>Completion Date: {{completion_date}}</p><p>Your certificate is available for download in your dashboard.</p><p>Keep up the great work!</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Congratulations!\n\nDear {{student_name}},\n\nYou have successfully completed the course {{course_title}}!\n\nCompletion Date: {{completion_date}}\n\nYour certificate is available for download in your dashboard.\n\nKeep up the great work!\n\nBest regards,\nThe AuraiumLMS Team'),

('course_completion_teacher', 'course_completion', 'Student Completed Course - {{course_title}}', 
'<h1>Student Course Completion</h1><p>Dear {{teacher_name}},</p><p><strong>{{student_name}}</strong> has successfully completed your course <strong>{{course_title}}</strong>.</p><p>Completion Date: {{completion_date}}</p><p>You can view their progress and certificate in your teacher dashboard.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Student Course Completion\n\nDear {{teacher_name}},\n\n{{student_name}} has successfully completed your course {{course_title}}.\n\nCompletion Date: {{completion_date}}\n\nYou can view their progress and certificate in your teacher dashboard.\n\nBest regards,\nThe AuraiumLMS Team'),

-- Module completion notifications
('module_completion_student', 'module_completion', 'Module Completed - {{module_title}}', 
'<h1>Module Completed!</h1><p>Dear {{student_name}},</p><p>You have successfully completed the module <strong>{{module_title}}</strong> in the course <strong>{{course_title}}</strong>.</p><p>Completion Date: {{completion_date}}</p><p>Great job! Continue to the next module to keep learning.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Module Completed!\n\nDear {{student_name}},\n\nYou have successfully completed the module {{module_title}} in the course {{course_title}}.\n\nCompletion Date: {{completion_date}}\n\nGreat job! Continue to the next module to keep learning.\n\nBest regards,\nThe AuraiumLMS Team'),

('module_completion_teacher', 'module_completion', 'Student Completed Module - {{module_title}}', 
'<h1>Student Module Completion</h1><p>Dear {{teacher_name}},</p><p><strong>{{student_name}}</strong> has completed the module <strong>{{module_title}}</strong> in your course <strong>{{course_title}}</strong>.</p><p>Completion Date: {{completion_date}}</p><p>You can track their progress in your teacher dashboard.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Student Module Completion\n\nDear {{teacher_name}},\n\n{{student_name}} has completed the module {{module_title}} in your course {{course_title}}.\n\nCompletion Date: {{completion_date}}\n\nYou can track their progress in your teacher dashboard.\n\nBest regards,\nThe AuraiumLMS Team'),

-- Assignment notifications
('assignment_created', 'assignment', 'New Assignment: {{assignment_title}}', 
'<h1>New Assignment Available</h1><p>Dear {{student_name}},</p><p>A new assignment <strong>{{assignment_title}}</strong> has been created for the course <strong>{{course_title}}</strong>.</p><p>Due Date: {{due_date}}</p><p>Points: {{points}}</p><p>Please check your assignments page to view the details and submit your work.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'New Assignment Available\n\nDear {{student_name}},\n\nA new assignment {{assignment_title}} has been created for the course {{course_title}}.\n\nDue Date: {{due_date}}\nPoints: {{points}}\n\nPlease check your assignments page to view the details and submit your work.\n\nBest regards,\nThe AuraiumLMS Team'),

('assignment_due_reminder', 'assignment', 'Assignment Due Soon: {{assignment_title}}', 
'<h1>Assignment Due Soon</h1><p>Dear {{student_name}},</p><p>This is a reminder that your assignment <strong>{{assignment_title}}</strong> is due soon.</p><p>Due Date: {{due_date}}</p><p>Course: {{course_title}}</p><p>Please make sure to submit your work before the deadline.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Assignment Due Soon\n\nDear {{student_name}},\n\nThis is a reminder that your assignment {{assignment_title}} is due soon.\n\nDue Date: {{due_date}}\nCourse: {{course_title}}\n\nPlease make sure to submit your work before the deadline.\n\nBest regards,\nThe AuraiumLMS Team'),

('assignment_graded', 'assignment', 'Assignment Graded: {{assignment_title}}', 
'<h1>Assignment Graded</h1><p>Dear {{student_name}},</p><p>Your assignment <strong>{{assignment_title}}</strong> has been graded.</p><p>Grade: {{grade}}/{{total_points}} ({{grade_percentage}}%)</p><p>Course: {{course_title}}</p><p>Please check your assignments page to view the feedback.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Assignment Graded\n\nDear {{student_name}},\n\nYour assignment {{assignment_title}} has been graded.\n\nGrade: {{grade}}/{{total_points}} ({{grade_percentage}}%)\nCourse: {{course_title}}\n\nPlease check your assignments page to view the feedback.\n\nBest regards,\nThe AuraiumLMS Team'),

-- Live session notifications
('live_session_scheduled', 'live_session', 'Live Session Scheduled: {{session_title}}', 
'<h1>Live Session Scheduled</h1><p>Dear {{student_name}},</p><p>A live session <strong>{{session_title}}</strong> has been scheduled for your course <strong>{{course_title}}</strong>.</p><p>Date: {{session_date}}</p><p>Time: {{session_time}}</p><p>Duration: {{duration}} minutes</p><p>Please join the session on time.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Live Session Scheduled\n\nDear {{student_name}},\n\nA live session {{session_title}} has been scheduled for your course {{course_title}}.\n\nDate: {{session_date}}\nTime: {{session_time}}\nDuration: {{duration}} minutes\n\nPlease join the session on time.\n\nBest regards,\nThe AuraiumLMS Team'),

('live_session_starting', 'live_session', 'Live Session Starting Soon: {{session_title}}', 
'<h1>Live Session Starting Soon</h1><p>Dear {{student_name}},</p><p>Your live session <strong>{{session_title}}</strong> is starting in 15 minutes.</p><p>Course: {{course_title}}</p><p>Please join the session now.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Live Session Starting Soon\n\nDear {{student_name}},\n\nYour live session {{session_title}} is starting in 15 minutes.\n\nCourse: {{course_title}}\n\nPlease join the session now.\n\nBest regards,\nThe AuraiumLMS Team'),

-- Announcement notifications
('announcement', 'announcement', 'New Announcement: {{announcement_title}}', 
'<h1>New Announcement</h1><p>Dear {{student_name}},</p><p>Your teacher has posted a new announcement for the course <strong>{{course_title}}</strong>.</p><p>Title: {{announcement_title}}</p><p>Message: {{announcement_message}}</p><p>Please check your dashboard for more details.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'New Announcement\n\nDear {{student_name}},\n\nYour teacher has posted a new announcement for the course {{course_title}}.\n\nTitle: {{announcement_title}}\nMessage: {{announcement_message}}\n\nPlease check your dashboard for more details.\n\nBest regards,\nThe AuraiumLMS Team'),

-- Enrollment notifications
('enrollment_confirmed', 'enrollment', 'Enrollment Confirmed: {{course_title}}', 
'<h1>Enrollment Confirmed</h1><p>Dear {{student_name}},</p><p>You have been successfully enrolled in the course <strong>{{course_title}}</strong>.</p><p>You can now access the course materials and start learning.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'Enrollment Confirmed\n\nDear {{student_name}},\n\nYou have been successfully enrolled in the course {{course_title}}.\n\nYou can now access the course materials and start learning.\n\nBest regards,\nThe AuraiumLMS Team'),

('enrollment_teacher', 'enrollment', 'New Student Enrolled: {{course_title}}', 
'<h1>New Student Enrolled</h1><p>Dear {{teacher_name}},</p><p><strong>{{student_name}}</strong> has enrolled in your course <strong>{{course_title}}</strong>.</p><p>You can view their profile and progress in your teacher dashboard.</p><p>Best regards,<br>The AuraiumLMS Team</p>',
'New Student Enrolled\n\nDear {{teacher_name}},\n\n{{student_name}} has enrolled in your course {{course_title}}.\n\nYou can view their profile and progress in your teacher dashboard.\n\nBest regards,\nThe AuraiumLMS Team')
ON CONFLICT (name) DO NOTHING;

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_email, user_type, email_notifications, in_app_notifications, course_completion_emails, module_completion_emails, assignment_emails, live_session_emails, announcement_emails)
SELECT 
    email,
    'teacher',
    true,
    true,
    true,
    true,
    true,
    true,
    true
FROM teachers
WHERE email IS NOT NULL
ON CONFLICT (user_email, user_type) DO NOTHING;

INSERT INTO notification_preferences (user_email, user_type, email_notifications, in_app_notifications, course_completion_emails, module_completion_emails, assignment_emails, live_session_emails, announcement_emails)
SELECT 
    email,
    'student',
    true,
    true,
    true,
    true,
    true,
    true,
    true
FROM students
WHERE email IS NOT NULL
ON CONFLICT (user_email, user_type) DO NOTHING;

-- Create a function to send notifications
CREATE OR REPLACE FUNCTION send_notification(
    p_user_email VARCHAR(255),
    p_user_type VARCHAR(50),
    p_type VARCHAR(100),
    p_title VARCHAR(500),
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_email, user_type, type, title, message, data)
    VALUES (p_user_email, p_user_type, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_email VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE id = p_notification_id AND user_email = p_user_email;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_email VARCHAR(255),
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    type VARCHAR(100),
    title VARCHAR(500),
    message TEXT,
    data JSONB,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.is_read,
        n.created_at
    FROM notifications n
    WHERE n.user_email = p_user_email
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_email VARCHAR(255))
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications
        WHERE user_email = p_user_email AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS policies for email_logs (admin only)
CREATE POLICY "Only admins can view email logs" ON email_logs
    FOR SELECT USING (false); -- Only accessible via service role

-- RLS policies for notification_templates (read-only for users)
CREATE POLICY "Users can view active notification templates" ON notification_templates
    FOR SELECT USING (is_active = true);

-- RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

COMMENT ON TABLE notifications IS 'Stores all user notifications (both email and in-app)';
COMMENT ON TABLE email_logs IS 'Tracks email sending status and logs';
COMMENT ON TABLE notification_templates IS 'Email templates for different notification types';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification types';
