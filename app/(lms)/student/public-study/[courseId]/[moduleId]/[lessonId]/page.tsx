"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  Download,
  FileText,
  Video,
  Image,
  File
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"

export default function PublicStudyPage() {
  const params = useParams<{ courseId: string; moduleId: string; lessonId: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<any>(null)
  const [module, setModule] = useState<any>(null)
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  
  // Document and presentation viewers
  const [viewingDocument, setViewingDocument] = useState<FileInfo | null>(null)
  const [viewingPresentation, setViewingPresentation] = useState<FileInfo | null>(null)

  // Fetch lesson data
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!params.courseId || !params.moduleId || !params.lessonId || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch course details
        const courseResponse = await http<any>(`/api/courses/${params.courseId}`)
        
        // Verify this is a public course
        if (courseResponse.course_mode !== 'public') {
          setError('This course is not available in public mode')
          return
        }
        
        setCourse(courseResponse)
        
        // Fetch module details
        const moduleResponse = await http<any>(`/api/courses/${params.courseId}/modules/${params.moduleId}`)
        setModule(moduleResponse)
        
        // Fetch lesson details
        const lessonResponse = await http<any>(`/api/courses/${params.courseId}/modules/${params.moduleId}/lessons/${params.lessonId}`)
        setLesson(lessonResponse)
        
        // Check if lesson is completed
        setCompleted(lessonResponse.completed || false)
        
      } catch (err) {
        console.error('Error fetching lesson data:', err)
        setError('Failed to load lesson data')
      } finally {
        setLoading(false)
      }
    }

    fetchLessonData()
  }, [params.courseId, params.moduleId, params.lessonId, user?.email])

  const handleMarkComplete = async () => {
    if (!lesson || completed) return
    
    try {
      // Mark lesson as completed
      await http(`/api/courses/${params.courseId}/modules/${params.moduleId}/lessons/${params.lessonId}/complete`, {
        method: 'POST'
      })
      
      setCompleted(true)
      
      // Show success message
      // You can add a toast notification here
      
    } catch (err) {
      console.error('Error marking lesson complete:', err)
    }
  }

  const handlePreviewFile = (content: any) => {
    const fileInfo = contentToFileInfo(content)
    if (!fileInfo) return
    
    const viewerType = getViewerType(fileInfo)
    
    if (viewerType === 'document') {
      setViewingDocument(fileInfo)
    } else if (viewerType === 'presentation') {
      setViewingPresentation(fileInfo)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (error || !course || !module || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{error || 'Lesson not found'}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/student/public-course/${params.courseId}`)}
          >
            Back to Course
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/student/public-course/${params.courseId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Course
            </Button>
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Eye className="h-3 w-3 mr-1" />
              Public Learning
            </Badge>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{lesson.title}</h1>
              <p className="text-slate-300 mb-4">{lesson.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.title}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {module.title}
                </span>
                {completed && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Lesson Content</h2>
                
                {lesson.content ? (
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-slate-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No content available</p>
                    <p className="text-slate-500 text-sm mt-2">
                      This lesson doesn't have content yet
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson Resources */}
              {lesson.resources && lesson.resources.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
                  <div className="space-y-3">
                    {lesson.resources.map((resource: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                            {resource.type === 'video' ? (
                              <Video className="h-5 w-5 text-slate-300" />
                            ) : resource.type === 'image' ? (
                              <Image className="h-5 w-5 text-slate-300" />
                            ) : (
                              <File className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{resource.name}</h4>
                            <p className="text-slate-400 text-sm">{resource.description}</p>
                          </div>
                        </div>
                        
                        {canPreviewFile(resource) ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePreviewFile(resource)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {getPreviewButtonText(resource)}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Button */}
              <div className="flex justify-center pt-6 border-t border-white/10">
                {completed ? (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Lesson Completed
                  </Badge>
                ) : (
                  <Button 
                    onClick={handleMarkComplete}
                    className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Progress */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Course Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Overall Progress</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Module Progress</span>
                    <span>60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </div>
            </GlassCard>

            {/* Navigation */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/student/public-course/${params.courseId}`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/student/public-dashboard')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </GlassCard>

            {/* Public Mode Notice */}
            <GlassCard className="p-6 bg-blue-500/10 border-blue-500/20">
              <div className="text-center">
                <Eye className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Public Learning Mode
                </h3>
                <p className="text-slate-300 text-sm">
                  You're studying in public mode. This is a simplified learning environment 
                  focused on course content and progress tracking.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          file={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {/* Presentation Viewer */}
      {viewingPresentation && (
        <PresentationViewer
          file={viewingPresentation}
          onClose={() => setViewingPresentation(null)}
        />
      )}
    </div>
  )
}