"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import * as api from './api'

// Hook for tracking student progress
export function useStudentProgress(studentEmail: string, courseId: string) {
  const [progress, setProgress] = useState<api.StudentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getStudentProgress(studentEmail, courseId)
      setProgress(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch progress')
      toast({
        title: 'Error',
        description: 'Failed to load student progress',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [studentEmail, courseId, toast])

  const recordProgress = useCallback(async (data: {
    lesson_id: string
    lesson_title: string
    time_spent_seconds?: number
    score?: number
    status?: string
  }) => {
    try {
      await api.recordStudentProgress(studentEmail, courseId, data)
      // Refresh progress after recording
      await fetchProgress()
      toast({
        title: 'Success',
        description: 'Progress recorded successfully'
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to record progress',
        variant: 'destructive'
      })
      throw err
    }
  }, [studentEmail, courseId, fetchProgress, toast])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    recordProgress
  }
}

// Hook for tracking student engagement
export function useStudentEngagement(studentEmail: string, courseId: string, days: number = 30) {
  const [engagement, setEngagement] = useState<api.StudentEngagement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchEngagement = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getStudentEngagement(studentEmail, courseId, days)
      setEngagement(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch engagement')
      toast({
        title: 'Error',
        description: 'Failed to load engagement data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [studentEmail, courseId, days, toast])

  const updateEngagement = useCallback(async (data: {
    date?: string
    login_count?: number
    total_session_time_seconds?: number
    lessons_completed?: number
    assignments_submitted?: number
    forum_posts?: number
    live_sessions_attended?: number
    participation_score?: number
  }) => {
    try {
      await api.updateStudentEngagement(studentEmail, courseId, data)
      await fetchEngagement()
      toast({
        title: 'Success',
        description: 'Engagement updated successfully'
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update engagement',
        variant: 'destructive'
      })
      throw err
    }
  }, [studentEmail, courseId, fetchEngagement, toast])

  useEffect(() => {
    fetchEngagement()
  }, [fetchEngagement])

  return {
    engagement,
    loading,
    error,
    refetch: fetchEngagement,
    updateEngagement
  }
}

// Hook for tracking student activities
export function useStudentActivities(studentEmail: string, options: {
  limit?: number
  course_id?: string
} = {}) {
  const [activities, setActivities] = useState<api.StudentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getStudentActivities(studentEmail, options)
      setActivities(data.items)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities')
      toast({
        title: 'Error',
        description: 'Failed to load activities',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [studentEmail, options, toast])

  const recordActivity = useCallback(async (data: {
    course_id?: string
    activity_type: string
    description: string
    metadata?: any
  }) => {
    try {
      await api.recordStudentActivity(studentEmail, data)
      await fetchActivities()
      toast({
        title: 'Success',
        description: 'Activity recorded successfully'
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to record activity',
        variant: 'destructive'
      })
      throw err
    }
  }, [studentEmail, fetchActivities, toast])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
    recordActivity
  }
}

// Hook for tracking student grades
export function useStudentGrades(studentEmail: string, courseId: string) {
  const [grades, setGrades] = useState<api.StudentGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getStudentGrades(studentEmail, courseId)
      setGrades(data.items)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grades')
      toast({
        title: 'Error',
        description: 'Failed to load grades',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [studentEmail, courseId, toast])

  const recordGrade = useCallback(async (data: {
    assignment_id?: string
    grade_type: string
    grade_percentage: number
    max_possible_score?: number
    actual_score?: number
    feedback?: string
  }) => {
    try {
      await api.recordStudentGrade(studentEmail, courseId, data)
      await fetchGrades()
      toast({
        title: 'Success',
        description: 'Grade recorded successfully'
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to record grade',
        variant: 'destructive'
      })
      throw err
    }
  }, [studentEmail, courseId, fetchGrades, toast])

  useEffect(() => {
    fetchGrades()
  }, [fetchGrades])

  return {
    grades,
    loading,
    error,
    refetch: fetchGrades,
    recordGrade
  }
}

// Hook for course details
export function useCourseDetails(studentEmail: string, courseId: string) {
  const [details, setDetails] = useState<api.CourseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getCourseDetails(studentEmail, courseId)
      setDetails(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch course details')
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [studentEmail, courseId, toast])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  return {
    details,
    loading,
    error,
    refetch: fetchDetails
  }
}

// Hook for live progress updates
export function useLiveProgress(studentEmail: string) {
  const [liveData, setLiveData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchLiveProgress = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getLiveStudentProgress(studentEmail)
      setLiveData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live progress')
      toast({
        title: 'Error',
        description: 'Failed to load live progress',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [studentEmail, toast])

  useEffect(() => {
    fetchLiveProgress()
    
    // Set up polling for live updates
    const interval = setInterval(fetchLiveProgress, 30000) // Poll every 30 seconds
    
    return () => clearInterval(interval)
  }, [fetchLiveProgress])

  return {
    liveData,
    loading,
    error,
    refetch: fetchLiveProgress
  }
}

// Hook for automatic activity tracking
export function useActivityTracker(studentEmail: string) {
  const { recordActivity } = useStudentActivities(studentEmail)
  const { user } = useAuthStore()

  // Track login activity
  useEffect(() => {
    if (user?.email === studentEmail) {
      recordActivity({
        activity_type: 'login',
        description: 'Logged into the system',
        metadata: { timestamp: new Date().toISOString() }
      }).catch(console.error)
    }
  }, [studentEmail, user?.email, recordActivity])

  // Track page view activity
  const trackPageView = useCallback((page: string, courseId?: string) => {
    recordActivity({
      course_id: courseId,
      activity_type: 'page_view',
      description: `Viewed page: ${page}`,
      metadata: { page, timestamp: new Date().toISOString() }
    }).catch(console.error)
  }, [recordActivity])

  // Track lesson completion
  const trackLessonCompletion = useCallback((lessonId: string, lessonTitle: string, courseId: string, timeSpent?: number) => {
    recordActivity({
      course_id: courseId,
      activity_type: 'lesson_completed',
      description: `Completed lesson: ${lessonTitle}`,
      metadata: { lesson_id: lessonId, lesson_title: lessonTitle, time_spent: timeSpent }
    }).catch(console.error)
  }, [recordActivity])

  // Track assignment submission
  const trackAssignmentSubmission = useCallback((assignmentId: string, assignmentTitle: string, courseId: string) => {
    recordActivity({
      course_id: courseId,
      activity_type: 'assignment_submitted',
      description: `Submitted assignment: ${assignmentTitle}`,
      metadata: { assignment_id: assignmentId, assignment_title: assignmentTitle }
    }).catch(console.error)
  }, [recordActivity])

  // Track live session attendance
  const trackLiveSessionAttendance = useCallback((sessionId: string, sessionTitle: string, courseId: string) => {
    recordActivity({
      course_id: courseId,
      activity_type: 'live_session_attended',
      description: `Attended live session: ${sessionTitle}`,
      metadata: { session_id: sessionId, session_title: sessionTitle }
    }).catch(console.error)
  }, [recordActivity])

  return {
    trackPageView,
    trackLessonCompletion,
    trackAssignmentSubmission,
    trackLiveSessionAttendance
  }
}
