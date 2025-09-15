import { useState, useEffect, useCallback } from 'react'
import { SimplifiedAssignmentsAPI, type Assignment } from '@/services/assignments/simplified-assignments'
import { useAuthStore } from '@/store/auth-store'
import { http } from '@/services/http'

export function useSimplifiedAssignments() {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    if (!user?.email) return

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
          // Add course information to each assignment
          const assignmentsWithCourse = courseAssignments.map(assignment => ({
            ...assignment,
            course_title: enrollment.courses?.title || 'Unknown Course',
            course_description: enrollment.courses?.description
          }))
          allAssignments.push(...assignmentsWithCourse)
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
  }, [user?.email])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const submitAssignment = useCallback(async (assignmentId: string, data: {
    response: string
    files?: string[]
  }) => {
    try {
      const result = await SimplifiedAssignmentsAPI.submitAssignment(assignmentId, data)
      // Refresh assignments after submission
      await fetchAssignments()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment')
      throw err
    }
  }, [fetchAssignments])

  const refreshAssignments = useCallback(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return {
    assignments,
    loading,
    error,
    submitAssignment,
    refreshAssignments
  }
}

export default useSimplifiedAssignments
