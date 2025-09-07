import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useFileUpload, UseFileUploadOptions } from '@/services/storage/hook'
import { StorageService } from '@/services/storage/api'
import { 
  Upload, 
  File, 
  Video, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Download
} from 'lucide-react'

interface FileUploadProps extends UseFileUploadOptions {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
  placeholder?: string
  showPreview?: boolean
  folder?: string
}

interface UploadedFile {
  file: File
  result?: any
  preview?: string
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 100,
  className = '',
  disabled = false,
  placeholder = 'Click to upload or drag and drop',
  showPreview = true,
  folder,
  onSuccess,
  onError,
  onProgress,
  maxFiles = 10,
  allowedTypes,
  ...options
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
    clearError
  } = useFileUpload({
    ...options,
    onSuccess: (result) => {
      onSuccess?.(result)
    },
    onError: (error) => {
      onError?.(error)
    },
    onProgress: (progress) => {
      onProgress?.(progress)
    },
    maxFiles,
    allowedTypes
  })

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validate files
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name} exceeds ${maxSize}MB limit`)
        continue
      }

      // Check file type
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        errors.push(`${file.name} type is not allowed`)
        continue
      }

      // Check if file type is supported by storage service
      if (!StorageService.isFileTypeAllowed(file.type)) {
        errors.push(`${file.name} type is not supported`)
        continue
      }

      validFiles.push(file)
    }

    if (errors.length > 0) {
      onError?.(errors.join(', '))
    }

    if (validFiles.length === 0) return

    // Create preview URLs for images and videos
    const filesWithPreview: UploadedFile[] = validFiles.map(file => {
      const uploadedFile: UploadedFile = { file }
      
      if (showPreview && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        uploadedFile.preview = URL.createObjectURL(file)
      }
      
      return uploadedFile
    })

    setUploadedFiles(prev => multiple ? [...prev, ...filesWithPreview] : filesWithPreview)

    // Upload files
    try {
      if (multiple) {
        const results = await uploadMultipleFiles(validFiles)
        setUploadedFiles(prev => 
          prev.map((uploadedFile, index) => ({
            ...uploadedFile,
            result: results[index]
          }))
        )
      } else {
        const result = await uploadFile(validFiles[0])
        setUploadedFiles(prev => 
          prev.map((uploadedFile, index) => 
            index === 0 ? { ...uploadedFile, result } : uploadedFile
          )
        )
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
  }, [uploadFile, uploadMultipleFiles, maxSize, allowedTypes, multiple, showPreview, onError])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [handleFileSelect, disabled])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const removeFile = useCallback(async (index: number) => {
    const fileToRemove = uploadedFiles[index]
    
    // If file was uploaded successfully, delete it from storage
    if (fileToRemove.result?.success && fileToRemove.result.path) {
      await deleteFile(fileToRemove.result.path)
    }
    
    // Remove preview URL to free memory
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
    
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [uploadedFiles, deleteFile])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.startsWith('text/') || file.type.includes('document')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFileTypeColor = (file: File) => {
    const category = StorageService.getFileTypeCategory(file.type)
    switch (category) {
      case 'video': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'image': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'document': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-white/20 bg-white/5 hover:border-white/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-slate-400" />
          <p className="text-white font-medium">{placeholder}</p>
          <p className="text-sm text-slate-400">
            {accept ? `Accepted formats: ${accept}` : 'All file types supported'}
          </p>
          <p className="text-xs text-slate-500">
            Max size: {maxSize}MB {multiple && `• Max files: ${maxFiles}`}
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white">Uploading...</span>
            <span className="text-slate-400">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-medium">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(uploadedFile.file)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {uploadedFile.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getFileTypeColor(uploadedFile.file)}`}
                    >
                      {StorageService.getFileTypeCategory(uploadedFile.file.type)}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {StorageService.formatFileSize(uploadedFile.file.size)}
                    </span>
                    {uploadedFile.result?.success && (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {uploadedFile.result?.success && uploadedFile.result.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(uploadedFile.result.url, '_blank')}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
