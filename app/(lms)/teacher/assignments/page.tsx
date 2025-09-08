"use client"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Eye,
  Users,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs } from "@/components/ui/fluid-tabs"

// Mock Data Types
type MockAssignment = {
  id: string
  title: string
  description: string
  type: 'essay' | 'project' | 'quiz' | 'discussion'
  course_title: string
  course_id: string
  points: number
  due_at: string
  created_at: string
  stats: {
    total_submissions: number
    pending_grading: number
    average_grade: number
  }
  status: 'active' | 'overdue' | 'completed'
}

type MockSubmission = {
  id: string
  assignment_id: string
  assignment_title: string
  course_title: string
  student_name: string
  student_email: string
  status: 'submitted' | 'graded' | 'draft'
  submitted_at: string
  grade?: number
  feedback?: string
  late_submission: boolean
}

// Mock Data
const mockAssignments: MockAssignment[] = [
  {
    id: "1",
    title: "Introduction to React Hooks",
    description: "Write a comprehensive essay explaining React hooks and their usage patterns.",
    type: "essay",
    course_title: "Advanced React Development",
    course_id: "course-1",
    points: 100,
    due_at: "2024-01-15T23:59:59Z",
    created_at: "2024-01-01T10:00:00Z",
    stats: {
      total_submissions: 15,
      pending_grading: 3,
      average_grade: 87.5
    },
    status: "active"
  },
  {
    id: "2", 
    title: "Build a Todo App",
    description: "Create a full-stack todo application using React and Node.js.",
    type: "project",
    course_title: "Full Stack Development",
    course_id: "course-2",
    points: 150,
    due_at: "2024-01-10T23:59:59Z",
    created_at: "2023-12-20T14:30:00Z",
    stats: {
      total_submissions: 8,
      pending_grading: 0,
      average_grade: 92.3
    },
    status: "completed"
  },
  {
    id: "3",
    title: "JavaScript Fundamentals Quiz",
    description: "Test your understanding of JavaScript basics and ES6 features.",
    type: "quiz",
    course_title: "JavaScript Fundamentals",
    course_id: "course-3",
    points: 50,
    due_at: "2024-01-05T23:59:59Z",
    created_at: "2023-12-15T09:15:00Z",
    stats: {
      total_submissions: 22,
      pending_grading: 5,
      average_grade: 78.9
    },
    status: "overdue"
  }
]

const mockSubmissions: MockSubmission[] = [
  {
    id: "sub-1",
    assignment_id: "1",
    assignment_title: "Introduction to React Hooks",
    course_title: "Advanced React Development",
    student_name: "John Doe",
    student_email: "john@example.com",
    status: "submitted",
    submitted_at: "2024-01-14T15:30:00Z",
    late_submission: false
  },
  {
    id: "sub-2",
    assignment_id: "1", 
    assignment_title: "Introduction to React Hooks",
    course_title: "Advanced React Development",
    student_name: "Jane Smith",
    student_email: "jane@example.com",
    status: "graded",
    submitted_at: "2024-01-13T10:15:00Z",
    grade: 95,
    feedback: "Excellent work! Great understanding of hooks concepts.",
    late_submission: false
  },
  {
    id: "sub-3",
    assignment_id: "2",
    assignment_title: "Build a Todo App", 
    course_title: "Full Stack Development",
    student_name: "Mike Johnson",
    student_email: "mike@example.com",
    status: "graded",
    submitted_at: "2024-01-09T20:45:00Z",
    grade: 88,
    feedback: "Good implementation, but could improve error handling.",
    late_submission: true
  }
]

