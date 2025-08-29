"use client"
import { useState, useEffect, useCallback } from 'react'
import { 
  listLiveNotes, createLiveNote, updateLiveNote, deleteLiveNote,
  listLiveQuizzes, createLiveQuiz, updateLiveQuiz, deleteLiveQuiz, submitQuizAnswer,
  listLivePolls, createLivePoll, updateLivePoll, deleteLivePoll, submitPollResponse,
  listLiveClasswork, createLiveClasswork, updateLiveClasswork, deleteLiveClasswork, submitClasswork,
  type LiveNote, type LiveQuiz, type LivePoll, type LiveClasswork
} from './api'

export function useLiveActivitiesFn(sessionId: string) {
  const [notes, setNotes] = useState<LiveNote[]>([])
  const [quizzes, setQuizzes] = useState<LiveQuiz[]>([])
  const [polls, setPolls] = useState<LivePoll[]>([])
  const [classwork, setClasswork] = useState<LiveClasswork[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllActivities = useCallback(async () => {
    if (!sessionId) return
    
    setLoading(true)
    setError(null)
    try {
      const [notesRes, quizzesRes, pollsRes, classworkRes] = await Promise.all([
        listLiveNotes(sessionId),
        listLiveQuizzes(sessionId),
        listLivePolls(sessionId),
        listLiveClasswork(sessionId)
      ])
      
      setNotes(notesRes.items)
      setQuizzes(quizzesRes.items)
      setPolls(pollsRes.items)
      setClasswork(classworkRes.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch live activities")
      setNotes([])
      setQuizzes([])
      setPolls([])
      setClasswork([])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchAllActivities()
  }, [fetchAllActivities])

  // Notes operations
  const createNote = useCallback(async (data: Omit<LiveNote, 'id' | 'session_id' | 'created_at' | 'updated_at'>) => {
    if (!sessionId) throw new Error("No session ID")
    
    setError(null)
    try {
      const newNote = await createLiveNote(sessionId, data)
      setNotes(prev => [newNote, ...prev])
      return newNote
    } catch (err: any) {
      setError(err.message || "Failed to create note")
      throw err
    }
  }, [sessionId])

  const updateNote = useCallback(async (noteId: string, data: Partial<Omit<LiveNote, 'id' | 'session_id' | 'created_by' | 'created_at' | 'updated_at'>>) => {
    setError(null)
    try {
      const updatedNote = await updateLiveNote(noteId, data)
      setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note))
      return updatedNote
    } catch (err: any) {
      setError(err.message || "Failed to update note")
      throw err
    }
  }, [])

  const deleteNote = useCallback(async (noteId: string) => {
    setError(null)
    try {
      await deleteLiveNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (err: any) {
      setError(err.message || "Failed to delete note")
      throw err
    }
  }, [])

  // Quiz operations
  const createQuiz = useCallback(async (data: Omit<LiveQuiz, 'id' | 'session_id' | 'created_at' | 'updated_at'>) => {
    if (!sessionId) throw new Error("No session ID")
    
    setError(null)
    try {
      const newQuiz = await createLiveQuiz(sessionId, data)
      setQuizzes(prev => [newQuiz, ...prev])
      return newQuiz
    } catch (err: any) {
      setError(err.message || "Failed to create quiz")
      throw err
    }
  }, [sessionId])

  const updateQuiz = useCallback(async (quizId: string, data: Partial<Omit<LiveQuiz, 'id' | 'session_id' | 'created_by' | 'created_at' | 'updated_at'>>) => {
    setError(null)
    try {
      const updatedQuiz = await updateLiveQuiz(quizId, data)
      setQuizzes(prev => prev.map(quiz => quiz.id === quizId ? updatedQuiz : quiz))
      return updatedQuiz
    } catch (err: any) {
      setError(err.message || "Failed to update quiz")
      throw err
    }
  }, [])

  const deleteQuiz = useCallback(async (quizId: string) => {
    setError(null)
    try {
      await deleteLiveQuiz(quizId)
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
    } catch (err: any) {
      setError(err.message || "Failed to delete quiz")
      throw err
    }
  }, [])

  const submitQuizAnswerFn = useCallback(async (quizId: string, questionId: string, answer: string) => {
    setError(null)
    try {
      await submitQuizAnswer(quizId, questionId, answer)
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz answer")
      throw err
    }
  }, [])

  // Poll operations
  const createPoll = useCallback(async (data: Omit<LivePoll, 'id' | 'session_id' | 'responses' | 'created_at' | 'updated_at'>) => {
    if (!sessionId) throw new Error("No session ID")
    
    setError(null)
    try {
      const newPoll = await createLivePoll(sessionId, data)
      setPolls(prev => [newPoll, ...prev])
      return newPoll
    } catch (err: any) {
      setError(err.message || "Failed to create poll")
      throw err
    }
  }, [sessionId])

  const updatePoll = useCallback(async (pollId: string, data: Partial<Omit<LivePoll, 'id' | 'session_id' | 'responses' | 'created_by' | 'created_at' | 'updated_at'>>) => {
    setError(null)
    try {
      const updatedPoll = await updateLivePoll(pollId, data)
      setPolls(prev => prev.map(poll => poll.id === pollId ? updatedPoll : poll))
      return updatedPoll
    } catch (err: any) {
      setError(err.message || "Failed to update poll")
      throw err
    }
  }, [])

  const deletePoll = useCallback(async (pollId: string) => {
    setError(null)
    try {
      await deleteLivePoll(pollId)
      setPolls(prev => prev.filter(poll => poll.id !== pollId))
    } catch (err: any) {
      setError(err.message || "Failed to delete poll")
      throw err
    }
  }, [])

  const submitPollResponseFn = useCallback(async (pollId: string, optionIndex: number) => {
    setError(null)
    try {
      await submitPollResponse(pollId, optionIndex)
      // Refresh polls to get updated response data
      const pollsRes = await listLivePolls(sessionId)
      setPolls(pollsRes.items)
    } catch (err: any) {
      setError(err.message || "Failed to submit poll response")
      throw err
    }
  }, [sessionId])

  // Classwork operations
  const createClassworkItem = useCallback(async (data: Omit<LiveClasswork, 'id' | 'session_id' | 'submissions' | 'created_at' | 'updated_at'>) => {
    if (!sessionId) throw new Error("No session ID")
    
    setError(null)
    try {
      const newClasswork = await createLiveClasswork(sessionId, data)
      setClasswork(prev => [newClasswork, ...prev])
      return newClasswork
    } catch (err: any) {
      setError(err.message || "Failed to create classwork")
      throw err
    }
  }, [sessionId])

  const updateClassworkItem = useCallback(async (classworkId: string, data: Partial<Omit<LiveClasswork, 'id' | 'session_id' | 'submissions' | 'created_by' | 'created_at' | 'updated_at'>>) => {
    setError(null)
    try {
      const updatedClasswork = await updateLiveClasswork(classworkId, data)
      setClasswork(prev => prev.map(item => item.id === classworkId ? updatedClasswork : item))
      return updatedClasswork
    } catch (err: any) {
      setError(err.message || "Failed to update classwork")
      throw err
    }
  }, [])

  const deleteClassworkItem = useCallback(async (classworkId: string) => {
    setError(null)
    try {
      await deleteLiveClasswork(classworkId)
      setClasswork(prev => prev.filter(item => item.id !== classworkId))
    } catch (err: any) {
      setError(err.message || "Failed to delete classwork")
      throw err
    }
  }, [])

  const submitClassworkFn = useCallback(async (classworkId: string, content: string) => {
    setError(null)
    try {
      await submitClasswork(classworkId, content)
      // Refresh classwork to get updated submission data
      const classworkRes = await listLiveClasswork(sessionId)
      setClasswork(classworkRes.items)
    } catch (err: any) {
      setError(err.message || "Failed to submit classwork")
      throw err
    }
  }, [sessionId])

  return {
    // State
    notes,
    quizzes,
    polls,
    classwork,
    loading,
    error,
    
    // Actions
    refresh: fetchAllActivities,
    
    // Notes
    createNote,
    updateNote,
    deleteNote,
    
    // Quizzes
    createQuiz,
    updateQuiz,
    deleteQuiz,
    submitQuizAnswer: submitQuizAnswerFn,
    
    // Polls
    createPoll,
    updatePoll,
    deletePoll,
    submitPollResponse: submitPollResponseFn,
    
    // Classwork
    createClasswork: createClassworkItem,
    updateClasswork: updateClassworkItem,
    deleteClasswork: deleteClassworkItem,
    submitClasswork: submitClassworkFn,
  }
} 