"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { useNotesFn } from "@/services/notes/hook"
import { useCoursesFn } from "@/services/courses/hook"
import { useToast } from "@/hooks/use-toast"
import { 
  StickyNote, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  BookOpen,
  Loader2,
  Tag
} from "lucide-react"

export default function StudentNotesPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const { courses } = useCoursesFn()
  const { notes, loading, error, create, update, delete: deleteNote, search } = useNotesFn(user?.email || "")
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    course_id: "none",
    tags: [] as string[],
    is_public: false
  })
  
  const [editingNote, setEditingNote] = useState({
    id: "",
    title: "",
    content: "",
    course_id: "none",
    tags: [] as string[],
    is_public: false
  })

  // Filter notes based on selections
  const filteredNotes = notes.filter(note => {
    if (selectedCourse !== "all" && note.course_id !== selectedCourse) return false
    if (selectedVisibility === "public" && !note.is_public) return false
    if (selectedVisibility === "private" && note.is_public) return false
    return true
  })

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      search(searchQuery)
    }
  }, [searchQuery, search])

  async function handleCreateNote() {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" })
      return
    }

    try {
      await create({
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        course_id: newNote.course_id === "none" ? undefined : newNote.course_id,
        tags: newNote.tags,
        is_public: newNote.is_public
      })
      
      setNewNote({
        title: "",
        content: "",
        course_id: "none",
        tags: [],
        is_public: false
      })
      setCreateOpen(false)
      toast({ title: "Note created successfully" })
    } catch (error: any) {
      toast({ title: "Failed to create note", description: error.message, variant: "destructive" })
    }
  }

  async function handleUpdateNote() {
    if (!editingNote.title.trim() || !editingNote.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" })
      return
    }

    try {
      await update(editingNote.id, {
        title: editingNote.title.trim(),
        content: editingNote.content.trim(),
        course_id: editingNote.course_id === "none" ? undefined : editingNote.course_id,
        tags: editingNote.tags,
        is_public: editingNote.is_public
      })
      
      setEditOpen(null)
      toast({ title: "Note updated successfully" })
    } catch (error: any) {
      toast({ title: "Failed to update note", description: error.message, variant: "destructive" })
    }
  }

  async function handleDeleteNote(id: string) {
    if (!confirm("Are you sure you want to delete this note?")) return
    
    try {
      await deleteNote(id)
      toast({ title: "Note deleted successfully" })
    } catch (error: any) {
      toast({ title: "Failed to delete note", description: error.message, variant: "destructive" })
    }
  }

  function openEditDialog(note: any) {
    setEditingNote({
      id: note.id,
      title: note.title,
      content: note.content,
      course_id: note.course_id || "none",
      tags: note.tags || [],
      is_public: note.is_public
    })
    setEditOpen(note.id)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">My Notes</h1>
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            <span className="ml-2 text-slate-300">Loading notes...</span>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">My Notes</h1>
        <GlassCard className="p-6">
          <div className="text-red-300">Error loading notes: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-semibold">My Notes</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter note title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full min-h-32 rounded-md border bg-white/5 border-white/10 text-white p-3 resize-none"
                  placeholder="Write your note content..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="course">Course (optional)</Label>
                <Select value={newNote.course_id} onValueChange={(value) => setNewNote(prev => ({ ...prev, course_id: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-white border-white/10">
                    <SelectItem value="none">No course</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newNote.is_public}
                  onChange={(e) => setNewNote(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-white/20"
                />
                <Label htmlFor="public" className="text-sm">Make this note public</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setCreateOpen(false)} className="bg-white/10 text-white hover:bg-white/20">
                  Cancel
                </Button>
                <Button onClick={handleCreateNote} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                  Create Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 text-white border-white/10">
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All notes" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 text-white border-white/10">
              <SelectItem value="all">All notes</SelectItem>
              <SelectItem value="public">Public notes</SelectItem>
              <SelectItem value="private">Private notes</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-slate-400 text-sm flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {filteredNotes.length} notes
          </div>
        </div>
      </GlassCard>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <GlassCard className="p-6">
          <div className="text-center space-y-4">
            <StickyNote className="mx-auto h-12 w-12 text-slate-400" />
            <div className="text-slate-300">No notes found</div>
            <div className="text-slate-400 text-sm">
              {searchQuery ? "Try adjusting your search terms" : "Create your first note to get started"}
            </div>
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <GlassCard key={note.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-white font-medium line-clamp-2">{note.title}</h3>
                  <div className="flex items-center space-x-1">
                    {note.is_public ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
                
                <p className="text-slate-300 text-sm line-clamp-3">{note.content}</p>
                
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                  </div>
                  {note.course_id && (
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{note.courses?.title || "Unknown course"}</span>
                    </div>
                  )}
                </div>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, index) => {
                      // Extract meaningful information from tags
                      let displayText = tag
                      let badgeColor = "bg-white/10 text-slate-200"
                      
                      if (tag.startsWith('lesson-')) {
                        displayText = note.lessons?.title || 'Lesson'
                        badgeColor = "bg-blue-500/20 text-blue-200"
                      } else if (tag.startsWith('course-')) {
                        displayText = note.courses?.title || 'Course'
                        badgeColor = "bg-green-500/20 text-green-200"
                      }
                      
                      return (
                        <Badge key={index} variant="secondary" className={`${badgeColor} border-white/10 text-xs`}>
                          <Tag className="mr-1 h-3 w-3" />
                          {displayText}
                        </Badge>
                      )
                    })}
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditDialog(note)}
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDeleteNote(note.id)}
                    className="bg-red-500/20 text-red-100 hover:bg-red-500/30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Edit Note Dialog */}
      <Dialog open={!!editOpen} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editingNote.title}
                onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter note title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <textarea
                id="edit-content"
                value={editingNote.content}
                onChange={(e) => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                className="w-full min-h-32 rounded-md border bg-white/5 border-white/10 text-white p-3 resize-none"
                placeholder="Write your note content..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-course">Course (optional)</Label>
              <Select value={editingNote.course_id} onValueChange={(value) => setEditingNote(prev => ({ ...prev, course_id: value }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="none">No course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-public"
                checked={editingNote.is_public}
                onChange={(e) => setEditingNote(prev => ({ ...prev, is_public: e.target.checked }))}
                className="rounded border-white/20"
              />
              <Label htmlFor="edit-public" className="text-sm">Make this note public</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setEditOpen(null)} className="bg-white/10 text-white hover:bg-white/20">
                Cancel
              </Button>
              <Button onClick={handleUpdateNote} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                Update Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 