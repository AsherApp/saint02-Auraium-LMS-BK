"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Eye, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  ExternalLink
} from "lucide-react"
import { DocumentViewer } from "./document-viewer"

interface FileUploadViewerProps {
  files: string[] | string
  readOnly?: boolean
  showHeader?: boolean
  className?: string
}

interface ViewingFile {
  name: string
  url: string
  type: string
}

export function FileUploadViewer({ 
  files, 
  readOnly = true,
  showHeader = true,
  className = ""
}: FileUploadViewerProps) {
  const [viewingFile, setViewingFile] = useState<ViewingFile | null>(null)

  const fileList = Array.isArray(files) ? files : [files]

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-400" />
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-400" />
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-400" />
      case 'ppt':
      case 'pptx':
        return <FileText className="h-5 w-5 text-orange-400" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <FileImage className="h-5 w-5 text-purple-400" />
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
        return <FileVideo className="h-5 w-5 text-pink-400" />
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return <FileAudio className="h-5 w-5 text-indigo-400" />
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive className="h-5 w-5 text-yellow-400" />
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'scss':
      case 'json':
      case 'xml':
        return <FileCode className="h-5 w-5 text-emerald-400" />
      default:
        return <File className="h-5 w-5 text-slate-400" />
    }
  }

  const getFileType = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return 'PDF Document'
      case 'doc':
      case 'docx':
        return 'Word Document'
      case 'xls':
      case 'xlsx':
        return 'Excel Spreadsheet'
      case 'ppt':
      case 'pptx':
        return 'PowerPoint Presentation'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return 'Image File'
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
        return 'Video File'
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return 'Audio File'
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return 'Archive File'
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'scss':
      case 'json':
      case 'xml':
        return 'Code File'
      default:
        return 'File'
    }
  }

  const getFileSize = (filename: string) => {
    // Mock file size - in real implementation, this would come from the file metadata
    const sizes = ['1.2 MB', '856 KB', '2.3 MB', '445 KB', '1.8 MB']
    return sizes[Math.floor(Math.random() * sizes.length)]
  }

  const handleViewFile = (filename: string) => {
    // In a real implementation, this would use the actual file URL
    const mockUrl = `/uploads/${filename}`
    setViewingFile({
      name: filename,
      url: mockUrl,
      type: getFileType(filename)
    })
  }

  const handleDownloadFile = (filename: string) => {
    // In a real implementation, this would trigger the actual download
    const mockUrl = `/uploads/${filename}`
    const a = document.createElement('a')
    a.href = mockUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-white">Uploaded Files</h4>
              <p className="text-slate-400 text-sm">{fileList.length} file{fileList.length !== 1 ? 's' : ''} submitted</p>
            </div>
          </div>
        </div>
      )}

      {fileList.length > 0 ? (
        <div className="space-y-3">
          {fileList.map((filename, index) => (
            <GlassCard key={index} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(filename)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium truncate">{filename}</p>
                    <Badge variant="outline" className="border-slate-500 text-slate-300 text-xs">
                      {getFileType(filename)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{getFileSize(filename)}</span>
                    <span>Uploaded {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewFile(filename)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadFile(filename)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-8">
          <div className="text-center text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No files uploaded</p>
            <p className="text-sm">The student has not submitted any files for this assignment.</p>
          </div>
        </GlassCard>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewingFile}
        isOpen={!!viewingFile}
        onClose={() => setViewingFile(null)}
        title="Assignment File"
        subtitle={viewingFile?.name}
      />
    </div>
  )
}
