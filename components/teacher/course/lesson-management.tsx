import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LessonIcon } from "./lesson-icon"
import { Plus, Trash2, Pencil, PlayCircle } from "lucide-react"

interface Lesson {
  id: string
  title: string
  type: "video" | "quiz" | "file" | "discussion" | "poll"
  description: string
  module_id: string
  order_index: number
}

interface Module {
  id: string
  title: string
}

interface LessonManagementProps {
  lessons: Lesson[]
  modules: Module[]
  selectedModuleId: string
  onSelectModule: (moduleId: string) => void
  onAddLesson: (title: string, type: string, description: string, moduleId: string) => Promise<void>
  onDeleteLesson: (id: string) => Promise<void>
  onUpdateLesson: (id: string, title: string, type: string, description: string) => Promise<void>
}

export function LessonManagement({ 
  lessons, 
  modules, 
  selectedModuleId, 
  onSelectModule, 
  onAddLesson, 
  onDeleteLesson, 
  onUpdateLesson 
}: LessonManagementProps) {
  const [lessonOpen, setLessonOpen] = useState(false)
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonType, setLessonType] = useState<"video" | "quiz" | "file" | "discussion" | "poll">("video")
  const [lessonDescription, setLessonDescription] = useState("")
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const { toast } = useToast()

  const filteredLessons = lessons.filter(lesson => lesson.module_id === selectedModuleId)

  const handleAddLesson = async () => {
    if (!lessonTitle.trim()) {
      toast({
        title: "Error",
        description: "Lesson title is required",
        variant: "destructive",
      })
      return
    }

    if (!selectedModuleId) {
      toast({
        title: "Error",
        description: "Please select a module first",
        variant: "destructive",
      })
      return
    }

    try {
      await onAddLesson(lessonTitle, lessonType, lessonDescription, selectedModuleId)
      setLessonTitle("")
      setLessonType("video")
      setLessonDescription("")
      setLessonOpen(false)
      toast({
        title: "Success",
        description: "Lesson created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lesson",
        variant: "destructive",
      })
    }
  }

  const handleUpdateLesson = async () => {
    if (!editingLesson || !lessonTitle.trim()) {
      toast({
        title: "Error",
        description: "Lesson title is required",
        variant: "destructive",
      })
      return
    }

    try {
      await onUpdateLesson(editingLesson.id, lessonTitle, lessonType, lessonDescription)
      setEditingLesson(null)
      setLessonTitle("")
      setLessonType("video")
      setLessonDescription("")
      toast({
        title: "Success",
        description: "Lesson updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lesson",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLesson = async (id: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      try {
        await onDeleteLesson(id)
        toast({
          title: "Success",
          description: "Lesson deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete lesson",
          variant: "destructive",
        })
      }
    }
  }

  const startEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonTitle(lesson.title)
    setLessonType(lesson.type)
    setLessonDescription(lesson.description)
    setLessonOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Lessons</h3>
        <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingLesson(null)
                setLessonTitle("")
                setLessonType("video")
                setLessonDescription("")
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!selectedModuleId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingLesson ? "Edit Lesson" : "Create New Lesson"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingLesson ? "Update lesson details" : "Add a new lesson to the selected module"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lessonTitle" className="text-white font-medium">Lesson Title</Label>
                <Input
                  id="lessonTitle"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200"
                  placeholder="Enter lesson title"
                />
              </div>
              <div>
                <Label htmlFor="lessonType" className="text-white font-medium">Lesson Type</Label>
                <Select value={lessonType} onValueChange={(value: any) => setLessonType(value)}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lessonDescription" className="text-white font-medium">Description</Label>
                <Textarea
                  id="lessonDescription"
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200 resize-none"
                  placeholder="Enter lesson description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setLessonOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingLesson ? handleUpdateLesson : handleAddLesson}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {editingLesson ? "Update" : "Create"} Lesson
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {modules.length > 0 && (
        <div>
          <Label className="text-white font-medium">Select Module</Label>
          <Select value={selectedModuleId} onValueChange={onSelectModule}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200">
              <SelectValue placeholder="Select a module" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {selectedModuleId 
                ? "No lessons in this module yet. Click 'Add Lesson' to create one."
                : "Select a module to view its lessons."
              }
            </p>
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <div key={lesson.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <LessonIcon type={lesson.type} />
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{lesson.title}</h4>
                    {lesson.description && (
                      <p className="text-sm text-slate-400 mt-1">{lesson.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(lesson)}
                    className="text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
