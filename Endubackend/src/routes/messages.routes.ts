import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const router = Router()

// Get messages for a user (teacher or student)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const user_email = (req as any).user?.email?.toLowerCase()
  
  if (!user_email) {
    return res.status(400).json({ error: 'missing_user_email' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .or(`from_email.eq.${user_email},to_email.eq.${user_email}`)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Get unread message count
router.get('/unread-count', requireAuth, asyncHandler(async (req, res) => {
  const user_email = (req as any).user?.email?.toLowerCase()
  
  if (!user_email) {
    return res.status(400).json({ error: 'missing_user_email' })
  }

  const { count, error } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_email', user_email)
    .eq('read', false)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ count: count || 0 })
}))

// Send a new message
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { to_email, subject, content, priority = 'normal', attachments = [], thread_id, parent_id } = req.body
  const from_email = (req as any).user?.email?.toLowerCase()
  
  if (!to_email || !subject || !content) {
    return res.status(400).json({ error: 'missing_required_fields' })
  }

  if (!from_email) {
    return res.status(400).json({ error: 'missing_user_email' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      from_email,
      to_email,
      subject,
      content,
      priority,
      attachments,
      thread_id,
      parent_id,
      read: false,
      starred: false,
      archived: false
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Mark message as read
router.put('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const message_id = req.params.id
  const user_email = (req as any).user?.email?.toLowerCase()
  
  if (!user_email) {
    return res.status(400).json({ error: 'missing_user_email' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ read: true })
    .eq('id', message_id)
    .eq('to_email', user_email)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Delete a message
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const message_id = req.params.id
  const user_email = (req as any).user?.email?.toLowerCase()
  
  if (!user_email) {
    return res.status(400).json({ error: 'missing_user_email' })
  }

  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', message_id)
    .or(`from_email.eq.${user_email},to_email.eq.${user_email}`)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}))

// Get conversation between two users
router.get('/conversation/:other_email', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const other_email = req.params.other_email.toLowerCase()
  
  if (!user_email || !other_email) {
    return res.status(400).json({ error: 'missing_emails' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .or(`and(from_email.eq.${user_email},to_email.eq.${other_email}),and(from_email.eq.${other_email},to_email.eq.${user_email})`)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Toggle message star
router.put('/:id/star', requireAuth, asyncHandler(async (req, res) => {
  const message_id = req.params.id
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  // Get current star status
  const { data: currentMessage, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('starred')
    .eq('id', message_id)
    .or(`from_email.eq.${user_email},to_email.eq.${user_email}`)
    .single()

  if (fetchError) return res.status(500).json({ error: fetchError.message })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ starred: !currentMessage.starred })
    .eq('id', message_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Archive/unarchive message
router.put('/:id/archive', requireAuth, asyncHandler(async (req, res) => {
  const message_id = req.params.id
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  // Get current archive status
  const { data: currentMessage, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('archived')
    .eq('id', message_id)
    .or(`from_email.eq.${user_email},to_email.eq.${user_email}`)
    .single()

  if (fetchError) return res.status(500).json({ error: fetchError.message })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ archived: !currentMessage.archived })
    .eq('id', message_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Bulk actions on messages
router.post('/bulk-action', requireAuth, asyncHandler(async (req, res) => {
  const { message_ids, action } = req.body
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  if (!message_ids || !Array.isArray(message_ids) || !action) {
    return res.status(400).json({ error: 'missing_required_fields' })
  }

  let updateData = {}
  
  switch (action) {
    case 'read':
      updateData = { read: true }
      break
    case 'unread':
      updateData = { read: false }
      break
    case 'star':
      updateData = { starred: true }
      break
    case 'unstar':
      updateData = { starred: false }
      break
    case 'archive':
      updateData = { archived: true }
      break
    case 'unarchive':
      updateData = { archived: false }
      break
    default:
      return res.status(400).json({ error: 'invalid_action' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update(updateData)
    .in('id', message_ids)
    .or(`from_email.eq.${user_email},to_email.eq.${user_email}`)
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ updated: data?.length || 0 })
}))

// Search messages
router.get('/search', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const { q, filter, sort_by = 'date' } = req.query
  
  let query = supabaseAdmin
    .from('messages')
    .select('*')
    .or(`from_email.eq.${user_email},to_email.eq.${user_email}`)

  // Apply search filter
  if (q) {
    query = query.or(`subject.ilike.%${q}%,content.ilike.%${q}%,from_email.ilike.%${q}%,to_email.ilike.%${q}%`)
  }

  // Apply status filter
  if (filter === 'unread') {
    query = query.eq('read', false)
  } else if (filter === 'starred') {
    query = query.eq('starred', true)
  } else if (filter === 'archived') {
    query = query.eq('archived', true)
  }

  // Apply sorting
  switch (sort_by) {
    case 'date':
      query = query.order('created_at', { ascending: false })
      break
    case 'sender':
      query = query.order('from_email', { ascending: true })
      break
    case 'subject':
      query = query.order('subject', { ascending: true })
      break
    case 'priority':
      query = query.order('priority', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Get message statistics
router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('read, starred, archived, priority')
    .or(`from_email.eq.${user_email},to_email.eq.${user_email}`)

  if (error) return res.status(500).json({ error: error.message })

  const stats = {
    total: data?.length || 0,
    unread: data?.filter(m => !m.read).length || 0,
    starred: data?.filter(m => m.starred).length || 0,
    archived: data?.filter(m => m.archived).length || 0,
    high_priority: data?.filter(m => m.priority === 'high').length || 0,
    sent: data?.filter(m => m.from_email === user_email).length || 0,
    received: data?.filter(m => m.to_email === user_email).length || 0
  }

  res.json(stats)
})) 