import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const router = Router()

// Get all messages for a user (inbox)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  const { filter = 'all', sort_by = 'date', limit = 50, offset = 0 } = req.query

  let query = supabaseAdmin
    .from('messages')
    .select('*')
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)

  // Apply filters
  if (filter === 'unread') {
    query = query.eq('read', false)
  } else if (filter === 'starred') {
    query = query.eq('starred', true)
  } else if (filter === 'archived') {
    query = query.eq('archived', true)
  } else if (filter === 'sent') {
    query = query.eq('from_email', userEmail)
  } else if (filter === 'received') {
    query = query.eq('to_email', userEmail)
  }

  // Apply sorting
  if (sort_by === 'date') {
    query = query.order('created_at', { ascending: false })
  } else if (sort_by === 'sender') {
    query = query.order('from_email', { ascending: true })
  } else if (sort_by === 'subject') {
    query = query.order('subject', { ascending: true })
  } else if (sort_by === 'priority') {
    query = query.order('priority', { ascending: false })
  }

  // Apply pagination
  query = query.range(Number(offset), Number(offset) + Number(limit) - 1)

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Get user profile information for senders and recipients
  const messagesWithNames = await Promise.all((data || []).map(async (message) => {
    // Get sender profile
    const { data: senderProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('email', message.from_email)
      .single()

    // Get recipient profile
    const { data: recipientProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('email', message.to_email)
      .single()

    return {
      ...message,
      from_name: senderProfile ? `${senderProfile.first_name} ${senderProfile.last_name}` : message.from_email,
      to_name: recipientProfile ? `${recipientProfile.first_name} ${recipientProfile.last_name}` : message.to_email
    }
  }))

  res.json({ items: messagesWithNames || [] })
}))

// Get unread message count
router.get('/unread-count', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  const { count, error } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('to_email', userEmail)
    .eq('read', false)
    .eq('archived', false)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ count: count || 0 })
}))

// Send a new message
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  const { to_email, subject, content, priority = 'normal', attachments = [], thread_id, parent_id } = req.body

  if (!to_email || !subject || !content) {
    return res.status(400).json({ error: 'Missing required fields: to_email, subject, content' })
  }

  // Validate priority
  if (!['low', 'normal', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority. Must be low, normal, or high' })
  }

  // Check if recipient exists (either as teacher or student)
  const { data: recipient } = await supabaseAdmin
    .from('user_profiles')
    .select('email')
    .eq('email', to_email)
    .single()

  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      from_email: userEmail,
      to_email,
      subject,
      content,
      priority,
      attachments,
      thread_id,
      parent_id
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json(data)
}))

// Mark message as read
router.put('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const messageId = req.params.id

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  // Check if user has access to this message
  const { data: message, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)
    .single()

  if (fetchError || !message) {
    return res.status(404).json({ error: 'Message not found' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ read: true })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}))

// Delete a message
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const messageId = req.params.id

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  // Check if user has access to this message
  const { data: message, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)
    .single()

  if (fetchError || !message) {
    return res.status(404).json({ error: 'Message not found' })
  }

  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ success: true })
}))

// Get conversation with another user
router.get('/conversation/:otherEmail', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const otherEmail = req.params.otherEmail

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .or(`and(from_email.eq.${userEmail},to_email.eq.${otherEmail}),and(from_email.eq.${otherEmail},to_email.eq.${userEmail})`)
    .order('created_at', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Get user profile information for senders and recipients
  const messagesWithNames = await Promise.all((data || []).map(async (message) => {
    // Get sender profile
    const { data: senderProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('email', message.from_email)
      .single()

    // Get recipient profile
    const { data: recipientProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('email', message.to_email)
      .single()

    return {
      ...message,
      from_name: senderProfile ? `${senderProfile.first_name} ${senderProfile.last_name}` : message.from_email,
      to_name: recipientProfile ? `${recipientProfile.first_name} ${recipientProfile.last_name}` : message.to_email
    }
  }))

  res.json({ items: messagesWithNames || [] })
}))

// Toggle message star
router.put('/:id/star', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const messageId = req.params.id

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  // Check if user has access to this message
  const { data: message, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)
    .single()

  if (fetchError || !message) {
    return res.status(404).json({ error: 'Message not found' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ starred: !message.starred })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}))

// Toggle message archive
router.put('/:id/archive', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const messageId = req.params.id

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  // Check if user has access to this message
  const { data: message, error: fetchError } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)
    .single()

  if (fetchError || !message) {
    return res.status(404).json({ error: 'Message not found' })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ archived: !message.archived })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}))

// Bulk actions on messages
router.post('/bulk-action', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { message_ids, action } = req.body

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
    return res.status(400).json({ error: 'message_ids must be a non-empty array' })
  }

  if (!['read', 'unread', 'star', 'unstar', 'archive', 'unarchive'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' })
  }

  let updateData: any = {}
  
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
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update(updateData)
    .in('id', message_ids)
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ updated: data?.length || 0 })
}))

// Search messages
router.get('/search', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { q, filter = 'all', sort_by = 'date', limit = 50, offset = 0 } = req.query

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  let query = supabaseAdmin
    .from('messages')
    .select('*')
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)

  // Apply text search
  if (q) {
    query = query.or(`subject.ilike.%${q}%,content.ilike.%${q}%`)
  }

  // Apply filters
  if (filter === 'unread') {
    query = query.eq('read', false)
  } else if (filter === 'starred') {
    query = query.eq('starred', true)
  } else if (filter === 'archived') {
    query = query.eq('archived', true)
  } else if (filter === 'sent') {
    query = query.eq('from_email', userEmail)
  } else if (filter === 'received') {
    query = query.eq('to_email', userEmail)
  }

  // Apply sorting
  if (sort_by === 'date') {
    query = query.order('created_at', { ascending: false })
  } else if (sort_by === 'sender') {
    query = query.order('from_email', { ascending: true })
  } else if (sort_by === 'subject') {
    query = query.order('subject', { ascending: true })
  } else if (sort_by === 'priority') {
    query = query.order('priority', { ascending: false })
  }

  // Apply pagination
  query = query.range(Number(offset), Number(offset) + Number(limit) - 1)

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ items: data || [] })
}))

// Get message statistics
router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email

  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  const baseQuery = supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`)

  const [totalResult, unreadResult, starredResult, archivedResult] = await Promise.all([
    baseQuery,
    baseQuery.eq('read', false),
    baseQuery.eq('starred', true),
    baseQuery.eq('archived', true)
  ])

  res.json({
    total: totalResult.count || 0,
    unread: unreadResult.count || 0,
    starred: starredResult.count || 0,
    archived: archivedResult.count || 0
  })
}))
