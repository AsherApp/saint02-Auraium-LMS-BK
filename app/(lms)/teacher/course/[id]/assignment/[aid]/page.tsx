"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { useCourseStore } from "@/store/course-store"
import { useAssignment, useAssignmentSubmissions, useGradingStats } from "@/services/assignments/hook"
import { type Assignment, type Submission, type GradingStats } from "@/services/assignments/api"
import { http } from "@/services/http"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  BarChart3, 
  Clock, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Download,
  Filter,
  Search,
  MoreVertical,
  Calendar,
  TrendingUp,
  Activity
} from "lucide-react"
import { GradingInterface } from "@/components/teacher/grading-interface"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

type AssignmentWithStats = Assignment & {
  stats?: GradingStats
}

export default function TeacherAssignmentSubmissionsPage() {
  const params = useParams<{ id: string; aid: string }>()
  const router = useRouter()
  const course = useCourseStore((s) => s.getById(params.id))
  
  const { assignment, loading, error } = useAssignment(params.aid)
  const { submissions } = useAssignmentSubmissions(params.aid)
  const { stats } = useGradingStats(params.aid)
  const [analytics, setAnalytics] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("submissions")

  // Fetch analytics data when assignment loads
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!params.aid) return
      
      try {
        const [analyticsData, timelineData] = await Promise.all([
          http(`/api/assignments/${params.aid}/analytics`),
          http(`/api/assignments/${params.aid}/submission-timeline`)
        ])
        setAnalytics(analyticsData)
        setTimeline(timelineData)
      } catch (analyticsError) {
        console.warn('Failed to fetch analytics data:', analyticsError)
        setAnalytics(null)
        setTimeline([])
      }
    }

    if (assignment) {
      fetchAnalytics()
    }
  }, [assignment, params.aid])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      case 'draft':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Draft</Badge>
      case 'returned':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Returned</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading assignment</p>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
            <p className="text-slate-400">Assignment Submissions & Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => router.push(`/teacher/assignment/${assignment.id}`)}
            className="bg-blue-600/80 hover:bg-blue-600 text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Assignment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.total_submissions || 0}</p>
              <p className="text-sm text-slate-400">Total Submissions</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.graded_submissions || 0}</p>
              <p className="text-sm text-slate-400">Graded</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Clock className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.pending_grading || 0}</p>
              <p className="text-sm text-slate-400">Pending</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Award className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.average_grade ? Math.round(stats.average_grade) : 0}%
              </p>
              <p className="text-sm text-slate-400">Avg Grade</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Navigation */}
      <div className="flex justify-center">
        <FluidTabs
          tabs={[
            { 
              id: 'submissions', 
              label: 'Submissions', 
              icon: <FileText className="h-4 w-4" />, 
              badge: submissions?.length || 0
            },
            { 
              id: 'analytics', 
              label: 'Analytics', 
              icon: <BarChart3 className="h-4 w-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          variant="default"
          width="wide"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        
        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          {submissions && submissions.length > 0 ? (
            <GlassCard className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Student Submissions</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-300">Student</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Submitted</TableHead>
                      <TableHead className="text-slate-300">Grade</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="text-white">
                          <div>
                            <p className="font-medium">{submission.student_name}</p>
                            <p className="text-sm text-slate-400">{submission.student_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(submission.status)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Not submitted'}
                        </TableCell>
                        <TableCell className="text-white">
                          {submission.grade !== null ? `${submission.grade}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/teacher/assignment/${assignment.id}/submission/${submission.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No submissions yet</h3>
                <p className="text-slate-400">Students haven't submitted their work for this assignment</p>
              </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assignment Analytics</h3>
            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-md font-medium text-white">Completion Rate</h4>
                    <p className="text-2xl font-bold text-blue-400">{analytics.completion_rate || 0}%</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-md font-medium text-white">Average Time Spent</h4>
                    <p className="text-2xl font-bold text-green-400">{analytics.average_time_spent || 0} min</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Analytics data will be available once students start submitting</p>
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}