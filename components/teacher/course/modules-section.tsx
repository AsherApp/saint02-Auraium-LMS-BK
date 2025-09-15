"use client"

import React, { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, BookOpen } from "lucide-react"
import { useModulesByCourse } from "@/services/modules/hook"

interface ModulesSectionProps {
  courseId: string
}

export function ModulesSection({ courseId }: ModulesSectionProps) {
  const [showAddModule, setShowAddModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const { toast } = useToast()
  
  const { modules, loading, createModule, deleteModule } = useModulesByCourse(courseId)

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim()) {
      toast({
        title: "Error",
        description: "Module title is required",
        variant: "destructive"
      })
      return
    }

    try {
      await createModule({
        course_id: courseId,
        title: newModuleTitle,
        description: newModuleDescription,
        order_index: modules.length + 1
      })
      
      setNewModuleTitle("")
      setNewModuleDescription("")
      setShowAddModule(false)
      
      toast({
        title: "Success",
        description: "Module created successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create module",
        variant: "destructive"
      })
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule(moduleId)
      toast({
        title: "Success",
        description: "Module deleted successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-400" />
          Course Modules
        </h2>
        <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-300">Module Title</Label>
                <Input
                  id="title"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter module title"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-slate-300">Description</Label>
                <Textarea
                  id="description"
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter module description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModule(false)}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateModule} className="bg-blue-600 hover:bg-blue-700">
                  Create Module
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No modules created yet</p>
            <p className="text-sm text-slate-500">Create your first module to get started</p>
          </div>
        ) : (
          modules.map((module) => (
            <div
              key={module.id}
              className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{module.title}</h3>
                  <p className="text-sm text-slate-400">{module.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteModule(module.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}
