import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { NotificationService } from '../services/notification.service.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const router = Router()

// Get user notifications
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { limit = 50, offset = 0 } = req.query

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const notifications = await NotificationService.getUserNotifications(
      userEmail,
      Number(limit),
      Number(offset)
    )

    res.json({ items: notifications })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}))

// Get user notifications (alias for /me)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { limit = 50, offset = 0 } = req.query

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const notifications = await NotificationService.getUserNotifications(
      userEmail,
      Number(limit),
      Number(offset)
    )

    res.json({ items: notifications })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}))

// Get unread notification count
router.get('/unread-count', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const count = await NotificationService.getUnreadNotificationCount(userEmail)
    res.json({ count })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
}))

// Mark notification as read
router.put('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const notificationId = req.params.id

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const success = await NotificationService.markNotificationRead(notificationId, userEmail)
    
    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
}))

// Mark all notifications as read
router.put('/mark-all-read', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_email', userEmail)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return res.status(500).json({ error: 'Failed to mark all notifications as read' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
}))

// Get notification preferences
router.get('/preferences', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const preferences = await NotificationService.getUserNotificationPreferences(userEmail, userRole)
    res.json(preferences || {})
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error)
    res.status(500).json({ error: 'Failed to fetch notification preferences' })
  }
}))

// Update notification preferences
router.put('/preferences', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const preferences = req.body

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const success = await NotificationService.updateNotificationPreferences(
      userEmail,
      userRole,
      preferences
    )

    if (success) {
      res.json({ success: true })
    } else {
      res.status(500).json({ error: 'Failed to update notification preferences' })
    }
  } catch (error: any) {
    console.error('Error updating notification preferences:', error)
    res.status(500).json({ error: 'Failed to update notification preferences' })
  }
}))

// Delete notification
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const notificationId = req.params.id

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_email', userEmail)

    if (error) {
      console.error('Error deleting notification:', error)
      return res.status(500).json({ error: 'Failed to delete notification' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
}))

// Delete all notifications for a user
router.delete('/clear-all', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email

  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_email', userEmail)

    if (error) {
      console.error('Error clearing all notifications:', error)
      return res.status(500).json({ error: 'Failed to clear all notifications' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error clearing all notifications:', error)
    res.status(500).json({ error: 'Failed to clear all notifications' })
  }
}))

// Get notification templates (admin only)
router.get('/templates', requireAuth, asyncHandler(async (req, res) => {
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching notification templates:', error)
      return res.status(500).json({ error: 'Failed to fetch notification templates' })
    }

    res.json({ items: data || [] })
  } catch (error: any) {
    console.error('Error fetching notification templates:', error)
    res.status(500).json({ error: 'Failed to fetch notification templates' })
  }
}))

// Send test notification (admin only)
router.post('/test', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { testEmail } = req.body

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' })
  }

  if (!testEmail) {
    return res.status(400).json({ error: 'testEmail is required' })
  }

  try {
    const notificationId = await NotificationService.sendNotification({
      user_email: testEmail,
      user_type: 'student',
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification from AuraiumLMS.',
      data: {
        test: true,
        sent_by: userEmail,
        sent_at: new Date().toISOString()
      }
    })

    if (notificationId) {
      res.json({ success: true, notificationId })
    } else {
      res.status(500).json({ error: 'Failed to send test notification' })
    }
  } catch (error: any) {
    console.error('Error sending test notification:', error)
    res.status(500).json({ error: 'Failed to send test notification' })
  }
}))

// Send test email (admin only)
router.post('/test-email', requireAuth, asyncHandler(async (req, res) => {
  const userRole = (req as any).user?.role
  const { testEmail } = req.body

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' })
  }

  if (!testEmail) {
    return res.status(400).json({ error: 'testEmail is required' })
  }

  try {
    const { EmailService } = await import('../services/email.service.js')
    const result = await EmailService.sendTestEmail(testEmail)

    if (result.success) {
      res.json({ success: true, messageId: result.messageId })
    } else {
      res.status(500).json({ error: result.error || 'Failed to send test email' })
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    res.status(500).json({ error: 'Failed to send test email' })
  }
}))

// Get email logs (admin only)
router.get('/email-logs', requireAuth, asyncHandler(async (req, res) => {
  const userRole = (req as any).user?.role
  const { limit = 50, offset = 0, status } = req.query

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' })
  }

  try {
    let query = supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching email logs:', error)
      return res.status(500).json({ error: 'Failed to fetch email logs' })
    }

    res.json({ items: data || [] })
  } catch (error: any) {
    console.error('Error fetching email logs:', error)
    res.status(500).json({ error: 'Failed to fetch email logs' })
  }
}))

export default router