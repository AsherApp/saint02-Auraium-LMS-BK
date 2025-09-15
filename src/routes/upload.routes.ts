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
    fileSize: 50 * 1024 * 1024, // 50MB limit (matches Supabase project limit)
  },
  fileFilter: (req, file, cb) => {
    // Temporarily allow all files for testing
    console.log('File filter - File info:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })
    cb(null, true)
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

  // Check file size limit (50MB for this Supabase project)
  const maxFileSize = 50 * 1024 * 1024 // 50MB
  if (req.file.size > maxFileSize) {
    console.error('File too large:', {
      fileSize: req.file.size,
      maxSize: maxFileSize,
      fileName: req.file.originalname
    })
    return res.status(413).json({ 
      error: 'File too large',
      message: `File size (${Math.round(req.file.size / 1024 / 1024)}MB) exceeds the maximum allowed size of 50MB`,
      maxSize: '50MB',
      fileSize: req.file.size
    })
  }

  const user = (req as any).user
  if (!user?.id) {
    console.error('No user ID found in request')
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  console.log('User info from auth:', {
    id: user.id,
    email: user.email,
    role: user.role
  })

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.round(Math.random() * 1E9)
    const fileExtension = req.file.originalname.split('.').pop()
    const fileName = `videos/${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`

    // Fix MIME type for video files
    const contentType = req.file.mimetype === 'application/octet-stream' && 
                       req.file.originalname.toLowerCase().endsWith('.mp4') 
                       ? 'video/mp4' 
                       : req.file.mimetype

    console.log('Attempting Supabase upload:', {
      fileName,
      fileSize: req.file.size,
      originalMimeType: req.file.mimetype,
      correctedContentType: contentType,
      userId: user.id
    })

    // Upload to Supabase Storage Files bucket
    // For very large files, we might need to use a different approach
    const uploadOptions = {
      contentType: contentType,
      cacheControl: '3600',
      upsert: false
    }

    console.log('Upload options:', uploadOptions)

    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .upload(fileName, req.file.buffer, uploadOptions)

    if (error) {
      console.error('Supabase upload error details:', {
        error: error,
        message: error.message,
        fileName,
        fileSize: req.file.size
      })
      return res.status(500).json({ 
        error: 'Failed to upload video to storage',
        details: {
          message: error.message,
          fileName,
          fileSize: req.file.size,
          userId: user.id
        }
      })
    }

    console.log('Supabase upload successful:', data)

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
    console.error('No user ID found in request')
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  console.log('User info from auth:', {
    id: user.id,
    email: user.email,
    role: user.role
  })

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

// Error handling middleware for multer errors
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File too large',
        message: 'File size exceeds the maximum allowed limit of 50MB',
        maxSize: '50MB'
      })
    }
    return res.status(400).json({ 
      error: 'Upload error',
      message: error.message 
    })
  }
  next(error)
})

export { router } 