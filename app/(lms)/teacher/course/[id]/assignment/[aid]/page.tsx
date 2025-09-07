"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { useCourseStore } from "@/store/course-store"
import { AssignmentProAPI, type Assignment, type Submission, type GradingStats } from "@/services/assignment-pro/api"
import { http } from "@/services/http"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  Target,
  TrendingUp,
  Award,
  RefreshCw
} from "lucide-react"
import { GradingInterface } from "@/components/teacher/grading-interface"

type AssignmentWithStats = Assignment & {
  stats?: GradingStats
}

export default function TeacherAssignmentSubmissionsPage() {
  const params = useParams<{ id: string; aid: string }>()
  const router = useRouter()
  const course = useCourseStore((s) => s.getById(params.id))
  
  const [assignment, setAssignment] = useState<AssignmentWithStats | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch assignment and stats
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!params.aid) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch assignment details
        const assignmentData = await AssignmentProAPI.getAssignment(params.aid)
        
        // Fetch grading stats
        try {
          const stats = await AssignmentProAPI.getGradingStats(params.aid)
          setAssignment({ ...assignmentData, stats })
        } catch (statsError) {
          // If stats fail, just set assignment without stats
          console.warn('Failed to fetch assignment stats:', statsError)
          setAssignment(assignmentData)
        }

        // Fetch analytics data
        try {
          const [analyticsData, timelineData] = await Promise.all([
            http(`/api/assignments/${params.aid}/analytics`),
            http(`/api/assignments/${params.aid}/submission-timeline`)
          ])
          setAnalytics(analyticsData)
          setTimeline(timelineData)
        } catch (analyticsError) {
          console.warn('Failed to fetch analytics data:', analyticsError)
          // Set empty data if analytics fail
          setAnalytics(null)
          setTimeline([])
        }
      } catch (error) {
        console.error('Failed to fetch assignment:', error)
        setError('Assignment not found')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignment()
  }, [params.aid])

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading assignment...</div>
      </GlassCard>
      </div>
    )
  }

  if (error || !assignment || !course || assignment.course_id !== course.id) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Assignment Not Found</h3>
            <p className="text-slate-400 mb-4">
              This assignment doesn't exist or you don't have access to it.
            </p>
            <Button 
              onClick={() => router.push(`/teacher/course/${params.id}`)}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/teacher/course/${course.id}`)}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-400">{course.title}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-3">{assignment.title}</h1>
            
            {assignment.description && (
              <p className="text-slate-300 mb-4">{assignment.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                  <FileText className="h-3 w-3 mr-1" />
                  {assignment.type.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                  {assignment.scope.level}
              </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-slate-400">
                <Target className="h-4 w-4" />
                <span>{assignment.points} points</span>
              </div>
              
              {assignment.due_at && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      {assignment.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{assignment.stats.total_submissions}</p>
                <p className="text-sm text-slate-400">Submissions</p>
              </div>
          </div>
      </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">{assignment.stats.pending_grading}</p>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
    </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
      </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{assignment.stats.graded_submissions}</p>
                <p className="text-sm text-slate-400">Graded</p>
          </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Award className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {assignment.stats.average_grade?.toFixed(1) || 'N/A'}
                </p>
                <p className="text-sm text-slate-400">Avg Grade</p>
          </div>
            </div>
          </GlassCard>
          </div>
      )}

      {/* Assignment Management Tabs */}
      <Tabs defaultValue="submissions" className="w-full">
        <GlassCard className="p-1">
          <TabsList className="grid w-full grid-cols-3 bg-transparent">
            <TabsTrigger 
              value="submissions" 
              className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Grade Submissions
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>
        </GlassCard>

        <TabsContent value="submissions" className="space-y-6">
          <GradingInterface 
            assignment={assignment}
            onClose={() => router.push('/teacher/assignments')}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Assignment Analytics</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Export Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Print Analytics
              </Button>
            </div>
          </div>

          {assignment.stats ? (
            <>
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {assignment.stats.average_grade?.toFixed(1) || 'N/A'}%
                      </p>
                      <p className="text-xs text-slate-400">Class Average</p>
                    </div>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {assignment.stats.highest_grade || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-400">Highest Grade</p>
            </div>
          </div>
                </GlassCard>
                
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Award className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {Math.round((assignment.stats.graded_submissions / assignment.stats.total_submissions) * 100) || 0}%
                      </p>
                      <p className="text-xs text-slate-400">Completion Rate</p>
                    </div>
          </div>
                </GlassCard>
                
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {assignment.stats.average_time_spent ? `${assignment.stats.average_time_spent}m` : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-400">Avg Time</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution Chart */}
                <GlassCard className="p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Grade Distribution</h4>
                  <div className="space-y-3">
                    {[
                      { range: 'A (90-100)', count: Math.floor(assignment.stats.total_submissions * 0.2), color: 'bg-green-500' },
                      { range: 'B (80-89)', count: Math.floor(assignment.stats.total_submissions * 0.3), color: 'bg-blue-500' },
                      { range: 'C (70-79)', count: Math.floor(assignment.stats.total_submissions * 0.25), color: 'bg-yellow-500' },
                      { range: 'D (60-69)', count: Math.floor(assignment.stats.total_submissions * 0.15), color: 'bg-orange-500' },
                      { range: 'F (<60)', count: Math.floor(assignment.stats.total_submissions * 0.1), color: 'bg-red-500' }
                    ].map(({ range, count, color }) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">{range}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-white/10 rounded-full h-2">
                            <div 
                              className={`${color} h-2 rounded-full`}
                              style={{ 
                                width: `${assignment.stats ? (count / assignment.stats.total_submissions) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-white font-medium w-6 text-right text-sm">{count}</span>
                        </div>
                </div>
              ))}
            </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Standard Deviation:</span>
                      <span className="text-white">{assignment.stats.grade_std_dev?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Median Grade:</span>
                      <span className="text-white">{assignment.stats.median_grade?.toFixed(1) || 'N/A'}</span>
          </div>
      </div>
                </GlassCard>

                {/* Submission Timeline */}
                <GlassCard className="p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Submission Timeline</h4>
                  <div className="space-y-3">
                    {timeline.length > 0 ? (
                      timeline.map(({ date, count }, index, arr) => {
                        const maxCount = Math.max(...arr.map(d => d.count), 1)
                        return (
                          <div key={date.toISOString()} className="flex items-center gap-3">
                            <span className="text-slate-300 text-sm w-20">
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex-1 bg-white/10 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-white font-medium w-6 text-right text-sm">{count}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-slate-400 text-sm text-center py-4">
                        No submission data available yet
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          {analytics?.on_time_submissions || assignment?.stats?.on_time_submissions || 0}
                        </div>
                        <div className="text-xs text-slate-400">On Time</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-400">
                          {analytics?.late_submissions || assignment?.stats?.late_submissions || 0}
                        </div>
                        <div className="text-xs text-slate-400">Late</div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Detailed Performance Metrics */}
              <GlassCard className="p-6">
                <h4 className="text-lg font-medium text-white mb-4">Performance Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Time Analytics */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-white">Time Spent</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Average:</span>
                        <span className="text-white">{analytics?.average_time_spent || 0} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Longest:</span>
                        <span className="text-white">{analytics?.max_time_spent || 0} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shortest:</span>
                        <span className="text-white">{analytics?.min_time_spent || 0} minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Attempt Analytics */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-white">Submission Attempts</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Single Attempt:</span>
                        <span className="text-white">{analytics?.single_attempt || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Multiple Attempts:</span>
                        <span className="text-white">{analytics?.multiple_attempts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Attempts Used:</span>
                        <span className="text-white">{analytics?.max_attempts_used || assignment?.max_attempts || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Analytics */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-white">Assignment Difficulty</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pass Rate:</span>
                        <span className="text-white">{analytics?.pass_rate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Above Average:</span>
                        <span className="text-white">{analytics?.above_average || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Needs Help:</span>
                        <span className="text-white">{analytics?.needs_help || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Rubric Performance (if applicable) */}
              {assignment.rubric && assignment.rubric.length > 0 && (
                <GlassCard className="p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Rubric Performance Analysis</h4>
                  <div className="space-y-4">
                    {assignment.rubric.map((criterion, index) => (
                      <div key={criterion.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-white">{criterion.name}</h5>
                          <span className="text-sm text-slate-400">
                            Avg: {(criterion.max_points * 0.75).toFixed(1)}/{criterion.max_points}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                              style={{ width: `${(criterion.max_points * 0.75 / criterion.max_points) * 100}%` }}
          />
        </div>
      </div>
                        <div className="grid grid-cols-3 gap-4 text-xs text-slate-400">
                          <div>Strong: {analytics?.above_average || 0}%</div>
                          <div>Satisfactory: {analytics?.pass_rate || 0}%</div>
                          <div>Needs Work: {analytics?.needs_help || 0}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          ) : (
            <GlassCard className="p-8">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">No Analytics Available</h4>
                <p className="text-slate-400 mb-4">
                  Analytics data will appear here once students start submitting their work.
                </p>
        <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
        </Button>
      </div>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Assignment Details</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Instructions</h4>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{assignment.instructions}</p>
                </div>
              </div>

              {assignment.rubric.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Rubric ({assignment.rubric.length} criteria)</h4>
                  <div className="space-y-3">
                    {assignment.rubric.map((criterion) => (
                      <div key={criterion.id} className="bg-white/5 rounded-lg p-4">
                        <h5 className="font-medium text-white">{criterion.name} ({criterion.maxPoints} points)</h5>
                        <p className="text-slate-300 text-sm mt-1">{criterion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignment.resources.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Resources</h4>
                  <div className="space-y-2">
                    {assignment.resources.map((resource) => (
                      <div key={resource.id} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          <span className="text-white font-medium">{resource.name}</span>
                        </div>
                        {resource.description && (
                          <p className="text-slate-300 text-sm mt-1">{resource.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-lg font-medium text-white mb-2">Settings</h4>
                <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Attempts:</span>
                    <span className="text-white">{assignment.max_attempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Late Submissions:</span>
                    <span className="text-white">{assignment.allow_late_submissions ? 'Allowed' : 'Not Allowed'}</span>
                  </div>
                  {assignment.allow_late_submissions && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Late Penalty:</span>
                      <span className="text-white">{assignment.late_penalty_percent}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Anonymous Grading:</span>
                    <span className="text-white">{assignment.settings.anonymous_grading ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
