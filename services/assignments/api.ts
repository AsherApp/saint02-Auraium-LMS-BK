import { http } from "../http"
import { useAuthStore } from "@/store/auth-store"

export type Assignment = {
  id: string
  course_id: string
  title: string
  description: string
  type: 'essay' | 'quiz' | 'project' | 'discussion'
  due_at: string
  points?: number
  submission_count?: number
  created_at: string
  updated_at: string
}

export type Submission = {
  id: string
  assignment_id: string
  student_email: string
  content: string
  submitted_at: string
  grade?: number
  feedback?: string
}

// Helper function to get user email and create headers
function getHeadersWithUserEmail() {
  const user = useAuthStore.getState().user
  const userEmail = user?.email
  if (!userEmail) {
    throw new Error('User email not available')
  }
  return {
    'x-user-email': userEmail
  }
}

// Mock data arrays for fallback
const mockAssignments: Assignment[] = []
const mockSubmissions: Submission[] = []

export async function listByCourse(courseId: string) {
  // Try real API first
  try {
    return await http<{ items: Assignment[] }>(`/api/courses/${courseId}/assignments`, {
      headers: getHeadersWithUserEmail()
    })
  } catch (error) {
    // Fallback to mock data
    const courseAssignments = mockAssignments.filter(assignment => assignment.course_id === courseId)
    return { items: courseAssignments }
  }
}

export async function listAllAssignments() {
  // Try real API first
  try {
    return await http<{ items: Assignment[] }>('/api/assignments', {
      headers: getHeadersWithUserEmail()
    })
  } catch (error) {
    // Fallback to mock data
    return { items: mockAssignments }
  }
}

export async function getAssignment(assignmentId: string) {
  // Try real API first
  try {
    return await http<Assignment>(`/api/assignments/${assignmentId}`, {
      headers: getHeadersWithUserEmail()
    })
  } catch (error) {
    // Fallback to mock data
    const assignment = mockAssignments.find(a => a.id === assignmentId)
    if (assignment) {
      return assignment
    }
    throw new Error('Assignment not found')
  }
}

export async function createAssignment(data: any) {
  // Try real API first
  try {
    return await http<Assignment>('/api/assignments', {
      method: 'POST',
      headers: getHeadersWithUserEmail(),
      body: {
        ...data,
        scope: data.scope || { level: 'course' },
        points: data.points || 100
      }
    })
  } catch (error) {
    // Fallback to mock data
    const newAssignment: Assignment = {
      id: `assignment-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockAssignments.push(newAssignment)
    return newAssignment
  }
}

export async function updateAssignment(assignmentId: string, data: Partial<Omit<Assignment, 'id' | 'created_at' | 'updated_at'>>) {
  // Try real API first
  try {
    return await http<Assignment>(`/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: getHeadersWithUserEmail(),
      body: data
    })
  } catch (error) {
    // Fallback to mock data
    const assignmentIndex = mockAssignments.findIndex(a => a.id === assignmentId)
    if (assignmentIndex !== -1) {
      mockAssignments[assignmentIndex] = {
        ...mockAssignments[assignmentIndex],
        ...data,
        updated_at: new Date().toISOString()
      }
      return mockAssignments[assignmentIndex]
    }
    throw new Error('Assignment not found')
  }
}

export async function deleteAssignment(assignmentId: string) {
  // Try real API first
  try {
    return await http<{ ok: true }>(`/api/assignments/${assignmentId}`, {
      method: 'DELETE'
    })
  } catch (error) {
    // Fallback to mock data
    const assignmentIndex = mockAssignments.findIndex(a => a.id === assignmentId)
    if (assignmentIndex !== -1) {
      mockAssignments.splice(assignmentIndex, 1)
      return { ok: true }
    }
    throw new Error('Assignment not found')
  }
}

export async function submitAssignment(assignmentId: string, studentEmail: string, payload: any) {
  // Try real API first
  try {
    return await http<Submission>(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: { 
        student_email: studentEmail, 
        payload: payload,
        content: JSON.stringify(payload)
      }
    })
  } catch (error) {
    // Fallback to mock data
    const newSubmission: Submission = {
      id: `submission-${Date.now()}`,
      assignment_id: assignmentId,
      student_email: studentEmail,
      content: JSON.stringify(payload),
      submitted_at: new Date().toISOString()
    }
    mockSubmissions.push(newSubmission)
    return newSubmission
  }
}

export async function gradeAssignment(submissionId: string, data: { grade: number; feedback?: string }) {
  // Try real API first
  try {
    return await http<Submission>(`/api/assignments/${submissionId}/grade`, {
      method: 'POST',
      body: data
    })
  } catch (error) {
    // Fallback to mock data
    const submissionIndex = mockSubmissions.findIndex(s => s.id === submissionId)
    if (submissionIndex !== -1) {
      mockSubmissions[submissionIndex] = {
        ...mockSubmissions[submissionIndex],
        ...data
      }
      return mockSubmissions[submissionIndex]
    }
    throw new Error('Submission not found')
  }
}

export async function listSubmissions(assignmentId: string) {
  // Try real API first
  try {
    return await http<{ items: Submission[] }>(`/api/assignments/${assignmentId}/submissions`)
  } catch (error) {
    // Fallback to mock data
    const assignmentSubmissions = mockSubmissions.filter(submission => submission.assignment_id === assignmentId)
    return { items: assignmentSubmissions }
  }
}

