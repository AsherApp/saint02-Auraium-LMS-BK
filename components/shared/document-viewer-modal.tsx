"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  Maximize2, 
  Minimize2, 
  FileText, 
  FileSpreadsheet, 
  File,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  file: {
    id: string
    name: string
    url: string
    type: string
    size?: number
    uploadedAt?: string
  }
  title?: string
  showDownload?: boolean
  showMaximize?: boolean
}

interface FileInfo {
  name: string
  type: string
  size: number
  extension: string
  icon: React.ReactNode
  color: string
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  file,
  title,
  showDownload = true,
  showMaximize = true
}: DocumentViewerModalProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const getFileInfo = (fileName: string, fileType: string): FileInfo => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    const size = file.size || 0

    switch (extension) {
      case 'pdf':
        return {
          name: fileName,
          type: 'PDF Document',
          size,
          extension: 'PDF',
          icon: <FileText className="h-6 w-6" />,
          color: 'text-red-500'
        }
      case 'doc':
      case 'docx':
        return {
          name: fileName,
          type: 'Word Document',
          size,
          extension: 'DOC',
          icon: <FileText className="h-6 w-6" />,
          color: 'text-blue-500'
        }
      case 'xls':
      case 'xlsx':
        return {
          name: fileName,
          type: 'Excel Spreadsheet',
          size,
          extension: 'XLS',
          icon: <FileSpreadsheet className="h-6 w-6" />,
          color: 'text-green-500'
        }
      case 'ppt':
      case 'pptx':
        return {
          name: fileName,
          type: 'PowerPoint Presentation',
          size,
          extension: 'PPT',
          icon: <FileText className="h-6 w-6" />,
          color: 'text-orange-500'
        }
      default:
        return {
          name: fileName,
          type: 'Document',
          size,
          extension: extension.toUpperCase(),
          icon: <File className="h-6 w-6" />,
          color: 'text-gray-500'
        }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getViewerUrl = (fileUrl: string, fileType: string): string => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    
    // For PDFs, use direct embedding
    if (extension === 'pdf') {
      return fileUrl
    }
    
    // For Office documents, use Microsoft Office Online viewer
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    }
    
    // Fallback to direct URL
    return fileUrl
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      setDownloadProgress(0)

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20
        })
      }, 200)

      // Create download link
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Complete progress
      setTimeout(() => {
        setDownloadProgress(100)
        setTimeout(() => {
          setIsDownloading(false)
          setDownloadProgress(0)
        }, 500)
      }, 1000)

    } catch (error) {
      console.error('Download failed:', error)
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  const resetView = () => {
    setZoom(100)
    setRotation(0)
  }

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setError(null)
      setZoom(100)
      setRotation(0)
    }
  }, [isOpen, file.url])

  const fileInfo = getFileInfo(file.name, file.type)
  const viewerUrl = getViewerUrl(file.url, file.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`bg-slate-900 border-slate-700 text-white p-0 ${
          isMaximized ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[90vh] w-[90vw] h-[90vh]'
        }`}
      >
        <DialogHeader className="p-6 pb-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-slate-800 rounded-lg ${fileInfo.color}`}>
                {fileInfo.icon}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  {title || fileInfo.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {fileInfo.extension}
                  </Badge>
                  {file.size && (
                    <span className="text-slate-400 text-sm">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                  {file.uploadedAt && (
                    <span className="text-slate-400 text-sm">
                      • {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Controls */}
              <div className="flex items-center gap-1 border border-slate-600 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-400 px-2 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetView}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {/* Download Button */}
              {showDownload && (
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              )}

              {/* Maximize Button */}
              {showMaximize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaximize}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Download Progress */}
          {isDownloading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Downloading...</span>
                <span className="text-sm text-slate-400">{Math.round(downloadProgress)}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-2">Failed to load document</p>
                <p className="text-slate-400 text-sm">{error}</p>
                <Button
                  onClick={() => window.open(file.url, '_blank')}
                  variant="outline"
                  className="mt-4"
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}

          {!error && (
            <div 
              className="h-full w-full overflow-auto"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <iframe
                ref={iframeRef}
                src={viewerUrl}
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError('Failed to load document preview')
                  setIsLoading(false)
                }}
                title={file.name}
                sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
              />
            </div>
          )}
        </div>

        {/* Document Info Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-slate-400">
              <span>Type: {fileInfo.type}</span>
              {file.size && <span>Size: {formatFileSize(file.size)}</span>}
              <span>Zoom: {zoom}%</span>
              {rotation > 0 && <span>Rotation: {rotation}°</span>}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Document loaded successfully</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
