import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middlewares/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Configure multer for memory storage (we'll upload directly to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow video files for video uploads
    if (req.path.includes('/video')) {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true)
      } else {
        cb(new Error('Only video files are allowed'))
      }
    } else {
      // Allow all files for general uploads
      cb(null, true)
    }
  }
})

// Video upload endpoint
router.post('/video', requireAuth, upload.single('video'), asyncHandler(async (req, res) => {
  console.log('Video upload request received:', {
    hasFile: !!req.file,
    fileInfo: req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    }
  })
  
  if (!req.file) {
    console.error('No file received in video upload request')
    return res.status(400).json({ error: 'No video file uploaded' })
  }

  const user = (req as any).user
  if (!user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.round(Math.random() * 1E9)
    const fileExtension = req.file.originalname.split('.').pop()
    const fileName = `videos/${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`

    // Upload to Supabase Storage Files bucket
    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return res.status(500).json({ error: 'Failed to upload video to storage' })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('Files')
      .getPublicUrl(fileName)

    res.json({
      success: true,
      file: {
        url: urlData.publicUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        filename: fileName
      }
    })
  } catch (error) {
    console.error('Video upload error:', error)
    res.status(500).json({ error: 'Failed to upload video' })
  }
}))

// File upload endpoint
router.post('/file', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  const user = (req as any).user
  if (!user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.round(Math.random() * 1E9)
    const fileExtension = req.file.originalname.split('.').pop()
    const fileName = `files/${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`

    // Upload to Supabase Storage Files bucket
    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return res.status(500).json({ error: 'Failed to upload file to storage' })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('Files')
      .getPublicUrl(fileName)

    res.json({
      success: true,
      file: {
        url: urlData.publicUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        filename: fileName
      }
    })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
}))



export { router } 