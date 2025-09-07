import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  from?: string
  fromName?: string
}

export interface EmailResult {
  success: boolean
  error?: string
  messageId?: string
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null

  /**
   * Initialize email transporter
   */
  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter
    }

    // Use environment variables for email configuration
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }

    // If no SMTP credentials, use a test account (for development)
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('No SMTP credentials found, using test account')
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      })
    } else {
      this.transporter = nodemailer.createTransport(emailConfig)
    }

    // Verify connection
    try {
      await this.transporter.verify()
      console.log('Email transporter verified successfully')
    } catch (error) {
      console.error('Email transporter verification failed:', error)
    }

    return this.transporter
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const transporter = await this.getTransporter()
      
      const fromEmail = options.from || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@auraiumlms.com'
      const fromName = options.fromName || 'AuraiumLMS'
      
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html)
      }

      const result = await transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error: any) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Send bulk emails
   */
  static async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Failed to send email ${index}:`, result.reason)
        return {
          success: false,
          error: result.reason?.message || 'Unknown error'
        }
      }
    })
  }

  /**
   * Convert HTML to plain text
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
  }

  /**
   * Send test email
   */
  static async sendTestEmail(to: string): Promise<EmailResult> {
    const testEmail: EmailOptions = {
      to,
      subject: 'AuraiumLMS - Test Email',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from AuraiumLMS.</p>
        <p>If you received this email, the email system is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <p>Best regards,<br>The AuraiumLMS Team</p>
      `
    }

    return this.sendEmail(testEmail)
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(userEmail: string, userName: string, userType: 'teacher' | 'student'): Promise<EmailResult> {
    const welcomeEmail: EmailOptions = {
      to: userEmail,
      toName: userName,
      subject: `Welcome to AuraiumLMS - ${userType === 'teacher' ? 'Teacher' : 'Student'} Account Created`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Welcome to AuraiumLMS!</h1>
          <p>Dear ${userName},</p>
          <p>Your ${userType} account has been successfully created. You can now start using AuraiumLMS.</p>
          ${userType === 'teacher' ? 
            '<p>As a teacher, you can create courses, manage students, and track their progress.</p>' :
            '<p>As a student, you can access your courses, complete assignments, and track your progress.</p>'
          }
          <p>Login at: <a href="${process.env.FRONTEND_URL || 'https://auraiumlms.vercel.app'}" style="color: #3b82f6;">${process.env.FRONTEND_URL || 'https://auraiumlms.vercel.app'}</a></p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The AuraiumLMS Team</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This email was sent to ${userEmail}. If you did not create an account, please ignore this email.
          </p>
        </div>
      `
    }

    return this.sendEmail(welcomeEmail)
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<EmailResult> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://auraiumlms.vercel.app'}/reset-password?token=${resetToken}`
    
    const resetEmail: EmailOptions = {
      to: userEmail,
      toName: userName,
      subject: 'AuraiumLMS - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Password Reset Request</h1>
          <p>Dear ${userName},</p>
          <p>You have requested to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The AuraiumLMS Team</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            This email was sent to ${userEmail}. If you did not request a password reset, please ignore this email.
          </p>
        </div>
      `
    }

    return this.sendEmail(resetEmail)
  }
}

// Export the sendEmail function for backward compatibility
export const sendEmail = EmailService.sendEmail
