"use client"

import { useState, useRef, useCallback } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  FolderOpen,
  Cloud,
  HardDrive,
  Wifi,
  WifiOff
} from "lucide-react"
import { FileList } from "@/components/shared/file-list"

interface FileUploadSubmissionProps {
  content: any
  setContent: (content: any) => void
  readOnly?: boolean
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt: Date
  status: 'uploading' | 'completed' | 'error'
  progress?: number
  error?: string
}

export function FileUploadSubmission({ content, setContent, readOnly = false }: FileUploadSubmissionProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>(content?.files || [])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-5 w-5 text-green-400" />
    if (type.includes('video')) return <Video className="h-5 w-5 text-blue-400" />
    if (type.includes('audio')) return <Music className="h-5 w-5 text-purple-400" />
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-400" />
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <Archive className="h-5 w-5 text-orange-400" />
    if (type.includes('doc') || type.includes('docx')) return <FileText className="h-5 w-5 text-blue-400" />
    if (type.includes('xls') || type.includes('xlsx')) return <FileText className="h-5 w-5 text-green-400" />
    if (type.includes('ppt') || type.includes('pptx')) return <FileText className="h-5 w-5 text-orange-400" />
    return <File className="h-5 w-5 text-slate-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/json', 'application/xml'
    ]

    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported'
    }

    return null
  }

  const simulateUpload = async (file: File): Promise<UploadedFile> => {
    const fileId = Math.random().toString(36).substr(2, 9)
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'uploading',
      progress: 0
    }

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      uploadedFile.progress = progress
      setFiles(prev => prev.map(f => f.id === fileId ? { ...uploadedFile } : f))
    }

    // Simulate completion
    uploadedFile.status = 'completed'
    uploadedFile.url = URL.createObjectURL(file)
    
    return uploadedFile
  }

  const handleFileUpload = async (selectedFiles: FileList) => {
    setUploading(true)
    
    for (const file of Array.from(selectedFiles)) {
      const validationError = validateFile(file)
      if (validationError) {
        toast({
          title: "Upload failed",
          description: `${file.name}: ${validationError}`,
          variant: "destructive"
        })
        continue
      }

      const fileId = Math.random().toString(36).substr(2, 9)
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'uploading',
        progress: 0
      }

      setFiles(prev => [...prev, newFile])

      try {
        const uploadedFile = await simulateUpload(file)
        setFiles(prev => prev.map(f => f.id === fileId ? uploadedFile : f))
        
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded successfully.`,
        })
      } catch (error) {
        setFiles(prev => prev.map(f => f.id === fileId ? {
          ...f,
          status: 'error',
          error: 'Upload failed'
        } : f))
        
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}.`,
          variant: "destructive"
        })
      }
    }

    setUploading(false)
    updateContent()
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (readOnly) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [readOnly])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!readOnly) {
      setIsDragOver(true)
    }
  }, [readOnly])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    updateContent()
  }

  const updateContent = () => {
    setContent({ files: files.filter(f => f.status === 'completed') })
  }

  const getTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0)
  }

  const getFileCount = () => {
    return files.filter(f => f.status === 'completed').length
  }

  return (
    <div className="space-y-6">
      {/* Upload Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Upload className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">File Upload</h3>
            <p className="text-slate-400 text-sm">Upload your assignment files</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {getFileCount()} files
          </Badge>
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {formatFileSize(getTotalSize())}
          </Badge>
        </div>
      </div>

      {/* Upload Area */}
      {!readOnly && (
        <GlassCard 
          className={`p-8 border-2 border-dashed transition-all duration-200 ${
            isDragOver 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-slate-600 hover:border-slate-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-slate-400" />
            </div>
            
            <h4 className="text-lg font-medium text-white mb-2">
              {isDragOver ? 'Drop files here' : 'Upload Files'}
            </h4>
            
            <p className="text-slate-400 mb-4">
              Drag and drop files here, or click to select files
            </p>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.mp3,.wav,.ogg,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml"
            />
            
            <p className="text-xs text-slate-500 mt-4">
              Supported formats: Images, Videos, Audio, PDF, Documents, Archives, Text files
              <br />
              Maximum file size: 50MB per file
            </p>
          </div>
        </GlassCard>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Uploaded Files</h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400 text-sm">
                <HardDrive className="h-4 w-4" />
                <span>{formatFileSize(getTotalSize())}</span>
              </div>
            </div>
          </div>
          
          {/* Show completed files with document viewer */}
          <FileList
            files={files
              .filter(file => file.status === 'completed')
              .map(file => ({
                id: file.id,
                name: file.name,
                url: file.url || '#',
                type: file.type,
                size: file.size,
                uploadedAt: file.uploadedAt.toISOString()
              }))}
            showDownload={!readOnly}
            showViewer={true}
          />
          
          {/* Show uploading and error files separately */}
          {files.some(file => file.status !== 'completed') && (
            <div className="mt-4 space-y-3">
              {files
                .filter(file => file.status !== 'completed')
                .map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <Badge 
                          variant="outline" 
                          className={
                            file.status === 'uploading' ? 'border-blue-500 text-blue-400' :
                            'border-red-500 text-red-400'
                          }
                        >
                          {file.status === 'uploading' ? (
                            <>
                              <Cloud className="h-3 w-3 mr-1" />
                              Uploading
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Error
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.type}</span>
                        <span>{file.uploadedAt.toLocaleTimeString()}</span>
                      </div>
                      
                      {file.status === 'uploading' && file.progress !== undefined && (
                        <div className="mt-2">
                          <Progress value={file.progress} className="h-2" />
                          <p className="text-xs text-slate-400 mt-1">{file.progress}% uploaded</p>
                        </div>
                      )}
                      
                      {file.status === 'error' && file.error && (
                        <p className="text-red-400 text-sm mt-1">{file.error}</p>
                      )}
                    </div>
                    
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Upload Status */}
      {uploading && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Uploading files...</span>
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {files.length === 0 && !uploading && (
        <GlassCard className="p-8">
          <div className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">No files uploaded</h4>
            <p className="text-slate-400">
              {readOnly ? 'No files have been uploaded for this assignment.' : 'Upload your assignment files to get started.'}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
