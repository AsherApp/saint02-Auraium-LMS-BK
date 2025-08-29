import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { 
  getLessonsByModule, 
  getLesson, 
  createLesson, 
  updateLesson, 
  deleteLesson, 
  updateLessonContent,
  type Lesson,
  type CreateLessonData,
  type UpdateLessonData
} from './api'

export function useLessonsByModule(moduleId: string) {
  const { user } = useAuthStore()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLessons = useCallback(async () => {
    if (!moduleId || !user?.email) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await getLessonsByModule(moduleId)
      setLessons(response.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }, [moduleId, user?.email])

  const addLesson = useCallback(async (data: CreateLessonData) => {
    if (!user?.email) throw new Error('User not authenticated')
    
    try {
      const newLesson = await createLesson(data)
      setLessons(prev => [...prev, newLesson])
      return newLesson
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create lesson')
    }
  }, [user?.email])

  const updateLessonById = useCallback(async (lessonId: string, data: UpdateLessonData) => {
    if (!user?.email) throw new Error('User not authenticated')
    
    try {
      const updatedLesson = await updateLesson(lessonId, data)
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId ? updatedLesson : lesson
      ))
      return updatedLesson
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update lesson')
    }
  }, [user?.email])

  const removeLesson = useCallback(async (lessonId: string) => {
    if (!user?.email) throw new Error('User not authenticated')
    
    try {
      await deleteLesson(lessonId)
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete lesson')
    }
  }, [user?.email])

  const updateContent = useCallback(async (lessonId: string, content: any) => {
    if (!user?.email) throw new Error('User not authenticated')
    
    try {
      const updatedLesson = await updateLessonContent(lessonId, content)
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId ? updatedLesson : lesson
      ))
      return updatedLesson
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update lesson content')
    }
  }, [user?.email])

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
    create: addLesson,
    update: updateLessonById,
    remove: removeLesson,
    updateContent
  }
}

export function useLesson(lessonId: string) {
  const { user } = useAuthStore()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLesson = useCallback(async () => {
    if (!lessonId || !user?.email) return
    
    setLoading(true)
    setError(null)
    try {
      const lessonData = await getLesson(lessonId)
      setLesson(lessonData)
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }, [lessonId, user?.email])

  const updateLessonData = useCallback(async (data: UpdateLessonData) => {
    if (!user?.email || !lesson) throw new Error('User not authenticated or lesson not loaded')
    
    try {
      const updatedLesson = await updateLesson(lessonId, data)
      setLesson(updatedLesson)
      return updatedLesson
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update lesson')
    }
  }, [user?.email, lesson, lessonId])

  const updateContent = useCallback(async (content: any) => {
    if (!user?.email || !lesson) throw new Error('User not authenticated or lesson not loaded')
    
    try {
      const updatedLesson = await updateLessonContent(lessonId, content)
      setLesson(updatedLesson)
      return updatedLesson
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update lesson content')
    }
  }, [user?.email, lesson, lessonId])

  useEffect(() => {
    fetchLesson()
  }, [fetchLesson])

  return {
    lesson,
    loading,
    error,
    refetch: fetchLesson,
    update: updateLessonData,
    updateContent
  }
} 