import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

// Get all notes for a user
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const user_email = (req as any).user?.email
  const { course_id, lesson_id, is_public } = req.query
  
  if (!user_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  let query = supabaseAdmin
    .from('notes')
    .select(`
      *,
      courses!left(
        id,
        title
      ),
      lessons!left(
        id,
        title
      )
    `)
    .eq('user_email', user_email)
    .order('updated_at', { ascending: false })
  
  if (course_id) {
    query = query.eq('course_id', course_id)
  }
  
  if (lesson_id) {
    query = query.eq('lesson_id', lesson_id)
  }
  
  if (is_public !== undefined) {
    query = query.eq('is_public', is_public === 'true')
  }
  
  const { data, error } = await query
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Get a specific note
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const user_email = (req as any).user?.email
  
  if (!user_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('notes')
    .select(`
      *,
      courses!left(
        id,
        title
      ),
      lessons!left(
        id,
        title
      )
    `)
    .eq('id', id)
    .eq('user_email', user_email)
    .single()
  
  if (error) return res.status(404).json({ error: 'not_found' })
  res.json(data)
}))

// Create a new note
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const user_email = (req as any).user?.email
  const { title, content, course_id, lesson_id, tags, is_public } = req.body || {}
  
  if (!user_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  if (!title || !content) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('notes')
    .insert({
      user_email,
      title,
      content,
      course_id,
      lesson_id,
      tags: tags || [],
      is_public: is_public || false
    })
    .select()
    .single()
  
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}))

// Update a note
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const user_email = (req as any).user?.email
  const { title, content, tags, is_public } = req.body || {}
  
  if (!user_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const updateData: any = {}
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (tags !== undefined) updateData.tags = tags
  if (is_public !== undefined) updateData.is_public = is_public
  
  const { data, error } = await supabaseAdmin
    .from('notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_email', user_email)
    .select()
    .single()
  
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Delete a note
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const user_email = (req as any).user?.email
  
  if (!user_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const { error } = await supabaseAdmin
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_email', user_email)
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}))

// Search notes
router.get('/search', requireAuth, asyncHandler(async (req, res) => {
  const user_email = (req as any).user?.email
  const { q } = req.query
  
  if (!user_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  if (!q) {
    return res.status(400).json({ error: 'missing_query' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('notes')
    .select(`
      *,
      courses!left(
        id,
        title
      ),
      lessons!left(
        id,
        title
      )
    `)
    .eq('user_email', user_email)
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))