export default function TeacherAssignmentsPage() {
  // State Management - Simplified
  const [assignments] = useState<MockAssignment[]>(mockAssignments)
  const [submissions] = useState<MockSubmission[]>(mockSubmissions)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "pending" | "graded" | "overdue">("all")
  const [activeTab, setActiveTab] = useState<"assignments" | "submissions">("assignments")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course_title.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    switch (filterType) {
      case "pending":
        matchesFilter = assignment.stats.pending_grading > 0
        break
      case "graded":
        matchesFilter = assignment.stats.total_submissions > 0 && assignment.stats.pending_grading === 0
        break
      case "overdue":
        matchesFilter = assignment.status === "overdue"
        break
      default:
        matchesFilter = true
    }
    
    return matchesSearch && matchesFilter
  })

  // Helper Functions
  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-5 w-5 text-blue-400" />
      case 'project': return <BarChart3 className="h-5 w-5 text-green-400" />
      case 'quiz': return <CheckCircle2 className="h-5 w-5 text-purple-400" />
      case 'discussion': return <Users className="h-5 w-5 text-orange-400" />
      default: return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = (assignment: MockAssignment) => {
    if (assignment.status === "overdue") {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
    } else if (assignment.stats.pending_grading > 0) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Needs Grading</Badge>
    } else if (assignment.stats.total_submissions > 0) {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Complete</Badge>
    } else {
      return <Badge variant="outline" className="border-slate-500 text-slate-400">Active</Badge>
    }
  }

  const getSubmissionStatusBadge = (submission: MockSubmission) => {
    switch (submission.status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      case 'draft':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Draft</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">{submission.status}</Badge>
    }
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
              <Button className="bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <div className="p-4 text-center text-slate-400">
                Assignment creation form will be implemented here
              </div>
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
                badge: assignments.length
              },
              { 
                id: 'submissions', 
                label: 'Submissions', 
                icon: <Users className="h-4 w-4" />, 
                badge: submissions.length
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
        
        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          {/* Search and Filters */}
          <AnimationWrapper delay={0.2}>
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
                  {["all", "pending", "graded", "overdue"].map((filter) => (
                    <Button
                      key={filter}
                      variant={filterType === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilterType(filter as any)}
                      className={filterType === filter ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </AnimationWrapper>

          {/* Assignments Grid */}
          {filteredAssignments.length === 0 ? (
            <AnimationWrapper delay={0.3}>
              <GlassCard className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No assignments found</h3>
                  <p className="text-slate-400">Try adjusting your search or filter criteria</p>
                </div>
              </GlassCard>
            </AnimationWrapper>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StaggeredAnimationWrapper staggerDelay={100} duration="normal">
                {filteredAssignments.map((assignment) => (
                  <GlassCard key={assignment.id} className="p-5 hover:bg-white/10 transition-all duration-300 hover:scale-105">
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
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-1">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Assignment Type */}
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/10 rounded-lg">
                          {getAssignmentIcon(assignment.type)}
                        </div>
                        <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                          {assignment.type}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {assignment.description}
                      </p>

                      {/* Stats */}
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
                            {assignment.stats.average_grade.toFixed(1)}
                          </div>
                          <div className="text-xs text-slate-400">Avg Grade</div>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`/teacher/assignment/${assignment.id}`} className="flex-1">
                          <Button size="sm" className="w-full bg-blue-600/80 hover:bg-blue-600 text-white">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </StaggeredAnimationWrapper>
            </div>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <div className="space-y-4">
            <StaggeredAnimationWrapper staggerDelay={150} duration="normal">
              {mockSubmissions.map((submission) => (
                <GlassCard key={submission.id} className="p-6 hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-lg shrink-0">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {submission.student_name}
                          </h3>
                          <p className="text-sm text-slate-400 mb-2">
                            {submission.assignment_title} • {submission.course_title}
                          </p>
                        </div>
                      </div>

                      {/* Submission Details */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Submitted {new Date(submission.submitted_at).toLocaleDateString()}</span>
                        </div>
                        {submission.late_submission && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-orange-400" />
                            <span className="text-orange-400">Late Submission</span>
                          </div>
                        )}
                        {submission.grade !== undefined && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Grade: {submission.grade}</span>
                          </div>
                        )}
                      </div>

                      {/* Feedback */}
                      {submission.feedback && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-300 line-clamp-2">
                            {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {getSubmissionStatusBadge(submission)}
                      <Link href={`/teacher/assignment/${submission.assignment_id}/submission/${submission.id}`}>
                        <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white">
                          {submission.status === 'graded' ? 'View Grade' : 'View Response'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </StaggeredAnimationWrapper>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StaggeredAnimationWrapper staggerDelay={100} duration="normal">
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-white">{assignments.length}</div>
            <div className="text-sm text-slate-400">Total Assignments</div>
          </GlassCard>
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-orange-400">
              {assignments.reduce((sum, a) => sum + a.stats.pending_grading, 0)}
            </div>
            <div className="text-sm text-slate-400">Pending Grading</div>
          </GlassCard>
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-green-400">
              {assignments.reduce((sum, a) => sum + a.stats.total_submissions, 0)}
            </div>
            <div className="text-sm text-slate-400">Total Submissions</div>
          </GlassCard>
          <GlassCard className="p-4 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-blue-400">
              {assignments.filter(a => a.status === "overdue").length}
            </div>
            <div className="text-sm text-slate-400">Overdue</div>
          </GlassCard>
        </StaggeredAnimationWrapper>
      </div>
    </div>
  )
}