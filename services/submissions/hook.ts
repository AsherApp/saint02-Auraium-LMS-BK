import { useState, useEffect, useCallback } from 'react'
import { SubmissionsAPI, type Submission, type CreateSubmissionData, type UpdateSubmissionData, type GradeSubmissionData } from './api'

// Hook for getting submissions for an assignment (teachers)
export function useAssignmentSubmissions(assignmentId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await SubmissionsAPI.getAssignmentSubmissions(assignmentId)
      setSubmissions(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions')
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions
  }
}

// Hook for getting a single submission
export function useSubmission(submissionId: string) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await SubmissionsAPI.getSubmission(submissionId)
      setSubmission(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submission')
      setSubmission(null)
    } finally {
      setLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    fetchSubmission()
  }, [fetchSubmission])

  return {
    submission,
    loading,
    error,
    refetch: fetchSubmission
  }
}

// Hook for submission management
export function useSubmissionManagement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSubmission = useCallback(async (data: CreateSubmissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await SubmissionsAPI.createSubmission(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSubmission = useCallback(async (submissionId: string, data: UpdateSubmissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await SubmissionsAPI.updateSubmission(submissionId, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const gradeSubmission = useCallback(async (submissionId: string, data: GradeSubmissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await SubmissionsAPI.gradeSubmission(submissionId, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to grade submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSubmission = useCallback(async (submissionId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await SubmissionsAPI.deleteSubmission(submissionId)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to delete submission')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createSubmission,
    updateSubmission,
    gradeSubmission,
    deleteSubmission
  }
}
