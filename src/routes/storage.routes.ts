import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()
router.post('/storage/sign-upload', requireAuth, (_req, res) => {
  // Placeholder: wire with supabase storage signed-url creation
  res.json({ url: null })
})

