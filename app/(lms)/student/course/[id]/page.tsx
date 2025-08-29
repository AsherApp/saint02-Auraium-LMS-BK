"use client"

import type React from "react"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, PlayCircle, CheckCircle2, ClipboardList, FileText, MessageSquare, AlarmClock } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"

export default function StudentCourseDetailPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
        setCourse(courseResponse)
        
        // Fetch modules
        const modulesResponse = await http<any>(`/api/modules/course/${params.id}`)
        const modulesData = modulesResponse.items || []
        
        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module: any) => {
            try {
              const lessonsResponse = await http<any>(`/api/lessons/module/${module.id}`)
              return {
                ...module,
                lessons: lessonsResponse.items || []
              }
            } catch (err) {
              console.error(`Failed to fetch lessons for module ${module.id}:`, err)
              return {
                ...module,
                lessons: []
              }
            }
          })
        )
        
        setModules(modulesWithLessons)
        
        // Fetch assignments
        const assignmentsResponse = await http<any>(`/api/courses/${params.id}/assignments`)
        const assignmentsData = assignmentsResponse.items || []
        setAssignments(assignmentsData)
        
      } catch (err: any) {
        setError(err.message || "Failed to load course data")
        console.error('Error fetching course data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourseData()
  }, [params.id, user?.email])

  const stats = useMemo(() => {
    if (!modules) return { modules: 0, lessons: 0, completed: 0 }
    const lessons = modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)
    // For now, we'll assume 0 completed since we don't have progress tracking yet
    const completed = 0
    return { modules: modules.length, lessons, completed }
  }, [modules])

  const firstPlayable = useMemo(() => {
    if (!modules || modules.length === 0) return null
    const firstModule = modules[0]
    if (!firstModule || !firstModule.lessons || firstModule.lessons.length === 0) return null
    return { moduleId: firstModule.id, lessonId: firstModule.lessons[0].id }
  }, [modules])

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading course...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Course not found.</div>
        </GlassCard>
      </div>
    )
  }

  function scopeLabel(scope: any) {
    if (scope.level === "course") return "Course"
    if (scope.level === "module") {
      const m = modules.find((mm: any) => mm.id === scope.moduleId)
      return `Module: ${m?.title || "Unknown"}`
    }
    const m = modules.find((mm: any) => mm.id === scope.moduleId)
    const l = m?.lessons?.find((ll: any) => ll.id === scope.lessonId)
    return `Lesson: ${m?.title || "Unknown"} › ${l?.title || "Unknown"}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-white text-2xl font-semibold">{course.title}</h1>
            {course.description ? <p className="text-slate-300">{course.description}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {firstPlayable ? (
              <Link href={`/student/course/${course.id}/study/${firstPlayable.moduleId}/${firstPlayable.lessonId}`}>
                <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Resume study
                </Button>
              </Link>
            ) : (
              <Button disabled className="bg-white/10 text-white border border-white/15">
                Resume study
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Modules" value={stats.modules} icon={<BookOpen className="h-4 w-4" />} />
          <Stat label="Lessons" value={stats.lessons} icon={<PlayCircle className="h-4 w-4" />} />
          <Stat label="Completed" value={stats.completed} icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-inherit">
        <div className="px-6">
          <Tabs defaultValue="curriculum" className="w-full">
            <div className="w-full flex justify-center py-4">
            <TabsList className="bg-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            </div>

            <TabsContent value="overview" className="mt-4">
              <div className="w-full">
            <GlassCard className="p-5">
            <div className="text-slate-300">
              Welcome to {course.title}. Use Resume study to continue where you left off, or explore the curriculum to
              jump to a specific lesson.
            </div>
            </GlassCard>
          </div>
            </TabsContent>

          <TabsContent value="curriculum" className="mt-4">
            <div className="px-6">
            <GlassCard className="p-5 space-y-4 w-full">
            {modules.length === 0 ? (
              <div className="text-slate-300">No modules available yet.</div>
            ) : (
              <div className="space-y-3">
                {modules.map((m: any) => {
                  const total = m.lessons?.length || 0
                  // For now, we'll assume 0 completed since we don't have progress tracking yet
                  const done = 0
                  const pct = total ? Math.round((done / total) * 100) : 0
                  return (
                    <div key={m.id} className="rounded-lg border border-white/10 bg-white/5">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-300" />
                          <div className="text-white font-medium">{m.title}</div>
                          <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/10">
                            {done}/{total} • {pct}%
                          </Badge>
                        </div>
                        <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-blue-600/60" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        {m.lessons && m.lessons.length > 0 ? (
                          m.lessons.map((l: any) => {
                            // For now, we'll assume not completed since we don't have progress tracking yet
                            const completed = false
                            return (
                              <div
                                key={l.id}
                                className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                              >
                                <div className="flex items-center gap-3">
                                  {completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4 text-blue-300" />
                                  )}
                                  <div>
                                    <div className="text-white font-medium">{l.title}</div>
                                    <div className="text-xs text-slate-400 capitalize">{l.type}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* File Viewer Button for file type lessons */}
                                  {l.type === 'file' && (() => {
                                    const fileInfo = contentToFileInfo(l)
                                    if (!fileInfo || !canPreviewFile(fileInfo)) return null
                                    
                                    const viewerType = getViewerType(fileInfo)
                                    const buttonText = getPreviewButtonText(fileInfo)
                                    
                                    return (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30"
                                        onClick={() => {
                                          if (viewerType === 'presentation') {
                                            setViewingPresentation(fileInfo)
                                          } else {
                                            setViewingDocument(fileInfo)
                                          }
                                        }}
                                      >
                                        <PlayCircle className="h-4 w-4 mr-1" />
                                        {buttonText}
                                      </Button>
                                    )
                                  })()}
                                  
                                  <Link href={`/student/course/${course.id}/study/${m.id}/${l.id}`}>
                                    <Button
                                      size="sm"
                                      className={
                                        completed
                                          ? "bg-white/10 text-white hover:bg-white/20"
                                          : "bg-blue-600/80 text-white hover:bg-blue-600"
                                      }
                                    >
                                      {completed ? "Review" : "Start"}
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-sm text-slate-400">No lessons in this module.</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </GlassCard>
          </div>
            </TabsContent>

          <TabsContent value="assignments" className="mt-4 px-6">
            <div className="w-full">
            <GlassCard className="p-5 space-y-4">
            {assignments.length === 0 ? (
              <div className="text-slate-300 text-sm">No assignments yet.</div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a: any) => {
                  // For now, we'll assume no submission since we don't have submission tracking yet
                  const status = "not_started"
                  const overdue = !!a.due_at && new Date(a.due_at) < new Date()
                  const dueSoon =
                    !!a.due_at &&
                    new Date(a.due_at) >= new Date() &&
                    new Date(a.due_at).getTime() - Date.now() <= 1000 * 60 * 60 * 48
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <AssignmentIcon type={a.type || "essay"} />
                        <div>
                          <div className="text-white font-medium">{a.title}</div>
                          <div className="text-xs text-slate-400 capitalize">
                            {a.type || "essay"}
                            {a.due_at ? ` • Due ${new Date(a.due_at).toLocaleString()}` : ""} • {a.scope?.level || "course"}
                          </div>
                          {overdue ? (
                            <div className="text-xs text-rose-300 inline-flex items-center gap-1 mt-1">
                              <AlarmClock className="h-3.5 w-3.5" /> Overdue
                            </div>
                          ) : dueSoon ? (
                            <div className="text-xs text-amber-300 inline-flex items-center gap-1 mt-1">
                              <AlarmClock className="h-3.5 w-3.5" /> Due soon
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`border-white/10 ${status === "submitted" ? "bg-emerald-600/30 text-emerald-100" : "bg-white/10 text-slate-200"}`}
                        >
                          {status}
                        </Badge>
                        <Link href={`/student/assignment/${a.id}`}>
                          <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">View Assignment</Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </GlassCard>
          </div>
            </TabsContent>

          <TabsContent value="discussions" className="mt-4 px-6">
            <div className="w-full">
            <GlassCard className="p-5">
            <div className="text-slate-300 text-sm">Course discussions will appear here.</div>
            </GlassCard>
          </div>
            </TabsContent>

          <TabsContent value="resources" className="mt-4 px-6">
            <div className="w-full">
            <GlassCard className="p-5">
            <div className="text-slate-300 text-sm">Shared files and links will appear here.</div>
            </GlassCard>
          </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        title="Lesson Content"
        subtitle={course?.title}
      />

      {/* Presentation Viewer Modal */}
      <PresentationViewer
        presentation={viewingPresentation}
        isOpen={!!viewingPresentation}
        onClose={() => setViewingPresentation(null)}
        title="Lesson Presentation"
        subtitle={course?.title}
      />
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-300 text-sm">
        <span className="text-blue-300">{icon}</span>
        {label}
      </div>
      <div className="text-white text-xl font-semibold mt-1">{value}</div>
    </div>
  )
}

function AssignmentIcon({ type }: { type: string }) {
  const Icon =
    type === "essay"
      ? FileText
      : type === "video"
        ? PlayCircle
        : type === "file"
          ? FileText
          : type === "form"
            ? ClipboardList
            : type === "discussion"
              ? MessageSquare
              : FileText
  return (
    <div className="rounded-md bg-blue-600/20 text-blue-300 p-2">
      <Icon className="h-5 w-5" />
    </div>
  )
}
