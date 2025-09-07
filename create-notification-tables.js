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

async function createNotificationTables() {
  try {
    console.log('Creating notification system tables...')
    
    // Create notifications table
    console.log('Creating notifications table...')
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (notificationsError) {
      console.log('Notifications table error (might already exist):', notificationsError.message)
    } else {
      console.log('✅ Notifications table created successfully')
    }
    
    // Create notification_templates table
    console.log('Creating notification_templates table...')
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (templatesError) {
      console.log('Notification templates table error (might already exist):', templatesError.message)
    } else {
      console.log('✅ Notification templates table created successfully')
    }
    
    // Create notification_preferences table
    console.log('Creating notification_preferences table...')
    const { error: preferencesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (preferencesError) {
      console.log('Notification preferences table error (might already exist):', preferencesError.message)
    } else {
      console.log('✅ Notification preferences table created successfully')
    }
    
    // Create email_logs table
    console.log('Creating email_logs table...')
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (logsError) {
      console.log('Email logs table error (might already exist):', logsError.message)
    } else {
      console.log('✅ Email logs table created successfully')
    }
    
    // Insert default email templates
    console.log('Inserting default email templates...')
    const templates = [
      {
        name: 'Student Signup Welcome',
        type: 'signup',
        subject_template: 'Welcome to AuraiumLMS - Student Account Created',
        html_template: '<h1>Welcome to AuraiumLMS!</h1><p>Hello {{user_name}}!</p><p>Your student account has been successfully created.</p><p>Student Code: {{student_code}}</p><p>Access your account at: {{login_url}}</p>',
        text_template: 'Welcome to AuraiumLMS!\n\nHello {{user_name}}!\n\nYour student account has been successfully created.\n\nStudent Code: {{student_code}}\n\nAccess your account at: {{login_url}}'
      },
      {
        name: 'Teacher Signup Welcome',
        type: 'teacher_signup',
        subject_template: 'Welcome to AuraiumLMS - Teacher Account Created',
        html_template: '<h1>Welcome to AuraiumLMS!</h1><p>Hello {{user_name}}!</p><p>Your teacher account has been successfully created.</p><p>Access your dashboard at: {{login_url}}</p>',
        text_template: 'Welcome to AuraiumLMS!\n\nHello {{user_name}}!\n\nYour teacher account has been successfully created.\n\nAccess your dashboard at: {{login_url}}'
      },
      {
        name: 'Student Course Invitation',
        type: 'course_invitation',
        subject_template: 'You\'ve been invited to join a course on AuraiumLMS',
        html_template: '<h1>Course Invitation</h1><p>Hello {{student_name}}!</p><p>{{teacher_name}} has invited you to join their course: {{course_title}}</p><p>Accept your invitation at: {{invite_url}}</p>',
        text_template: 'Course Invitation\n\nHello {{student_name}}!\n\n{{teacher_name}} has invited you to join their course: {{course_title}}\n\nAccept your invitation at: {{invite_url}}'
      },
      {
        name: 'Password Reset',
        type: 'password_reset',
        subject_template: 'AuraiumLMS - Password Reset Request',
        html_template: '<h1>Password Reset</h1><p>Hello {{user_name}}!</p><p>You have requested to reset your password.</p><p>Reset your password at: {{reset_url}}</p>',
        text_template: 'Password Reset\n\nHello {{user_name}}!\n\nYou have requested to reset your password.\n\nReset your password at: {{reset_url}}'
      },
      {
        name: 'Password Changed',
        type: 'password_changed',
        subject_template: 'AuraiumLMS - Password Successfully Changed',
        html_template: '<h1>Password Changed</h1><p>Hello {{user_name}}!</p><p>Your password has been successfully changed.</p><p>Changed at: {{change_date}}</p>',
        text_template: 'Password Changed\n\nHello {{user_name}}!\n\nYour password has been successfully changed.\n\nChanged at: {{change_date}}'
      }
    ]
    
    for (const template of templates) {
      const { error: insertError } = await supabase
        .from('notification_templates')
        .upsert(template, { onConflict: 'type' })
      
      if (insertError) {
        console.log(`Template ${template.type} error:`, insertError.message)
      } else {
        console.log(`✅ Template ${template.type} inserted successfully`)
      }
    }
    
    console.log('✅ Notification system setup completed!')
    console.log('Tables created: notifications, notification_templates, notification_preferences, email_logs')
    console.log('Templates inserted: signup, teacher_signup, course_invitation, password_reset, password_changed')
    
  } catch (error) {
    console.error('Error creating notification tables:', error)
    process.exit(1)
  }
}

createNotificationTables()
