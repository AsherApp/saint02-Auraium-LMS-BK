"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { AnimationWrapper, StaggeredAnimationWrapper } from "@/components/shared/animation-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth-store"
import { AssignmentProAPI, type Assignment, type Submission } from "@/services/assignment-pro/api"
import { ProgressAPI, StudentProgress } from '@/services/progress/api'
import { http } from "@/services/http"
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search,
  FileText,
  Award,
  Target,
  TrendingUp,
  BookOpen,
  Video,
  Code,
  MessageSquare,
  Presentation,
  Users,
  Play,
  Eye,
  BarChart3
} from "lucide-react"
import { StudentGrades } from "@/components/student/assignment-grades"

type AssignmentWithSubmission = Assignment & {
  course_title?: string
  submission?: Submission | null
  submission_status?: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'overdue'
}

export default function StudentAssignmentsPage() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([])
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [progressLoading, setProgressLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "submitted" | "overdue">("all")
  const [activeTab, setActiveTab] = useState("assignments")

  // Fetch assignments for enrolled courses - use direct assignment API approach
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.email) return

      setLoading(true)
      try {
        // First fetch enrolled courses for the student
        const enrollmentsResponse = await http<{ items: any[] }>(`/api/students/me/enrollments`)
        const enrollments = enrollmentsResponse.items || []
        const enrolledCourses = (enrollments || []).map((enrollment: any) => enrollment.course).filter(Boolean)
        setCourses(enrolledCourses)
        
        const allAssignments: AssignmentWithSubmission[] = []
        
        // Get all courses and try to fetch assignments for each
        // The backend will handle enrollment checking
        for (const course of enrolledCourses) {
          try {
            // Try to fetch assignments for this course
            // The backend will return 404 if student is not enrolled
            const courseAssignments = await AssignmentProAPI.listCourseAssignments(course.id)
            
            // If we get here, student is enrolled in this course
            // Fetch submission status for each assignment
            const assignmentsWithSubmissions = await Promise.all(
              (courseAssignments || []).map(async (assignment) => {
                try {
                  // Get all submissions for this assignment by the current student
                  const submissions = await AssignmentProAPI.getMyAssignmentSubmissions(assignment.id)
                  
                  // Get the most recent submission (if any)
                  const submission = submissions.length > 0 ? submissions[0] : null
                  
                  // Determine submission status
                  let submissionStatus: AssignmentWithSubmission['submission_status'] = 'not_started'
                  
                  if (submission) {
                    if (submission.status === 'graded') {
                      submissionStatus = 'graded'
                    } else if (submission.status === 'submitted') {
                      submissionStatus = 'submitted'
                    } else {
                      submissionStatus = 'in_progress'
                    }
                  } else if (assignment.due_at && new Date(assignment.due_at) < new Date()) {
                    submissionStatus = 'overdue'
                  }
                  
                  return {
                    ...assignment,
                    course_title: course.title,
                    submission,
                    submission_status: submissionStatus
                  }
                } catch (error) {
                  // No submission found, determine status based on due date
                  let submissionStatus: AssignmentWithSubmission['submission_status'] = 'not_started'
                  if (assignment.due_at && new Date(assignment.due_at) < new Date()) {
                    submissionStatus = 'overdue'
                  }
                  
                  return {
                    ...assignment,
                    course_title: course.title,
                    submission: null,
                    submission_status: submissionStatus
                  }
                }
              })
            )
            
            allAssignments.push(...assignmentsWithSubmissions)
          } catch (error) {
            // Student not enrolled in this course or no assignments
            console.debug(`No assignments for course ${course.id}`)
          }
        }
        
        console.log('Fetched assignments with submissions:', allAssignments)
        setAssignments(allAssignments)
      } catch (error) {
        console.error("Failed to fetch assignments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
    
    // Set up polling for new assignments every 30 seconds
    const interval = setInterval(fetchAssignments, 30000)
    
    return () => clearInterval(interval)
  }, [user?.email])

  useEffect(() => {
    if (activeTab === "progress") {
      fetchProgressData()
    }
  }, [activeTab])

  const fetchProgressData = async () => {
    try {
      setProgressLoading(true)
      const data = await ProgressAPI.getMyProgress()
      setProgressData(data)
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  // Filter assignments based on search and status
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "pending" && assignment.submission_status === "not_started") ||
      (filterStatus === "submitted" && (assignment.submission_status === "submitted" || assignment.submission_status === "graded")) ||
      (filterStatus === "overdue" && assignment.submission_status === "overdue")
    
    console.log(`Assignment: ${assignment.title}, Status: ${assignment.submission_status}, Filter: ${filterStatus}, Matches: ${matchesSearch && matchesStatus}`)
    
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const pendingAssignments = assignments.filter(a => a.submission_status === "not_started").length
  const submittedAssignments = assignments.filter(a => a.submission_status === "submitted" || a.submission_status === "graded").length
  const overdueAssignments = assignments.filter(a => a.submission_status === "overdue").length
  
  console.log('Assignment stats:', {
    total: assignments.length,
    pending: pendingAssignments,
    submitted: submittedAssignments,
    overdue: overdueAssignments,
    assignments: (assignments || []).map(a => ({ title: a.title, status: a.submission_status }))
  })

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay':
        return <FileText className="h-5 w-5 text-blue-400" />
      case 'project':
        return <Code className="h-5 w-5 text-green-400" />
      case 'discussion':
        return <MessageSquare className="h-5 w-5 text-purple-400" />
      case 'presentation':
        return <Presentation className="h-5 w-5 text-orange-400" />
      case 'video':
        return <Video className="h-5 w-5 text-red-400" />
      default:
        return <ClipboardList className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = (assignment: AssignmentWithSubmission) => {
    console.log(`Getting status badge for ${assignment.title}: ${assignment.submission_status}`)
    switch (assignment.submission_status) {
      case 'graded':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        )
      case 'submitted':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case 'overdue':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-slate-500 text-slate-400">
            <Play className="h-3 w-3 mr-1" />
            Start
          </Badge>
        )
    }
  }

  const getProgressPercentage = (assignment: AssignmentWithSubmission) => {
    switch (assignment.submission_status) {
      case 'graded':
      case 'submitted':
        return 100
      case 'in_progress':
        return 50
      case 'overdue':
      case 'not_started':
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">My Assignments</h1>
        </div>
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading assignments...</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Assignments</h1>
          <p className="text-slate-400">Track your progress and submit your work</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex justify-center mb-6">
        <FluidTabs
          tabs={[
            { 
              id: 'assignments', 
              label: 'Assignments', 
              icon: <ClipboardList className="h-4 w-4" />, 
              badge: assignments.length 
            },
            { 
              id: 'progress', 
              label: 'My Progress', 
              icon: <BarChart3 className="h-4 w-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="wide"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

        <TabsContent value="assignments" className="space-y-4">
          {/* Stats Cards */}
          <StaggeredAnimationWrapper 
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            staggerDelay={100}
            duration="normal"
          >
            <GlassCard className="p-4" variant="light" hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{assignments.length}</p>
                  <p className="text-sm text-slate-400">Total</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4" variant="light" hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600/20 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">{pendingAssignments}</p>
                  <p className="text-sm text-slate-400">Pending</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4" variant="light" hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{submittedAssignments}</p>
                  <p className="text-sm text-slate-400">Submitted</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4" variant="light" hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{overdueAssignments}</p>
                  <p className="text-sm text-slate-400">Overdue</p>
                </div>
              </div>
            </GlassCard>
          </StaggeredAnimationWrapper>

          {/* Search and Filters */}
          <GlassCard className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search assignments or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-slate-400"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                  className={filterStatus === "all" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                  className={filterStatus === "pending" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === "submitted" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus("submitted")}
                  className={filterStatus === "submitted" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                >
                  Submitted
                </Button>
                <Button
                  variant={filterStatus === "overdue" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterStatus("overdue")}
                  className={filterStatus === "overdue" ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                >
                  Overdue
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Assignments List */}
          {filteredAssignments.length === 0 ? (
            <GlassCard className="p-8">
              <div className="text-center">
                <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {assignments.length === 0 ? "No assignments yet" : "No assignments found"}
                </h3>
                <p className="text-slate-400">
                  {assignments.length === 0 
                    ? "You'll see assignments here once your teachers create them" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </div>
            </GlassCard>
          ) : (
            <StaggeredAnimationWrapper 
              className="space-y-4"
              staggerDelay={150}
              duration="normal"
            >
              {(filteredAssignments || []).map((assignment) => (
                <GlassCard key={assignment.id} className="p-6" variant="default" hover={true}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-lg shrink-0">
                          {getAssignmentIcon(assignment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-slate-400 mb-2">
                            {assignment.course_title}
                          </p>
                          {assignment.description && (
                            <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Assignment Details */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{assignment.points} points</span>
                        </div>
                        {assignment.due_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span className="capitalize">{assignment.type.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white">{getProgressPercentage(assignment)}%</span>
                        </div>
                        <Progress 
                          value={getProgressPercentage(assignment)} 
                          className="h-2 bg-white/10"
                        />
                      </div>

                      {/* Grade Display */}
                      {assignment.submission?.grade !== null && assignment.submission?.grade !== undefined && (
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4 text-green-400" />
                          <span className="text-green-400 font-semibold">
                            Grade: {assignment.submission.grade}/{assignment.points} ({((assignment.submission.grade / assignment.points) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {getStatusBadge(assignment)}
                      <Link 
                        href={`/student/assignment/${assignment.id}`}
                      >
                        <Button 
                          size="sm" 
                          className="bg-blue-600/80 hover:bg-blue-600 text-white"
                        >
                          {assignment.submission_status === 'graded' ? 'View Results' :
                           assignment.submission_status === 'submitted' ? 'View Submission' :
                           assignment.submission_status === 'in_progress' ? 'Continue' :
                           'View Assignment'
                          }
                        </Button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </StaggeredAnimationWrapper>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">My Learning Progress</h3>
            {progressLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : progressData ? (
              <div className="space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <GlassCard className="p-4 text-center">
                    <div className="text-2xl font-bold text-white">{progressData.total_courses || 0}</div>
                    <div className="text-sm text-slate-400">Enrolled Courses</div>
                  </GlassCard>
                  <GlassCard className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{progressData.completed_courses || 0}</div>
                    <div className="text-sm text-slate-400">Completed Courses</div>
                  </GlassCard>
                  <GlassCard className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{progressData.total_lessons_completed || 0}</div>
                    <div className="text-sm text-slate-400">Lessons Completed</div>
                  </GlassCard>
                  <GlassCard className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{progressData.total_assignments_submitted || 0}</div>
                    <div className="text-sm text-slate-400">Assignments Submitted</div>
                  </GlassCard>
                </div>

                {/* Course Progress */}
                {progressData.course_progress && progressData.course_progress.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Course Progress</h4>
                    <div className="space-y-3">
                      {(progressData.course_progress || []).map((course: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div>
                            <h5 className="text-white font-medium">{course.course_title}</h5>
                            <p className="text-slate-400 text-sm">{course.course_id}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">
                                {course.completion_percentage || 0}%
                              </div>
                              <Progress 
                                value={course.completion_percentage || 0} 
                                className="w-32 mt-2"
                              />
                            </div>
                            <div className="text-right text-sm text-slate-400">
                              <div>Lessons: {course.completed_lessons || 0}/{course.total_lessons || 0}</div>
                              <div>Assignments: {course.completed_assignments || 0}/{course.total_assignments || 0}</div>
                              <div>Quizzes: {course.passed_quizzes || 0}/{course.total_quizzes || 0}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activities */}
                {progressData.recent_activities && progressData.recent_activities.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Recent Activities</h4>
                    <div className="space-y-2">
                      {(progressData.recent_activities || []).slice(0, 5).map((activity: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm">{activity.description || 'Activity completed'}</p>
                            <p className="text-slate-400 text-xs">{activity.created_at}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.type?.replace('_', ' ') || 'activity'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No progress data available
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
} 