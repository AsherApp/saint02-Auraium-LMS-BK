import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const router = Router()

// Generate signed URL for direct upload to Supabase Storage
router.post('/storage/sign-upload', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user
  if (!user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { fileName, fileType, bucket = 'Files' } = req.body

  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'fileName and fileType are required' })
  }

  try {
    // Generate unique filename with user ID
    const timestamp = Date.now()
    const randomSuffix = Math.round(Math.random() * 1E9)
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`

    // Create signed URL for upload
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(uniqueFileName, {
        upsert: false
      })

    if (error) {
      console.error('Error creating signed URL:', error)
      return res.status(500).json({ error: 'Failed to create signed URL' })
    }

    res.json({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token
    })
  } catch (error) {
    console.error('Storage sign-upload error:', error)
    res.status(500).json({ error: 'Failed to generate signed URL' })
  }
}))

// Get public URL for a file
router.get('/storage/public-url', requireAuth, asyncHandler(async (req, res) => {
  const { fileName, bucket = 'Files' } = req.query

  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' })
  }

  try {
    const { data } = supabaseAdmin.storage
      .from(bucket as string)
      .getPublicUrl(fileName as string)

    res.json({
      publicUrl: data.publicUrl
    })
  } catch (error) {
    console.error('Storage public-url error:', error)
    res.status(500).json({ error: 'Failed to get public URL' })
  }
}))

// Delete a file from storage
router.delete('/storage/delete', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user
  if (!user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { fileName, bucket = 'Files' } = req.body

  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' })
  }

  try {
    // Verify user owns the file (files are stored in user.id/ folder)
    if (!fileName.startsWith(`${user.id}/`)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([fileName])

    if (error) {
      console.error('Error deleting file:', error)
      return res.status(500).json({ error: 'Failed to delete file' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Storage delete error:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
}))

