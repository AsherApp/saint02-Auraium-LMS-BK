"use client"
import { useEffect, useState, useCallback } from 'react'
import { createAssignment, gradeAssignment, listByCourse, listAllAssignments, submitAssignment, getAssignment, listSubmissions, type Assignment, type Submission } from './api'

export function useAssignmentsFn(courseId?: string) {
  const [items, setItems] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let response
      if (courseId) {
        response = await listByCourse(courseId)
      } else {
        response = await listAllAssignments()
      }
      setItems(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch assignments")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const create = useCallback(async (input: Omit<Assignment, 'id' | 'created_at'>) => {
    setLoading(true)
    setError(null)
    try {
      const newAssignment = await createAssignment(input)
      setItems(prev => [newAssignment, ...prev])
      return newAssignment
    } catch (err: any) {
      setError(err.message || "Failed to create assignment")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const submit = useCallback(async (id: string, student_email: string, payload: any) => {
    setError(null)
    try {
      await submitAssignment(id, student_email, payload)
    } catch (err: any) {
      setError(err.message || "Failed to submit assignment")
      throw err
    }
  }, [])

  const grade = useCallback(async (id: string, student_email: string, grade?: number, feedback?: string) => {
    setError(null)
    try {
      await gradeAssignment(id, student_email, grade, feedback)
    } catch (err: any) {
      setError(err.message || "Failed to grade assignment")
      throw err
    }
  }, [])

  return {
    items,
    loading,
    error,
    refresh: fetchAssignments,
    create,
    submit,
    grade,
  }
}

export function useAssignmentDetailFn(assignmentId: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return
    
    setLoading(true)
    setError(null)
    try {
      const [assignmentData, submissionsData] = await Promise.all([
        getAssignment(assignmentId),
        listSubmissions(assignmentId)
      ])
      setAssignment(assignmentData)
      setSubmissions(submissionsData.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch assignment")
      setAssignment(null)
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  return {
    assignment,
    submissions,
    loading,
    error,
    refresh: fetchAssignment,
  }
}

