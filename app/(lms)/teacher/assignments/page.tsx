"use client"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AnimationWrapper, StaggeredAnimationWrapper } from "@/components/shared/animation-wrapper"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Copy, 
  Trash2,
  Clock,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Eye,
  Users,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { useAssignments } from "@/services/assignments/hook"
import { type Assignment } from "@/services/assignments/api"
import { AssignmentCreator } from "@/components/teacher/assignment-creator"

export default function TeacherAssignmentsPage() {
  // State Management - Using Real API
  const { assignments, loading, error, createAssignment, updateAssignment, deleteAssignment } = useAssignments()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "pending" | "graded" | "overdue">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.course_title || assignment.course_id).toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    switch (filterType) {
      case "pending":
        matchesFilter = (assignment.submission_count || 0) > (assignment.graded_count || 0)
        break
      case "graded":
        matchesFilter = (assignment.graded_count || 0) > 0
        break
      case "overdue":
        matchesFilter = !!(assignment.due_at && new Date(assignment.due_at) < new Date())
        break
      default:
        matchesFilter = true
    }
    
    return matchesSearch && matchesFilter
  })

  // Helper Functions
  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-5 w-5 text-blue-400" />
      case 'project': return <BarChart3 className="h-5 w-5 text-green-400" />
      case 'quiz': return <CheckCircle2 className="h-5 w-5 text-purple-400" />
      case 'discussion': return <Users className="h-5 w-5 text-orange-400" />
      case 'presentation': return <Eye className="h-5 w-5 text-indigo-400" />
      case 'code_submission': return <FileText className="h-5 w-5 text-emerald-400" />
      case 'peer_review': return <Users className="h-5 w-5 text-pink-400" />
      case 'file_upload': return <FileText className="h-5 w-5 text-cyan-400" />
      default: return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.due_at && new Date(assignment.due_at) < new Date()) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
    } else if ((assignment.submission_count || 0) > (assignment.graded_count || 0)) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Needs Grading</Badge>
    } else if ((assignment.submission_count || 0) > 0) {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Complete</Badge>
    } else {
      return <Badge variant="outline" className="border-slate-500 text-slate-400">Active</Badge>
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimationWrapper>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Assignments</h1>
            <p className="text-slate-400">Manage and track all your course assignments</p>
          </div>
          <Dialog  open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white sm:max-w-[1200px] w-[95vw] max-h-[95vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-white">Create New Assignment</DialogTitle>
                <p className="text-slate-400 text-sm">Create a new assignment for your students</p>
              </DialogHeader>
              <AssignmentCreator 
                onSave={async (data) => {
                  try {
                    await createAssignment(data)
                    setShowCreateDialog(false)
                  } catch (error) {
                    console.error('Failed to create assignment:', error)
                  }
                }}
                onCancel={() => setShowCreateDialog(false)}
                onClose={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </AnimationWrapper>

      {/* Main Navigation */}
      <AnimationWrapper delay={0.1}>
        <div className="flex justify-center">
          <div className="bg-white/5 rounded-lg p-1">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-md">
              <FileText className="h-4 w-4" />
              <span>Assignments</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {assignments.length}
              </Badge>
            </div>
          </div>
        </div>
      </AnimationWrapper>

      {/* Assignments Content */}
      <div className="space-y-6">
          {/* Search and Filters */}
          <AnimationWrapper delay={0.2}>
            <GlassCard className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search assignments or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "pending", "graded", "overdue"].map((filter) => (
                    <Button
                      key={filter}
                      variant={filterType === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilterType(filter as any)}
                      className={filterType === filter ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </AnimationWrapper>

          {/* Assignments Grid */}
          {filteredAssignments.length === 0 ? (
            <AnimationWrapper delay={0.3}>
              <GlassCard className="p-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No assignments found</h3>
                  <p className="text-slate-400">Try adjusting your search or filter criteria</p>
                </div>
              </GlassCard>
            </AnimationWrapper>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAssignments.map((assignment, index) => (
                <AnimationWrapper key={assignment.id} delay={index * 0.1}>
                  <GlassCard className="p-5 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate mb-1">
                            {assignment.title}
                          </h3>
                          <p className="text-xs text-slate-400">Course: {assignment.course_title || assignment.course_id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(assignment)}
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-1">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Assignment Type */}
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/10 rounded-lg">
                          {getAssignmentIcon(assignment.type)}
                        </div>
                        <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                          {assignment.type}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {assignment.description}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-white">
                            {assignment.submission_count || 0}
                          </div>
                          <div className="text-xs text-slate-400">Submissions</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-orange-400">
                            {(assignment.submission_count || 0) - (assignment.graded_count || 0)}
                          </div>
                          <div className="text-xs text-slate-400">Pending</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-green-400">
                            {assignment.avg_grade ? assignment.avg_grade.toFixed(1) : '0.0'}
                          </div>
                          <div className="text-xs text-slate-400">Avg Grade</div>
                        </div>
                      </div>

                      {/* Due Date */}
                      {assignment.due_at && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`/teacher/assignment/${assignment.id}`} className="flex-1">
                          <Button size="sm" className="w-full bg-blue-600/80 hover:bg-blue-600 text-white">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </AnimationWrapper>
              ))}
            </div>
          )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assignments - Circular */}
        <AnimationWrapper delay={0.1}>
          <GlassCard className="p-6 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{assignments.length}</div>
            <div className="text-sm text-slate-400">Total Assignments</div>
          </GlassCard>
        </AnimationWrapper>
        
        {/* Pending Grading - Rectangular with icon */}
        <AnimationWrapper delay={0.2}>
          <GlassCard className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {assignments.reduce((sum, a) => sum + ((a.submission_count || 0) - (a.graded_count || 0)), 0)}
                </div>
                <div className="text-sm text-slate-400">Pending Grading</div>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>
        
        {/* Total Submissions - Circular */}
        <AnimationWrapper delay={0.3}>
          <GlassCard className="p-6 text-center hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Users className="h-8 w-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              {assignments.reduce((sum, a) => sum + (a.submission_count || 0), 0)}
            </div>
            <div className="text-sm text-slate-400">Total Submissions</div>
          </GlassCard>
        </AnimationWrapper>
        
        {/* Overdue - Rectangular with warning */}
        <AnimationWrapper delay={0.4}>
          <GlassCard className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {assignments.filter(a => a.due_at && new Date(a.due_at) < new Date()).length}
                </div>
                <div className="text-sm text-slate-400">Overdue</div>
              </div>
            </div>
          </GlassCard>
        </AnimationWrapper>
      </div>
    </div>
  )
}