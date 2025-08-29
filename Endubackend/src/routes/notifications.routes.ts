import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Get notifications for a user
router.get('/:userEmail', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { userEmail } = req.params;
    const { limit = 50 } = req.query;

    if (user.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) throw error;

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.post('/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { notificationId } = req.params;

    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('user_email')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user_email !== user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/:userEmail/read-all', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { userEmail } = req.params;

    if (user.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_email', userEmail)
      .eq('read', false);

    if (error) throw error;

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export default router;
