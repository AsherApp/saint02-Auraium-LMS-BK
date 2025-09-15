"use client"

import { useState, useCallback } from 'react'

interface ContentCompletionState {
  videoWatched: boolean
  videoWatchTime: number
  videoDuration: number
  quizCompleted: boolean
  quizAttempts: number
  quizPassed: boolean
  quizScore: number
  contentRead: boolean
  contentReadTime: number
  fileViewed: boolean
  fileViewTime: number
}

interface ContentCompletionOptions {
  minVideoWatchPercentage?: number // Default 95%
  maxQuizAttempts?: number // Default 2
  minQuizPassScore?: number // Default 70%
  minContentReadTime?: number // Default 30 seconds
  minFileViewTime?: number // Default 10 seconds
  onContentCompleted?: (type: 'video' | 'quiz' | 'text' | 'file', score?: number) => void
}

export function useContentCompletion(options: ContentCompletionOptions = {}) {
  const {
    minVideoWatchPercentage = 95,
    maxQuizAttempts = 2,
    minQuizPassScore = 70,
    minContentReadTime = 30,
    minFileViewTime = 10,
    onContentCompleted
  } = options

  const [state, setState] = useState<ContentCompletionState>({
    videoWatched: false,
    videoWatchTime: 0,
    videoDuration: 0,
    quizCompleted: false,
    quizAttempts: 0,
    quizPassed: false,
    quizScore: 0,
    contentRead: false,
    contentReadTime: 0,
    fileViewed: false,
    fileViewTime: 0
  })

  // Video completion tracking
  const updateVideoProgress = useCallback((watchTime: number, duration: number) => {
    setState(prev => ({
      ...prev,
      videoWatchTime: watchTime,
      videoDuration: duration,
      videoWatched: duration > 0 && (watchTime / duration) * 100 >= minVideoWatchPercentage
    }))
  }, [minVideoWatchPercentage])

  const markVideoCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      videoWatched: true
    }))
    onContentCompleted?.('video')
  }, [onContentCompleted])

  // Quiz completion tracking
  const submitQuiz = useCallback((score: number, totalQuestions: number, timeTaken: number = 0) => {
    const percentage = (score / totalQuestions) * 100
    const passed = percentage >= minQuizPassScore

    setState(prev => {
      const newState = {
        ...prev,
        quizAttempts: prev.quizAttempts + 1,
        quizScore: percentage,
        quizPassed: passed,
        quizCompleted: passed || prev.quizAttempts + 1 >= maxQuizAttempts
      }
      
      // Trigger callback if quiz is completed (passed or max attempts reached)
      if (newState.quizCompleted) {
        onContentCompleted?.('quiz', percentage)
      }
      
      return newState
    })

    return {
      passed,
      canRetry: !passed && prev.quizAttempts + 1 < maxQuizAttempts,
      attemptsRemaining: maxQuizAttempts - (prev.quizAttempts + 1)
    }
  }, [minQuizPassScore, maxQuizAttempts, onContentCompleted])

  const resetQuiz = useCallback(() => {
    setState(prev => ({
      ...prev,
      quizCompleted: false,
      quizPassed: false,
      quizScore: 0
    }))
  }, [])

  // Content reading tracking
  const updateContentReadTime = useCallback((readTime: number) => {
    setState(prev => ({
      ...prev,
      contentReadTime: readTime,
      contentRead: readTime >= minContentReadTime
    }))
  }, [minContentReadTime])

  const markContentRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      contentRead: true
    }))
    onContentCompleted?.('text')
  }, [onContentCompleted])

  // File viewing tracking
  const updateFileViewTime = useCallback((viewTime: number) => {
    setState(prev => ({
      ...prev,
      fileViewTime: viewTime,
      fileViewed: viewTime >= minFileViewTime
    }))
  }, [minFileViewTime])

  const markFileViewed = useCallback(() => {
    setState(prev => ({
      ...prev,
      fileViewed: true
    }))
    onContentCompleted?.('file')
  }, [onContentCompleted])

  // Check if content type is completed based on lesson type
  const isContentCompleted = useCallback((lessonType: string, lessonContent: any): boolean => {
    switch (lessonType) {
      case 'video':
        return state.videoWatched

      case 'quiz':
        return state.quizCompleted && state.quizPassed

      case 'text':
      case 'content':
        return state.contentRead

      case 'file':
      case 'document':
        return state.fileViewed

      default:
        // For mixed content, check if any content is available and completed
        if (lessonContent?.video?.url) {
          return state.videoWatched
        }
        if (lessonContent?.quiz?.questions || lessonContent?.quiz_questions) {
          return state.quizCompleted && state.quizPassed
        }
        if (lessonContent?.text_content) {
          return state.contentRead
        }
        if (lessonContent?.file_url || lessonContent?.file?.url || lessonContent?.files) {
          return state.fileViewed
        }
        return false
    }
  }, [state])

  // Get completion requirements for a lesson
  const getCompletionRequirements = useCallback((lessonType: string, lessonContent: any) => {
    const requirements = []

    switch (lessonType) {
      case 'video':
        requirements.push({
          type: 'video',
          description: `Watch at least ${minVideoWatchPercentage}% of the video`,
          completed: state.videoWatched,
          progress: state.videoDuration > 0 ? Math.min((state.videoWatchTime / state.videoDuration) * 100, 100) : 0
        })
        break

      case 'quiz':
        requirements.push({
          type: 'quiz',
          description: `Pass the quiz with at least ${minQuizPassScore}% score`,
          completed: state.quizCompleted && state.quizPassed,
          progress: state.quizScore,
          attempts: state.quizAttempts,
          maxAttempts: maxQuizAttempts
        })
        break

      case 'text':
      case 'content':
        requirements.push({
          type: 'text',
          description: `Read content for at least ${minContentReadTime} seconds`,
          completed: state.contentRead,
          progress: Math.min((state.contentReadTime / minContentReadTime) * 100, 100)
        })
        break

      case 'file':
      case 'document':
        requirements.push({
          type: 'file',
          description: `View file for at least ${minFileViewTime} seconds`,
          completed: state.fileViewed,
          progress: Math.min((state.fileViewTime / minFileViewTime) * 100, 100)
        })
        break

      default:
        // Mixed content
        if (lessonContent?.video?.url) {
          requirements.push({
            type: 'video',
            description: `Watch at least ${minVideoWatchPercentage}% of the video`,
            completed: state.videoWatched,
            progress: state.videoDuration > 0 ? Math.min((state.videoWatchTime / state.videoDuration) * 100, 100) : 0
          })
        }
        if (lessonContent?.quiz?.questions || lessonContent?.quiz_questions) {
          requirements.push({
            type: 'quiz',
            description: `Pass the quiz with at least ${minQuizPassScore}% score`,
            completed: state.quizCompleted && state.quizPassed,
            progress: state.quizScore,
            attempts: state.quizAttempts,
            maxAttempts: maxQuizAttempts
          })
        }
        if (lessonContent?.text_content) {
          requirements.push({
            type: 'text',
            description: `Read content for at least ${minContentReadTime} seconds`,
            completed: state.contentRead,
            progress: Math.min((state.contentReadTime / minContentReadTime) * 100, 100)
          })
        }
        if (lessonContent?.file_url || lessonContent?.file?.url || lessonContent?.files) {
          requirements.push({
            type: 'file',
            description: `View file for at least ${minFileViewTime} seconds`,
            completed: state.fileViewed,
            progress: Math.min((state.fileViewTime / minFileViewTime) * 100, 100)
          })
        }
    }

    return requirements
  }, [state, minVideoWatchPercentage, minQuizPassScore, minContentReadTime, minFileViewTime, maxQuizAttempts])

  // Reset all completion state
  const resetCompletion = useCallback(() => {
    setState({
      videoWatched: false,
      videoWatchTime: 0,
      videoDuration: 0,
      quizCompleted: false,
      quizAttempts: 0,
      quizPassed: false,
      quizScore: 0,
      contentRead: false,
      contentReadTime: 0,
      fileViewed: false,
      fileViewTime: 0
    })
  }, [])

  return {
    // State
    ...state,
    maxQuizAttempts,

    // Actions
    updateVideoProgress,
    markVideoCompleted,
    submitQuiz,
    resetQuiz,
    updateContentReadTime,
    markContentRead,
    updateFileViewTime,
    markFileViewed,
    resetCompletion,

    // Getters
    isContentCompleted,
    getCompletionRequirements
  }
}
