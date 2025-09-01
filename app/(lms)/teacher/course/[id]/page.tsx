"use client"

import type React from "react"

import { useMemo, useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { useCourseDetailFn } from "@/services/courses/hook"
import { useModulesByCourse } from "@/services/modules/hook"
import { useLessonsByModule } from "@/services/lessons/hook"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  BookOpen,
  Users,
  SettingsIcon,
  Plus,
  Trash2,
  Pencil,
  BarChart2,
  PlayCircle,
  FileText,
  MessageSquare,
  ExternalLink,
  ClipboardList,
  ListPlus,
  ListChecks,
  Eye,
  Video,
} from "lucide-react"
import { useInvitesFn } from "@/services/invites/hook"
import { LessonContentEditor } from "@/components/teacher/lesson-content-editor"
import { ContentPreviewModal } from "@/components/teacher/content-preview-modal"
import { useEnrollmentsFn } from "@/services/enrollments/hook"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { listStudents, enrollStudent } from "@/services/students/api"
import { useLiveSessionsFn } from "@/services/live/hook"
import { PendingInvitesWidget } from "@/components/teacher/pending-invites-widget"
import { AssignmentCreator } from "@/components/teacher/assignment-creator"
import { useAssignmentsFn } from "@/services/assignments/hook"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"

