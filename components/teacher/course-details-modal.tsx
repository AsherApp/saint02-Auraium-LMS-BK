"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Activity, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  MessageSquare,
  Video,
  Award,
  BarChart3,
  Mail
} from "lucide-react"

interface CourseDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  studentEmail: string
  courseId: string
}

interface CourseDetails {
  student: {
    email: string
    name: string
    student_code: string
  }
  course: {
    id: string
    title: string
    description: string
    status: string
  }
  enrollment: {
    id: string
    enrolled_at: string
  }
  progress: {
    overall_percentage: number
    modules_completed: number
    total_modules: number
    lessons_completed: number
    total_lessons: number
    time_spent: number
    last_activity: string
  }
  grades: {
    overall_grade: number
    assignments_completed: number
    assignments_pending: number
    average_assignment_score: number
    quizzes_taken: number
    average_quiz_score: number
  }
  engagement: {
    login_frequency: number
    average_session_duration: number
    participation_score: number
    forum_posts: number
    live_sessions_attended: number
  }
  assignments: Array<{
    id: string
    title: string
    type: string
    due_date: string
    status: string
    submitted_at: string | null
    grade: number | null
    feedback: string | null
  }>
  recent_activities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    metadata: any
  }>
}

export function CourseDetailsModal({ 
  isOpen, 
  onClose, 
  studentEmail, 
  courseId 
}: CourseDetailsModalProps) {
  const [details, setDetails] = useState<CourseDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && studentEmail && courseId) {
      fetchCourseDetails()
    }
  }, [isOpen, studentEmail, courseId])

  const fetchCourseDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await http<CourseDetails>(`/api/students/${encodeURIComponent(studentEmail)}/course/${courseId}/details`)
      setDetails(response)
    } catch (err: any) {
      setError(err.message || "Failed to fetch course details")
      toast({ 
        title: "Error", 
        description: "Failed to load course details", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-500"
    if (grade >= 80) return "text-blue-500"
    if (grade >= 70) return "text-orange-500"
    return "text-red-500"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-green-600 text-white text-xs">Submitted</Badge>
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>
      case 'late':
        return <Badge variant="destructive" className="text-xs">Late</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const handleSendMessage = () => {
    // TODO: Implement messaging functionality
    toast({ title: "Message feature coming soon" })
  }

  const handleSendNotification = () => {
    // TODO: Implement notification functionality
    toast({ title: "Notification feature coming soon" })
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/95 border-white/10 text-white w-full max-h-[90vh] overflow-y-auto flex flex-col items-center px-2 md:px-8 lg:px-24 xl:px-48">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription className="text-slate-300">
              Loading course information...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/95 border-white/10 text-white w-full max-h-[90vh] overflow-y-auto flex flex-col items-center px-2 md:px-8 lg:px-24 xl:px-48">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription className="text-slate-300">
              An error occurred while loading course information.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-12">
            <div className="text-red-300 mb-4">{error}</div>
            <Button onClick={fetchCourseDetails} variant="outline">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!details) return null

  return (
          <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/95 border-white/10 text-white w-full max-h-[90vh] overflow-y-auto flex flex-col items-center px-2 md:px-8 lg:px-24 xl:px-48">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-blue-400" />
              Course Details: {details.course.title}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              View detailed information about this student's enrollment and progress in the course.
            </DialogDescription>
          </DialogHeader>

  <div className="space-y-6 w-full">
          {/* Student and Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Student Information
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600/20 text-blue-400">
                    {details.student.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-medium">{details.student.name}</div>
                  <div className="text-slate-400 text-sm">{details.student.email}</div>
                  <div className="text-slate-500 text-xs">ID: {details.student.student_code}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSendMessage}>
                  <Mail className="h-4 w-4 mr-1" />
                  Send Message
                </Button>
                <Button size="sm" variant="outline" onClick={handleSendNotification}>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Send Notification
                </Button>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-400" />
                Course Information
              </h3>
              <div className="space-y-2">
                <div>
                  <div className="text-white font-medium">{details.course.title}</div>
                  <div className="text-slate-400 text-sm">{details.course.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white text-xs">{details.course.status}</Badge>
                  <span className="text-slate-400 text-sm">
                    Enrolled: {formatDate(details.enrollment.enrolled_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress and Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                Progress
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Overall Progress</span>
                    <span className="text-white font-medium">{details.progress.overall_percentage}%</span>
                  </div>
                  <Progress value={details.progress.overall_percentage} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-400">Modules</div>
                    <div className="text-white">{details.progress.modules_completed}/{details.progress.total_modules}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Lessons</div>
                    <div className="text-white">{details.progress.lessons_completed}/{details.progress.total_lessons}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-slate-400">Time Spent</div>
                  <div className="text-white">{details.progress.time_spent} hours</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-green-400" />
                Grades
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-slate-400 text-sm">Overall Grade</div>
                  <div className={`text-2xl font-bold ${getGradeColor(details.grades.overall_grade)}`}>
                    {details.grades.overall_grade}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-400">Assignments</div>
                    <div className="text-white">{details.grades.assignments_completed} completed</div>
                    <div className="text-slate-500">{details.grades.assignments_pending} pending</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Quizzes</div>
                    <div className="text-white">{details.grades.quizzes_taken} taken</div>
                    <div className="text-slate-500">Avg: {details.grades.average_quiz_score}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                Engagement
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-400">Login Frequency</div>
                  <div className="text-white">{details.engagement.login_frequency} days/week</div>
                </div>
                <div>
                  <div className="text-slate-400">Session Duration</div>
                  <div className="text-white">{details.engagement.average_session_duration} min avg</div>
                </div>
                <div>
                  <div className="text-slate-400">Participation</div>
                  <div className="text-white">{details.engagement.participation_score}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Forum Posts</div>
                  <div className="text-white">{details.engagement.forum_posts}</div>
                </div>
                <div>
                  <div className="text-slate-400">Live Sessions</div>
                  <div className="text-white">{details.engagement.live_sessions_attended} attended</div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-400" />
              Assignments ({details.assignments.length})
            </h3>
            <div className="space-y-3">
              {details.assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-white font-medium">{assignment.title}</div>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <div className="text-slate-400 text-sm">
                      Type: {assignment.type} • Due: {assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}
                    </div>
                    {assignment.submitted_at && (
                      <div className="text-slate-500 text-xs">
                        Submitted: {formatDate(assignment.submitted_at)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {assignment.grade !== null ? (
                      <div className={`font-medium ${getGradeColor(assignment.grade)}`}>
                        {assignment.grade}%
                      </div>
                    ) : (
                      <div className="text-slate-500">-</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              Recent Activities
            </h3>
            <div className="space-y-3">
              {details.recent_activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="p-2 rounded-full bg-blue-600/20">
                    {activity.type === 'lesson_completed' && <CheckCircle className="h-4 w-4 text-green-400" />}
                    {activity.type === 'assignment_submitted' && <FileText className="h-4 w-4 text-blue-400" />}
                    {activity.type === 'live_session_attended' && <Video className="h-4 w-4 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">{activity.description}</div>
                    <div className="text-slate-500 text-xs">{formatTimeAgo(activity.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
