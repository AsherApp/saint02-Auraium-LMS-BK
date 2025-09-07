import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { UniversalMediaPlayer } from "@/components/shared/universal-media-player"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"
import { 
  FileText, 
  Video, 
  Play, 
  Eye,
  Download
} from "lucide-react"

interface Lesson {
  id: string
  title: string
  type: string
  content: string
  description?: string
  duration?: number
  order_index: number
}

interface LessonContentViewerProps {
  lesson: Lesson
  onMarkComplete: () => void
  isCompleted: boolean
  markingComplete: boolean
}

export function LessonContentViewer({ 
  lesson, 
  onMarkComplete, 
  isCompleted, 
  markingComplete 
}: LessonContentViewerProps) {
  const [viewingDocument, setViewingDocument] = useState<FileInfo | null>(null)
  const [viewingPresentation, setViewingPresentation] = useState<FileInfo | null>(null)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

  const handlePreviewContent = () => {
    if (!lesson.content) return

    const fileInfo = contentToFileInfo(lesson.content, lesson.title)
    const viewerType = getViewerType(fileInfo)

    if (viewerType === 'document') {
      setViewingDocument(fileInfo)
      setDocumentViewerOpen(true)
    } else if (viewerType === 'presentation') {
      setViewingPresentation(fileInfo)
    }
  }

  const renderContent = () => {
    if (!lesson.content) {
      return (
        <div className="text-center py-12 text-slate-400">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No content available for this lesson</p>
        </div>
      )
    }

    const fileInfo = contentToFileInfo(lesson.content, lesson.title)
    const viewerType = getViewerType(fileInfo)

    switch (viewerType) {
      case 'video':
        return (
          <div className="w-full">
            <UniversalMediaPlayer 
              src={lesson.content}
              title={lesson.title}
              type="video"
            />
          </div>
        )
      
      case 'audio':
        return (
          <div className="w-full">
            <UniversalMediaPlayer 
              src={lesson.content}
              title={lesson.title}
              type="audio"
            />
          </div>
        )
      
      case 'document':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-400" />
                <div>
                  <h3 className="text-white font-medium">{lesson.title}</h3>
                  <p className="text-sm text-slate-400">Document</p>
                </div>
              </div>
              <Button
                onClick={handlePreviewContent}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        )
      
      case 'presentation':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-purple-400" />
                <div>
                  <h3 className="text-white font-medium">{lesson.title}</h3>
                  <p className="text-sm text-slate-400">Presentation</p>
                </div>
              </div>
              <Button
                onClick={handlePreviewContent}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                View Presentation
              </Button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-slate-400" />
                <div>
                  <h3 className="text-white font-medium">{lesson.title}</h3>
                  <p className="text-sm text-slate-400">File</p>
                </div>
              </div>
              <div className="flex gap-2">
                {canPreviewFile(fileInfo) && (
                  <Button
                    onClick={handlePreviewContent}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {getPreviewButtonText(fileInfo)}
                  </Button>
                )}
                <Button
                  onClick={() => window.open(lesson.content, '_blank')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
          {lesson.description && (
            <p className="text-slate-400 mt-2">{lesson.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            {lesson.type}
          </Badge>
          {lesson.duration && (
            <Badge 
              variant="outline" 
              className="bg-green-500/20 text-green-400 border-green-500/30"
            >
              {lesson.duration} min
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white/5 rounded-lg border border-white/10 p-6">
        {renderContent()}
      </div>

      {/* Completion Button */}
      <div className="flex justify-center">
        <Button
          onClick={onMarkComplete}
          disabled={isCompleted || markingComplete}
          className={`px-8 py-3 text-lg font-medium transition-all duration-200 ${
            isCompleted 
              ? "bg-green-600 text-white cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-lg"
          }`}
        >
          {markingComplete ? (
            "Marking Complete..."
          ) : isCompleted ? (
            "✓ Completed"
          ) : (
            "Mark as Complete"
          )}
        </Button>
      </div>

      {/* Document Viewer Modal */}
      {documentViewerOpen && viewingDocument && (
        <DocumentViewer
          file={viewingDocument}
          isOpen={documentViewerOpen}
          onClose={() => {
            setDocumentViewerOpen(false)
            setViewingDocument(null)
          }}
        />
      )}

      {/* Presentation Viewer Modal */}
      {viewingPresentation && (
        <PresentationViewer
          file={viewingPresentation}
          isOpen={!!viewingPresentation}
          onClose={() => setViewingPresentation(null)}
        />
      )}
    </div>
  )
}