export default function TeacherCourseDetailPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const { user } = useAuthStore()
  
  // Add mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use the new course detail hook
  const { course, loading: courseLoading, error: courseError, updateCourse } = useCourseDetailFn(params.id)

  // Use the new modules hook
  const { modules, loading: modulesLoading, create: createModule, update: updateModule, remove: deleteModule } = useModulesByCourse(params.id)

  // Use the lessons hook for each module
  const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<string>("")
  const { create: createLesson } = useLessonsByModule(selectedModuleForLessons)

  const rosterSvc = useEnrollmentsFn(course?.id)
  const assignSvc = useAssignmentsFn(course?.id)
  const assignments = assignSvc.items || []

  const [modOpen, setModOpen] = useState(false)
  const [modTitle, setModTitle] = useState("")
  const [modDescription, setModDescription] = useState("")
  const [lessonOpen, setLessonOpen] = useState(false)
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonType, setLessonType] = useState<"video" | "quiz" | "file" | "discussion" | "poll">("video")
  const [lessonModuleId, setLessonModuleId] = useState<string>("")
  const [lessonDescription, setLessonDescription] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invRows, setInvRows] = useState<{ id: string; name: string; email: string }[]>([])
  const [inviteBusy, setInviteBusy] = useState(false)
  const [existingStudents, setExistingStudents] = useState<any[]>([])
  const [selectedExistingStudents, setSelectedExistingStudents] = useState<string[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const invitesSvc = useInvitesFn()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editStatus, setEditStatus] = useState<"draft" | "published" | "archived">("draft")
  const [editVisibility, setEditVisibility] = useState<"private" | "unlisted" | "public">("private")
  const [editPolicy, setEditPolicy] = useState<"invite_only" | "request" | "open">("invite_only")
  const [assignmentOpen, setAssignmentOpen] = useState<false | { level: "course" | "module" | "lesson"; moduleId?: string; lessonId?: string }>(false)

  // Live sessions
  const { sessions: liveSessions, createSession } = useLiveSessionsFn(user?.email || undefined, user?.role)
  const [liveSessionOpen, setLiveSessionOpen] = useState(false)
  const [newLiveSession, setNewLiveSession] = useState({
    title: "",
    description: "",
    start_at: "",
    session_type: "course" as "course" | "module" | "general",
    module_id: ""
  })

  // Edit lesson content dialog
  const [editContentOpen, setEditContentOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string>("")
  const [selectedLessonId, setSelectedLessonId] = useState<string>("")
  const [selectedLesson, setSelectedLesson] = useState<any>(null)

  // Document and presentation viewers
  const [viewingDocument, setViewingDocument] = useState<FileInfo | null>(null)
  const [viewingPresentation, setViewingPresentation] = useState<FileInfo | null>(null)


  // Get lessons for each module
  const [moduleLessons, setModuleLessons] = useState<Record<string, any[]>>({})
  const [lessonsLoading, setLessonsLoading] = useState(false)

  // Load lessons for all modules
  const loadModuleLessons = useCallback(async () => {
    if (modules.length === 0 || !user?.email) {
      console.log('loadModuleLessons: Skipping - modules:', modules.length, 'user email:', user?.email)
      return
    }
    
    console.log('loadModuleLessons: Starting to load lessons for', modules.length, 'modules')
    setLessonsLoading(true)
    const lessonsMap: Record<string, any[]> = {}
    
    try {
      await Promise.all(
        modules.map(async (module) => {
          try {
            console.log('Loading lessons for module:', module.id, module.title)
            // Use the HTTP utility instead of direct fetch
            const data = await http<{ items: any[] }>(`/api/lessons/module/${module.id}`)
            console.log('Lessons for module', module.id, ':', data.items?.length || 0, 'lessons')
            lessonsMap[module.id] = data.items || []
          } catch (error) {
            console.error(`Error loading lessons for module ${module.id}:`, error)
            lessonsMap[module.id] = []
          }
        })
      )
      console.log('Final lessons map:', lessonsMap)
      setModuleLessons(lessonsMap)
    } catch (error) {
      console.error('Error loading module lessons:', error)
    } finally {
      setLessonsLoading(false)
    }
  }, [modules, user?.email])

  // Load lessons when modules change
  useEffect(() => {
    loadModuleLessons()
  }, [loadModuleLessons])

  const stats = useMemo(() => {
    const lessons = Object.values(moduleLessons).reduce((acc, lessons) => acc + lessons.length, 0)
    const students = (rosterSvc.items || []).length
    return { modules: modules.length, lessons, students }
  }, [modules, moduleLessons, rosterSvc.items])

  const roster = rosterSvc.items || []

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className="space-y-6"><GlassCard className="p-6"><div className="text-slate-300">Loading...</div></GlassCard></div>
  }

  if (courseLoading || modulesLoading) {
    return <div className="space-y-6"><GlassCard className="p-6"><div className="text-slate-300">Loading course...</div></GlassCard></div>
  }

  if (courseError || !course) {
    return <div className="space-y-6"><GlassCard className="p-6"><div className="text-red-300">Error loading course: {courseError}</div></GlassCard></div>
  }

  async function getLesson(lessonId: string) {
    if (!user?.email) return null
    
    try {
      return await http<any>(`/api/lessons/${lessonId}`)
    } catch (error) {
      console.error('Error fetching lesson:', error)
      return null
    }
  }

  async function openLessonContentEditor(moduleId: string, lessonId: string) {
    const lesson = await getLesson(lessonId)
    if (lesson) {
      setSelectedLesson(lesson)
      setSelectedModuleId(moduleId)
      setSelectedLessonId(lessonId)
      setEditContentOpen(true)
    } else {
      toast({ title: "Error", description: "Could not load lesson content", variant: "destructive" })
    }
  }

  async function saveLessonContent(content: any) {
    if (!selectedLessonId || !user?.email) return
    
    try {
      await http(`/api/lessons/${selectedLessonId}/content`, {
        method: 'PUT',
        body: { content }
      })
      
      toast({ title: "Lesson content saved" })
      setEditContentOpen(false)
      // Refresh the lesson data
      const updatedLesson = await getLesson(selectedLessonId)
      if (updatedLesson) {
        setSelectedLesson(updatedLesson)
      }
      // Refresh all module lessons to update the list
      await loadModuleLessons()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  function resetLessonModal() {
    setLessonTitle("")
    setLessonType("video")
    setLessonDescription("")
    setLessonModuleId(modules[0]?.id || "")
  }

  async function onAddModule() {
    if (!modTitle.trim() || !course?.id) return
    try {
      await createModule({
        course_id: course.id,
        title: modTitle.trim(),
        description: modDescription.trim()
      })
      setModTitle("")
      setModDescription("")
      setModOpen(false)
      toast({ title: "Module added" })
    } catch (error: any) {
      toast({ title: "Failed to add module", description: error.message, variant: "destructive" })
    }
  }

  async function onAddLesson() {
    if (!lessonTitle.trim() || !lessonModuleId) return
    try {
      setSelectedModuleForLessons(lessonModuleId)
      await createLesson({
        module_id: lessonModuleId,
        title: lessonTitle.trim(),
        type: lessonType,
        description: lessonDescription.trim(),
        content: {}
      })
      resetLessonModal()
      setLessonOpen(false)
      toast({ title: "Lesson added" })
      // Refresh the lessons list
      await loadModuleLessons()
    } catch (error: any) {
      toast({ title: "Failed to add lesson", description: error.message, variant: "destructive" })
    }
  }

  function addInviteRow() {
    setInvRows((prev) => [...prev, { id: Math.random().toString(), name: "", email: "" }])
  }

  function updateInviteRow(id: string, patch: Partial<{ name: string; email: string }>) {
    setInvRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeInviteRow(id: string) {
    setInvRows((prev) => prev.filter((r) => r.id !== id))
  }

  async function onSendInvites() {
    if (!course) return
    if (invRows.length === 0) {
      toast({ title: "No students to invite", description: "Add at least one student.", variant: "destructive" })
      return
    }
    setInviteBusy(true)
    try {
      const results = await Promise.all(
        invRows.map((r) =>
          invitesSvc.create({
            course_id: course.id,
            email: r.email,
            name: r.name
          })
        )
      )
      
      // Update the invite rows with the generated invite links
      const updatedRows = invRows.map((row, index) => {
        const result = results[index]
        if (result && result.inviteUrl) {
          return {
            ...row,
            email: result.inviteUrl,
            name: `${row.name} (Code: ${result.code})`
          }
        }
        return row
      })
      
      setInvRows(updatedRows)
      toast({ title: "Invite links generated", description: `${results.length} invite links created successfully.` })
    } catch (error: any) {
      toast({ title: "Failed to generate invites", description: error.message, variant: "destructive" })
    } finally {
      setInviteBusy(false)
    }
  }

  async function loadExistingStudents() {
    setLoadingStudents(true)
    try {
      const result = await listStudents()
      const allStudents = result.items || []
      
      // Filter out students who are already enrolled in this course
      const enrolledEmails = roster.map(student => student.email)
      const availableStudents = allStudents.filter(student => 
        !enrolledEmails.includes(student.email)
      )
      
      setExistingStudents(availableStudents)
    } catch (error: any) {
      toast({ title: "Failed to load students", description: error.message, variant: "destructive" })
    } finally {
      setLoadingStudents(false)
    }
  }

  async function onEnrollExistingStudents() {
    if (!course) return
    if (selectedExistingStudents.length === 0) {
      toast({ title: "No students selected", description: "Select at least one student to enroll.", variant: "destructive" })
      return
    }
    setInviteBusy(true)
    try {
      const results = await Promise.all(
        selectedExistingStudents.map(email => enrollStudent(email, course.id))
      )
      setSelectedExistingStudents([])
      setExistingStudents([]) // Clear the list after enrollment
      toast({ title: "Students enrolled", description: `${results.length} students enrolled successfully.` })
      
      // Refresh the roster to show newly enrolled students
      await rosterSvc.refresh()
    } catch (error: any) {
      toast({ title: "Failed to enroll students", description: error.message, variant: "destructive" })
    } finally {
      setInviteBusy(false)
    }
  }

  function openSettings() {
    if (!course) return
    setEditTitle(course.title)
    setEditDesc(course.description || "")
    setEditStatus(course.status || "draft")
    setEditVisibility(course.visibility || "private")
    setEditPolicy(course.enrollment_policy || "invite_only")
    setSettingsOpen(true)
  }

  async function onSaveSettings() {
    if (!course) return
    try {
      await updateCourse({
        title: editTitle,
        description: editDesc,
        status: editStatus
      })
      toast({ title: "Course updated" })
      setSettingsOpen(false)
    } catch (error: any) {
      toast({ title: "Failed to update course", description: error.message, variant: "destructive" })
    }
  }

  function scopeLabel(scope: any) {
    if (scope.level === "course") return "Course"
    if (scope.level === "module") {
      const m = modules.find((mm) => mm.id === scope.moduleId)
      return `Module: ${m?.title || "Unknown"}`
    }
    const m = modules.find((mm) => mm.id === scope.moduleId)
    // TODO: Add lessons when lessons API is ready
    return `Lesson: ${m?.title || "Unknown"} › Unknown`
  }

  async function handleCreateLiveSession() {
    if (!course?.id || !newLiveSession.title || !newLiveSession.start_at) {
      toast({ title: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      await createSession({
        course_id: course.id,
        module_id: newLiveSession.module_id || undefined,
        title: newLiveSession.title,
        description: newLiveSession.description,
        start_at: new Date(newLiveSession.start_at).getTime(),
        session_type: newLiveSession.session_type
      })
      
      toast({ title: "Live session created successfully!" })
      setLiveSessionOpen(false)
      setNewLiveSession({
        title: "",
        description: "",
        start_at: "",
        session_type: "course",
        module_id: ""
      })
    } catch (err: any) {
      toast({ 
        title: "Failed to create live session", 
        description: err.message, 
        variant: "destructive" 
      })
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-white text-2xl font-semibold">{course.title}</h1>
            {course.description ? <p className="text-slate-300">{course.description}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Professional Assignment System */}
            <Link href="/teacher/assignments">
              <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">
                <ListPlus className="mr-2 h-4 w-4" />
                Manage Assignments
              </Button>
            </Link>

            <Dialog open={modOpen} onOpenChange={setModOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/10 text-white hover:bg-white/20">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={liveSessionOpen} onOpenChange={setLiveSessionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600/80 hover:bg-green-600 text-white">
                  <Video className="mr-2 h-4 w-4" />
                  Create Live Session
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Live Session</DialogTitle>
                  <DialogDescription>Schedule a live session for this course.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ls-title">Session Title *</Label>
                    <Input
                      id="ls-title"
                      value={newLiveSession.title}
                      onChange={(e) => setNewLiveSession(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Enter session title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ls-description">Description</Label>
                    <Input
                      id="ls-description"
                      value={newLiveSession.description}
                      onChange={(e) => setNewLiveSession(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Session description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ls-start">Start Time *</Label>
                    <Input
                      id="ls-start"
                      type="datetime-local"
                      value={newLiveSession.start_at}
                      onChange={(e) => setNewLiveSession(prev => ({ ...prev, start_at: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ls-module">Module (Optional)</Label>
                    <Select 
                      value={newLiveSession.module_id} 
                      onValueChange={(value) => setNewLiveSession(prev => ({ ...prev, module_id: value }))}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select a module (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 text-white border-white/10">
                        {modules.map((module, index) => (
                          <SelectItem key={module.id || `module-${index}`} value={module.id || ''}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateLiveSession}
                      disabled={!newLiveSession.title || !newLiveSession.start_at}
                      className="bg-green-600/80 hover:bg-green-600 text-white flex-1"
                    >
                      Create Session
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setLiveSessionOpen(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={modOpen} onOpenChange={setModOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/10 text-white hover:bg-white/20">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
                <DialogHeader>
                  <DialogTitle>Add Module</DialogTitle>
                  <DialogDescription>Create a new module for your course content.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Label htmlFor="mt">Title</Label>
                  <Input
                    id="mt"
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Label htmlFor="md">Description</Label>
                  <Input
                    id="md"
                    value={modDescription}
                    onChange={(e) => setModDescription(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Button onClick={onAddModule} className="w-full bg-blue-600/80 hover:bg-blue-600">
                    Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={lessonOpen}
              onOpenChange={(o) => {
                setLessonOpen(o)
                if (o) {
                  setLessonModuleId(modules[0]?.id || "")
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
                <DialogHeader>
                  <DialogTitle>Add Lesson</DialogTitle>
                  <DialogDescription>Create a new lesson within a module.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Module</Label>
                    <Select value={lessonModuleId} onValueChange={setLessonModuleId}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 text-white border-white/10">
                        {modules.map((m) => (
                          <SelectItem key={m.id || `module-${Math.random()}`} value={m.id || ''}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g., Introduction to Variables"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={lessonDescription}
                      onChange={(e) => setLessonDescription(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Brief description of this lesson"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select value={lessonType} onValueChange={(v) => setLessonType(v as any)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 text-white border-white/10">
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="file">File</SelectItem>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="poll">Poll</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={onAddLesson} className="w-full bg-blue-600/80 hover:bg-blue-600">
                    Add Lesson
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                  Invite Students
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Invite Students</DialogTitle>
                  <DialogDescription>Invite new students or add existing students to your course.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="invite" className="w-full">
                  <div className="w-full flex justify-center py-4">
                    <TabsList className="bg-white/10">
                      <TabsTrigger value="invite">
                        Invite New
                      </TabsTrigger>
                      <TabsTrigger value="existing">
                        Add Existing
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="invite" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Add student rows</span>
                      <Button onClick={addInviteRow} className="bg-blue-600/80 hover:bg-blue-600">
                        <Plus className="mr-2 h-4 w-4" /> Add
                      </Button>
                    </div>
                    {invRows.length === 0 ? (
                      <div className="text-slate-400 text-sm">No students added.</div>
                    ) : (
                      <div className="space-y-2">
                        {invRows.map((r) => (
                          <div key={r.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                            <Input
                              placeholder="Full name"
                              value={r.name}
                              onChange={(e) => updateInviteRow(r.id, { name: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                              placeholder="email@student.edu"
                              value={r.email}
                              onChange={(e) => updateInviteRow(r.id, { email: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Button
                              variant="secondary"
                              onClick={() => removeInviteRow(r.id)}
                              className="bg-white/10 hover:bg-white/20 text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      disabled={!invRows.length || inviteBusy}
                      onClick={onSendInvites}
                      className="w-full bg-blue-600/80 hover:bg-blue-600"
                    >
                      {inviteBusy ? "Generating..." : "Generate Invite Links"}
                    </Button>

                    {invRows.length > 0 && (invRows[0].email.startsWith("/invite/") || invRows[0].email.startsWith("http")) && (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-sm text-slate-300">
                          Generated Invite Links:
                        </div>
                        <ul className="mt-2 space-y-2">
                          {invRows.map((r) => (
                            <li key={`invite-${r.id}`} className="text-xs text-slate-400 break-all">
                              {r.name} • {r.email}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="existing" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Select existing students</span>
                      <Button 
                        onClick={loadExistingStudents} 
                        disabled={loadingStudents}
                        className="bg-blue-600/80 hover:bg-blue-600"
                      >
                        {loadingStudents ? "Loading..." : "Load Students"}
                      </Button>
                    </div>
                    
                    {existingStudents.length === 0 ? (
                      <div className="text-slate-400 text-sm">
                        {loadingStudents ? "Loading students..." : "Click 'Load Students' to see available students."}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {existingStudents.map((student, index) => (
                          <div key={student.id || `${student.email || 'unknown'}-${index}`} className="flex items-center gap-3 p-2 rounded border border-white/10 bg-white/5">
                            <input
                              type="checkbox"
                              checked={selectedExistingStudents.includes(student.email)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExistingStudents(prev => [...prev, student.email])
                                } else {
                                  setSelectedExistingStudents(prev => prev.filter(email => email !== student.email))
                                }
                              }}
                              className="rounded border-white/20"
                            />
                            <div className="flex-1">
                              <div className="text-sm text-white font-medium">{student.name}</div>
                              <div className="text-xs text-slate-400">{student.email}</div>
                            </div>
                            <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/10">
                              {student.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button
                      disabled={selectedExistingStudents.length === 0 || inviteBusy}
                      onClick={onEnrollExistingStudents}
                      className="w-full bg-green-600/80 hover:bg-green-600"
                    >
                      {inviteBusy ? "Enrolling..." : `Enroll ${selectedExistingStudents.length} Student${selectedExistingStudents.length !== 1 ? 's' : ''}`}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={openSettings}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatCard icon={<BookOpen className="h-4 w-4" />} label="Modules" value={stats.modules} />
          <StatCard icon={<PlayCircle className="h-4 w-4" />} label="Lessons" value={stats.lessons} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Students" value={stats.students} />
        </div>
      </GlassCard>

      {/* Course Navigation */}
      <div className="w-full">
        <div className="w-full flex justify-center py-4">
          <FluidTabs
            tabs={[
              { id: 'overview', label: 'Overview', icon: <BarChart2 className="h-4 w-4" /> },
              { id: 'curriculum', label: 'Curriculum', icon: <BookOpen className="h-4 w-4" />, badge: modules?.length || 0 },
              { id: 'students', label: 'Students', icon: <Users className="h-4 w-4" />, badge: rosterSvc.items?.length || 0 },
              { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="h-4 w-4" />, badge: assignments?.length || 0 },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" /> }
            ]}
            activeTab="curriculum"
            onTabChange={() => {}}
            variant="default"
            width="content-match"
          />
        </div>
        
        <Tabs defaultValue="curriculum" className="w-full">

            <TabsContent value="overview" className="mt-4">
              <div className="w-full">
              <GlassCard className="p-0">
                <div className="p-6">
                <div className="text-slate-300">
                  Use this space for announcements, goals, and recent activity. You can also pin resources here later.
                </div>
                </div>
              </GlassCard>
            </div>
          </TabsContent>

            <TabsContent value="curriculum" className="mt-4">
              <div className="w-full">
            <GlassCard className="p-0 space-y-4 w-full">
            {modules.length === 0 ? (
              <div className="text-slate-300">No modules yet. Use Add Module to start structuring your course.</div>
            ) : (
              <div className="space-y-3 p-6">
                {modules.map((m) => (
                  <div key={m.id} className="rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-300" />
                        <div className="text-white font-medium">{m.title}</div>
                        <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/10">
                          {moduleLessons[m.id]?.length || 0} lessons
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Module-level assignment */}
                        <Dialog
                          open={
                            !!assignmentOpen && assignmentOpen.level === "module" && assignmentOpen.moduleId === m.id
                          }
                          onOpenChange={(o) => setAssignmentOpen(o ? { level: "module", moduleId: m.id } : false)}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white">
                              <ListPlus className="h-4 w-4 mr-1" /> Add Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-6xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                              <DialogTitle>New Assignment (Module)</DialogTitle>
                            </DialogHeader>
                            <AssignmentCreator
                              scope={{ level: "module", moduleId: m.id }}
                              scopeLabel={`Module: ${m.title}`}
                              onCancel={() => setAssignmentOpen(false)}
                              onSave={(data) => {
                                if (!course.id) return
                                void assignSvc.create({
                                  course_id: course.id,
                                  scope: { level: "module", moduleId: m.id },
                                  title: data.title,
                                  description: data.description,
                                  type: data.type,
                                  due_at: data.due_at,
                                  available_from: data.available_from,
                                  available_until: data.available_until,
                                  allow_late_submissions: data.allow_late_submissions,
                                  late_penalty_percent: data.late_penalty_percent,
                                  max_attempts: data.max_attempts,
                                  time_limit_minutes: data.time_limit_minutes,
                                  require_rubric: data.require_rubric,
                                  rubric: data.rubric,
                                  resources: data.resources,
                                  settings: data.settings,
                                })
                                setAssignmentOpen(false)
                                toast({ title: "Assignment created" })
                              }}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/10 text-white hover:bg-white/20"
                          onClick={() => {
                            setLessonModuleId(m.id)
                            setLessonOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Lesson
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/10 text-white hover:bg-white/20"
                          onClick={() => deleteModule(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      {moduleLessons[m.id] && moduleLessons[m.id].length > 0 ? (
                        moduleLessons[m.id].map((l: any, index) => (
                          <div
                            key={l.id || `lesson-${m.id}-${index}`}
                            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-white/10 bg-white/5 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <LessonIcon type={l.type} />
                              <div>
                                <div className="text-white font-medium">{l.title}</div>
                                <div className="text-xs text-slate-400 capitalize">{l.type}</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Lesson-level assignment */}
                              <Dialog
                                open={
                                  !!assignmentOpen &&
                                  assignmentOpen.level === "lesson" &&
                                  assignmentOpen.moduleId === m.id &&
                                  assignmentOpen.lessonId === l.id
                                }
                                onOpenChange={(o) =>
                                  setAssignmentOpen(o ? { level: "lesson", moduleId: m.id, lessonId: l.id } : false)
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white">
                                    <ListPlus className="h-4 w-4 mr-1" /> Add Assignment
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-6xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>New Assignment (Lesson)</DialogTitle>
                                    <DialogDescription>Create a new assignment for this specific lesson.</DialogDescription>
                                  </DialogHeader>
                                  <AssignmentCreator
                                    scope={{ level: "lesson", moduleId: m.id, lessonId: l.id }}
                                    scopeLabel={`Lesson: ${m.title} › ${l.title}`}
                                    onCancel={() => setAssignmentOpen(false)}
                                    onSave={(data) => {
                                      if (!course.id) return
                                      void assignSvc.create({
                                        course_id: course.id,
                                        scope: { level: "lesson", moduleId: m.id, lessonId: l.id },
                                        title: data.title,
                                        description: data.description || "",
                                        type: data.type as any,
                                        due_at: data.dueAt ? new Date(data.dueAt).toISOString() : undefined,
                                        form: data.form as any,
                                        resources: data.resources as any,
                                      })
                                      setAssignmentOpen(false)
                                      toast({ title: "Assignment created" })
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/10 text-white hover:bg-white/20"
                                onClick={() => {
                                  openLessonContentEditor(m.id, l.id)
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit Content
                              </Button>
                              <ContentPreviewModal
                                lesson={{
                                  id: l.id,
                                  title: l.title,
                                  type: l.type,
                                  content: l.content,
                                  description: l.description
                                }}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/10 text-white hover:bg-white/20"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview
                                  </Button>
                                }
                              />
                              
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
                                    <Eye className="h-4 w-4 mr-1" />
                                    {buttonText}
                                  </Button>
                                )
                              })()}
                              
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/10 text-white hover:bg-white/20"
                                onClick={() => {
                                  // TODO: Implement lesson deletion
                                  toast({ title: "Lesson deletion not yet implemented" })
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-slate-400">No lessons in this module.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
              </GlassCard>
            </div>
          </TabsContent>

            <TabsContent value="students" className="mt-4">
              <div className="w-full">
              <div className="space-y-4 p-6">
            {/* Pending Invites Section */}
            <PendingInvitesWidget 
              courseId={course.id}
              title="Pending Invites" 
              showCourseInfo={false}
            />
            
            {/* Enrolled Students Section */}
            <GlassCard className="p-0 space-y-4">
                              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium">Enrolled Students</div>
                <Button
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setInviteOpen(true)}
                >
                  Invite Students
                </Button>
              </div>
            {rosterSvc.loading ? (
              <div className="text-slate-300 text-sm">Loading students...</div>
            ) : roster.length === 0 ? (
              <div className="text-slate-300 text-sm">No enrolled students yet.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roster.map((student, index) => (
                  <StudentItem key={student.email || `student-${index}`} email={student.email} name={student.name} state={student.state} />
                ))}
              </div>
                )}
                </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="assignments" className="mt-4">
              <div className="w-full">
            <GlassCard className="p-0 space-y-4">
            <div className="p-6">
            <div className="text-white font-medium">Assignments</div>

            {assignments.length === 0 ? (
              <div className="text-slate-300 text-sm">No assignments yet.</div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a, index) => {
                  const overdue =
                    !!(a as any).due_at &&
                    new Date((a as any).due_at).getTime() < Date.now() &&
                    // any missing among enrolled
                    false
                  return (
                    <div
                      key={a.id ? String(a.id) : `assignment-${index}`}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <AssignmentIcon type={(a as any).type} />
                        <div>
                          <div className="text-white font-medium">{(a as any).title}</div>
                          <div className="text-xs text-slate-400 capitalize">
                            {(a as any).type}
                            {(a as any).due_at ? ` • Due ${new Date((a as any).due_at).toLocaleString()}` : ""} • {scopeLabel((a as any).scope)}
                          </div>
                          {overdue ? (
                            <div className="text-xs text-rose-300 inline-flex items-center gap-1 mt-1">
                              <ListChecks className="h-3.5 w-3.5" /> Overdue submissions pending
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/10">
                          {(a as any).submission_count || 0} submitted
                        </Badge>
                        <Link href={`/student/course/${course.id}/assignment/${a.id}`} target="_blank">
                          <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </Link>
                        <Link href={`/teacher/assignment/${a.id}`}>
                          <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                            Details
                          </Button>
                        </Link>
                        <Link href={`/teacher/assignments?tab=submissions`}>
                          <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white">
                            View Submissions
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/10 text-white hover:bg-white/20"
                          onClick={() => {
                            // TODO: Implement assignment deletion
                            toast({ title: "Assignment deletion not yet implemented" })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </div>
            </GlassCard>
          </div>
        </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="w-full">
            <GlassCard className="p-0 space-y-4">
            <div className="p-6">
            <div className="text-slate-300 text-sm">
              Update course details below or open the quick Settings dialog from the header.
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={editTitle || course.title}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input
                  value={editDesc || course.description || ""}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-white border-white/10">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Visibility</Label>
                <Select value={editVisibility} onValueChange={(v) => setEditVisibility(v as any)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-white border-white/10">
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Enrollment Policy</Label>
                <Select value={editPolicy} onValueChange={(v) => setEditPolicy(v as any)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-white border-white/10">
                    <SelectItem value="invite_only">Invite Only</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="bg-blue-600/80 hover:bg-blue-600 text-white" onClick={onSaveSettings}>
              Save Changes
            </Button>
            </div>
            </GlassCard>
          </div>
            </TabsContent>
          </Tabs>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update your course settings and information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <Button className="bg-blue-600/80 hover:bg-blue-600 text-white" onClick={onSaveSettings}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Content Dialog */}
      <Dialog open={editContentOpen} onOpenChange={setEditContentOpen}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson Content</DialogTitle>
            <DialogDescription>Edit the content and settings for this lesson.</DialogDescription>
          </DialogHeader>
          {selectedLesson ? (
            <LessonContentEditor
              lesson={selectedLesson}
              onCancel={() => setEditContentOpen(false)}
              onSave={saveLessonContent}
            />
          ) : (
            <div className="text-slate-300 text-sm">Select a lesson to edit content.</div>
          )}
        </DialogContent>
      </Dialog>

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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
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

function LessonIcon({ type }: { type: "video" | "quiz" | "file" | "discussion" | "poll" }) {
  const Icon =
    type === "video"
      ? PlayCircle
      : type === "quiz"
        ? ClipboardList
        : type === "file"
          ? FileText
          : type === "discussion"
            ? MessageSquare
            : BarChart2
  return (
    <div className="rounded-md bg-blue-600/20 text-blue-300 p-2">
      <Icon className="h-5 w-5" />
    </div>
  )
}

function AssignmentIcon({ type }: { type: import("@/store/assignment-store").AssignmentType }) {
  const Icon =
    type === "essay"
      ? FileText
      : type === "video"
        ? PlayCircle
      : type === "file"
        ? FileText
      : type === "form"
        ? ClipboardList
        : MessageSquare
  return (
    <div className="rounded-md bg-blue-600/20 text-blue-300 p-2">
      <Icon className="h-5 w-5" />
    </div>
  )
}

function StudentItem({ email, name, state }: { email: string; name: string; state: "active" | "inactive" | "pending" }) {
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-blue-600/30 text-blue-100">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-white text-sm">{name}</div>
        <div className="text-xs text-slate-400">{email}</div>
      </div>
      <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/10">
        {state}
      </Badge>
    </div>
  )
}
