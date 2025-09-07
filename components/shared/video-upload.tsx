import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useFileUpload } from '@/services/storage/hook'
import { StorageService } from '@/services/storage/api'
import { 
  Upload, 
  Video, 
  X, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react'

interface VideoUploadProps {
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
  className?: string
  disabled?: boolean
  maxSize?: number // in MB
  showPreview?: boolean
  folder?: string
}

interface UploadedVideo {
  file: File
  result?: any
  preview?: string
  duration?: number
}

export function VideoUpload({
  onSuccess,
  onError,
  onProgress,
  className = '',
  disabled = false,
  maxSize = 100,
  showPreview = true,
  folder
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
    clearError
  } = useFileUpload({
    onSuccess: (result) => {
      onSuccess?.(result)
    },
    onError: (error) => {
      onError?.(error)
    },
    onProgress: (progress) => {
      onProgress?.(progress)
    },
    allowedTypes: [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv'
    ]
  })

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file
    if (!file.type.startsWith('video/')) {
      onError?.('Please select a video file')
      return
    }

    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`Video size exceeds ${maxSize}MB limit`)
      return
    }

    // Create preview URL
    const preview = URL.createObjectURL(file)
    
    // Get video duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = video.duration
      setUploadedVideo({
        file,
        preview,
        duration
      })
    }
    video.src = preview

    // Upload video
    try {
      const result = await uploadFile(file)
      setUploadedVideo(prev => prev ? { ...prev, result } : null)
    } catch (err) {
      console.error('Upload error:', err)
    }
  }, [uploadFile, maxSize, onError])

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

  const removeVideo = useCallback(async () => {
    if (!uploadedVideo) return
    
    // If video was uploaded successfully, delete it from storage
    if (uploadedVideo.result?.success && uploadedVideo.result.path) {
      await deleteFile(uploadedVideo.result.path)
    }
    
    // Remove preview URL to free memory
    if (uploadedVideo.preview) {
      URL.revokeObjectURL(uploadedVideo.preview)
    }
    
    setUploadedVideo(null)
  }, [uploadedVideo, deleteFile])

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!uploadedVideo && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
            accept="video/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="space-y-4">
            <Video className="h-12 w-12 mx-auto text-slate-400" />
            <div>
              <p className="text-white font-medium text-lg">Upload Video</p>
              <p className="text-slate-400">Click to upload or drag and drop</p>
            </div>
            <div className="text-sm text-slate-500">
              <p>Supported formats: MP4, WebM, OGG, AVI, MOV</p>
              <p>Max size: {maxSize}MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white">Uploading video...</span>
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

      {/* Video Preview */}
      {uploadedVideo && showPreview && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={uploadedVideo.preview}
              className="w-full h-auto max-h-96"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              muted={isMuted}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
                
                {uploadedVideo.duration && (
                  <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                    {formatDuration(uploadedVideo.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-white font-medium">{uploadedVideo.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"
                  >
                    Video
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {StorageService.formatFileSize(uploadedVideo.file.size)}
                  </span>
                  {uploadedVideo.duration && (
                    <span className="text-xs text-slate-400">
                      {formatDuration(uploadedVideo.duration)}
                    </span>
                  )}
                  {uploadedVideo.result?.success && (
                    <CheckCircle className="h-3 w-3 text-green-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadedVideo.result?.success && uploadedVideo.result.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(uploadedVideo.result.url, '_blank')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  View
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={removeVideo}
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Another Button */}
      {uploadedVideo && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Another Video
          </Button>
        </div>
      )}
    </div>
  )
}

export default VideoUpload
