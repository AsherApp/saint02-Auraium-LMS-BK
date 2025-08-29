"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { http } from "@/services/http"
import { useAuthStore } from "@/store/auth-store"
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Award, 
  MessageSquare,
  Star,
  TrendingUp,
  Calendar,
  BookOpen
} from "lucide-react"

interface StudentSubmission {
  id: string
  assignment_id: string
  student_email: string
  status: string
  payload: any
  grade: number | null
  feedback: string | null
  graded_by: string | null
  graded_at: string | null
  submitted_at: string
  updated_at: string
  assignments: {
    title: string
    description: string
    type: string
    due_at: string | null
    points: number
  }
  courses: {
    title: string
    teacher_email: string
  }
}

interface StudentGradesProps {
  studentEmail: string
}

export function StudentGrades({ studentEmail }: StudentGradesProps) {
  const { user } = useAuthStore()
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState("all")

  // Fetch student submissions
  useEffect(() => {
    fetchSubmissions()
  }, [studentEmail])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const response = await http<any>(`/api/students/${studentEmail}/assignments`)
      setSubmissions(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-500"
    if (grade >= 80) return "text-blue-500"
    if (grade >= 70) return "text-orange-500"
    if (grade >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getGradeLetter = (grade: number) => {
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-green-600/30 text-green-100"
      case "draft": return "bg-orange-600/30 text-orange-100"
      default: return "bg-red-600/30 text-red-100"
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filterType === "all") return true
    if (filterType === "graded") return sub.grade !== null
    if (filterType === "ungraded") return sub.grade === null
    if (filterType === "submitted") return sub.status === "submitted"
    return true
  }).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())

  const totalAssignments = submissions.length
  const gradedAssignments = submissions.filter(s => s.grade !== null).length
  const averageGrade = gradedAssignments > 0 
    ? Math.round(submissions.filter(s => s.grade !== null).reduce((sum, s) => sum + s.grade!, 0) / gradedAssignments)
    : 0

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2 text-slate-300">Loading your grades...</span>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grade Summary */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Grade Summary
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalAssignments}</div>
            <div className="text-sm text-slate-400">Total Assignments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{gradedAssignments}</div>
            <div className="text-sm text-slate-400">Graded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{totalAssignments - gradedAssignments}</div>
            <div className="text-sm text-slate-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{averageGrade}%</div>
            <div className="text-sm text-slate-400">Average Grade</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Overall Progress</span>
            <span className="text-sm text-slate-400">{gradedAssignments}/{totalAssignments} completed</span>
          </div>
          <Progress value={(gradedAssignments / totalAssignments) * 100} className="h-2" />
        </div>
      </GlassCard>

      {/* Assignments List */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assignment Grades ({filteredSubmissions.length})
          </h3>
          
          <div className="flex items-center gap-3">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="graded">Graded</option>
              <option value="ungraded">Ungraded</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm">No assignments found.</div>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div key={submission.id} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-white font-medium">{submission.assignments.title}</h4>
                      <Badge variant="secondary" className={`${getStatusColor(submission.status)} border-white/10`}>
                        {submission.status}
                      </Badge>
                      {submission.grade !== null && (
                        <Badge variant="outline" className="border-white/10">
                          {getGradeLetter(submission.grade)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-300 mb-2">
                      Course: {submission.courses.title}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                      {submission.assignments.due_at && (
                        <span>Due: {new Date(submission.assignments.due_at).toLocaleDateString()}</span>
                      )}
                      <span>Points: {submission.assignments.points}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {submission.grade !== null ? (
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getGradeColor(submission.grade)}`}>
                          {submission.grade}%
                        </div>
                        <div className="text-xs text-slate-400">
                          {submission.graded_at && `Graded ${new Date(submission.graded_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-slate-400 text-sm">Not graded</div>
                      </div>
                    )}
                    
                    {submission.feedback && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setFeedbackDialogOpen(true)
                        }}
                        className="bg-white/10 text-white hover:bg-white/20"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {submission.assignments.description && (
                  <div className="mt-3 text-sm text-slate-300">
                    {submission.assignments.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Teacher Feedback</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Assignment Info */}
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Assignment</div>
                    <div className="text-white font-medium">{selectedSubmission.assignments.title}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Grade</div>
                    <div className={`text-white font-bold ${getGradeColor(selectedSubmission.grade!)}`}>
                      {selectedSubmission.grade}% ({getGradeLetter(selectedSubmission.grade!)})
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white">Teacher Feedback</h4>
                <div className="rounded-md border border-white/10 bg-white/5 p-4">
                  <div className="text-slate-200 whitespace-pre-wrap">
                    {selectedSubmission.feedback}
                  </div>
                </div>
              </div>

              {/* Grading Info */}
              <div className="text-xs text-slate-400">
                Graded by: {selectedSubmission.graded_by}<br/>
                Graded on: {selectedSubmission.graded_at ? new Date(selectedSubmission.graded_at).toLocaleString() : 'Unknown'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
