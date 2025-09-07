import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Pencil, FolderOpen } from "lucide-react"

interface Module {
  id: string
  title: string
  description: string
  order_index: number
}

interface ModuleManagementProps {
  modules: Module[]
  onAddModule: (title: string, description: string) => Promise<void>
  onDeleteModule: (id: string) => Promise<void>
  onUpdateModule: (id: string, title: string, description: string) => Promise<void>
}

export function ModuleManagement({ 
  modules, 
  onAddModule, 
  onDeleteModule, 
  onUpdateModule 
}: ModuleManagementProps) {
  const [modOpen, setModOpen] = useState(false)
  const [modTitle, setModTitle] = useState("")
  const [modDescription, setModDescription] = useState("")
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const { toast } = useToast()

  const handleAddModule = async () => {
    if (!modTitle.trim()) {
      toast({
        title: "Error",
        description: "Module title is required",
        variant: "destructive",
      })
      return
    }

    try {
      await onAddModule(modTitle, modDescription)
      setModTitle("")
      setModDescription("")
      setModOpen(false)
      toast({
        title: "Success",
        description: "Module created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create module",
        variant: "destructive",
      })
    }
  }

  const handleUpdateModule = async () => {
    if (!editingModule || !modTitle.trim()) {
      toast({
        title: "Error",
        description: "Module title is required",
        variant: "destructive",
      })
      return
    }

    try {
      await onUpdateModule(editingModule.id, modTitle, modDescription)
      setEditingModule(null)
      setModTitle("")
      setModDescription("")
      toast({
        title: "Success",
        description: "Module updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update module",
        variant: "destructive",
      })
    }
  }

  const handleDeleteModule = async (id: string) => {
    if (confirm("Are you sure you want to delete this module?")) {
      try {
        await onDeleteModule(id)
        toast({
          title: "Success",
          description: "Module deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete module",
          variant: "destructive",
        })
      }
    }
  }

  const startEdit = (module: Module) => {
    setEditingModule(module)
    setModTitle(module.title)
    setModDescription(module.description)
    setModOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Modules</h3>
        <Dialog open={modOpen} onOpenChange={setModOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingModule(null)
                setModTitle("")
                setModDescription("")
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingModule ? "Edit Module" : "Create New Module"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingModule ? "Update module details" : "Add a new module to your course"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="modTitle" className="text-white font-medium">Module Title</Label>
                <Input
                  id="modTitle"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200"
                  placeholder="Enter module title"
                />
              </div>
              <div>
                <Label htmlFor="modDescription" className="text-white font-medium">Description</Label>
                <Textarea
                  id="modDescription"
                  value={modDescription}
                  onChange={(e) => setModDescription(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200 resize-none"
                  placeholder="Enter module description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setModOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingModule ? handleUpdateModule : handleAddModule}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingModule ? "Update" : "Create"} Module
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {modules.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No modules yet. Click "Add Module" to start structuring your course.</p>
          </div>
        ) : (
          modules.map((module) => (
            <div key={module.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-medium">{module.title}</h4>
                  {module.description && (
                    <p className="text-sm text-slate-400 mt-1">{module.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(module)}
                    className="text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteModule(module.id)}
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
