import { useState, useCallback } from 'react'
import { StorageService, UploadResult, FileMetadata } from './api'
import { useAuthStore } from '@/store/auth-store'

export interface UseFileUploadOptions {
  onSuccess?: (result: UploadResult) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
  maxFiles?: number
  allowedTypes?: string[]
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<UploadResult>
  uploadMultipleFiles: (files: File[]) => Promise<UploadResult[]>
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
  getPublicUrl: (filePath: string) => string
  getSignedUrl: (filePath: string, expiresIn?: number) => Promise<{ success: boolean; url?: string; error?: string }>
  listUserFiles: (folder?: string) => Promise<{ success: boolean; files?: any[]; error?: string }>
  isUploading: boolean
  uploadProgress: number
  error: string | null
  clearError: () => void
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { user } = useAuthStore()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    if (!user?.email) {
      const errorMsg = 'User not authenticated'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return { success: false, error: errorMsg }
    }

    // Check file type if allowedTypes is specified
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      const errorMsg = `File type ${file.type} is not allowed`
      setError(errorMsg)
      options.onError?.(errorMsg)
      return { success: false, error: errorMsg }
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const result = await StorageService.uploadFile(file, user.email, {
        onProgress: (progress) => {
          setUploadProgress(progress)
          options.onProgress?.(progress)
        }
      })

      if (result.success) {
        options.onSuccess?.(result)
      } else {
        setError(result.error || 'Upload failed')
        options.onError?.(result.error || 'Upload failed')
      }

      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown upload error'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [user?.email, options])

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    if (!user?.email) {
      const errorMsg = 'User not authenticated'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return files.map(() => ({ success: false, error: errorMsg }))
    }

    // Check max files limit
    if (options.maxFiles && files.length > options.maxFiles) {
      const errorMsg = `Maximum ${options.maxFiles} files allowed`
      setError(errorMsg)
      options.onError?.(errorMsg)
      return files.map(() => ({ success: false, error: errorMsg }))
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const results = await StorageService.uploadMultipleFiles(files, user.email, {
        onProgress: (fileIndex, progress) => {
          const totalProgress = ((fileIndex + progress / 100) / files.length) * 100
          setUploadProgress(totalProgress)
          options.onProgress?.(totalProgress)
        }
      })

      const successCount = results.filter(r => r.success).length
      if (successCount === files.length) {
        // All uploads successful
        results.forEach(result => {
          if (result.success) {
            options.onSuccess?.(result)
          }
        })
      } else {
        const errorMsg = `${successCount}/${files.length} files uploaded successfully`
        setError(errorMsg)
        options.onError?.(errorMsg)
      }

      return results
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown upload error'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return files.map(() => ({ success: false, error: errorMsg }))
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [user?.email, options])

  const deleteFile = useCallback(async (filePath: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.email) {
      const errorMsg = 'User not authenticated'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setError(null)

    try {
      const result = await StorageService.deleteFile(filePath)
      if (!result.success) {
        setError(result.error || 'Delete failed')
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown delete error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [user?.email])

  const getPublicUrl = useCallback((filePath: string): string => {
    return StorageService.getPublicUrl(filePath)
  }, [])

  const getSignedUrl = useCallback(async (
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user?.email) {
      const errorMsg = 'User not authenticated'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setError(null)

    try {
      const result = await StorageService.getSignedUrl(filePath, expiresIn)
      if (!result.success) {
        setError(result.error || 'Failed to get signed URL')
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown signed URL error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [user?.email])

  const listUserFiles = useCallback(async (folder?: string): Promise<{ success: boolean; files?: any[]; error?: string }> => {
    if (!user?.email) {
      const errorMsg = 'User not authenticated'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setError(null)

    try {
      const result = await StorageService.listUserFiles(user.email, folder)
      if (!result.success) {
        setError(result.error || 'Failed to list files')
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown list files error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [user?.email])

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getPublicUrl,
    getSignedUrl,
    listUserFiles,
    isUploading,
    uploadProgress,
    error,
    clearError
  }
}

export default useFileUpload
