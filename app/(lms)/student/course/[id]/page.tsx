"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { AnimationWrapper, StaggeredAnimationWrapper } from "@/components/shared/animation-wrapper"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, PlayCircle, CheckCircle2, ClipboardList, FileText, MessageSquare, AlarmClock, Award, Eye } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useCourseAssignments } from "@/services/assignments/hook"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"
import { http } from "@/services/http"

export default function StudentCourseDetailPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const { assignments } = useCourseAssignments(params.id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("curriculum")
  const [isPublicMode, setIsPublicMode] = useState(false)
  const [modulesWithLessons, setModulesWithLessons] = useState<any[]>([])
  

  // Set up course data
  useEffect(() => {
    if (params.id && user?.email) {
      const fetchCourseData = async () => {
        setLoading(true)
        setError(null)
        
        try {
          // Fetch real course details
          const courseResponse = await http<any>(`/api/courses/${params.id}`)
          setCourse(courseResponse)
          
          // Check if course is in public mode
          const isPublic = courseResponse.course_mode === 'public'
          setIsPublicMode(isPublic)
          
          // Update user object with course_mode for sidebar detection
          if (isPublic && user) {
            const updatedUser = { ...user, course_mode: 'public' as const }
            const { setUser } = useAuthStore.getState()
            setUser(updatedUser)
          }
          
          // Fetch real modules data
          try {
            const modulesResponse = await http<any>(`/api/modules/course/${params.id}`)
            setModules(modulesResponse.items || [])
          } catch (modulesError) {
            console.warn('Failed to fetch modules:', modulesError)
            setModules([]) // Set empty array if modules fetch fails
          }
          
        } catch (err: any) {
          setError(err.message || "Failed to load course")
          console.error('Course fetch error:', err)
        } finally {
          setLoading(false)
        }
      }
      
      fetchCourseData()
    }
  }, [params.id, user?.email])

  // Fetch lessons for each module
  useEffect(() => {
    if (modules.length > 0 && user?.email) {
      const fetchLessonsForModules = async () => {
        try {
          const modulesWithLessonsData = await Promise.all(
            modules.map(async (module) => {
              try {
                const lessonsResponse = await http<any>(`/api/lessons/module/${module.id}`)
                return {
                  ...module,
                  lessons: lessonsResponse.items || []
                }
              } catch (error) {
                console.warn(`Failed to fetch lessons for module ${module.id}:`, error)
                return {
                  ...module,
                  lessons: []
                }
              }
            })
          )
          setModulesWithLessons(modulesWithLessonsData)
        } catch (error) {
          console.error('Failed to fetch lessons for modules:', error)
          setModulesWithLessons(modules.map(module => ({ ...module, lessons: [] })))
        }
      }
      
      fetchLessonsForModules()
    }
  }, [modules, user?.email])

  const stats = useMemo(() => {
    if (!modulesWithLessons) return { modules: 0, lessons: 0, completed: 0 }
    const lessons = modulesWithLessons.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)
    // TODO: Calculate real completion based on student progress
    // For now, return 0 completed until we have progress tracking
    const completed = 0
    return { modules: modulesWithLessons.length, lessons, completed }
  }, [modulesWithLessons])

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-5 w-5 text-blue-400" />
      case 'project': return <Award className="h-5 w-5 text-green-400" />
      case 'quiz': return <CheckCircle2 className="h-5 w-5 text-purple-400" />
      case 'discussion': return <MessageSquare className="h-5 w-5 text-orange-400" />
      case 'presentation': return <Eye className="h-5 w-5 text-indigo-400" />
      case 'code_submission': return <FileText className="h-5 w-5 text-emerald-400" />
      case 'peer_review': return <MessageSquare className="h-5 w-5 text-pink-400" />
      case 'file_upload': return <FileText className="h-5 w-5 text-cyan-400" />
      default: return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  const getAssignmentStatus = (assignment: any) => {
    // TODO: Fetch real submission data for this assignment
    // For now, return 'not_started' until we implement submission tracking
    return 'not_started'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In Progress</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">Not Started</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading course</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimationWrapper>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            <p className="text-slate-400">{course.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Instructor</p>
              <p className="text-white font-medium">{course.instructor}</p>
            </div>
            {modulesWithLessons.length > 0 && modulesWithLessons[0].lessons.length > 0 && (
              <Link href={`/student/course/${params.id}/study/${modulesWithLessons[0].id}/${modulesWithLessons[0].lessons[0].id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Course
                </Button>
              </Link>
            )}
          </div>
        </div>
      </AnimationWrapper>

      {/* Course Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimationWrapper delay={0.1}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.modules}</p>
                <p className="text-sm text-slate-400">Modules</p>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>

        <AnimationWrapper delay={0.2}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <PlayCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.lessons}</p>
                <p className="text-sm text-slate-400">Lessons</p>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>

        <AnimationWrapper delay={0.3}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>

        {/* Hide assignments for public courses */}
        {!isPublicMode && (
          <AnimationWrapper delay={0.4}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{assignments?.length || 0}</p>
                  <p className="text-sm text-slate-400">Assignments</p>
                </div>
              </div>
            </GlassCard>
          </AnimationWrapper>
        )}
      </div>

      {/* Progress Bar */}
      <AnimationWrapper delay={0.5}>
        <GlassCard className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Course Progress</h3>
              <span className="text-sm text-slate-400">{Math.round((stats.completed / stats.lessons) * 100)}% Complete</span>
            </div>
            <Progress value={(stats.completed / stats.lessons) * 100} className="h-2" />
          </div>
        </GlassCard>
      </AnimationWrapper>

      {/* Main Navigation */}
      <AnimationWrapper delay={0.6}>
        <div className="flex justify-center">
          <FluidTabs
            tabs={[
              { 
                id: 'curriculum', 
                label: 'Curriculum', 
                icon: <BookOpen className="h-4 w-4" />, 
                badge: stats.modules
              },
              // Hide assignments tab for public courses
              ...(isPublicMode ? [] : [{
                id: 'assignments', 
                label: 'Assignments', 
                icon: <ClipboardList className="h-4 w-4" />, 
                badge: assignments?.length || 0
              }])
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            variant="default"
            width="wide"
          />
        </div>
      </AnimationWrapper>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        
        {/* Curriculum Tab */}
        <TabsContent value="curriculum" className="space-y-6">
          <StaggeredAnimationWrapper>
            {modulesWithLessons.map((module, moduleIndex) => (
              <AnimationWrapper key={module.id} delay={moduleIndex * 0.1}>
                <GlassCard className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                        <p className="text-slate-400">{module.description}</p>
                      </div>
                      <Badge variant="outline" className="border-slate-500 text-slate-300">
                        {module.lessons?.length || 0} lessons
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {module.lessons?.map((lesson: any, lessonIndex: number) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <PlayCircle className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{lesson.title}</p>
                              <p className="text-sm text-slate-400">{lesson.duration}</p>
                            </div>
                          </div>
                          <Link href={`/student/course/${params.id}/study/${module.id}/${lesson.id}`}>
                            <Button size="sm" variant="outline">
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </AnimationWrapper>
            ))}
          </StaggeredAnimationWrapper>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          {assignments && assignments.length > 0 ? (
            <StaggeredAnimationWrapper>
              {assignments.map((assignment, index) => {
                const status = getAssignmentStatus(assignment)
                return (
                  <AnimationWrapper key={assignment.id} delay={index * 0.1}>
                    <GlassCard className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white/10 rounded-lg">
                            {getAssignmentIcon(assignment.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">{assignment.title}</h3>
                            <p className="text-slate-400 mb-3">{assignment.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <div className="flex items-center gap-1">
                                <Award className="h-4 w-4" />
                                <span>{assignment.points} points</span>
                              </div>
                              {assignment.due_at && (
                                <div className="flex items-center gap-1">
                                  <AlarmClock className="h-4 w-4" />
                                  <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(status)}
                          <Link href={`/student/assignment/${assignment.id}`}>
                            <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white">
                              {status === 'graded' ? 'View Result' : 
                               status === 'submitted' ? 'View Submission' :
                               status === 'in_progress' ? 'Continue' : 'Start Assignment'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </GlassCard>
                  </AnimationWrapper>
                )
              })}
            </StaggeredAnimationWrapper>
          ) : (
            <AnimationWrapper>
              <GlassCard className="p-8">
                <div className="text-center">
                  <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No assignments yet</h3>
                  <p className="text-slate-400">Your instructor will add assignments to this course soon</p>
                </div>
              </GlassCard>
            </AnimationWrapper>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}