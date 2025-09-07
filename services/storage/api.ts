import { supabaseAdmin } from '@/lib/supabase'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
  fileId?: string
}

export interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified?: number
}

export class StorageService {
  private static readonly BUCKET_NAME = 'Files'
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv'
  ]
  private static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]

  /**
   * Generate a unique file path for uploads
   */
  private static generateFilePath(userId: string, fileType: string, originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop() || ''
    
    // Determine folder based on file type
    let folder = 'files'
    if (this.ALLOWED_VIDEO_TYPES.includes(fileType)) {
      folder = 'videos'
    } else if (this.ALLOWED_IMAGE_TYPES.includes(fileType)) {
      folder = 'images'
    } else if (this.ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
      folder = 'documents'
    }
    
    return `${userId}/${folder}/${timestamp}-${random}.${extension}`
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit` }
    }

    // Check file type
    const allowedTypes = [
      ...this.ALLOWED_VIDEO_TYPES,
      ...this.ALLOWED_DOCUMENT_TYPES,
      ...this.ALLOWED_IMAGE_TYPES
    ]

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` }
    }

    return { valid: true }
  }

  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(
    file: File, 
    userId: string, 
    options?: {
      onProgress?: (progress: number) => void
      customPath?: string
    }
  ): Promise<UploadResult> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase client not initialized' }
      }

      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate file path
      const filePath = options?.customPath || this.generateFilePath(userId, file.type, file.name)

      // Upload file
      const { data, error } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        fileId: data.path
      }
    } catch (error) {
      console.error('Upload error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown upload error' 
      }
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: File[], 
    userId: string,
    options?: {
      onProgress?: (fileIndex: number, progress: number) => void
    }
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await this.uploadFile(file, userId, {
        onProgress: (progress) => options?.onProgress?.(i, progress)
      })
      results.push(result)
    }
    
    return results
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase client not initialized' }
      }

      const { error } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown delete error' 
      }
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(filePath: string): string {
    if (!supabaseAdmin) {
      return ''
    }

    const { data } = supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Get signed URL for private file access
   */
  static async getSignedUrl(
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase client not initialized' }
      }

      const { data, error } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, url: data.signedUrl }
    } catch (error) {
      console.error('Signed URL error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown signed URL error' 
      }
    }
  }

  /**
   * List files for a user
   */
  static async listUserFiles(
    userId: string, 
    folder?: string
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase client not initialized' }
      }

      const path = folder ? `${userId}/${folder}` : userId
      
      const { data, error } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('List files error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, files: data || [] }
    } catch (error) {
      console.error('List files error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown list files error' 
      }
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(filePath: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase client not initialized' }
      }

      const { data, error } = await supabaseAdmin.storage
        .from(this.BUCKET_NAME)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        })

      if (error) {
        console.error('Get metadata error:', error)
        return { success: false, error: error.message }
      }

      const file = data?.[0]
      if (!file) {
        return { success: false, error: 'File not found' }
      }

      return { success: true, metadata: file }
    } catch (error) {
      console.error('Get metadata error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown metadata error' 
      }
    }
  }

  /**
   * Check if file type is allowed
   */
  static isFileTypeAllowed(fileType: string): boolean {
    const allowedTypes = [
      ...this.ALLOWED_VIDEO_TYPES,
      ...this.ALLOWED_DOCUMENT_TYPES,
      ...this.ALLOWED_IMAGE_TYPES
    ]
    return allowedTypes.includes(fileType)
  }

  /**
   * Get file type category
   */
  static getFileTypeCategory(fileType: string): 'video' | 'document' | 'image' | 'other' {
    if (this.ALLOWED_VIDEO_TYPES.includes(fileType)) return 'video'
    if (this.ALLOWED_IMAGE_TYPES.includes(fileType)) return 'image'
    if (this.ALLOWED_DOCUMENT_TYPES.includes(fileType)) return 'document'
    return 'other'
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export default StorageService
