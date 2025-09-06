"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { AssignmentProAPI, type Assignment, type Submission, type GradingStats } from "@/services/assignment-pro/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { http } from "@/services/http"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  Target,
  TrendingUp,
  Award,
  RefreshCw,
  BookOpen,
  Edit,
  Save,
  Trash2,
  Plus,
  Eye,
  Download,
  Share2,
  Settings,
  PieChart,
  Activity,
  Layers,
  FolderOpen,
  BookMarked
} from "lucide-react"
import { GradingInterface } from "@/components/teacher/grading-interface"

type AssignmentWithStats = Assignment & {
  stats?: GradingStats
}

// Helper function to calculate stats from submissions data
const calculateStatsFromSubmissions = (submissions: any[]) => {
  const totalSubmissions = submissions.length
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length
  const gradedCount = submissions.filter(s => s.status === 'graded').length
  const lateCount = submissions.filter(s => s.late_submission).length
  
  const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined)
  const averageGrade = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
    : 0

  // Calculate grade distribution
  const gradeDistribution: { [key: string]: number } = {}
  gradedSubmissions.forEach(s => {
    const grade = s.grade || 0
    let range = ''
    if (grade >= 90) range = 'A (90-100)'
    else if (grade >= 80) range = 'B (80-89)'
    else if (grade >= 70) range = 'C (70-79)'
    else if (grade >= 60) range = 'D (60-69)'
    else range = 'F (0-59)'
    
    gradeDistribution[range] = (gradeDistribution[range] || 0) + 1
  })

  return {
    total_submissions: totalSubmissions,
    submitted_count: submittedCount,
    graded_submissions: gradedCount,
    pending_grading: submittedCount - gradedCount,
    average_grade: Math.round(averageGrade * 100) / 100,
    late_count: lateCount,
    completion_rate: totalSubmissions > 0 ? (submittedCount / totalSubmissions) * 100 : 0,
    grading_progress: totalSubmissions > 0 ? (gradedCount / totalSubmissions) * 100 : 0,
    grade_distribution: gradeDistribution
  }
}

