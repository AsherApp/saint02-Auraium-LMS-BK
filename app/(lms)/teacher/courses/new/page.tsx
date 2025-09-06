"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/auth-store"
import { useCoursesFn } from "@/services/courses/hook"
import { createModule } from "@/services/modules/api"
import { createLesson } from "@/services/lessons/api"
import { cn } from "@/lib/utils"
import { Plus, Trash2, BookOpen, PlayCircle, FileText, MessageSquare, BarChart2, ClipboardList, Clock, Star, AlertCircle, CheckCircle, Settings, Video, Upload, Link, Users, CheckSquare } from "lucide-react"

interface Module {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  type: "video" | "quiz" | "file" | "discussion" | "poll"
  description: string
  content?: {
    video?: {
      url?: string
      duration?: number
      source?: 'youtube' | 'vimeo' | 'upload'
    }
    quiz?: {
      questions: Array<{
        id: string
        question: string
        type: 'multiple-choice' | 'true-false' | 'multi-select'
        options: string[]
        correctIndex?: number
        correctIndexes?: number[]
      }>
    }
    file?: {
      url?: string
      filename?: string
      size?: number
    }
    discussion?: {
      prompt: string
      guidelines?: string
    }
    poll?: {
      question: string
      options: string[]
      allowMultiple?: boolean
    }
  }
  duration?: number // in minutes
  points?: number
  required?: boolean
}

