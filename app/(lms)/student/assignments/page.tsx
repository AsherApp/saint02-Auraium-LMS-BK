"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { AnimationWrapper, StaggeredAnimationWrapper } from "@/components/shared/animation-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth-store"
import { useSimplifiedAssignments } from "@/hooks/use-simplified-assignments"
import { type Assignment } from "@/services/assignments/api"
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  BarChart3,
  Eye,
  Edit,
  Settings
} from "lucide-react"

type AssignmentWithSubmission = Assignment & {
  course_title?: string
  course_description?: string
}

export default function StudentAssignmentsPage() {
  const { user } = useAuthStore()
  const { assignments: allAssignments, loading, error, refreshAssignments } = useSimplifiedAssignments()
  const [courses, setCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([])
  const [progressData, setProgressData] = useState<any>(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "submitted" | "overdue">("all")
  const [activeTab, setActiveTab] = useState("assignments")

  // Process assignments from simplified API
  useEffect(() => {
    const processAssignments = () => {
      if (!allAssignments.length) return

      try {
        // The simplified API already provides processed assignments with submission data
        setAssignments(allAssignments)
      } catch (error) {
        console.error('Error processing assignments:', error)
      }
    }

    processAssignments()
  }, [allAssignments])

  useEffect(() => {
    if (activeTab === "progress") {
      setProgressLoading(true)
      // Calculate real progress data from assignments
      const realProgressData = {
        totalAssignments: assignments.length,
        completedAssignments: assignments.filter(a => a.is_submitted).length,
        gradedAssignments: assignments.filter(a => a.is_graded).length,
        averageGrade: assignments.filter(a => a.student_submission?.grade).length > 0 
          ? Math.round(assignments.filter(a => a.student_submission?.grade)
              .reduce((sum, a) => sum + (a.student_submission?.grade || 0), 0) / 
              assignments.filter(a => a.student_submission?.grade).length)
          : 0,
        recentActivity: assignments
          .filter(a => a.is_submitted)
          .sort((a, b) => new Date(b.student_submission?.submitted_at || b.created_at).getTime() - new Date(a.student_submission?.submitted_at || a.created_at).getTime())
          .slice(0, 5)
          .map(a => ({
            type: a.is_graded ? 'grade' : 'submission',
            assignment: a.title,
            grade: a.student_submission?.grade || null,
            date: a.student_submission?.submitted_at || a.created_at
          }))
      }
      setProgressData(realProgressData)
      setProgressLoading(false)
    }
  }, [activeTab, assignments])

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    switch (filterStatus) {
      case "pending":
        matchesFilter = !assignment.is_submitted
        break
      case "submitted":
        matchesFilter = !!assignment.is_submitted && !assignment.is_graded
        break
      case "overdue":
        matchesFilter = !!assignment.is_overdue && !assignment.is_submitted
        break
      default:
        matchesFilter = true
    }
    
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (assignment: AssignmentWithSubmission) => {
    if (assignment.is_graded) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
    } else if (assignment.is_submitted) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
    } else if (assignment.is_overdue) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
    } else if (!assignment.is_available) {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Not Available</Badge>
    } else {
      return <Badge variant="outline" className="border-slate-500 text-slate-400">Not Started</Badge>
    }
  }

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-5 w-5 text-blue-400" />
      case 'project': return <BarChart3 className="h-5 w-5 text-green-400" />
      case 'quiz': return <CheckCircle className="h-5 w-5 text-purple-400" />
      case 'discussion': return <Users className="h-5 w-5 text-orange-400" />
      case 'presentation': return <Eye className="h-5 w-5 text-indigo-400" />
      case 'code_submission': return <FileText className="h-5 w-5 text-emerald-400" />
      case 'peer_review': return <Users className="h-5 w-5 text-pink-400" />
      case 'file_upload': return <FileText className="h-5 w-5 text-cyan-400" />
      default: return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading assignments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading assignments</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimationWrapper>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Assignments</h1>
            <p className="text-slate-400">Track your progress and manage your work</p>
          </div>
        </div>
      </AnimationWrapper>

      {/* Main Navigation */}
      <AnimationWrapper delay={0.1}>
        <div className="flex justify-center">
          <FluidTabs
            tabs={[
              { 
                id: 'assignments', 
                label: 'Assignments', 
                icon: <ClipboardList className="h-4 w-4" />, 
                badge: assignments.length
              },
              { 
                id: 'progress', 
                label: 'Progress', 
                icon: <BarChart3 className="h-4 w-4" />, 
                badge: assignments.filter(a => a.is_graded).length
              }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            variant="default"
            width="wide"
          />
        </div>
      </AnimationWrapper>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        
        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          {/* Search and Filters */}
          <AnimationWrapper delay={0.2}>
            <GlassCard className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search assignments or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-slate-400"
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "pending", "submitted", "overdue"].map((filter) => (
                    <Button
                      key={filter}
                      variant={filterStatus === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus(filter as any)}
                      className={filterStatus === filter ? "bg-blue-600/80 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"}
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
                  <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
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
                          <p className="text-xs text-slate-400">{assignment.course_title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(assignment)}
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

                      {/* Due Date */}
                      {assignment.due_at && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`/student/assignment/${assignment.id}`} className="flex-1">
                          <Button size="sm" className="w-full bg-blue-600/80 hover:bg-blue-600 text-white">
                            {assignment.is_graded ? 'View Result' : 
                             assignment.is_submitted ? 'View Submission' :
                             !assignment.is_available ? 'Not Available' : 'Start Assignment'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                </AnimationWrapper>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          {progressLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : progressData ? (
            <GlassCard className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-400 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-2">Performance Overview</h3>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{progressData.totalAssignments}</div>
                    <div className="text-sm text-slate-400">Total</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{progressData.completedAssignments}</div>
                    <div className="text-sm text-slate-400">Submitted</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{progressData.gradedAssignments}</div>
                    <div className="text-sm text-slate-400">Graded</div>
                  </div>
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{progressData.averageGrade}%</div>
                    <div className="text-sm text-slate-400">Average</div>
                  </div>
                </div>

                {/* Recent Activity */}
                {progressData.recentActivity.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      {progressData.recentActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              activity.type === 'grade' ? 'bg-green-500/20' : 'bg-blue-500/20'
                            }`}>
                              {activity.type === 'grade' ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <FileText className="h-4 w-4 text-blue-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{activity.assignment}</div>
                              <div className="text-xs text-slate-400">
                                {activity.type === 'grade' ? 'Graded' : 'Submitted'} • {new Date(activity.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {activity.grade && (
                            <div className="text-sm font-bold text-green-400">{activity.grade}%</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-8">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No progress data available</h3>
                <p className="text-slate-400">Complete some assignments to see your progress</p>
              </div>
            </GlassCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}