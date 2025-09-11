"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  FileSpreadsheet, 
  File, 
  Download, 
  Eye,
  Calendar,
  HardDrive
} from "lucide-react"
import { useDocumentViewer } from "@/hooks/use-document-viewer"
import { DocumentViewerModal } from "./document-viewer-modal"

interface FileItem {
  id: string
  name: string
  url: string
  type: string
  size?: number
  uploadedAt?: string
}

interface FileListProps {
  files: FileItem[]
  title?: string
  showDownload?: boolean
  showViewer?: boolean
  className?: string
}

export function FileList({ 
  files, 
  title, 
  showDownload = true, 
  showViewer = true,
  className = ""
}: FileListProps) {
  const { isOpen, file, title: modalTitle, showDownload: modalShowDownload, showMaximize, openDocument, closeDocument } = useDocumentViewer()

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case 'ppt':
      case 'pptx':
        return <FileText className="h-5 w-5 text-orange-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    switch (extension) {
      case 'pdf': return 'PDF'
      case 'doc': return 'DOC'
      case 'docx': return 'DOCX'
      case 'xls': return 'XLS'
      case 'xlsx': return 'XLSX'
      case 'ppt': return 'PPT'
      case 'pptx': return 'PPTX'
      default: return extension.toUpperCase()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleViewFile = (file: FileItem) => {
    openDocument(file, {
      title: title,
      showDownload: showDownload,
      showMaximize: true
    })
  }

  const handleDownloadFile = (file: FileItem) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <File className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400">No files available</p>
      </div>
    )
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        )}
        
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getFileIcon(file.name)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-medium truncate">{file.name}</h4>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {getFileType(file.name)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  {file.size && (
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  )}
                  {file.uploadedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {showViewer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewFile(file)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              )}
              
              {showDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile(file)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isOpen}
        onClose={closeDocument}
        file={file!}
        title={modalTitle}
        showDownload={modalShowDownload}
        showMaximize={showMaximize}
      />
    </>
  )
}
