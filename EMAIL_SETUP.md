# Email Configuration for AuraiumLMS

## Overview
The AuraiumLMS system sends emails for course invitations, notifications, and other important communications. This document explains how to configure email sending.

## Current Status
✅ **Email Templates**: All templates are configured in the database
✅ **Notification System**: Fully functional
✅ **Email Service**: Working with proper configuration
❌ **SMTP Configuration**: Needs to be set up

## Email Configuration Options

### Option 1: Gmail (Recommended for Development/Production)

1. **Create a Gmail App Password**:
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Generate an App Password for "Mail"
   - Use this password (not your regular Gmail password)

2. **Set Environment Variables**:
   ```bash
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   ```

### Option 2: Custom SMTP Server

1. **Set Environment Variables**:
   ```bash
   SMTP_HOST=smtp.your-provider.com
   SMTP_PORT=587
   SMTP_USER=your-email@your-domain.com
   SMTP_PASS=your-password
   SMTP_SECURE=false
   SMTP_FROM=noreply@your-domain.com
   ```

### Option 3: Development Mode (No Real Emails)

For development, you can use a service like Ethereal Email or Mailtrap:

1. **Ethereal Email** (Free):
   ```bash
   # No configuration needed - uses built-in test account
   # Emails will be logged but not actually sent
   ```

2. **Mailtrap** (Free tier available):
   ```bash
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   ```

## Testing Email Functionality

Run the test script to verify email configuration:

```bash
node test-email-invitation.js
```

## Email Templates Available

1. **Course Invitation** (`course_invitation`)
   - Sent when a teacher invites a student to a course
   - Includes course details, teacher info, and invitation link

2. **Student Signup Welcome** (`signup`)
   - Sent when a student completes registration
   - Includes account details and login information

3. **Teacher Signup Welcome** (`teacher_signup`)
   - Sent when a teacher completes registration
   - Includes dashboard access and features overview

4. **Password Reset** (`password_reset`)
   - Sent when a user requests password reset
   - Includes secure reset link

5. **Password Changed** (`password_changed`)
   - Sent when a user successfully changes their password
   - Security notification

## Production Recommendations

1. **Use a dedicated email service** like SendGrid, Mailgun, or AWS SES
2. **Set up proper SPF, DKIM, and DMARC records** for your domain
3. **Monitor email delivery rates** and bounce handling
4. **Use environment-specific configurations** (dev/staging/prod)

## Troubleshooting

### Common Issues

1. **"Missing credentials" error**:
   - Check that GMAIL_USER and GMAIL_APP_PASSWORD are set
   - Verify the app password is correct (16 characters, no spaces)

2. **"Authentication failed" error**:
   - Ensure 2FA is enabled on the Gmail account
   - Use App Password, not regular password

3. **Emails not being sent**:
   - Check email logs in the database (`email_logs` table)
   - Verify notification preferences are enabled
   - Check SMTP server connectivity

### Email Logs

Check the `email_logs` table in the database to see:
- Which emails were sent
- Delivery status
- Error messages
- Template data used

## Next Steps

1. **Set up Gmail credentials** for immediate functionality
2. **Test with a real email address** to verify delivery
3. **Configure production SMTP** for live deployment
4. **Monitor email delivery** and adjust as needed

The system is ready to send emails once proper credentials are configured!
