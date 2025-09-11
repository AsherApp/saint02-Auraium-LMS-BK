import { useState, useEffect, useCallback } from 'react'
import { AssignmentAPI, type Assignment, type Submission, type GradingStats } from './api'

// =====================================================
// ASSIGNMENT HOOKS
// =====================================================

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.listAssignments()
      setAssignments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const createAssignment = useCallback(async (data: Partial<Assignment>) => {
    try {
      const newAssignment = await AssignmentAPI.createAssignment(data)
      setAssignments(prev => [newAssignment, ...prev])
      return newAssignment
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment')
      throw err
    }
  }, [])

  const updateAssignment = useCallback(async (id: string, data: Partial<Assignment>) => {
    try {
      const updatedAssignment = await AssignmentAPI.updateAssignment(id, data)
      setAssignments(prev => prev.map(a => a.id === id ? updatedAssignment : a))
      return updatedAssignment
    } catch (err: any) {
      setError(err.message || 'Failed to update assignment')
      throw err
    }
  }, [])

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      await AssignmentAPI.deleteAssignment(id)
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete assignment')
      throw err
    }
  }, [])

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
  }
}

export function useAssignment(assignmentId: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getAssignment(assignmentId)
      setAssignment(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignment')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  return {
    assignment,
    loading,
    error,
    fetchAssignment
  }
}

export function useCourseAssignments(courseId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourseAssignments = useCallback(async () => {
    if (!courseId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.listCourseAssignments(courseId)
      setAssignments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch course assignments')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourseAssignments()
  }, [fetchCourseAssignments])

  return {
    assignments,
    loading,
    error,
    fetchCourseAssignments
  }
}

export function useAssignmentSubmissions(assignmentId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.listAssignmentSubmissions(assignmentId)
      setSubmissions(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const gradeSubmission = useCallback(async (submissionId: string, grade: number, feedback?: string) => {
    try {
      const updatedSubmission = await AssignmentAPI.gradeSubmission(submissionId, { grade, feedback })
      setSubmissions(prev => prev.map(s => s.id === submissionId ? updatedSubmission : s))
      return updatedSubmission
    } catch (err: any) {
      setError(err.message || 'Failed to grade submission')
      throw err
    }
  }, [])

  const returnSubmission = useCallback(async (submissionId: string, feedback: string) => {
    try {
      const updatedSubmission = await AssignmentAPI.returnSubmission(submissionId, feedback)
      setSubmissions(prev => prev.map(s => s.id === submissionId ? updatedSubmission : s))
      return updatedSubmission
    } catch (err: any) {
      setError(err.message || 'Failed to return submission')
      throw err
    }
  }, [])

  return {
    submissions,
    loading,
    error,
    fetchSubmissions,
    gradeSubmission,
    returnSubmission
  }
}

export function useMySubmission(assignmentId: string) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMySubmission = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getMySubmission(assignmentId)
      setSubmission(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submission')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchMySubmission()
  }, [fetchMySubmission])

  const createSubmission = useCallback(async (data: {
    content: any
    attachments?: any[]
    status?: 'draft' | 'submitted'
    timeSpentMinutes?: number
  }) => {
    try {
      const newSubmission = await AssignmentAPI.createSubmission(assignmentId, data)
      setSubmission(newSubmission)
      return newSubmission
    } catch (err: any) {
      setError(err.message || 'Failed to create submission')
      throw err
    }
  }, [assignmentId])

  const updateSubmission = useCallback(async (submissionId: string, data: {
    content?: any
    attachments?: any[]
    status?: 'draft' | 'submitted'
    timeSpentMinutes?: number
  }) => {
    try {
      const updatedSubmission = await AssignmentAPI.updateSubmission(submissionId, data)
      setSubmission(updatedSubmission)
      return updatedSubmission
    } catch (err: any) {
      setError(err.message || 'Failed to update submission')
      throw err
    }
  }, [])

  return {
    submission,
    loading,
    error,
    fetchMySubmission,
    createSubmission,
    updateSubmission
  }
}

export function useGradingStats(assignmentId: string) {
  const [stats, setStats] = useState<GradingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!assignmentId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await AssignmentAPI.getGradingStats(assignmentId)
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grading stats')
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    fetchStats
  }
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File, type: 'assignment_resource' | 'submission_attachment') => {
    try {
      setUploading(true)
      setError(null)
      const result = await AssignmentAPI.uploadFile(file, type)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
      throw err
    } finally {
      setUploading(false)
    }
  }, [])

  return {
    uploading,
    error,
    uploadFile
  }
}