export default function NewCourseWizardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { createCourse } = useCoursesFn()

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  // Step 1: Basics
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [visibility, setVisibility] = useState<"private" | "unlisted" | "public">("private")
  const [enrollmentPolicy, setEnrollmentPolicy] = useState<"invite_only" | "request" | "open">("invite_only")

  // Step 2: Structure
  const [modules, setModules] = useState<Module[]>([])
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const [selectedModuleId, setSelectedModuleId] = useState<string>("")
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [newLessonType, setNewLessonType] = useState<"video" | "quiz" | "file" | "discussion" | "poll">("video")
  const [newLessonDescription, setNewLessonDescription] = useState("")
  const [newLessonDuration, setNewLessonDuration] = useState<number>(30)
  const [newLessonPoints, setNewLessonPoints] = useState<number>(10)
  const [newLessonRequired, setNewLessonRequired] = useState<boolean>(true)
  
  // Enhanced lesson content state
  const [newLessonContent, setNewLessonContent] = useState<any>({})
  const [showLessonEditor, setShowLessonEditor] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  async function handleCreateCourse() {
    if (!title.trim()) {
      toast({ title: "Course title is required", variant: "destructive" })
      setStep(0)
      return
    }
    
    if (!user?.email) {
      toast({ title: "You must be logged in", variant: "destructive" })
      return
    }

    setBusy(true)
    try {
      // Step 1: Create the course
      const course = await createCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        teacher_email: user.email,
        status,
        visibility,
        enrollment_policy: enrollmentPolicy,
        thumbnail_url: thumbnailUrl.trim() || undefined
      })
      
      // Step 2: Create modules and lessons
      if (modules.length > 0) {
        for (const module of modules) {
          try {
            // Create module
            const createdModule = await createModule({
              course_id: course.id,
              title: module.title,
              description: module.description || ""
            })
            
            // Create lessons for this module
            if (module.lessons.length > 0) {
              for (const lesson of module.lessons) {
                try {
                  await createLesson({
                    module_id: createdModule.id,
                    title: lesson.title,
                    type: lesson.type,
                    description: lesson.description || "",
                    content: lesson.content || null,
                    duration: lesson.duration || 30,
                    points: lesson.points || 10,
                    required: lesson.required || true
                  })
                } catch (lessonError: any) {
                  console.error(`Failed to create lesson ${lesson.title}:`, lessonError)
                  toast({ 
                    title: "Warning", 
                    description: `Failed to create lesson: ${lesson.title}`, 
                    variant: "destructive" 
                  })
                }
              }
            }
          } catch (moduleError: any) {
            console.error(`Failed to create module ${module.title}:`, moduleError)
            toast({ 
              title: "Warning", 
              description: `Failed to create module: ${module.title}`, 
              variant: "destructive" 
            })
          }
        }
      }
      
      toast({ title: "Course created successfully", description: "Redirecting to the course..." })
      router.push(`/teacher/course/${course.id}`)
    } catch (error: any) {
      toast({ 
        title: "Failed to create course", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      })
    } finally {
      setBusy(false)
    }
  }

  function canNextFromBasics() {
    return title.trim().length > 0
  }

  function canNextFromStructure() {
    return modules.length > 0
  }

  function addModule() {
    if (!newModuleTitle.trim()) return
    
    const module: Module = {
      id: Math.random().toString(),
      title: newModuleTitle.trim(),
      description: newModuleDescription.trim(),
      lessons: []
    }
    
    setModules([...modules, module])
    setNewModuleTitle("")
    setNewModuleDescription("")
  }

  function removeModule(moduleId: string) {
    setModules(modules.filter(m => m.id !== moduleId))
  }

  function addLesson() {
    if (!newLessonTitle.trim() || !selectedModuleId) return
    
    const lesson: Lesson = {
      id: Math.random().toString(),
      title: newLessonTitle.trim(),
      type: newLessonType,
      description: newLessonDescription.trim(),
      duration: newLessonDuration,
      points: newLessonPoints,
      required: newLessonRequired,
      content: newLessonContent
    }
    
    setModules(modules.map(m => 
      m.id === selectedModuleId 
        ? { ...m, lessons: [...m.lessons, lesson] }
        : m
    ))
    
    // Reset form
    setNewLessonTitle("")
    setNewLessonType("video")
    setNewLessonDescription("")
    setNewLessonDuration(30)
    setNewLessonPoints(10)
    setNewLessonRequired(true)
    setNewLessonContent({})
    setSelectedModuleId("")
  }

  function editLesson(lesson: Lesson) {
    setEditingLesson(lesson)
    setNewLessonTitle(lesson.title)
    setNewLessonType(lesson.type)
    setNewLessonDescription(lesson.description)
    setNewLessonDuration(lesson.duration || 30)
    setNewLessonPoints(lesson.points || 10)
    setNewLessonRequired(lesson.required || true)
    setNewLessonContent(lesson.content || {})
    setShowLessonEditor(true)
  }

  function updateLesson(lessonId: string, moduleId: string) {
    if (!editingLesson) return
    
    const updatedLesson: Lesson = {
      ...editingLesson,
      title: newLessonTitle.trim(),
      type: newLessonType,
      description: newLessonDescription.trim(),
      duration: newLessonDuration,
      points: newLessonPoints,
      required: newLessonRequired,
      content: newLessonContent
    }
    
    setModules(modules.map(m => 
      m.id === moduleId 
        ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? updatedLesson : l) }
        : m
    ))
    
    // Reset form
    setEditingLesson(null)
    setShowLessonEditor(false)
    setNewLessonTitle("")
    setNewLessonType("video")
    setNewLessonDescription("")
    setNewLessonDuration(30)
    setNewLessonPoints(10)
    setNewLessonRequired(true)
    setNewLessonContent({})
  }

  function removeLesson(moduleId: string, lessonId: string) {
    setModules(modules.map(m => 
      m.id === moduleId 
        ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
        : m
    ))
  }

  function getLessonIcon(type: string) {
    switch (type) {
      case "video": return <PlayCircle className="h-4 w-4" />
      case "quiz": return <ClipboardList className="h-4 w-4" />
      case "file": return <FileText className="h-4 w-4" />
      case "discussion": return <MessageSquare className="h-4 w-4" />
      case "poll": return <BarChart2 className="h-4 w-4" />
      default: return <PlayCircle className="h-4 w-4" />
    }
  }

  function getLessonTypeDescription(type: string) {
    switch (type) {
      case "video": return "Video content with playback controls"
      case "quiz": return "Interactive quiz with questions and answers"
      case "file": return "Downloadable files and resources"
      case "discussion": return "Student discussion and collaboration"
      case "poll": return "Quick polls and surveys"
      default: return ""
    }
  }

  function getLessonTypeColor(type: string) {
    switch (type) {
      case "video": return "text-blue-400"
      case "quiz": return "text-green-400"
      case "file": return "text-purple-400"
      case "discussion": return "text-orange-400"
      case "poll": return "text-pink-400"
      default: return "text-slate-400"
    }
  }

  function canAddLesson() {
    return newLessonTitle.trim().length > 0 && selectedModuleId
  }

  function canUpdateLesson() {
    return newLessonTitle.trim().length > 0 && editingLesson
  }

  function StepIndicator() {
    const steps = ["Course Details", "Course Structure", "Settings", "Review"]
    return (
      <div className="flex items-center justify-between gap-3">
        {steps.map((s, i) => {
          const active = i === step
          const completed = i < step
          return (
            <div key={s} className="flex-1">
              <div
                className={cn("h-2 rounded-full bg-white/10", active && "bg-blue-600/60", completed && "bg-blue-600")}
              />
              <div className={cn("mt-2 text-xs", active ? "text-white" : "text-slate-400")}>{s}</div>
            </div>
          )
        })}
      </div>
    )
  }

  function Actions() {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-slate-400 text-sm">Step {step + 1} of 4</div>
        <div className="flex gap-3 w-full sm:w-auto">
          {step > 0 && (
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              className="bg-blue-600/80 hover:bg-blue-600 text-white w-full sm:w-auto"
              onClick={() => {
                if (step === 0 && !canNextFromBasics()) {
                  toast({ title: "Please enter a course title", variant: "destructive" })
                  return
                }
                if (step === 1 && !canNextFromStructure()) {
                  toast({ title: "Please add at least one module", variant: "destructive" })
                  return
                }
                setStep(step + 1)
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              disabled={busy}
              onClick={handleCreateCourse}
              className="bg-blue-600/80 hover:bg-blue-600 text-white w-full sm:w-auto"
            >
              {busy ? "Creating..." : "Create Course"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl font-semibold">Create New Course</h1>

      <GlassCard className="p-6 space-y-6">
        <StepIndicator />

        {step === 0 && (
          <section className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Programming"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary of the course content and objectives"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL (Optional)</Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 h-11"
              />
              {thumbnailUrl && (
                <div className="mt-2">
                  <img 
                    src={thumbnailUrl} 
                    alt="Thumbnail preview" 
                    className="w-32 h-20 object-cover rounded border border-white/20"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-4">Course Structure</h3>
              <p className="text-slate-400 text-sm mb-4">
                Organize your course into modules and lessons. This helps students navigate and understand the course flow.
              </p>
            </div>

            {/* Add Module */}
            <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5">
              <h4 className="text-white font-medium">Add Module</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Module Title *</Label>
                  <Input
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="e.g., Getting Started"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    placeholder="Brief description of this module"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 h-11"
                  />
                </div>
              </div>
              <Button 
                onClick={addModule}
                disabled={!newModuleTitle.trim()}
                className="bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>

            {/* Modules List */}
            {modules.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-white font-medium">Course Modules</h4>
                {modules.map((module) => (
                  <div key={module.id} className="border border-white/10 rounded-lg bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-400" />
                        <h5 className="text-white font-medium">{module.title}</h5>
                        <span className="text-slate-400 text-sm">({module.lessons.length} lessons)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(module.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {module.description && (
                      <p className="text-slate-400 text-sm mb-3">{module.description}</p>
                    )}

                    {/* Enhanced Lesson Form */}
                    <div className="space-y-4 p-4 bg-white/5 rounded border border-white/10">
                      <div className="flex items-center justify-between">
                        <h6 className="text-white text-sm font-medium">Add Lesson</h6>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{newLessonDuration} min</span>
                          <Star className="h-3 w-3" />
                          <span>{newLessonPoints} pts</span>
                        </div>
                      </div>
                      
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">Title *</Label>
                          <Input
                            value={selectedModuleId === module.id ? newLessonTitle : ""}
                            onChange={(e) => {
                              setSelectedModuleId(module.id)
                              setNewLessonTitle(e.target.value)
                            }}
                            placeholder="Enter lesson title"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">Type</Label>
                          <Select
                            value={selectedModuleId === module.id ? newLessonType : "video"}
                            onValueChange={(v: "video" | "quiz" | "file" | "discussion" | "poll") => {
                              setSelectedModuleId(module.id)
                              setNewLessonType(v)
                            }}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-9">
                              <SelectValue />
                            </SelectTrigger>
                              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                              <SelectItem value="video">
                                <div className="flex items-center gap-2">
                                  <PlayCircle className="h-4 w-4" />
                                  Video
                                </div>
                              </SelectItem>
                              <SelectItem value="quiz">
                                <div className="flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4" />
                                  Quiz
                                </div>
                              </SelectItem>
                              <SelectItem value="file">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  File
                                </div>
                              </SelectItem>
                              <SelectItem value="discussion">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Discussion
                                </div>
                              </SelectItem>
                              <SelectItem value="poll">
                                <div className="flex items-center gap-2">
                                  <BarChart2 className="h-4 w-4" />
                                  Poll
                                </div>
                              </SelectItem>
                              </SelectContent>
                            </Select>
                          <p className="text-xs text-slate-400">{getLessonTypeDescription(newLessonType)}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Description</Label>
                        <Input
                          value={selectedModuleId === module.id ? newLessonDescription : ""}
                          onChange={(e) => {
                            setSelectedModuleId(module.id)
                            setNewLessonDescription(e.target.value)
                          }}
                          placeholder="Brief description of the lesson content"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 text-sm h-9"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">Duration (min)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="480"
                            value={selectedModuleId === module.id ? newLessonDuration : 30}
                            onChange={(e) => {
                              setSelectedModuleId(module.id)
                              setNewLessonDuration(parseInt(e.target.value) || 30)
                            }}
                            className="bg-white/5 border-white/10 text-white text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">Points</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedModuleId === module.id ? newLessonPoints : 10}
                            onChange={(e) => {
                              setSelectedModuleId(module.id)
                              setNewLessonPoints(parseInt(e.target.value) || 10)
                            }}
                            className="bg-white/5 border-white/10 text-white text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">Required</Label>
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              checked={selectedModuleId === module.id ? newLessonRequired : true}
                              onChange={(e) => {
                                setSelectedModuleId(module.id)
                                setNewLessonRequired(e.target.checked)
                              }}
                              className="rounded border-white/20 bg-white/5"
                            />
                            <span className="text-xs text-slate-300">Required for completion</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={addLesson}
                        disabled={!canAddLesson()}
                        size="sm"
                        className="bg-green-600/80 hover:bg-green-600 text-white w-full"
                      >
                        {canAddLesson() ? (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Lesson
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Complete Required Fields
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Enhanced Lessons List */}
                    {module.lessons.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h6 className="text-white text-sm font-medium">Lessons ({module.lessons.length})</h6>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{module.lessons.reduce((acc, l) => acc + (l.duration || 0), 0)} min total</span>
                            <Star className="h-3 w-3" />
                            <span>{module.lessons.reduce((acc, l) => acc + (l.points || 0), 0)} pts total</span>
                          </div>
                        </div>
                        {module.lessons.map((lesson, index) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`${getLessonTypeColor(lesson.type)}`}>
                                {getLessonIcon(lesson.type)}
                  </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-medium truncate">{lesson.title}</span>
                                  {lesson.required && (
                                    <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                      Required
                                    </Badge>
                                  )}
              </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-slate-400 text-xs capitalize">{lesson.type}</span>
                                  <span className="text-slate-400 text-xs">•</span>
                                  <span className="text-slate-400 text-xs">{lesson.duration || 30} min</span>
                                  <span className="text-slate-400 text-xs">•</span>
                                  <span className="text-slate-400 text-xs">{lesson.points || 10} pts</span>
                                  {lesson.description && (
                                    <>
                                      <span className="text-slate-400 text-xs">•</span>
                                      <span className="text-slate-400 text-xs truncate">{lesson.description}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editLesson(lesson)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              >
                                <Settings className="h-3 w-3" />
                              </Button>
              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLesson(module.id, lesson.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div className="space-y-2">
              <Label>Course Status</Label>
              <Select value={status} onValueChange={(v: "draft" | "published") => setStatus(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="draft">Draft (Private)</SelectItem>
                  <SelectItem value="published">Published (Live)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v: "private" | "unlisted" | "public") => setVisibility(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="private">Private (Only you)</SelectItem>
                  <SelectItem value="unlisted">Unlisted (Link only)</SelectItem>
                  <SelectItem value="public">Public (Searchable)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Enrollment Policy</Label>
              <Select value={enrollmentPolicy} onValueChange={(v: "invite_only" | "request" | "open") => setEnrollmentPolicy(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select enrollment policy" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="invite_only">Invite Only</SelectItem>
                  <SelectItem value="request">Request to Join</SelectItem>
                  <SelectItem value="open">Open Enrollment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-white font-semibold">Review Course Details</h2>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <div className="text-white font-medium">Title</div>
                <div className="text-slate-300">{title || "Untitled Course"}</div>
              </div>
              <div>
                <div className="text-white font-medium">Description</div>
                <div className="text-slate-300">{description || "No description"}</div>
              </div>
              <div>
                <div className="text-white font-medium">Structure</div>
                <div className="text-slate-300">
                  {modules.length} module{modules.length !== 1 ? 's' : ''}, {modules.reduce((acc, m) => acc + m.lessons.length, 0)} lesson{modules.reduce((acc, m) => acc + m.lessons.length, 0) !== 1 ? 's' : ''}
                </div>
              </div>
              <div>
                <div className="text-white font-medium">Status</div>
                <div className="text-slate-300 capitalize">{status}</div>
              </div>
              <div>
                <div className="text-white font-medium">Visibility</div>
                <div className="text-slate-300 capitalize">{visibility}</div>
              </div>
              <div>
                <div className="text-white font-medium">Enrollment</div>
                <div className="text-slate-300 capitalize">{enrollmentPolicy.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Course Structure Preview */}
            {modules.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="text-white font-medium mb-3">Course Structure Preview</h3>
                <div className="space-y-2">
                  {modules.map((module, index) => (
                    <div key={module.id} className="space-y-1">
                      <div className="text-blue-400 font-medium">
                        Module {index + 1}: {module.title}
                      </div>
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="ml-4 text-slate-300 text-sm">
                          • Lesson {lessonIndex + 1}: {lesson.title} ({lesson.type})
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <Actions />
      </GlassCard>
    </div>
  )
}
