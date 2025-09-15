"use client"

import { useState, useEffect, useCallback } from 'react'
import { ProgressAPI } from '@/services/progress/api'

interface Lesson {
  id: string
  title: string
  type: string
  content: any
  duration: number
  points: number
  position: number
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  position: number
}

interface Course {
  id: string
  title: string
  modules: Module[]
}

interface SequentialNavigationState {
  currentModuleIndex: number
  currentLessonIndex: number
  completedLessons: Set<string>
  accessibleLessons: Set<string>
  isAutoAdvancing: boolean
}

export function useSequentialNavigation(
  course: Course | null,
  courseId: string,
  userEmail: string
) {
  const [state, setState] = useState<SequentialNavigationState>({
    currentModuleIndex: 0,
    currentLessonIndex: 0,
    completedLessons: new Set(),
    accessibleLessons: new Set(),
    isAutoAdvancing: false
  })

  const [courseProgress, setCourseProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch course progress and determine accessible content
  useEffect(() => {
    const fetchProgress = async () => {
      if (!course || !courseId || !userEmail) return

      setLoading(true)
      try {
        const progress = await ProgressAPI.getCourseProgress(courseId)
        setCourseProgress(progress)

        // Get completed lessons
        const completed = new Set<string>()
        const accessible = new Set<string>()

        if (progress?.detailedProgress) {
          progress.detailedProgress.forEach((p: any) => {
            if (p.type === 'lesson_completed' && p.status === 'completed') {
              completed.add(p.lesson_id)
            }
          })
        }

        // Determine accessible lessons (sequential unlocking)
        let foundFirstIncomplete = false
        for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
          const module = course.modules[moduleIndex]
          for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
            const lesson = module.lessons[lessonIndex]
            
            if (!foundFirstIncomplete) {
              // First lesson is always accessible
              if (moduleIndex === 0 && lessonIndex === 0) {
                accessible.add(lesson.id)
              } else {
                // Check if previous lesson is completed
                const prevLesson = getPreviousLesson(course, moduleIndex, lessonIndex)
                if (prevLesson && completed.has(prevLesson.id)) {
                  accessible.add(lesson.id)
                } else {
                  foundFirstIncomplete = true
                  break
                }
              }
            }
          }
          if (foundFirstIncomplete) break
        }

        setState(prev => ({
          ...prev,
          completedLessons: completed,
          accessibleLessons: accessible
        }))

      } catch (error) {
        console.error('Error fetching course progress:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [course, courseId, userEmail])

  // Get the previous lesson in sequence
  const getPreviousLesson = (course: Course, moduleIndex: number, lessonIndex: number): Lesson | null => {
    if (lessonIndex > 0) {
      return course.modules[moduleIndex].lessons[lessonIndex - 1]
    } else if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1]
      return prevModule.lessons[prevModule.lessons.length - 1]
    }
    return null
  }

  // Get the next lesson in sequence
  const getNextLesson = (course: Course, moduleIndex: number, lessonIndex: number): { moduleIndex: number; lessonIndex: number; lesson: Lesson } | null => {
    if (lessonIndex < course.modules[moduleIndex].lessons.length - 1) {
      return {
        moduleIndex,
        lessonIndex: lessonIndex + 1,
        lesson: course.modules[moduleIndex].lessons[lessonIndex + 1]
      }
    } else if (moduleIndex < course.modules.length - 1) {
      return {
        moduleIndex: moduleIndex + 1,
        lessonIndex: 0,
        lesson: course.modules[moduleIndex + 1].lessons[0]
      }
    }
    return null
  }

  // Check if a lesson is accessible
  const isLessonAccessible = useCallback((lessonId: string): boolean => {
    return state.accessibleLessons.has(lessonId)
  }, [state.accessibleLessons])

  // Check if a lesson is completed
  const isLessonCompleted = useCallback((lessonId: string): boolean => {
    return state.completedLessons.has(lessonId)
  }, [state.completedLessons])

  // Get current lesson
  const getCurrentLesson = useCallback((): Lesson | null => {
    if (!course || !course.modules[state.currentModuleIndex]) return null
    return course.modules[state.currentModuleIndex].lessons[state.currentLessonIndex] || null
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Navigate to a specific lesson (only if accessible)
  const navigateToLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    if (!course) return false

    const lesson = course.modules[moduleIndex]?.lessons[lessonIndex]
    if (!lesson || !isLessonAccessible(lesson.id)) {
      return false
    }

    setState(prev => ({
      ...prev,
      currentModuleIndex: moduleIndex,
      currentLessonIndex: lessonIndex
    }))
    return true
  }, [course, isLessonAccessible])

  // Navigate to next lesson (auto-advance)
  const navigateToNext = useCallback(() => {
    if (!course) return false

    const next = getNextLesson(course, state.currentModuleIndex, state.currentLessonIndex)
    if (!next) return false

    setState(prev => ({
      ...prev,
      currentModuleIndex: next.moduleIndex,
      currentLessonIndex: next.lessonIndex,
      isAutoAdvancing: true
    }))

    // Reset auto-advancing flag after a short delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isAutoAdvancing: false }))
    }, 1000)

    return true
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Navigate to previous lesson (always allowed)
  const navigateToPrevious = useCallback(() => {
    if (!course) return false

    const prev = getPreviousLesson(course, state.currentModuleIndex, state.currentLessonIndex)
    if (!prev) return false

    // Find the module and lesson index of the previous lesson
    for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
      const module = course.modules[moduleIndex]
      for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
        if (module.lessons[lessonIndex].id === prev.id) {
          setState(prev => ({
            ...prev,
            currentModuleIndex: moduleIndex,
            currentLessonIndex: lessonIndex
          }))
          return true
        }
      }
    }
    return false
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Mark lesson as completed and unlock next lesson
  const markLessonCompleted = useCallback(async (lessonId: string, timeSpentSeconds: number = 0) => {
    if (!course || !courseId) return false

    try {
      const currentLesson = getCurrentLesson()
      if (!currentLesson || currentLesson.id !== lessonId) return false

      // Record completion
      await ProgressAPI.recordLessonCompletion({
        courseId,
        moduleId: course.modules[state.currentModuleIndex].id,
        lessonId,
        lessonTitle: currentLesson.title,
        timeSpentSeconds
      })

      // Update local state
      setState(prev => {
        const newCompleted = new Set(prev.completedLessons)
        newCompleted.add(lessonId)

        const newAccessible = new Set(prev.accessibleLessons)
        
        // Unlock next lesson
        const next = getNextLesson(course, prev.currentModuleIndex, prev.currentLessonIndex)
        if (next) {
          newAccessible.add(next.lesson.id)
        }

        return {
          ...prev,
          completedLessons: newCompleted,
          accessibleLessons: newAccessible
        }
      })

      // Refresh course progress
      const progress = await ProgressAPI.getCourseProgress(courseId)
      setCourseProgress(progress)

      return true
    } catch (error) {
      console.error('Error marking lesson as completed:', error)
      return false
    }
  }, [course, courseId, state.currentModuleIndex, state.currentLessonIndex, getCurrentLesson])

  // Check if there's a next lesson
  const hasNextLesson = useCallback((): boolean => {
    if (!course) return false
    return getNextLesson(course, state.currentModuleIndex, state.currentLessonIndex) !== null
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Check if there's a previous lesson
  const hasPreviousLesson = useCallback((): boolean => {
    if (!course) return false
    return getPreviousLesson(course, state.currentModuleIndex, state.currentLessonIndex) !== null
  }, [course, state.currentModuleIndex, state.currentLessonIndex])

  // Get course completion percentage
  const getCourseCompletionPercentage = useCallback((): number => {
    if (!course || !courseProgress) return 0

    const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0)
    const completedCount = state.completedLessons.size
    return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  }, [course, courseProgress, state.completedLessons])

  return {
    // State
    currentModuleIndex: state.currentModuleIndex,
    currentLessonIndex: state.currentLessonIndex,
    completedLessons: state.completedLessons,
    accessibleLessons: state.accessibleLessons,
    isAutoAdvancing: state.isAutoAdvancing,
    courseProgress,
    loading,

    // Actions
    navigateToLesson,
    navigateToNext,
    navigateToPrevious,
    markLessonCompleted,

    // Getters
    getCurrentLesson,
    isLessonAccessible,
    isLessonCompleted,
    hasNextLesson,
    hasPreviousLesson,
    getCourseCompletionPercentage
  }
}
