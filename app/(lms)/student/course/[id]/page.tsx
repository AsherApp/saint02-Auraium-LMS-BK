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
  

  // Set up course data
  useEffect(() => {
    if (params.id) {
      // Mock course details - replace with real API call
      const mockCourse = {
        id: params.id,
        title: "Advanced React Development",
        description: "Learn advanced React concepts including hooks, context, and performance optimization.",
        course_mode: 'full',
        instructor: "Dr. Sarah Johnson",
        created_at: "2025-01-01T00:00:00Z"
      }
      
      setIsPublicMode(false)
      setCourse(mockCourse)
      
      // Mock modules data - replace with real API call
      const mockModules = [
        {
          id: "module-js-basics",
          title: "JavaScript Fundamentals",
          description: "Core JavaScript concepts and ES6+ features",
          lessons: [
            { id: "lesson-1", title: "Variables and Functions", duration: "30 min" },
            { id: "lesson-2", title: "Arrays and Objects", duration: "45 min" },
            { id: "lesson-3", title: "ES6+ Features", duration: "60 min" }
          ]
        },
        {
          id: "module-react-core",
          title: "React Core Concepts",
          description: "Understanding React components, props, and state",
          lessons: [
            { id: "lesson-4", title: "Components and JSX", duration: "40 min" },
            { id: "lesson-5", title: "Props and State", duration: "50 min" },
            { id: "lesson-6", title: "Event Handling", duration: "35 min" }
          ]
        },
        {
          id: "module-react-advanced",
          title: "Advanced React",
          description: "Hooks, context, and performance optimization",
          lessons: [
            { id: "lesson-7", title: "React Hooks", duration: "70 min" },
            { id: "lesson-8", title: "Context API", duration: "45 min" },
            { id: "lesson-9", title: "Performance Optimization", duration: "60 min" }
          ]
        }
      ]
      
      setModules(mockModules)
      setLoading(false)
    }
  }, [params.id])

  const stats = useMemo(() => {
    if (!modules) return { modules: 0, lessons: 0, completed: 0 }
    const lessons = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)
    const completed = Math.floor(lessons * 0.3) // Mock 30% completion
    return { modules: modules.length, lessons, completed }
  }, [modules])

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
    // Mock status - replace with real submission data
    const statuses = ['not_started', 'in_progress', 'submitted', 'graded']
    return statuses[Math.floor(Math.random() * statuses.length)]
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
          <div className="text-right">
            <p className="text-sm text-slate-400">Instructor</p>
            <p className="text-white font-medium">{course.instructor}</p>
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
              { 
                id: 'assignments', 
                label: 'Assignments', 
                icon: <ClipboardList className="h-4 w-4" />, 
                badge: assignments?.length || 0
              }
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
            {modules.map((module, moduleIndex) => (
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
                          <Button size="sm" variant="outline">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start
                          </Button>
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