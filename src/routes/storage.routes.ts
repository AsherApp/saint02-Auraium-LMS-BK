import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'
import multer from 'multer'
import path from 'path'

const router = Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-zip-compressed'
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`))
    }
  }
})

// Generate unique file path
const generateFilePath = (userId: string, fileType: string, originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = path.extname(originalName)
  
  // Determine folder based on file type
  let folder = 'files'
  if (fileType.startsWith('video/')) {
    folder = 'videos'
  } else if (fileType.startsWith('image/')) {
    folder = 'images'
  } else if (fileType.includes('document') || fileType.includes('pdf') || fileType.includes('text')) {
    folder = 'documents'
  }
  
  return `${userId}/${folder}/${timestamp}-${random}${extension}`
}

// Upload single file
router.post('/upload', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  try {
    const userEmail = (req as any).user?.email
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const file = req.file
    const filePath = generateFilePath(userEmail, file.mimetype, file.originalname)

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return res.status(500).json({ error: error.message })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('Files')
      .getPublicUrl(filePath)

    res.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      fileId: data.path,
      metadata: {
        name: file.originalname,
        size: file.size,
        type: file.mimetype
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
}))

// Upload multiple files
router.post('/upload-multiple', requireAuth, upload.array('files', 10), asyncHandler(async (req, res) => {
  try {
    const userEmail = (req as any).user?.email
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' })
    }

    const results = []

    for (const file of files) {
      const filePath = generateFilePath(userEmail, file.mimetype, file.originalname)

      // Upload to Supabase storage
      const { data, error } = await supabaseAdmin.storage
        .from('Files')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        results.push({
          success: false,
          error: error.message,
          fileName: file.originalname
        })
        continue
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('Files')
        .getPublicUrl(filePath)

      results.push({
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        fileId: data.path,
        fileName: file.originalname,
        metadata: {
          name: file.originalname,
          size: file.size,
          type: file.mimetype
        }
      })
    }

    res.json({
      success: true,
      results,
      totalFiles: files.length,
      successfulUploads: results.filter(r => r.success).length
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
}))

// Get signed upload URL
router.post('/sign-upload', requireAuth, asyncHandler(async (req, res) => {
  try {
    const userEmail = (req as any).user?.email
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { fileName, fileType } = req.body

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' })
    }

    const filePath = generateFilePath(userEmail, fileType, fileName)

    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Sign upload error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      signedUrl: data.signedUrl,
      path: filePath,
      token: data.token
    })
  } catch (error) {
    console.error('Sign upload error:', error)
    res.status(500).json({ error: 'Failed to create signed upload URL' })
  }
}))

// Get public URL
router.get('/public-url', requireAuth, asyncHandler(async (req, res) => {
  try {
    const { fileName } = req.query

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' })
    }

    const { data } = supabaseAdmin.storage
      .from('Files')
      .getPublicUrl(fileName as string)

    res.json({
      success: true,
      publicUrl: data.publicUrl
    })
  } catch (error) {
    console.error('Get public URL error:', error)
    res.status(500).json({ error: 'Failed to get public URL' })
  }
}))

// Get signed URL for private access
router.post('/signed-url', requireAuth, asyncHandler(async (req, res) => {
  try {
    const userEmail = (req as any).user?.email
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { fileName, expiresIn = 3600 } = req.body

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' })
    }

    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .createSignedUrl(fileName, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      success: true,
      signedUrl: data.signedUrl
    })
  } catch (error) {
    console.error('Signed URL error:', error)
    res.status(500).json({ error: 'Failed to create signed URL' })
  }
}))

// Delete file
router.delete('/delete', requireAuth, asyncHandler(async (req, res) => {
  try {
    const userEmail = (req as any).user?.email
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { fileName } = req.body

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' })
    }

    // Verify user owns the file (file path should start with user email)
    if (!fileName.startsWith(userEmail)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { error } = await supabaseAdmin.storage
      .from('Files')
      .remove([fileName])

    if (error) {
      console.error('Delete error:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
}))

// List user files
router.get('/list', requireAuth, asyncHandler(async (req, res) => {
  try {
    const userEmail = (req as any).user?.email
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { folder, limit = 100, offset = 0 } = req.query
    const path = folder ? `${userEmail}/${folder}` : userEmail

    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .list(path, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('List files error:', error)
      return res.status(500).json({ error: error.message })
    }

    // Get public URLs for all files
    const filesWithUrls = (data || []).map(file => {
      const filePath = `${path}/${file.name}`
      const { data: urlData } = supabaseAdmin.storage
        .from('Files')
        .getPublicUrl(filePath)

      return {
        ...file,
        path: filePath,
        publicUrl: urlData.publicUrl
      }
    })

    res.json({
      success: true,
      files: filesWithUrls,
      total: filesWithUrls.length
    })
  } catch (error) {
    console.error('List files error:', error)
    res.status(500).json({ error: 'Failed to list files' })
  }
}))

// Get file metadata
router.get('/metadata', requireAuth, asyncHandler(async (req, res) => {
  try {
    const { fileName } = req.query

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' })
    }

    const pathParts = (fileName as string).split('/')
    const folder = pathParts.slice(0, -1).join('/')
    const fileNameOnly = pathParts[pathParts.length - 1]

    const { data, error } = await supabaseAdmin.storage
      .from('Files')
      .list(folder, {
        search: fileNameOnly
      })

    if (error) {
      console.error('Get metadata error:', error)
      return res.status(500).json({ error: error.message })
    }

    const file = data?.[0]
    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('Files')
      .getPublicUrl(fileName as string)

    res.json({
      success: true,
      metadata: {
        ...file,
        path: fileName,
        publicUrl: urlData.publicUrl
      }
    })
  } catch (error) {
    console.error('Get metadata error:', error)
    res.status(500).json({ error: 'Failed to get file metadata' })
  }
}))

export default router