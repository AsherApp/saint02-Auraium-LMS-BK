"use client"

import type React from "react"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, PlayCircle, CheckCircle2, ClipboardList, FileText, MessageSquare, AlarmClock, Eye, Download, Award } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"

export default function PublicStudentCourseDetailPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("curriculum")
  
  // Document and presentation viewers
  const [viewingDocument, setViewingDocument] = useState<FileInfo | null>(null)
  const [viewingPresentation, setViewingPresentation] = useState<FileInfo | null>(null)

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!params.id || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch course details
        const courseResponse = await http<any>(`/api/courses/${params.id}`)
        
        // Verify this is a public course
        if (courseResponse.course_mode !== 'public') {
          setError('This course is not available in public mode')
          return
        }
        
        setCourse(courseResponse)
        
        // Fetch modules
        const modulesResponse = await http<any>(`/api/courses/${params.id}/modules`)
        setModules(modulesResponse.items || [])
        
      } catch (err) {
        console.error('Error fetching course data:', err)
        setError('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [params.id, user?.email])

  // Calculate progress
  const progress = useMemo(() => {
    if (!modules.length) return 0
    
    const totalLessons = modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
    const completedLessons = modules.reduce((sum, module) => 
      sum + (module.lessons?.filter((lesson: any) => lesson.completed).length || 0), 0
    )
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }, [modules])

  // Check if course is completed
  const isCompleted = progress >= 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{error || 'Course not found'}</p>
          <Link href="/student/public-dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/student/public-dashboard">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Eye className="h-3 w-3 mr-1" />
              Public Course
            </Badge>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-slate-300 text-lg mb-4">{course.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {modules.length} Modules
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {progress}% Complete
                </span>
                {isCompleted && (
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Award className="h-3 w-3 mr-1" />
                    Course Completed
                  </Badge>
                )}
              </div>
            </div>
            
            {isCompleted && (
              <div className="text-center">
                <Button className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Course Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <GlassCard className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <FluidTabs
              tabs={[
                { 
                  id: 'curriculum', 
                  label: 'Curriculum', 
                  icon: <BookOpen className="h-4 w-4" />,
                  badge: modules.length
                }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="default"
              width="wide"
            />

            <TabsContent value="curriculum" className="mt-6">
              {modules.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No modules available</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Course content is being prepared
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {modules.map((module, moduleIndex) => (
                    <div key={module.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">
                            Module {moduleIndex + 1}: {module.title}
                          </h3>
                          <p className="text-slate-400">{module.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {module.lessons?.length || 0} Lessons
                        </Badge>
                      </div>

                      {module.lessons && module.lessons.length > 0 ? (
                        <div className="space-y-3">
                          {module.lessons.map((lesson: any, lessonIndex: number) => (
                            <div 
                              key={lesson.id} 
                              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm text-slate-300">
                                  {lessonIndex + 1}
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">{lesson.title}</h4>
                                  <p className="text-slate-400 text-sm">{lesson.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {lesson.completed ? (
                                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                                    <AlarmClock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                                
                                <Link href={`/student/public-study/${params.id}/${module.id}/${lesson.id}`}>
                                  <Button size="sm" variant="outline">
                                    <PlayCircle className="h-4 w-4 mr-1" />
                                    {lesson.completed ? 'Review' : 'Start'}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-400">No lessons available</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </GlassCard>

        {/* Public Mode Notice */}
        <div className="mt-8">
          <GlassCard className="p-6 bg-blue-500/10 border-blue-500/20">
            <div className="flex items-center gap-4">
              <Eye className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Public Learning Mode
                </h3>
                <p className="text-slate-300 text-sm">
                  You're viewing this course in public mode. Some features like assignments, 
                  live classes, and discussions are not available in this simplified environment.
                </p>
              </div>
            </div>
          </GlassCard>
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