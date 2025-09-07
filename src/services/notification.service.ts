import { supabaseAdmin } from '../lib/supabase.js'
import { sendEmail } from './email.service.js'

export interface NotificationData {
  user_email: string
  user_type: 'teacher' | 'student'
  type: string
  title: string
  message: string
  data?: Record<string, any>
}

export interface EmailTemplate {
  name: string
  type: string
  subject_template: string
  html_template: string
  text_template?: string
}

export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async sendNotification(notificationData: NotificationData): Promise<string> {
    try {
      // Check user notification preferences
      const preferences = await this.getUserNotificationPreferences(
        notificationData.user_email,
        notificationData.user_type
      )

      if (!preferences) {
        console.log(`No notification preferences found for ${notificationData.user_email}`)
        return ''
      }

      // Create notification record
      const { data: notification, error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_email: notificationData.user_email,
          user_type: notificationData.user_type,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {}
        })
        .select('id')
        .single()

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
        return ''
      }

      // Send email if enabled
      if (preferences.email_notifications && this.shouldSendEmail(notificationData.type, preferences)) {
        await this.sendEmailNotification(notification.id, notificationData)
      }

      return notification.id
    } catch (error) {
      console.error('Error in sendNotification:', error)
      return ''
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(notificationId: string, notificationData: NotificationData): Promise<void> {
    try {
      // Get email template
      const template = await this.getEmailTemplate(notificationData.type)
      if (!template) {
        console.log(`No email template found for type: ${notificationData.type}`)
        return
      }

      // Get user profile for personalization
      const userProfile = await this.getUserProfile(notificationData.user_email)
      if (!userProfile) {
        console.log(`No user profile found for: ${notificationData.user_email}`)
        return
      }

      // Prepare template data
      const templateData = {
        ...notificationData.data,
        user_name: `${userProfile.first_name} ${userProfile.last_name}`,
        user_email: notificationData.user_email,
        notification_title: notificationData.title,
        notification_message: notificationData.message,
        current_date: new Date().toLocaleDateString(),
        current_time: new Date().toLocaleTimeString(),
        login_url: process.env.FRONTEND_URL || 'https://auraiumlms.vercel.app',
        support_email: process.env.SUPPORT_EMAIL || 'support@auraiumlms.com'
      }

      // Render templates
      const subject = this.renderTemplate(template.subject_template, templateData)
      const htmlContent = this.renderTemplate(template.html_template, templateData)
      const textContent = template.text_template ? this.renderTemplate(template.text_template, templateData) : undefined

      // Log email attempt
      const { data: emailLog, error: logError } = await supabaseAdmin
        .from('email_logs')
        .insert({
          notification_id: notificationId,
          recipient_email: notificationData.user_email,
          recipient_name: `${userProfile.first_name} ${userProfile.last_name}`,
          subject,
          template_name: template.name,
          template_data: templateData,
          status: 'pending'
        })
        .select('id')
        .single()

      if (logError) {
        console.error('Error creating email log:', logError)
        return
      }

      // Send email
      const emailResult = await sendEmail({
        to: notificationData.user_email,
        toName: `${userProfile.first_name} ${userProfile.last_name}`,
        subject,
        html: htmlContent,
        text: textContent
      })

      // Update email log and notification
      const updateData = {
        status: emailResult.success ? 'sent' : 'failed',
        error_message: emailResult.error || null,
        sent_at: emailResult.success ? new Date().toISOString() : null
      }

      await supabaseAdmin
        .from('email_logs')
        .update(updateData)
        .eq('id', emailLog.id)

      await supabaseAdmin
        .from('notifications')
        .update({
          is_email_sent: emailResult.success,
          email_sent_at: emailResult.success ? new Date().toISOString() : null
        })
        .eq('id', notificationId)

      if (emailResult.success) {
        console.log(`Email sent successfully to ${notificationData.user_email}`)
      } else {
        console.error(`Failed to send email to ${notificationData.user_email}:`, emailResult.error)
      }
    } catch (error) {
      console.error('Error in sendEmailNotification:', error)
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserNotificationPreferences(userEmail: string, userType: string) {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_email', userEmail)
      .eq('user_type', userType)
      .single()

    if (error) {
      console.error('Error fetching notification preferences:', error)
      return null
    }

    return data
  }

  /**
   * Get email template by type
   */
  static async getEmailTemplate(type: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching email template:', error)
      return null
    }

    return data
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userEmail: string) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email, user_type')
      .eq('email', userEmail)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  /**
   * Render template with data
   */
  static renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match
    })
  }

  /**
   * Check if email should be sent based on notification type and preferences
   */
  static shouldSendEmail(type: string, preferences: any): boolean {
    switch (type) {
      case 'course_completion':
        return preferences.course_completion_emails
      case 'module_completion':
        return preferences.module_completion_emails
      case 'assignment':
      case 'assignment_created':
      case 'assignment_due_reminder':
      case 'assignment_graded':
        return preferences.assignment_emails
      case 'live_session':
      case 'live_session_scheduled':
      case 'live_session_starting':
        return preferences.live_session_emails
      case 'announcement':
        return preferences.announcement_emails
      case 'signup':
      case 'password_reset':
      case 'enrollment':
        return true // Always send these
      default:
        return preferences.email_notifications
    }
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(notifications: NotificationData[]): Promise<string[]> {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Failed to send notification ${index}:`, result.reason)
        return ''
      }
    })
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userEmail: string, limit = 50, offset = 0) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching user notifications:', error)
      return []
    }

    return data || []
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string, userEmail: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_email', userEmail)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  }

  /**
   * Get unread notification count
   */
  static async getUnreadNotificationCount(userEmail: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail)
      .eq('is_read', false)

    if (error) {
      console.error('Error fetching unread notification count:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    userEmail: string,
    userType: string,
    preferences: Partial<any>
  ): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({
        user_email: userEmail,
        user_type: userType,
        ...preferences,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating notification preferences:', error)
      return false
    }

    return true
  }
}