// Helper function to get scope color
const getScopeColor = (level: string) => {
  switch (level) {
    case 'course':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'module':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'lesson':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

// Helper function to get scope label
const getScopeLabel = (level: string) => {
  switch (level) {
    case 'course':
      return 'COURSE LEVEL'
    case 'module':
      return 'MODULE LEVEL'
    case 'lesson':
      return 'LESSON LEVEL'
    default:
      return 'COURSE LEVEL'
  }
}

// Helper function to get scope icon
const getScopeIcon = (level: string) => {
  switch (level) {
    case 'course':
      return <BookOpen className="h-5 w-5 text-blue-400" />
    case 'module':
      return <FolderOpen className="h-5 w-5 text-purple-400" />
    case 'lesson':
      return <BookMarked className="h-5 w-5 text-green-400" />
    default:
      return <BookOpen className="h-5 w-5 text-blue-400" />
  }
}

export default function TeacherAssignmentDetailPage() {
  const params = useParams<{ aid: string }>()
  const router = useRouter()
  
  const [assignment, setAssignment] = useState<AssignmentWithStats | null>(null)
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [moduleInfo, setModuleInfo] = useState<any>(null)
  const [lessonInfo, setLessonInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    instructions: "",
    points: 0,
    due_at: "",
    type: "essay" as const,
    allow_late_submissions: false,
    late_penalty_percent: 0,
    max_attempts: 1
  })

  // Fetch assignment and stats
  useEffect(() => {
    const fetchAssignmentAndContext = async () => {
      if (!params.aid) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch assignment details
        const assignmentData = await AssignmentProAPI.getAssignment(params.aid)
        
        // Fetch course information
        if (assignmentData.course_id) {
          try {
            const courseResponse = await http<any>(`/api/courses/${assignmentData.course_id}`)
            setCourseInfo(courseResponse)
          } catch (err) {
            console.error('Failed to fetch course info:', err)
          }
        }

        // Fetch module information if assignment is module or lesson scoped
        if (assignmentData.scope?.level === 'module' || assignmentData.scope?.level === 'lesson') {
          if (assignmentData.scope?.moduleId) {
            try {
              const moduleResponse = await http<any>(`/api/courses/${assignmentData.course_id}/modules/${assignmentData.scope.moduleId}`)
              setModuleInfo(moduleResponse)
            } catch (err) {
              console.error('Failed to fetch module info:', err)
            }
          }
        }

        // Fetch lesson information if assignment is lesson scoped
        if (assignmentData.scope?.level === 'lesson') {
          if (assignmentData.scope?.lessonId) {
            try {
              const lessonResponse = await http<any>(`/api/courses/${assignmentData.course_id}/modules/${assignmentData.scope.moduleId}/lessons/${assignmentData.scope.lessonId}`)
              setLessonInfo(lessonResponse)
            } catch (err) {
              console.error('Failed to fetch lesson info:', err)
            }
          }
        }
        
        // Fetch grading stats
        try {
          const stats = await AssignmentProAPI.getGradingStats(params.aid)
          setAssignment({ ...assignmentData, stats })
        } catch (statsError) {
          // If stats fail, calculate from submissions data
          console.warn('Failed to fetch assignment stats, calculating from submissions:', statsError)
          const calculatedStats = calculateStatsFromSubmissions(assignmentData.submissions || [])
          setAssignment({ ...assignmentData, stats: calculatedStats })
        }
        
        // Populate edit form
        setEditForm({
          title: assignmentData.title,
          description: assignmentData.description,
          instructions: assignmentData.instructions,
          points: assignmentData.points,
          due_at: assignmentData.due_at ? new Date(assignmentData.due_at).toISOString().split('T')[0] : "",
          type: assignmentData.type,
          allow_late_submissions: assignmentData.allow_late_submissions,
          late_penalty_percent: assignmentData.late_penalty_percent,
          max_attempts: assignmentData.max_attempts
        })
      } catch (error) {
        console.error('Failed to fetch assignment:', error)
        
        setError('Assignment not found')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignmentAndContext()
  }, [params.aid])

  const handleSaveEdit = async () => {
    if (!assignment) return
    
    try {
      const updatedAssignment = await AssignmentProAPI.updateAssignment(assignment.id, {
        title: editForm.title,
        description: editForm.description,
        instructions: editForm.instructions,
        points: editForm.points,
        due_at: editForm.due_at ? new Date(editForm.due_at).toISOString() : null,
        type: editForm.type,
        allow_late_submissions: editForm.allow_late_submissions,
        late_penalty_percent: editForm.late_penalty_percent,
        max_attempts: editForm.max_attempts
      })
      
      setAssignment({ ...updatedAssignment, stats: assignment.stats })
      setEditing(false)
    } catch (error) {
      console.error('Failed to update assignment:', error)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!assignment) return
    
    try {
      await AssignmentProAPI.deleteAssignment(assignment.id)
      router.push('/teacher/assignments')
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading assignment...</div>
        </GlassCard>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Assignment Not Found</h3>
            <p className="text-slate-400 mb-4">
              This assignment doesn't exist or you don't have access to it.
            </p>
            <Button 
              onClick={() => router.push('/teacher/assignments')}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/teacher/assignments')}
            className="text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
            <p className="text-slate-400">Assignment Management & Analytics</p>
          </div>
        </div>
        <Badge className={getScopeColor(assignment.scope?.level || 'course')}>
          {getScopeLabel(assignment.scope?.level || 'course')}
        </Badge>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => router.push(`/teacher/course/${assignment.course_id}`)}
            className="bg-blue-600/80 hover:bg-blue-600 text-white"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Course
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(!editing)}
            className="text-slate-300 hover:text-white hover:bg-white/10"
          >
            {editing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {editing ? 'Save' : 'Edit'}
          </Button>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
              <DialogHeader>
                <DialogTitle>Delete Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-slate-300">
                  Are you sure you want to delete "{assignment.title}"? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAssignment}
                    className="bg-red-600/80 hover:bg-red-600"
                  >
                    Delete Assignment
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Scope Context Information */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {getScopeIcon(assignment.scope?.level || 'course')}
          <h3 className="text-lg font-semibold text-white">Assignment Context</h3>
        </div>
        <div className="space-y-2">
          {/* Course Context - Always shown */}
          {courseInfo && (
            <div className="flex items-center gap-2 text-slate-300">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="font-medium">Course:</span>
              <span>{courseInfo.title}</span>
            </div>
          )}

          {/* Module Context - Show if module or lesson scoped */}
          {moduleInfo && (assignment.scope?.level === 'module' || assignment.scope?.level === 'lesson') && (
            <div className="flex items-center gap-2 text-slate-300">
              <FolderOpen className="h-4 w-4 text-purple-400" />
              <span className="font-medium">Module:</span>
              <span>{moduleInfo.title}</span>
            </div>
          )}

          {/* Lesson Context - Show if lesson scoped */}
          {lessonInfo && assignment.scope?.level === 'lesson' && (
            <div className="flex items-center gap-2 text-slate-300">
              <BookMarked className="h-4 w-4 text-green-400" />
              <span className="font-medium">Lesson:</span>
              <span>{lessonInfo.title}</span>
            </div>
          )}

          {/* Scope Level Badge */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              {assignment.scope?.level?.toUpperCase() || 'COURSE'} LEVEL
            </Badge>
            {assignment.scope?.level === 'course' && (
              <span className="text-xs text-slate-400">Available to all students in this course</span>
            )}
            {assignment.scope?.level === 'module' && (
              <span className="text-xs text-slate-400">Specific to this module</span>
            )}
            {assignment.scope?.level === 'lesson' && (
              <span className="text-xs text-slate-400">Specific to this lesson</span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Assignment Overview Stats */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <Target className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{assignment.points}</p>
              <p className="text-sm text-slate-400">Points</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <Users className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{assignment.stats?.total_submissions || 0}</p>
              <p className="text-sm text-slate-400">Submissions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600/20 rounded-lg">
              <Award className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {assignment.stats?.average_grade ? Math.round(assignment.stats.average_grade) : 0}%
              </p>
              <p className="text-sm text-slate-400">Avg Grade</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <Activity className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{assignment.stats?.pending_grading || 0}</p>
              <p className="text-sm text-slate-400">Pending</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Main Content Tabs */}
      <div className="w-full">
        <div className="w-full flex justify-center py-4">
          <div className="flex gap-2 bg-white/10 rounded-lg p-1">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              className={activeTab === "overview" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
            >
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === "submissions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("submissions")}
              className={activeTab === "submissions" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
            >
              <Users className="h-4 w-4 mr-2" />
              Submissions
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("analytics")}
              className={activeTab === "analytics" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className={activeTab === "settings" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assignment Details */}
            <div className="lg:col-span-1">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Assignment Details</h3>
                
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Title</Label>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Description</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Instructions</Label>
                      <Textarea
                        value={editForm.instructions}
                        onChange={(e) => setEditForm({...editForm, instructions: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-400">Points</Label>
                        <Input
                          type="number"
                          value={editForm.points}
                          onChange={(e) => setEditForm({...editForm, points: parseInt(e.target.value)})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-400">Type</Label>
                        <Select value={editForm.type} onValueChange={(value: any) => setEditForm({...editForm, type: value})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900/95 text-white border-white/10">
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="file_upload">File Upload</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="discussion">Discussion</SelectItem>
                            <SelectItem value="presentation">Presentation</SelectItem>
                            <SelectItem value="code_submission">Code Submission</SelectItem>
                            <SelectItem value="peer_review">Peer Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-400">Due Date</Label>
                      <Input
                        type="date"
                        value={editForm.due_at}
                        onChange={(e) => setEditForm({...editForm, due_at: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <Button onClick={handleSaveEdit} className="bg-green-600/80 hover:bg-green-600 text-white">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setEditing(false)}
                        className="text-slate-300 hover:text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-400">Type</label>
                      <p className="text-white capitalize">{assignment.type.replace('_', ' ')}</p>
                    </div>
                    
                    {assignment.description && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Description</label>
                        <p className="text-slate-300">{assignment.description}</p>
                      </div>
                    )}
                    
                    {assignment.instructions && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Instructions</label>
                        <p className="text-slate-300">{assignment.instructions}</p>
                      </div>
                    )}
                    
                    {assignment.due_at && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Due Date</label>
                        <p className="text-white">{new Date(assignment.due_at).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-slate-400">Scope</label>
                      <p className="text-white capitalize">{assignment.scope.level}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-400">Max Attempts</label>
                      <p className="text-white">{assignment.max_attempts}</p>
                    </div>
                    
                    {assignment.allow_late_submissions && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">Late Penalty</label>
                        <p className="text-white">{assignment.late_penalty_percent}%</p>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab("submissions")}
                    className="bg-blue-600/80 hover:bg-blue-600 text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Submissions
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("analytics")}
                    className="bg-green-600/80 hover:bg-green-600 text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <GlassCard className="p-6">
            <GradingInterface assignment={assignment} onClose={() => {}} />
          </GlassCard>
        )}

        {activeTab === "analytics" && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assignment Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-md font-medium text-white">Submission Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Submissions:</span>
                    <span className="text-white font-semibold">{assignment.stats?.total_submissions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Graded:</span>
                    <span className="text-white font-semibold">{assignment.stats?.graded_submissions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending Grading:</span>
                    <span className="text-white font-semibold">{assignment.stats?.pending_grading || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Grade:</span>
                    <span className="text-white font-semibold">
                      {assignment.stats?.average_grade ? `${assignment.stats.average_grade.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-md font-medium text-white">Grade Distribution</h4>
                <div className="space-y-2">
                  {assignment.stats?.grade_distribution && Object.entries(assignment.stats.grade_distribution).map(([grade, count]) => (
                    <div key={grade} className="flex justify-between">
                      <span className="text-slate-400">{grade}:</span>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {activeTab === "settings" && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assignment Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-medium text-white">Late Submissions</h4>
                  <p className="text-sm text-slate-400">Allow students to submit after the due date</p>
                </div>
                <Button
                  variant={assignment.allow_late_submissions ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    // Toggle late submissions setting
                  }}
                >
                  {assignment.allow_late_submissions ? "Enabled" : "Disabled"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-medium text-white">Anonymous Grading</h4>
                  <p className="text-sm text-slate-400">Hide student names during grading</p>
                </div>
                <Button
                  variant={assignment.settings?.anonymous_grading ? "default" : "outline"}
                  size="sm"
                >
                  {assignment.settings?.anonymous_grading ? "Enabled" : "Disabled"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-medium text-white">Show Grades Immediately</h4>
                  <p className="text-sm text-slate-400">Students can see their grades right after submission</p>
                </div>
                <Button
                  variant={assignment.settings?.show_grades_immediately ? "default" : "outline"}
                  size="sm"
                >
                  {assignment.settings?.show_grades_immediately ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
