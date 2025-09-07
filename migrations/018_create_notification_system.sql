-- =============================================================================
-- NOTIFICATION SYSTEM MIGRATION
-- =============================================================================
-- This migration creates the complete notification system including:
-- - Notifications table for in-app notifications
-- - Email templates for different notification types
-- - Notification preferences for users
-- - Email logs for tracking email delivery
-- =============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'student')),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL UNIQUE,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'student')),
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    course_completion_emails BOOLEAN DEFAULT TRUE,
    module_completion_emails BOOLEAN DEFAULT TRUE,
    assignment_emails BOOLEAN DEFAULT TRUE,
    live_session_emails BOOLEAN DEFAULT TRUE,
    announcement_emails BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_email, user_type)
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    template_name TEXT,
    template_data JSONB DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_is_active ON notification_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_email ON notification_preferences(user_email);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type ON notification_preferences(user_type);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject_template, html_template, text_template) VALUES
(
    'Student Signup Welcome',
    'signup',
    'Welcome to AuraiumLMS - Student Account Created',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AuraiumLMS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AuraiumLMS!</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello {{user_name}}!</h2>
        
        <p>Your student account has been successfully created. You can now access your courses and start learning.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Your Account Details:</h3>
            <p><strong>Student Code:</strong> {{student_code}}</p>
            <p><strong>Email:</strong> {{user_email}}</p>
            <p><strong>Registration Date:</strong> {{registration_date}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{login_url}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Your Account</a>
        </div>
        
        <p>If you have any questions or need assistance, please don''t hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The AuraiumLMS Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This email was sent to {{user_email}}. If you did not create an account, please ignore this email.</p>
    </div>
</body>
</html>',
    'Welcome to AuraiumLMS!

Hello {{user_name}}!

Your student account has been successfully created. You can now access your courses and start learning.

Your Account Details:
- Student Code: {{student_code}}
- Email: {{user_email}}
- Registration Date: {{registration_date}}

Access your account at: {{login_url}}

If you have any questions or need assistance, please don''t hesitate to contact our support team.

Best regards,
The AuraiumLMS Team

This email was sent to {{user_email}}. If you did not create an account, please ignore this email.'
),
(
    'Teacher Signup Welcome',
    'teacher_signup',
    'Welcome to AuraiumLMS - Teacher Account Created',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AuraiumLMS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AuraiumLMS!</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello {{user_name}}!</h2>
        
        <p>Your teacher account has been successfully created. You can now start creating courses, managing students, and tracking their progress.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Your Account Details:</h3>
            <p><strong>Email:</strong> {{user_email}}</p>
            <p><strong>Registration Date:</strong> {{registration_date}}</p>
            <p><strong>Subscription:</strong> Free Tier (up to 50 students)</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{login_url}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Your Dashboard</a>
        </div>
        
        <p>As a teacher, you can:</p>
        <ul>
            <li>Create and manage courses</li>
            <li>Invite students to your courses</li>
            <li>Track student progress and performance</li>
            <li>Create assignments and grade submissions</li>
            <li>Conduct live sessions</li>
        </ul>
        
        <p>If you have any questions or need assistance, please don''t hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The AuraiumLMS Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This email was sent to {{user_email}}. If you did not create an account, please ignore this email.</p>
    </div>
</body>
</html>',
    'Welcome to AuraiumLMS!

Hello {{user_name}}!

Your teacher account has been successfully created. You can now start creating courses, managing students, and tracking their progress.

Your Account Details:
- Email: {{user_email}}
- Registration Date: {{registration_date}}
- Subscription: Free Tier (up to 50 students)

Access your dashboard at: {{login_url}}

As a teacher, you can:
- Create and manage courses
- Invite students to your courses
- Track student progress and performance
- Create assignments and grade submissions
- Conduct live sessions

If you have any questions or need assistance, please don''t hesitate to contact our support team.

Best regards,
The AuraiumLMS Team

This email was sent to {{user_email}}. If you did not create an account, please ignore this email.'
),
(
    'Student Course Invitation',
    'course_invitation',
    'You''ve been invited to join a course on AuraiumLMS',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Invitation - AuraiumLMS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Course Invitation</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello {{student_name}}!</h2>
        
        <p>{{teacher_name}} has invited you to join their course on AuraiumLMS.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Course Details:</h3>
            <p><strong>Course:</strong> {{course_title}}</p>
            <p><strong>Teacher:</strong> {{teacher_name}}</p>
            <p><strong>Description:</strong> {{course_description}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{invite_url}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation</a>
        </div>
        
        <p>Click the button above to create your account and join the course. This invitation will expire in 7 days.</p>
        
        <p>If you have any questions, please contact {{teacher_name}} or our support team.</p>
        
        <p>Best regards,<br>The AuraiumLMS Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This email was sent to {{student_email}}. If you did not expect this invitation, please ignore this email.</p>
    </div>
</body>
</html>',
    'Course Invitation - AuraiumLMS

Hello {{student_name}}!

{{teacher_name}} has invited you to join their course on AuraiumLMS.

Course Details:
- Course: {{course_title}}
- Teacher: {{teacher_name}}
- Description: {{course_description}}

Accept your invitation at: {{invite_url}}

Click the link above to create your account and join the course. This invitation will expire in 7 days.

If you have any questions, please contact {{teacher_name}} or our support team.

Best regards,
The AuraiumLMS Team

This email was sent to {{student_email}}. If you did not expect this invitation, please ignore this email.'
),
(
    'Password Reset',
    'password_reset',
    'AuraiumLMS - Password Reset Request',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - AuraiumLMS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello {{user_name}}!</h2>
        
        <p>You have requested to reset your password for your AuraiumLMS account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{reset_url}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>This link will expire in 24 hours for security reasons.</p>
        
        <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <p>For security reasons, please do not share this link with anyone.</p>
        
        <p>Best regards,<br>The AuraiumLMS Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This email was sent to {{user_email}}. If you did not request a password reset, please ignore this email.</p>
    </div>
</body>
</html>',
    'Password Reset - AuraiumLMS

Hello {{user_name}}!

You have requested to reset your password for your AuraiumLMS account.

Reset your password at: {{reset_url}}

This link will expire in 24 hours for security reasons.

If you did not request this password reset, please ignore this email. Your password will remain unchanged.

For security reasons, please do not share this link with anyone.

Best regards,
The AuraiumLMS Team

This email was sent to {{user_email}}. If you did not request a password reset, please ignore this email.'
),
(
    'Password Changed',
    'password_changed',
    'AuraiumLMS - Password Successfully Changed',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed - AuraiumLMS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello {{user_name}}!</h2>
        
        <p>Your password has been successfully changed for your AuraiumLMS account.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">Security Information:</h3>
            <p><strong>Changed at:</strong> {{change_date}}</p>
            <p><strong>Account:</strong> {{user_email}}</p>
        </div>
        
        <p>If you made this change, no further action is required.</p>
        
        <p>If you did not make this change, please contact our support team immediately as your account may have been compromised.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{login_url}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Your Account</a>
        </div>
        
        <p>Best regards,<br>The AuraiumLMS Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This email was sent to {{user_email}}. If you did not change your password, please contact our support team immediately.</p>
    </div>
</body>
</html>',
    'Password Changed - AuraiumLMS

Hello {{user_name}}!

Your password has been successfully changed for your AuraiumLMS account.

Security Information:
- Changed at: {{change_date}}
- Account: {{user_email}}

If you made this change, no further action is required.

If you did not make this change, please contact our support team immediately as your account may have been compromised.

Access your account at: {{login_url}}

Best regards,
The AuraiumLMS Team

This email was sent to {{user_email}}. If you did not change your password, please contact our support team immediately.'
)
ON CONFLICT (type) DO NOTHING;

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_email, user_type, email_notifications, push_notifications, course_completion_emails, module_completion_emails, assignment_emails, live_session_emails, announcement_emails)
SELECT 
    email,
    'teacher',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM teachers
WHERE email NOT IN (SELECT user_email FROM notification_preferences WHERE user_type = 'teacher')
ON CONFLICT (user_email, user_type) DO NOTHING;

INSERT INTO notification_preferences (user_email, user_type, email_notifications, push_notifications, course_completion_emails, module_completion_emails, assignment_emails, live_session_emails, announcement_emails)
SELECT 
    email,
    'student',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM students
WHERE email NOT IN (SELECT user_email FROM notification_preferences WHERE user_type = 'student')
ON CONFLICT (user_email, user_type) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR ALL USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create RLS policies for email_logs (admin only)
CREATE POLICY "Only service role can access email logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT ALL ON notification_templates TO authenticated;
GRANT ALL ON email_logs TO service_role;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
