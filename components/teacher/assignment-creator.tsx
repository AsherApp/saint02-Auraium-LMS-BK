"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AssignmentProAPI, type Assignment, type AssignmentType, type RubricCriteria } from "@/services/assignment-pro/api"
import { http } from "@/services/http"
import { useAuthStore } from "@/store/auth-store"
import { notificationService } from "@/services/notification-service"
import { 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Video, 
  Code, 
  MessageSquare,
  Presentation,
  Users,
  Clock,
  Calendar,
  Star,
  Info,
  BookOpen,
  Settings,
  ClipboardList
} from "lucide-react"

interface AssignmentCreatorProps {
  scope?: { level: "course" | "module" | "lesson"; moduleId?: string; lessonId?: string }
  scopeLabel?: string
  onCancel?: () => void
  onSave?: (data: any) => void
  onClose?: () => void
}

export function AssignmentCreator({ scope, scopeLabel, onCancel, onSave, onClose }: AssignmentCreatorProps) {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Basic assignment data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [courseId, setCourseId] = useState("")
  const [type, setType] = useState<AssignmentType>("essay")
  const [scopeLevel, setScopeLevel] = useState<"course" | "module" | "lesson">(scope?.level || "course")
  const [moduleId, setModuleId] = useState(scope?.moduleId || "")
  const [lessonId, setLessonId] = useState(scope?.lessonId || "")
  
  // Grading & Due Dates
  const [points, setPoints] = useState(100)
  const [dueAt, setDueAt] = useState("")
  const [availableFrom, setAvailableFrom] = useState("")
  const [availableUntil, setAvailableUntil] = useState("")
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(true)
  const [latePenaltyPercent, setLatePenaltyPercent] = useState(10)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  
  // Rubric
  const [requireRubric, setRequireRubric] = useState(false)
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>([])
  
  // Settings
  const [allowComments, setAllowComments] = useState(true)
  const [showGradesImmediately, setShowGradesImmediately] = useState(false)
  const [anonymousGrading, setAnonymousGrading] = useState(false)
  const [plagiarismCheck, setPlagiarismCheck] = useState(false)
  const [groupAssignment, setGroupAssignment] = useState(false)
  const [maxGroupSize, setMaxGroupSize] = useState(4)
  const [selfAssessment, setSelfAssessment] = useState(false)
  const [peerReview, setPeerReview] = useState(false)
  const [peerReviewCount, setPeerReviewCount] = useState(2)
  
  // Type-specific content
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [videoInstructions, setVideoInstructions] = useState("")
  const [videoRequirements, setVideoRequirements] = useState({
    maxDuration: 10,
    allowWebcam: true,
    allowUpload: true,
    requiredTopics: [] as string[]
  })
  const [presentationRequirements, setPresentationRequirements] = useState({
    minSlides: 5,
    maxSlides: 15,
    requiredSections: [] as string[],
    allowedFormats: ["pptx", "pdf", "google-slides"]
  })

  const selectedCourse = courses.find(c => c.id === courseId)

  // Fetch real courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.email) return
      
      try {
        const coursesResponse = await http<{ items: any[] }>('/api/courses')
        const teacherCourses = coursesResponse.items || []
        setCourses(teacherCourses)
        
        // Set default course if available
        if (teacherCourses.length > 0 && !courseId) {
          setCourseId(teacherCourses[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [user?.email, courseId])

  const assignmentTypeIcons = {
    essay: FileText,
    file_upload: Upload,
    quiz: FileText,
    project: BookOpen,
    discussion: MessageSquare,
    presentation: Presentation,
    code_submission: Code,
    peer_review: Users
  }

  const addRubricCriterion = () => {
    const newCriterion: RubricCriteria = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      maxPoints: 25,
      levels: [
        { level: 4, description: "Excellent", points: 25 },
        { level: 3, description: "Good", points: 20 },
        { level: 2, description: "Fair", points: 15 },
        { level: 1, description: "Poor", points: 10 }
      ]
    }
    setRubricCriteria([...rubricCriteria, newCriterion])
  }

  const removeRubricCriterion = (id: string) => {
    setRubricCriteria(rubricCriteria.filter(c => c.id !== id))
  }

  const updateRubricCriterion = (id: string, updates: Partial<RubricCriteria>) => {
    setRubricCriteria(rubricCriteria.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !courseId || !instructions.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)
    
    try {
      const assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'> = {
        course_id: courseId,
        title: title.trim(),
        description: description.trim() || "",
        instructions: instructions.trim(),
        type,
        scope: {
          level: scopeLevel,
          ...(scopeLevel === "module" && moduleId ? { moduleId } : {}),
          ...(scopeLevel === "lesson" && moduleId && lessonId ? { moduleId, lessonId } : {})
        },
        points,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
        available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
        allow_late_submissions: allowLateSubmissions,
        late_penalty_percent: latePenaltyPercent,
        max_attempts: maxAttempts,
        time_limit_minutes: timeLimitMinutes,
        require_rubric: requireRubric,
        rubric: rubricCriteria,
        resources: [], // Could be added later
        settings: {
          allow_comments: allowComments,
          show_grades_immediately: showGradesImmediately,
          anonymous_grading: anonymousGrading,
          plagiarism_check: plagiarismCheck,
          group_assignment: groupAssignment,
          max_group_size: groupAssignment ? maxGroupSize : undefined,
          self_assessment: selfAssessment,
          peer_review: peerReview,
          peer_review_count: peerReview ? peerReviewCount : undefined
        }
      }

      if (onSave) {
        // If onSave is provided, use it (for course detail page)
        onSave(assignmentData)
      } else {
        // Otherwise use the API directly (for assignment page)
        await AssignmentProAPI.createAssignment(assignmentData)
        // Don't reload the page - let the parent component handle refresh
      }
      
      // Trigger notification for new assignment
      notificationService.newAssignment(assignmentData, selectedCourse?.title)
      
      if (onClose) onClose()
    } catch (error) {
      console.error("Failed to create assignment:", error)
      alert("Failed to create assignment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="w-full">
        <FluidTabs
          tabs={[
            { id: 'basic', label: 'Basic', icon: <FileText className="h-4 w-4" /> },
            { id: 'content', label: 'Content', icon: <BookOpen className="h-4 w-4" /> },
            { id: 'grading', label: 'Grading', icon: <Star className="h-4 w-4" /> },
            { id: 'rubric', label: 'Rubric', icon: <FileText className="h-4 w-4" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="full"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <form onSubmit={handleSubmit} className="w-full max-w-none">
          <TabsContent value="basic" className="space-y-6 w-full max-w-none mt-6">
            <Card className="bg-white/5 border-white/10 w-full max-w-none">
              <CardHeader>
                <CardTitle className="text-white">Assignment Details</CardTitle>
                <CardDescription className="text-slate-400">
                  Basic information about your assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 w-full">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title..."
                    className="bg-white/5 border-white/10 text-white placeholder-slate-400 h-11"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-white">Course *</Label>
                    {loadingCourses ? (
                      <div className="text-slate-400 text-sm">Loading courses...</div>
                    ) : courses.length === 0 ? (
                      <div className="text-red-400 text-sm">No courses available. Please create a course first.</div>
                    ) : (
                      <Select value={courseId} onValueChange={setCourseId} required>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/95 text-white border-white/20 backdrop-blur-md">
                          {(courses || []).map((course) => (
                            <SelectItem key={course.id} value={course.id} className="hover:bg-white/10">
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-white">Assignment Type *</Label>
                    <Select value={type} onValueChange={(value: AssignmentType) => setType(value)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 text-white border-white/20 backdrop-blur-md">
                        {Object.entries(assignmentTypeIcons).map(([typeKey, Icon]) => (
                          <SelectItem key={typeKey} value={typeKey} className="hover:bg-white/10">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="capitalize">{typeKey.replace('_', ' ')}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scope" className="text-white">Scope Level</Label>
                    <Select value={scopeLevel} onValueChange={(value: "course" | "module" | "lesson") => setScopeLevel(value)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 text-white border-white/20 backdrop-blur-md">
                        <SelectItem value="course" className="hover:bg-white/10">Course Wide</SelectItem>
                        <SelectItem value="module" className="hover:bg-white/10">Module Specific</SelectItem>
                        <SelectItem value="lesson" className="hover:bg-white/10">Lesson Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {scopeLevel !== "course" && selectedCourse && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="module" className="text-white">Module</Label>
                      <Select value={moduleId} onValueChange={setModuleId}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/95 text-white border-white/20 backdrop-blur-md">
                          {(selectedCourse?.modules || []).map((module) => (
                            <SelectItem key={module.id} value={module.id} className="hover:bg-white/10">
                              {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {scopeLevel === "lesson" && moduleId && (
                      <div className="space-y-2">
                        <Label htmlFor="lesson" className="text-white">Lesson</Label>
                        <Select value={lessonId} onValueChange={setLessonId}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                            <SelectValue placeholder="Select lesson" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/95 text-white border-white/20 backdrop-blur-md">
                            {(selectedCourse?.modules
                              ?.find(m => m.id === moduleId)?.lessons || [])
                              .map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id} className="hover:bg-white/10">
                                  {lesson.title}
                                </SelectItem>
                              ))}
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the assignment..."
                      className="bg-white/5 border-white/10 text-white placeholder-slate-400 min-h-32 resize-none w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions" className="text-white">Instructions *</Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Detailed instructions for students..."
                      className="bg-white/5 border-white/10 text-white placeholder-slate-400 min-h-32 resize-none w-full"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6 w-full max-w-none">
            {/* Type-specific content builders */}
            {type === "quiz" && (
              <Card className="bg-white/5 border-white/10 w-full max-w-none">
                <CardHeader>
                  <CardTitle className="text-white">Quiz Builder</CardTitle>
                  <CardDescription className="text-slate-400">
                    Create questions for your quiz assignment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-white">Questions</h4>
                    <Button
                      type="button"
                      onClick={() => setQuizQuestions([...quizQuestions, {
                        id: crypto.randomUUID(),
                        question: "",
                        type: "multiple_choice",
                        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                        correctAnswer: 0,
                        points: 1
                      }])}
                      size="sm"
                      className="bg-blue-600/80 hover:bg-blue-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {quizQuestions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No questions added yet</p>
                      <p className="text-sm">Click "Add Question" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(quizQuestions || []).map((question, index) => (
                        <div key={question.id} className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium text-white">Question {index + 1}</h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuizQuestions(quizQuestions.filter(q => q.id !== question.id))}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-white">Question Text</Label>
                              <Textarea
                                value={question.question}
                                onChange={(e) => {
                                  const updated = [...quizQuestions]
                                  updated[index].question = e.target.value
                                  setQuizQuestions(updated)
                                }}
                                className="bg-white/5 border-white/10 text-white mt-1"
                                placeholder="Enter your question..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {(question.options || []).map((option: string, optIndex: number) => (
                                <div key={optIndex} className="space-y-1">
                                  <Label className="text-white text-xs">Option {optIndex + 1}</Label>
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const updated = [...quizQuestions]
                                      updated[index].options[optIndex] = e.target.value
                                      setQuizQuestions(updated)
                                    }}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-4">
                              <div>
                                <Label className="text-white">Correct Answer</Label>
                                <Select 
                                  value={question.correctAnswer.toString()} 
                                  onValueChange={(value) => {
                                    const updated = [...quizQuestions]
                                    updated[index].correctAnswer = parseInt(value)
                                    setQuizQuestions(updated)
                                  }}
                                >
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900/95 text-white border-white/20 backdrop-blur-md">
                                    {(question.options || []).map((option: string, optIndex: number) => (
                                      <SelectItem key={optIndex} value={optIndex.toString()} className="hover:bg-white/10">
                                        Option {optIndex + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-white">Points</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={question.points}
                                  onChange={(e) => {
                                    const updated = [...quizQuestions]
                                    updated[index].points = parseInt(e.target.value) || 1
                                    setQuizQuestions(updated)
                                  }}
                                  className="bg-white/5 border-white/10 text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {type === "video" && (
              <Card className="bg-white/5 border-white/10 w-full max-w-none">
                <CardHeader>
                  <CardTitle className="text-white">Video Assignment Setup</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure requirements for student video submissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Video Instructions</Label>
                    <Textarea
                      value={videoInstructions}
                      onChange={(e) => setVideoInstructions(e.target.value)}
                      placeholder="Explain what students should record, topics to cover, etc..."
                      className="bg-white/5 border-white/10 text-white placeholder-slate-400 min-h-24"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Max Duration (minutes)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={videoRequirements.maxDuration}
                        onChange={(e) => setVideoRequirements({
                          ...videoRequirements,
                          maxDuration: parseInt(e.target.value) || 10
                        })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">Submission Options</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Allow Webcam Recording</Label>
                        <p className="text-sm text-slate-400">Students can record directly in their browser</p>
                      </div>
                      <Switch
                        checked={videoRequirements.allowWebcam}
                        onCheckedChange={(checked) => setVideoRequirements({
                          ...videoRequirements,
                          allowWebcam: checked
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Allow File Upload</Label>
                        <p className="text-sm text-slate-400">Students can upload pre-recorded videos</p>
                      </div>
                      <Switch
                        checked={videoRequirements.allowUpload}
                        onCheckedChange={(checked) => setVideoRequirements({
                          ...videoRequirements,
                          allowUpload: checked
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {type === "presentation" && (
              <Card className="bg-white/5 border-white/10 w-full max-w-none">
                <CardHeader>
                  <CardTitle className="text-white">Presentation Requirements</CardTitle>
                  <CardDescription className="text-slate-400">
                    Set guidelines for student presentations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Minimum Slides</Label>
                      <Input
                        type="number"
                        min="1"
                        value={presentationRequirements.minSlides}
                        onChange={(e) => setPresentationRequirements({
                          ...presentationRequirements,
                          minSlides: parseInt(e.target.value) || 5
                        })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Maximum Slides</Label>
                      <Input
                        type="number"
                        min="1"
                        value={presentationRequirements.maxSlides}
                        onChange={(e) => setPresentationRequirements({
                          ...presentationRequirements,
                          maxSlides: parseInt(e.target.value) || 15
                        })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Accepted Formats</Label>
                    <div className="flex gap-2 flex-wrap">
                      {["pptx", "pdf", "google-slides", "keynote"].map((format) => (
                        <Badge 
                          key={format}
                          variant={presentationRequirements.allowedFormats.includes(format) ? "default" : "outline"}
                          className={`cursor-pointer ${
                            presentationRequirements.allowedFormats.includes(format) 
                              ? "bg-blue-600/80 text-white border-blue-600" 
                              : "border-slate-500 text-slate-300 hover:bg-white/10"
                          }`}
                          onClick={() => {
                            const formats = presentationRequirements.allowedFormats.includes(format)
                              ? presentationRequirements.allowedFormats.filter(f => f !== format)
                              : [...presentationRequirements.allowedFormats, format]
                            setPresentationRequirements({
                              ...presentationRequirements,
                              allowedFormats: formats
                            })
                          }}
                        >
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(type === "essay" || type === "file_upload" || type === "project") && (
              <Card className="bg-white/5 border-white/10 w-full max-w-none">
                <CardHeader>
                  <CardTitle className="text-white">Content Guidelines</CardTitle>
                  <CardDescription className="text-slate-400">
                    Additional requirements for this assignment type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-blue-300 font-medium mb-1">
                          {type === "essay" && "Essay Assignment"}
                          {type === "file_upload" && "File Upload Assignment"}
                          {type === "project" && "Project Assignment"}
                        </h4>
                        <p className="text-blue-200 text-sm">
                          {type === "essay" && "Students will write their response directly in the assignment workspace with rich text formatting."}
                          {type === "file_upload" && "Students will upload files as attachments. You can specify accepted file types in the instructions."}
                          {type === "project" && "Students can provide both written descriptions and file attachments for comprehensive project submissions."}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="grading" className="space-y-6 w-full max-w-none mt-6">
            <Card className="bg-white/5 border-white/10 w-full max-w-none">
              <CardHeader>
                <CardTitle className="text-white">Grading & Timing</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure how this assignment will be graded and when it's available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-white">Total Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      min="1"
                      max="1000"
                      className="bg-white/5 border-white/10 text-white h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts" className="text-white">Max Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(Number(e.target.value))}
                      min="1"
                      max="10"
                      className="bg-white/5 border-white/10 text-white h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit" className="text-white">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={timeLimitMinutes || ""}
                    onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : null)}
                    placeholder="No time limit"
                    min="1"
                    className="bg-white/5 border-white/10 text-white placeholder-slate-400 h-11"
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availableFrom" className="text-white">Available From</Label>
                    <Input
                      id="availableFrom"
                      type="datetime-local"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueAt" className="text-white">Due Date</Label>
                    <Input
                      id="dueAt"
                      type="datetime-local"
                      value={dueAt}
                      onChange={(e) => setDueAt(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availableUntil" className="text-white">Available Until</Label>
                    <Input
                      id="availableUntil"
                      type="datetime-local"
                      value={availableUntil}
                      onChange={(e) => setAvailableUntil(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Allow Late Submissions</Label>
                      <p className="text-sm text-slate-400">Students can submit after due date</p>
                    </div>
                    <Switch
                      checked={allowLateSubmissions}
                      onCheckedChange={setAllowLateSubmissions}
                    />
                  </div>

                  {allowLateSubmissions && (
                    <div className="space-y-2">
                      <Label htmlFor="latePenalty" className="text-white">Late Penalty (%)</Label>
                      <Input
                        id="latePenalty"
                        type="number"
                        value={latePenaltyPercent}
                        onChange={(e) => setLatePenaltyPercent(Number(e.target.value))}
                        min="0"
                        max="100"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rubric" className="space-y-6 w-full max-w-none">
            <Card className="bg-white/5 border-white/10 w-full max-w-none">
              <CardHeader>
                <CardTitle className="text-white">Grading Rubric</CardTitle>
                <CardDescription className="text-slate-400">
                  Create a detailed rubric for consistent grading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Require Rubric</Label>
                    <p className="text-sm text-slate-400">Use rubric for grading this assignment</p>
                  </div>
                  <Switch
                    checked={requireRubric}
                    onCheckedChange={setRequireRubric}
                  />
                </div>

                {requireRubric && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold text-white">Criteria</h4>
                      <Button
                        type="button"
                        onClick={addRubricCriterion}
                        size="sm"
                        className="bg-blue-600/80 hover:bg-blue-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Criterion
                      </Button>
                    </div>

                    {(rubricCriteria || []).map((criterion, index) => (
                      <Card key={criterion.id} className="bg-white/5 border-white/10">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  placeholder="Criterion name..."
                                  value={criterion.name}
                                  onChange={(e) => updateRubricCriterion(criterion.id, { name: e.target.value })}
                                  className="bg-white/5 border-white/10 text-white placeholder-slate-400"
                                />
                                <Input
                                  type="number"
                                  placeholder="Max points"
                                  value={criterion.maxPoints}
                                  onChange={(e) => updateRubricCriterion(criterion.id, { maxPoints: Number(e.target.value) })}
                                  min="1"
                                  className="bg-white/5 border-white/10 text-white"
                                />
                              </div>
                              <Textarea
                                placeholder="Criterion description..."
                                value={criterion.description}
                                onChange={(e) => updateRubricCriterion(criterion.id, { description: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder-slate-400"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRubricCriterion(criterion.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {rubricCriteria.length === 0 && (
                      <div className="text-center py-8">
                        <Info className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">No criteria added yet. Click "Add Criterion" to get started.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 w-full max-w-none">
            <Card className="bg-white/5 border-white/10 w-full max-w-none">
              <CardHeader>
                <CardTitle className="text-white">Assignment Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure advanced options for your assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Allow Student Comments</Label>
                      <p className="text-sm text-slate-400">Students can add comments to submissions</p>
                    </div>
                    <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Show Grades Immediately</Label>
                      <p className="text-sm text-slate-400">Students see grades as soon as graded</p>
                    </div>
                    <Switch checked={showGradesImmediately} onCheckedChange={setShowGradesImmediately} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Anonymous Grading</Label>
                      <p className="text-sm text-slate-400">Hide student names during grading</p>
                    </div>
                    <Switch checked={anonymousGrading} onCheckedChange={setAnonymousGrading} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Plagiarism Check</Label>
                      <p className="text-sm text-slate-400">Check submissions for plagiarism</p>
                    </div>
                    <Switch checked={plagiarismCheck} onCheckedChange={setPlagiarismCheck} />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Group Assignment</Label>
                      <p className="text-sm text-slate-400">Students work in groups</p>
                    </div>
                    <Switch checked={groupAssignment} onCheckedChange={setGroupAssignment} />
                  </div>

                  {groupAssignment && (
                    <div className="space-y-2">
                      <Label htmlFor="maxGroupSize" className="text-white">Max Group Size</Label>
                      <Input
                        id="maxGroupSize"
                        type="number"
                        value={maxGroupSize}
                        onChange={(e) => setMaxGroupSize(Number(e.target.value))}
                        min="2"
                        max="10"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Self Assessment</Label>
                      <p className="text-sm text-slate-400">Students evaluate their own work</p>
                    </div>
                    <Switch checked={selfAssessment} onCheckedChange={setSelfAssessment} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Peer Review</Label>
                      <p className="text-sm text-slate-400">Students review each other's work</p>
                    </div>
                    <Switch checked={peerReview} onCheckedChange={setPeerReview} />
                  </div>

                  {peerReview && (
                    <div className="space-y-2">
                      <Label htmlFor="peerReviewCount" className="text-white">Reviews per Student</Label>
                      <Input
                        id="peerReviewCount"
                        type="number"
                        value={peerReviewCount}
                        onChange={(e) => setPeerReviewCount(Number(e.target.value))}
                        min="1"
                        max="5"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel || onClose}
              className="text-slate-300 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !courseId || !instructions.trim()}
              className="bg-blue-600/80 hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}