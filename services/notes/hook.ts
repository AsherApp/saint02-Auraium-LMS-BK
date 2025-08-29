"use client"
import { useState, useEffect, useCallback } from 'react'
import { listNotes, getNote, createNote, updateNote, deleteNote, searchNotes, type Note } from './api'

export function useNotesFn(userId: string, filters?: { course_id?: string; lesson_id?: string; is_public?: boolean }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await listNotes(userId, filters)
      setNotes(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to fetch notes")
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [userId, filters])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const create = useCallback(async (data: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId) throw new Error("No user ID")
    
    setError(null)
    try {
      const newNote = await createNote({ ...data, user_email: userId })
      setNotes(prev => [newNote, ...prev])
      return newNote
    } catch (err: any) {
      setError(err.message || "Failed to create note")
      throw err
    }
  }, [userId])

  const update = useCallback(async (id: string, data: Partial<Omit<Note, 'id' | 'user_email' | 'created_at' | 'updated_at'>>) => {
    setError(null)
    try {
      const updatedNote = await updateNote(id, data)
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note))
      return updatedNote
    } catch (err: any) {
      setError(err.message || "Failed to update note")
      throw err
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    setError(null)
    try {
      await deleteNote(id)
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (err: any) {
      setError(err.message || "Failed to delete note")
      throw err
    }
  }, [])

  const search = useCallback(async (query: string) => {
    if (!userId || !query.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await searchNotes(userId, query)
      setNotes(response.items)
    } catch (err: any) {
      setError(err.message || "Failed to search notes")
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  return {
    notes,
    loading,
    error,
    refresh: fetchNotes,
    create,
    update,
    delete: remove,
    search,
  }
}

export function useNoteDetailFn(noteId: string) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNote = useCallback(async () => {
    if (!noteId) return
    
    setLoading(true)
    setError(null)
    try {
      const noteData = await getNote(noteId)
      setNote(noteData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch note")
      setNote(null)
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    fetchNote()
  }, [fetchNote])

  return {
    note,
    loading,
    error,
    refresh: fetchNote,
  }
} 