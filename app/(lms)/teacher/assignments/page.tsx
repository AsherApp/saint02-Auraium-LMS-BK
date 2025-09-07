"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AssignmentProAPI, type Assignment, type GradingStats } from "@/services/assignment-pro/api"
import { useAuthStore } from "@/store/auth-store"
import { AssignmentCreator } from "@/components/teacher/assignment-creator"
import { http } from "@/services/http"
import { AnimationWrapper, StaggeredAnimationWrapper } from "@/components/shared/animation-wrapper"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Copy, 
  Trash2,
  Clock,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Presentation,
  Users,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"

type AssignmentWithStats = Assignment & {
  stats?: GradingStats
  course_title?: string
}

type SubmissionWithAssignment = {
  id: string
  assignmentId: string
  assignmentTitle: string
  courseTitle: string
  studentEmail: string
  studentName: string
  status: string
  submittedAt: string
  grade?: number
  feedback?: string
  content: any
  attachments: any[]
  lateSubmission: boolean
}

export default function TeacherAssignmentsPage() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "pending" | "graded" | "overdue">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<"assignments" | "submissions">("assignments")
  
  // Fluid tabs for main navigation
  const mainTabs = useFluidTabs("assignments")
  
  // Fluid tabs for assignment filters
  const filterTabs = useFluidTabs("all")

  // Check URL parameters for initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam === 'submissions') {
      setActiveTab('submissions')
    }
  }, [])
  const [submissions, setSubmissions] = useState<SubmissionWithAssignment[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  
  // Document and presentation viewer states
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [viewingPresentation, setViewingPresentation] = useState<any>(null)

  // Fetch courses and assignments
  useEffect(() => {
    const fetchData = async () => {
      console.log('fetchData called with user:', user)
      console.log('User email:', user?.email)
      console.log('User object:', JSON.stringify(user, null, 2))
      
      if (!user?.email) {
        console.log('No user email, returning early')
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        // First fetch real courses from backend
        console.log('Making API call to /api/courses...')
        const coursesResponse = await http<{ items: any[] }>('/api/courses')
        console.log('Courses API response:', coursesResponse)
        const teacherCourses = coursesResponse?.items || []
        console.log('Teacher courses:', teacherCourses)
        setCourses(teacherCourses)
        
        const allAssignments: AssignmentWithStats[] = []
        
        // Fetch assignments for each course the teacher has
        for (const course of teacherCourses) {
          try {
            console.log(`Fetching assignments for course: ${course.id}`)
            const courseAssignments = await AssignmentProAPI.listCourseAssignments(course.id)
            console.log(`Course assignments response:`, courseAssignments)
            console.log(`Course assignments type:`, typeof courseAssignments)
            console.log(`Course assignments is array:`, Array.isArray(courseAssignments))
            
            // Ensure courseAssignments is an array
            const assignmentsArray = Array.isArray(courseAssignments) ? courseAssignments : []
            console.log(`Using assignments array with ${assignmentsArray.length} items`)
            
            // Fetch stats for each assignment
            const assignmentsWithStats = await Promise.all(
              assignmentsArray.map(async (assignment) => {
                try {
                  const stats = await AssignmentProAPI.getGradingStats(assignment.id)
                  return {
                    ...assignment,
                    stats,
                    course_title: course.title
                  }
                } catch (error) {
                  console.warn(`Failed to fetch stats for assignment ${assignment.id}:`, error)
                  // If stats fail, just return assignment without stats
                  return {
                    ...assignment,
                    course_title: course.title
                  }
                }
              })
            )
            
            console.log(`Adding ${assignmentsWithStats.length} assignments to allAssignments`)
            allAssignments.push(...assignmentsWithStats)
          } catch (error) {
            // If course assignments fail, just skip this course
            console.warn(`Failed to fetch assignments for course ${course.id}:`, error)
          }
        }
        
        console.log('Fetched assignments with stats:', allAssignments)
        setAssignments(allAssignments)
      } catch (error) {
        console.error("Failed to fetch assignments:", error)
        console.error("Error type:", typeof error)
        console.error("Error details:", error)
        console.error("Error message:", error instanceof Error ? error.message : 'Unknown error')
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
        setError("Failed to load assignments. Please try again.")
        setCourses([])
        setAssignments([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.email])

  // Filter assignments with useMemo to prevent unnecessary recalculations
  const filteredAssignments = useMemo(() => {
    console.log('Filtering assignments:', assignments)
    console.log('Assignments type:', typeof assignments)
    console.log('Assignments is array:', Array.isArray(assignments))
    
    const assignmentsForFilter = Array.isArray(assignments) ? assignments : []
    console.log('Assignments for filter:', assignmentsForFilter)
    
    return assignmentsForFilter.filter((assignment) => {
      const matchesSearch = searchTerm === "" || 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesFilter = true
      const now = new Date().getTime()
      const dueAt = assignment.due_at ? new Date(assignment.due_at).getTime() : null
      const isOverdue = dueAt && dueAt < now
      const pendingCount = assignment.stats?.pending_grading || 0
      const totalSubmissions = assignment.stats?.total_submissions || 0
      
      switch (filterType) {
        case "pending":
          matchesFilter = pendingCount > 0
          break
        case "graded":
          matchesFilter = totalSubmissions > 0 && pendingCount === 0
          break
      case "overdue":
        matchesFilter = Boolean(isOverdue)
        break
        case "all":
        default:
          matchesFilter = true
      }
      
      console.log(`Assignment: ${assignment.title}, Filter: ${filterType}, Pending: ${pendingCount}, Total: ${totalSubmissions}, Overdue: ${isOverdue}, Matches: ${matchesSearch && matchesFilter}`)
      
      return matchesSearch && matchesFilter
    })
  }, [assignments, searchTerm, filterType])

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    try {
      const newTitle = `${assignment.title} (Copy)`
      await AssignmentProAPI.duplicateAssignment(assignment.id, newTitle)
      // Refresh the assignments list
      window.location.reload()
    } catch (error) {
      console.error("Failed to duplicate assignment:", error)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This cannot be undone.")) {
      return
    }
    
    try {
      await AssignmentProAPI.deleteAssignment(assignmentId)
      setAssignments(prev => prev.filter(a => a.id !== assignmentId))
    } catch (error) {
      console.error("Failed to delete assignment:", error)
    }
  }

  // Fetch all submissions for the teacher's courses
  const fetchSubmissions = async () => {
    if (!user?.email) return
    
    setSubmissionsLoading(true)
    try {
      const allSubmissions: SubmissionWithAssignment[] = []
      
      // Ensure assignments is an array
      const assignmentsArray = Array.isArray(assignments) ? assignments : []
      console.log(`Fetching submissions for ${assignmentsArray.length} assignments`)
      console.log(`Assignments variable:`, assignments)
      console.log(`Assignments type:`, typeof assignments)
      
      // Fetch submissions for each assignment
      for (const assignment of assignmentsArray) {
        try {
          const assignmentSubmissions = await AssignmentProAPI.listAssignmentSubmissions(assignment.id)
          console.log(`Assignment submissions for ${assignment.id}:`, assignmentSubmissions)
          console.log(`Assignment submissions type:`, typeof assignmentSubmissions)
          console.log(`Assignment submissions is array:`, Array.isArray(assignmentSubmissions))
          
          const submissionsArray = Array.isArray(assignmentSubmissions) ? assignmentSubmissions : []
          const submissionsWithDetails = submissionsArray.map(submission => ({
            id: submission.id,
            assignmentId: assignment.id, // Use the assignment ID from the context
            assignmentTitle: assignment.title,
            courseTitle: assignment.course_title || '',
            studentEmail: submission.student_email,
            studentName: submission.student_name,
            status: submission.status,
            submittedAt: submission.submitted_at || '',
            grade: submission.grade,
            feedback: submission.feedback,
            content: submission.content,
            attachments: submission.attachments,
            lateSubmission: submission.late_submission
          }))
          
          allSubmissions.push(...submissionsWithDetails)
          console.log('Submissions for assignment', assignment.id, ':', submissionsWithDetails)
        } catch (error) {
          // Skip assignments with no submissions
          console.debug(`No submissions for assignment ${assignment.id}`)
        }
      }
      
      setSubmissions(allSubmissions)
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    } finally {
      setSubmissionsLoading(false)
    }
  }

  // Fetch submissions when assignments change or tab changes to submissions
  useEffect(() => {
    if (activeTab === "submissions" && assignments.length > 0) {
      fetchSubmissions()
    }
  }, [activeTab, assignments])

  const getStatusBadge = (assignment: AssignmentWithStats) => {
    const now = new Date().getTime()
    const dueAt = assignment.due_at ? new Date(assignment.due_at).getTime() : null
    const isOverdue = dueAt && dueAt < now
    const pendingCount = assignment.stats?.pending_grading || 0
    const totalSubmissions = assignment.stats?.total_submissions || 0

    if (isOverdue) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
    } else if (pendingCount > 0) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Needs Grading</Badge>
    } else if (totalSubmissions > 0) {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Complete</Badge>
    } else {
      return <Badge variant="outline" className="border-slate-500 text-slate-400">Active</Badge>
    }
  }

  const getSubmissionStatusBadge = (submission: SubmissionWithAssignment) => {
    switch (submission.status) {
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
      case 'draft':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-slate-500 text-slate-400">
            {submission.status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Assignments</h1>
        </div>
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading assignments...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Assignments</h1>
        </div>
        <GlassCard className="p-8">
          <div className="text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              Retry
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimationWrapper>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Assignments</h1>
            <p className="text-slate-400">Manage and track all your course assignments</p>
          </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <AssignmentCreator 
              onClose={() => setShowCreateDialog(false)}
              onSave={async (assignmentData) => {
                try {
                  await AssignmentProAPI.createAssignment(assignmentData)
                  setShowCreateDialog(false)
                  // Refresh the assignments list without full page reload
                  const fetchData = async () => {
                    if (!user?.email) return
                    
                    setLoading(true)
                    try {
                      // First fetch real courses from backend
                      const coursesResponse = await http<{ items: any[] }>('/api/courses')
                      const teacherCourses = coursesResponse.items || []
                      setCourses(teacherCourses)
                      
                      const allAssignments: AssignmentWithStats[] = []
                      
                      // Fetch assignments for each course the teacher has
                      for (const course of teacherCourses) {
                        try {
                          const courseAssignments = await AssignmentProAPI.listCourseAssignments(course.id)
                          
                          // Fetch stats for each assignment
                          const assignmentsWithStats = await Promise.all(
                            (courseAssignments || []).map(async (assignment) => {
                              try {
                                const stats = await AssignmentProAPI.getGradingStats(assignment.id)
                                return {
                                  ...assignment,
                                  stats,
                                  course_title: course.title
                                }
                              } catch (error) {
                                // If stats fail, just return assignment without stats
                                return {
                                  ...assignment,
                                  course_title: course.title
                                }
                              }
                            })
                          )
                          
                          allAssignments.push(...assignmentsWithStats)
                        } catch (error) {
                          // If course assignments fail, just skip this course
                          console.warn(`Failed to fetch assignments for course ${course.id}:`, error)
                        }
                      }
                      
                      console.log('Fetched assignments with stats:', allAssignments)
                      setAssignments(allAssignments)
                    } catch (error) {
                      console.error("Failed to fetch assignments:", error)
                    } finally {
                      setLoading(false)
                    }
                  }
                  
                  fetchData()
                } catch (error) {
                  console.error('Failed to create assignment:', error)
                  alert('Failed to create assignment. Please try again.')
                }
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </AnimationWrapper>

      {/* Main Navigation */}
      <AnimationWrapper delay={0.1}>
        <div className="flex justify-center">
        <FluidTabs
          tabs={[
            { 
              id: 'assignments', 
              label: 'Assignments', 
              icon: <FileText className="h-4 w-4" />, 
              badge: (assignments || []).length 
            },
            { 
              id: 'submissions', 
              label: 'Submissions', 
              icon: <Users className="h-4 w-4" />, 
              badge: (submissions || []).length 
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as "assignments" | "submissions")}
          variant="default"
          width="wide"
        />
        </div>
      </AnimationWrapper>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "assignments" | "submissions")}>

        <TabsContent value="assignments" className="space-y-6">
          {/* Filters and Search */}
          <AnimationWrapper delay={0.2}>
            <GlassCard className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search assignments or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              <FluidTabs
                tabs={[
                  { id: 'all', label: 'All', badge: (assignments || []).length },
                  { 
                    id: 'pending', 
                    label: 'Pending', 
                    badge: (assignments || []).filter(a => {
                      const pendingCount = a.stats?.pending_grading || 0
                      return pendingCount > 0
                    }).length 
                  },
                  { 
                    id: 'graded', 
                    label: 'Graded', 
                    badge: (assignments || []).filter(a => {
                      const totalSubmissions = a.stats?.total_submissions || 0
                      const pendingCount = a.stats?.pending_grading || 0
                      return totalSubmissions > 0 && pendingCount === 0
                    }).length 
                  },
                  { 
                    id: 'overdue', 
                    label: 'Overdue', 
                    badge: (assignments || []).filter(a => {
                      const now = new Date().getTime()
                      const dueAt = a.due_at ? new Date(a.due_at).getTime() : null
                      return dueAt && dueAt < now
                    }).length 
                  }
                ]}
                activeTab={filterType}
                onTabChange={(filter) => setFilterType(filter as "all" | "pending" | "graded" | "overdue")}
                variant="compact"
                width="wide"
              />
            </div>
            </GlassCard>
          </AnimationWrapper>

                {/* Assignment Grid */}
          {filteredAssignments.length === 0 ? (
            <AnimationWrapper delay={0.3}>
              <GlassCard className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {assignments.length === 0 ? "No assignments yet" : "No assignments found"}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {assignments.length === 0 
                      ? "Create your first assignment to get started" 
                      : "Try adjusting your search or filter criteria"
                    }
                  </p>
                  {assignments.length === 0 && (
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  )}
                </div>
              </GlassCard>
            </AnimationWrapper>
          ) : (
            <StaggeredAnimationWrapper delay={0.3} stagger={0.1}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(filteredAssignments || []).map((assignment) => (
                  <GlassCard key={assignment.id} className="p-5 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate mb-1">
                          {assignment.title}
                        </h3>
                        <p className="text-xs text-slate-400">{assignment.course_title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(assignment)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Assignment Type & Scope */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                        {assignment.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                        {assignment.scope.level}
                      </Badge>
                    </div>

                    {/* Description */}
                    {assignment.description && (
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}

                    {/* Stats */}
                    {assignment.stats && (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-white">
                            {assignment.stats.total_submissions}
                          </div>
                          <div className="text-xs text-slate-400">Submissions</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-orange-400">
                            {assignment.stats.pending_grading}
                          </div>
                          <div className="text-xs text-slate-400">Pending</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-green-400">
                            {assignment.stats.average_grade ? assignment.stats.average_grade.toFixed(1) : 'N/A'}
                          </div>
                          <div className="text-xs text-slate-400">Avg Grade</div>
                        </div>
                      </div>
                    )}

                    {/* Due Date */}
                    {assignment.due_at && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link 
                        href={`/teacher/assignment/${assignment.id}`}
                        className="flex-1"
                      >
                        <Button 
                          size="sm" 
                          className="w-full bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 hover:scale-105"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateAssignment(assignment)}
                        className="text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  </GlassCard>
                ))}
              </div>
            </StaggeredAnimationWrapper>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          {/* Submissions List */}
          {submissionsLoading ? (
            <AnimationWrapper delay={0.2}>
              <GlassCard className="p-8">
                <div className="text-center text-slate-300">Loading submissions...</div>
              </GlassCard>
            </AnimationWrapper>
          ) : submissions.length === 0 ? (
            <AnimationWrapper delay={0.2}>
              <GlassCard className="p-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No submissions yet</h3>
                  <p className="text-slate-400">
                    Student submissions will appear here once they submit their assignments
                  </p>
                </div>
              </GlassCard>
            </AnimationWrapper>
          ) : (
            <StaggeredAnimationWrapper delay={0.2} stagger={0.1}>
              <div className="space-y-4">
                {(submissions || []).map((submission) => (
                  <GlassCard key={submission.id} className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-lg shrink-0">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {submission.studentName}
                          </h3>
                          <p className="text-sm text-slate-400 mb-2">
                            {submission.assignmentTitle} • {submission.courseTitle}
                          </p>
                        </div>
                      </div>

                      {/* Submission Details */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Recently'}</span>
                        </div>
                        {submission.lateSubmission && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-orange-400" />
                            <span className="text-orange-400">Late Submission</span>
                          </div>
                        )}
                        {submission.grade !== undefined && submission.grade !== null && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Grade: {submission.grade}</span>
                          </div>
                        )}
                      </div>

                      {/* Content Preview */}
                      {submission.content && Object.keys(submission.content).length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-300 line-clamp-2">
                            {submission.content.essay || submission.content.project || submission.content.discussion || 'Content submitted'}
                          </p>
                        </div>
                      )}

                      {/* Attachments */}
                      {submission.attachments && submission.attachments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-400">
                            {submission.attachments.length} attachment{submission.attachments.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {getSubmissionStatusBadge(submission)}
                      <Link 
                        href={`/teacher/assignment/${submission.assignmentId}/submission/${submission.id}`}
                      >
                        <Button 
                          size="sm" 
                          className="bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 hover:scale-105"
                        >
                          {submission.status === 'graded' ? 'View Grade' : 'View Response'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                  </GlassCard>
                ))}
              </div>
            </StaggeredAnimationWrapper>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <StaggeredAnimationWrapper delay={0.4} stagger={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-white">{assignments.length}</div>
            <div className="text-sm text-slate-400">Total Assignments</div>
          </GlassCard>
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-orange-400">
              {assignments.reduce((sum, a) => sum + (a.stats?.pending_grading || 0), 0)}
            </div>
            <div className="text-sm text-slate-400">Pending Grading</div>
          </GlassCard>
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-green-400">
              {assignments.reduce((sum, a) => sum + (a.stats?.total_submissions || 0), 0)}
            </div>
            <div className="text-sm text-slate-400">Total Submissions</div>
          </GlassCard>
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-blue-400">
              {assignments.filter(a => {
                const now = new Date().getTime()
                const dueAt = a.due_at ? new Date(a.due_at).getTime() : null
                return dueAt && dueAt < now
              }).length}
            </div>
            <div className="text-sm text-slate-400">Overdue</div>
          </GlassCard>
        </div>
      </StaggeredAnimationWrapper>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        title="Assignment Document"
      />

      {/* Presentation Viewer Modal */}
      <PresentationViewer
        presentation={viewingPresentation}
        isOpen={!!viewingPresentation}
        onClose={() => setViewingPresentation(null)}
        title="Assignment Presentation"
      />
    </div>
  )
} 