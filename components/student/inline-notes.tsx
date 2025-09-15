"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
// Removed Framer Motion import to fix module resolution issues
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/hooks/use-toast"
import * as notesApi from "@/services/notes/api"
import {
  StickyNote,
  Save,
  X,
  Edit3,
  BookOpen,
  Clock,
  Tag,
  Plus,
  Trash2
} from "lucide-react"

interface InlineNotesProps {
  courseId: string
  lessonId: string
  lessonTitle: string
  className?: string
}

interface Note {
  id: string
  title: string
  content: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export function InlineNotes({ courseId, lessonId, lessonTitle, className }: InlineNotesProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch notes for this lesson
  useEffect(() => {
    if (isExpanded && user?.email) {
      fetchNotes()
    }
  }, [isExpanded, courseId, lessonId, user?.email])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await notesApi.listNotes(user?.email || '', {
        course_id: courseId,
        lesson_id: lessonId
      })
      setNotes(response.items || [])
    } catch (error) {
      console.error('Failed to fetch notes:', error)
      toast({
        title: "Failed to load notes",
        description: "Could not load your notes for this lesson.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your note.",
        variant: "destructive"
      })
      return
    }

    try {
      const note = await notesApi.createNote({
        user_email: user?.email || '',
        course_id: courseId,
        lesson_id: lessonId,
        title: newNote.title,
        content: newNote.content,
        tags: [`lesson-${lessonId}`, `course-${courseId}`],
        is_public: false
      })

      setNotes(prev => [note, ...prev])
      setNewNote({ title: "", content: "" })
      setIsCreating(false)
      
      toast({
        title: "Note saved",
        description: "Your note has been saved and will appear in your notes page."
      })
    } catch (error) {
      console.error('Failed to create note:', error)
      toast({
        title: "Failed to save note",
        description: "Could not save your note. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateNote = async (noteId: string, title: string, content: string) => {
    try {
      const updatedNote = await notesApi.updateNote(noteId, {
        title,
        content
      })

      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ))
      setEditingNote(null)
      
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully."
      })
    } catch (error) {
      console.error('Failed to update note:', error)
      toast({
        title: "Failed to update note",
        description: "Could not update your note. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await notesApi.deleteNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
      
      toast({
        title: "Note deleted",
        description: "Your note has been deleted."
      })
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast({
        title: "Failed to delete note",
        description: "Could not delete your note. Please try again.",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={className}>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <StickyNote className="h-4 w-4 mr-2" />
        Notes ({notes.length})
        {isExpanded ? <X className="h-4 w-4 ml-2" /> : <Edit3 className="h-4 w-4 ml-2" />}
      </Button>

      {/* Notes Panel */}
      {isExpanded && (
        <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-4 transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Notes for {lessonTitle}
              </h3>
              <Button
                size="sm"
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Note
              </Button>
            </div>

            {/* Create Note Form */}
            {isCreating && (
              <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10 transition-all duration-300 ease-in-out">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Note title..."
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400"
                    />
                    <Textarea
                      ref={textareaRef}
                      placeholder="Write your note here..."
                      value={newNote.content}
                      onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                      className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateNote}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Note
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsCreating(false)
                          setNewNote({ title: "", content: "" })
                        }}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            {/* Notes List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-slate-400">
                  Loading notes...
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No notes yet for this lesson.</p>
                  <p className="text-sm">Click "New Note" to get started!</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 transition-all duration-300 ease-in-out"
                  >
                    {editingNote === note.id ? (
                      <EditNoteForm
                        note={note}
                        onSave={(title, content) => handleUpdateNote(note.id, title, content)}
                        onCancel={() => setEditingNote(null)}
                      />
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-medium">{note.title}</h4>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNote(note.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNote(note.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm mb-2 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(note.updated_at)}</span>
                          {note.tags && note.tags.length > 0 && (
                            <>
                              <Tag className="h-3 w-3 ml-2" />
                              <Badge variant="secondary" className="text-xs">
                                {note.tags.length} tags
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
    </div>
  )
}

// Edit Note Form Component
interface EditNoteFormProps {
  note: Note
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

function EditNoteForm({ note, onSave, onCancel }: EditNoteFormProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] bg-white/5 border-white/10 text-white"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(title, content)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
