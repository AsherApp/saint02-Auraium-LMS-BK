"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Maximize2, 
  Minimize2, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  ExternalLink
} from "lucide-react"

interface DocumentFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt?: string
}

interface DocumentViewerProps {
  document: DocumentFile | null
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
}

export function DocumentViewer({ 
  document, 
  isOpen, 
  onClose, 
  title = "Document Viewer",
  subtitle 
}: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  if (!document) return null

  const isPDF = document.type === 'application/pdf' || document.name.toLowerCase().endsWith('.pdf')
  const isImage = document.type.startsWith('image/')
  const isText = document.type.startsWith('text/') || 
                 document.name.toLowerCase().endsWith('.txt') ||
                 document.name.toLowerCase().endsWith('.md')
  const isWord = document.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                 document.type === 'application/msword' ||
                 document.name.toLowerCase().endsWith('.docx') ||
                 document.name.toLowerCase().endsWith('.doc')
  const isPowerPoint = document.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                       document.type === 'application/vnd.ms-powerpoint' ||
                       document.name.toLowerCase().endsWith('.pptx') ||
                       document.name.toLowerCase().endsWith('.ppt')
  const isExcel = document.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  document.type === 'application/vnd.ms-excel' ||
                  document.name.toLowerCase().endsWith('.xlsx') ||
                  document.name.toLowerCase().endsWith('.xls')

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = document.url
    link.download = document.name
    link.click()
  }

  const handleExternalOpen = () => {
    window.open(document.url, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`bg-white/10 border-white/20 backdrop-blur text-white ${
          isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl max-h-[80vh]'
        } overflow-hidden`}
      >
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-white truncate">{title}</DialogTitle>
              {subtitle && (
                <p className="text-slate-400 text-sm truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="border-slate-500 text-slate-300">
                {Math.round(document.size / 1024)} KB
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Document Info Bar */}
        <div className="flex items-center justify-between py-2 px-1 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-white font-medium text-sm truncate max-w-[200px]">
                {document.name}
              </div>
              <div className="text-slate-400 text-xs">
                {document.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : 'Document'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!isImage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-slate-400 text-sm min-w-[50px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {isImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="text-slate-400 hover:text-white hover:bg-white/10"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExternalOpen}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-auto bg-white/5 rounded-lg p-4 min-h-[400px]">
          {isPDF ? (
            <div className="w-full h-full">
              <iframe
                src={`${document.url}#zoom=${zoom}`}
                className="w-full h-full min-h-[500px] rounded border border-white/10"
                title={document.name}
              />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={document.url}
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded"
                style={{ 
                  transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>
          ) : isText ? (
            <div className="h-full">
              <iframe
                src={document.url}
                className="w-full h-full min-h-[500px] bg-white rounded border border-white/10"
                title={document.name}
                style={{ fontSize: `${zoom}%` }}
              />
            </div>
          ) : isWord || isPowerPoint || isExcel ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Office Document</p>
                <p className="text-sm text-slate-400 mb-4">
                  {isWord ? 'Word Document' : isPowerPoint ? 'PowerPoint Presentation' : 'Excel Spreadsheet'}
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  This document type requires Microsoft Office or compatible software to view.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => window.open(document.url, '_blank')}
                    className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Browser
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="text-green-400 hover:text-green-300 border-green-400 hover:border-green-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <FileText className="h-16 w-16 text-slate-400" />
              <div className="text-center">
                <h3 className="text-white font-medium mb-2">Preview Not Available</h3>
                <p className="text-slate-400 mb-4">
                  This file type cannot be previewed in the browser.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="bg-blue-600/80 hover:bg-blue-600">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExternalOpen}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Externally
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}