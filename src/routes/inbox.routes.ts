import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = String(req.headers['x-user-email'] || '').toLowerCase()
  if (!userEmail) return res.status(401).json({ error: 'missing_user_email' })
  
  const { data, error } = await supabaseAdmin.from('messages').select('*').or(`from_email.eq.${userEmail},to_email.eq.${userEmail}`).order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data })
}))

router.post('/send', requireAuth, asyncHandler(async (req, res) => {
  const { from_email, to_email, subject, body } = req.body || {}
  if (!from_email || !to_email || !subject || !body) return res.status(400).json({ error: 'missing_fields' })
  
  const { data, error } = await supabaseAdmin.from('messages').insert({ from_email, to_email, subject, body }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

router.post('/read', requireAuth, asyncHandler(async (req, res) => {
  const { message_id } = req.body || {}
  if (!message_id) return res.status(400).json({ error: 'missing_message_id' })
  
  const { error } = await supabaseAdmin.from('messages').update({ read: true }).eq('id', message_id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}))

router.post('/delete', requireAuth, asyncHandler(async (req, res) => {
  const { message_id } = req.body || {}
  if (!message_id) return res.status(400).json({ error: 'missing_message_id' })
  
  const { error } = await supabaseAdmin.from('messages').delete().eq('id', message_id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}))

