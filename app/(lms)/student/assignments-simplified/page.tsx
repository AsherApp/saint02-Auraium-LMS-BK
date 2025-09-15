"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { SimplifiedAssignmentCard } from "@/components/student/simplified-assignment-card"
import { SimplifiedAssignmentsAPI, Assignment } from "@/services/assignments/simplified-assignments"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { 
  FileText, 
  BookOpen, 
  CheckCircle, 
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react"

export default function SimplifiedAssignmentsPage() {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.email) return
    fetchAssignments()
  }, [user?.email])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get student's enrolled courses
      const enrollmentsResponse = await http<any>(`/api/students/me/enrollments`)
      const enrollments = enrollmentsResponse.items || []
      
      if (enrollments.length === 0) {
        setAssignments([])
        return
      }

      // Get assignments for all enrolled courses
      const allAssignments: Assignment[] = []
      
      for (const enrollment of enrollments) {
        try {
          const courseAssignments = await SimplifiedAssignmentsAPI.getCourseAssignments(enrollment.course_id)
          allAssignments.push(...courseAssignments)
        } catch (err) {
          console.error(`Error fetching assignments for course ${enrollment.course_id}:`, err)
        }
      }

      // Sort assignments by due date
      allAssignments.sort((a, b) => {
        if (!a.due_at && !b.due_at) return 0
        if (!a.due_at) return 1
        if (!b.due_at) return -1
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      })

      setAssignments(allAssignments)
    } catch (err: any) {
      console.error('Error fetching assignments:', err)
      setError(err.message || "Failed to fetch assignments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmissionUpdate = () => {
    fetchAssignments() // Refresh assignments after submission
  }

  // Calculate stats
  const totalAssignments = assignments.length
  const submittedAssignments = assignments.filter(a => a.is_submitted).length
  const gradedAssignments = assignments.filter(a => a.is_graded).length
  const overdueAssignments = assignments.filter(a => 
    a.due_at && new Date(a.due_at) < new Date() && !a.is_submitted
  ).length

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading assignments...</p>
            </div>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-center py-12">
            <div className="text-red-300 mb-4">Error: {error}</div>
            <button 
              onClick={fetchAssignments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-400" />
            My Assignments
          </h1>
          <p className="text-slate-400 mt-1">View and submit your course assignments</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalAssignments}</p>
              <p className="text-slate-400 text-sm">Total Assignments</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{submittedAssignments}</p>
              <p className="text-slate-400 text-sm">Submitted</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{gradedAssignments}</p>
              <p className="text-slate-400 text-sm">Graded</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{overdueAssignments}</p>
              <p className="text-slate-400 text-sm">Overdue</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <GlassCard className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Assignments Yet</h3>
            <p className="text-slate-400 mb-6">
              You don't have any assignments yet. Check back later or contact your teacher.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment) => (
            <SimplifiedAssignmentCard
              key={assignment.id}
              assignment={assignment}
              onSubmissionUpdate={handleSubmissionUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
