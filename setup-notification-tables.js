import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function setupNotificationTables() {
  try {
    console.log('Setting up notification system tables manually...')
    
    // Since we can't use exec_sql, let's try to create the tables using direct SQL
    // We'll need to run this in the Supabase SQL editor
    
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:')
    console.log('')
    console.log('-- Create notifications table')
    console.log('CREATE TABLE IF NOT EXISTS notifications (')
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    console.log('  user_email TEXT NOT NULL,')
    console.log('  user_type TEXT NOT NULL CHECK (user_type IN (\'teacher\', \'student\')),')
    console.log('  type TEXT NOT NULL,')
    console.log('  title TEXT NOT NULL,')
    console.log('  message TEXT NOT NULL,')
    console.log('  data JSONB DEFAULT \'{}\',')
    console.log('  is_read BOOLEAN DEFAULT FALSE,')
    console.log('  is_email_sent BOOLEAN DEFAULT FALSE,')
    console.log('  email_sent_at TIMESTAMPTZ,')
    console.log('  created_at TIMESTAMPTZ DEFAULT NOW(),')
    console.log('  updated_at TIMESTAMPTZ DEFAULT NOW()')
    console.log(');')
    console.log('')
    console.log('-- Create notification_templates table')
    console.log('CREATE TABLE IF NOT EXISTS notification_templates (')
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    console.log('  name TEXT NOT NULL UNIQUE,')
    console.log('  type TEXT NOT NULL UNIQUE,')
    console.log('  subject_template TEXT NOT NULL,')
    console.log('  html_template TEXT NOT NULL,')
    console.log('  text_template TEXT,')
    console.log('  is_active BOOLEAN DEFAULT TRUE,')
    console.log('  created_at TIMESTAMPTZ DEFAULT NOW(),')
    console.log('  updated_at TIMESTAMPTZ DEFAULT NOW()')
    console.log(');')
    console.log('')
    console.log('-- Create notification_preferences table')
    console.log('CREATE TABLE IF NOT EXISTS notification_preferences (')
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    console.log('  user_email TEXT NOT NULL,')
    console.log('  user_type TEXT NOT NULL CHECK (user_type IN (\'teacher\', \'student\')),')
    console.log('  email_notifications BOOLEAN DEFAULT TRUE,')
    console.log('  push_notifications BOOLEAN DEFAULT TRUE,')
    console.log('  course_completion_emails BOOLEAN DEFAULT TRUE,')
    console.log('  module_completion_emails BOOLEAN DEFAULT TRUE,')
    console.log('  assignment_emails BOOLEAN DEFAULT TRUE,')
    console.log('  live_session_emails BOOLEAN DEFAULT TRUE,')
    console.log('  announcement_emails BOOLEAN DEFAULT TRUE,')
    console.log('  created_at TIMESTAMPTZ DEFAULT NOW(),')
    console.log('  updated_at TIMESTAMPTZ DEFAULT NOW(),')
    console.log('  UNIQUE(user_email, user_type)')
    console.log(');')
    console.log('')
    console.log('-- Create email_logs table')
    console.log('CREATE TABLE IF NOT EXISTS email_logs (')
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    console.log('  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,')
    console.log('  recipient_email TEXT NOT NULL,')
    console.log('  recipient_name TEXT,')
    console.log('  subject TEXT NOT NULL,')
    console.log('  template_name TEXT,')
    console.log('  template_data JSONB DEFAULT \'{}\',')
    console.log('  status TEXT NOT NULL CHECK (status IN (\'pending\', \'sent\', \'failed\')),')
    console.log('  error_message TEXT,')
    console.log('  sent_at TIMESTAMPTZ,')
    console.log('  created_at TIMESTAMPTZ DEFAULT NOW()')
    console.log(');')
    console.log('')
    console.log('-- Insert default email templates')
    console.log('INSERT INTO notification_templates (name, type, subject_template, html_template, text_template) VALUES')
    console.log('(\'Student Signup Welcome\', \'signup\', \'Welcome to AuraiumLMS - Student Account Created\', \'<h1>Welcome to AuraiumLMS!</h1><p>Hello {{user_name}}!</p><p>Your student account has been successfully created.</p><p>Student Code: {{student_code}}</p><p>Access your account at: {{login_url}}</p>\', \'Welcome to AuraiumLMS!\\n\\nHello {{user_name}}!\\n\\nYour student account has been successfully created.\\n\\nStudent Code: {{student_code}}\\n\\nAccess your account at: {{login_url}}\'),')
    console.log('(\'Teacher Signup Welcome\', \'teacher_signup\', \'Welcome to AuraiumLMS - Teacher Account Created\', \'<h1>Welcome to AuraiumLMS!</h1><p>Hello {{user_name}}!</p><p>Your teacher account has been successfully created.</p><p>Access your dashboard at: {{login_url}}</p>\', \'Welcome to AuraiumLMS!\\n\\nHello {{user_name}}!\\n\\nYour teacher account has been successfully created.\\n\\nAccess your dashboard at: {{login_url}}\'),')
    console.log('(\'Student Course Invitation\', \'course_invitation\', \'You\\\'ve been invited to join a course on AuraiumLMS\', \'<h1>Course Invitation</h1><p>Hello {{student_name}}!</p><p>{{teacher_name}} has invited you to join their course: {{course_title}}</p><p>Accept your invitation at: {{invite_url}}</p>\', \'Course Invitation\\n\\nHello {{student_name}}!\\n\\n{{teacher_name}} has invited you to join their course: {{course_title}}\\n\\nAccept your invitation at: {{invite_url}}\'),')
    console.log('(\'Password Reset\', \'password_reset\', \'AuraiumLMS - Password Reset Request\', \'<h1>Password Reset</h1><p>Hello {{user_name}}!</p><p>You have requested to reset your password.</p><p>Reset your password at: {{reset_url}}</p>\', \'Password Reset\\n\\nHello {{user_name}}!\\n\\nYou have requested to reset your password.\\n\\nReset your password at: {{reset_url}}\'),')
    console.log('(\'Password Changed\', \'password_changed\', \'AuraiumLMS - Password Successfully Changed\', \'<h1>Password Changed</h1><p>Hello {{user_name}}!</p><p>Your password has been successfully changed.</p><p>Changed at: {{change_date}}</p>\', \'Password Changed\\n\\nHello {{user_name}}!\\n\\nYour password has been successfully changed.\\n\\nChanged at: {{change_date}}\')')
    console.log('ON CONFLICT (type) DO NOTHING;')
    console.log('')
    console.log('✅ After running the SQL above, the notification system will be ready!')
    console.log('')
    console.log('🔧 Next steps:')
    console.log('1. Configure SMTP settings in your .env file:')
    console.log('   SMTP_HOST=smtp.gmail.com')
    console.log('   SMTP_PORT=587')
    console.log('   SMTP_USER=your-email@gmail.com')
    console.log('   SMTP_PASS=your-app-password')
    console.log('   SMTP_FROM=noreply@auraiumlms.com')
    console.log('')
    console.log('2. Test the email system using the test endpoint:')
    console.log('   POST /api/notifications/test-email')
    console.log('   Body: { "testEmail": "your-email@example.com" }')
    
  } catch (error) {
    console.error('Error setting up notification tables:', error)
    process.exit(1)
  }
}

setupNotificationTables()
