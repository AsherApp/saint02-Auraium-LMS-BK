"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuthStore } from "@/store/auth-store"
import { useCoursesFn } from "@/services/courses/hook"
import { ProgressAPI, TeacherStudentProgress } from '@/services/progress/api'
import { http } from "@/services/http"
import { BarChart3, TrendingUp, Users, BookOpen, Award, Clock, Download, Calendar, Activity, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TeacherPerformance() {
  const { user } = useAuthStore()
  const { courses } = useCoursesFn()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("analytics")
  const [progressData, setProgressData] = useState<TeacherStudentProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any>({
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    averageCompletion: 0,
    recentActivity: [],
    coursePerformance: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.email) return
    
    setLoading(true)
    
    const fetchAnalytics = async () => {
      try {
        // Fetch real analytics data from the backend
        const response = await http<any>('/api/teacher/analytics')
        console.log('Teacher analytics data:', response)
        setAnalytics(response)
      } catch (err) {
        console.error("Failed to fetch analytics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user?.email, courses])

  useEffect(() => {
    if (activeTab === "progress") {
      fetchProgressData()
    }
  }, [activeTab])

  const fetchProgressData = async () => {
    try {
      setProgressLoading(true)
      const data = await ProgressAPI.getTeacherDashboard()
      console.log('Teacher dashboard data:', data)
      setProgressData(data)
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  const handleExportReport = () => {
    // In a real app, this would generate and download a report
    console.log("Exporting report...")
  }

  const handleViewStudentProgress = (studentEmail: string, courseId: string) => {
    router.push(`/teacher/progress/student/${studentEmail}/course/${courseId}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold">Performance Analytics</h1>
          <p className="text-slate-400 mt-1">Track student performance and course analytics</p>
        </div>
        <Button 
          onClick={handleExportReport}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Performance Analytics Navigation */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { 
              id: 'analytics', 
              label: 'Analytics', 
              icon: <BarChart3 className="h-4 w-4" />
            },
            { 
              id: 'progress', 
              label: 'Student Progress', 
              icon: <TrendingUp className="h-4 w-4" />, 
              badge: progressData?.length || 0 
            },
            { 
              id: 'engagement', 
              label: 'Engagement', 
              icon: <Activity className="h-4 w-4" />
            },
            { 
              id: 'reports', 
              label: 'Reports', 
              icon: <Download className="h-4 w-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="wide"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

        <TabsContent value="analytics" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-600/20 text-blue-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{analytics.totalStudents}</div>
                  <div className="text-slate-400 text-sm">Total Students</div>
                  {analytics.totalEnrollments > analytics.totalStudents && (
                    <div className="text-blue-400 text-xs">{analytics.totalEnrollments} Total Enrollments</div>
                  )}
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-600/20 text-green-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{analytics.totalCourses}</div>
                  <div className="text-slate-400 text-sm">Published Courses</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-600/20 text-purple-300">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{analytics.totalAssignments}</div>
                  <div className="text-slate-400 text-sm">Total Assignments</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-600/20 text-orange-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{analytics.averageCompletion}%</div>
                  <div className="text-slate-400 text-sm">Avg. Completion</div>
                  <div className="text-orange-400 text-xs">Student Progress</div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recent Activity */}
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                      {activity.type === "assignment_submitted" && <Award className="h-4 w-4 text-blue-400" />}
                      {activity.type === "course_enrolled" && <Users className="h-4 w-4 text-green-400" />}
                      {activity.type === "assignment_graded" && <BookOpen className="h-4 w-4 text-purple-400" />}
                      {activity.type === "live_session" && <Clock className="h-4 w-4 text-orange-400" />}
                      {activity.type === "login" && <Calendar className="h-4 w-4 text-purple-400" />}
                      {!["assignment_submitted", "course_enrolled", "assignment_graded", "live_session", "login"].includes(activity.type) && 
                        <Activity className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        {activity.description || (
                          <>
                            <span className="font-medium">{activity.student}</span>
                            {activity.type === "assignment_submitted" && " submitted an assignment"}
                            {activity.type === "course_enrolled" && " enrolled in"}
                            {activity.type === "assignment_graded" && " received a grade for"}
                            {activity.type === "live_session" && " attended a live session in"}
                            {activity.type === "login" && " logged in"}
                            <span className="text-slate-300"> {activity.course}</span>
                          </>
                        )}
                      </p>
                      <p className="text-slate-400 text-xs">{activity.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {loading ? 'Loading recent activity...' : 'No recent activity available'}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Course Performance */}
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Course Performance Overview</h3>
            <div className="space-y-4">
              {analytics.coursePerformance && analytics.coursePerformance.length > 0 ? (
                analytics.coursePerformance.map((course: any) => (
                  <div key={course.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">{course.title}</h4>
                      <p className="text-slate-400 text-sm">
                        Status: <Badge variant="outline" className="text-xs">
                          {course.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-white font-semibold">{course.studentCount}</div>
                        <div className="text-slate-400 text-xs">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">{course.avgCompletion}%</div>
                        <div className="text-slate-400 text-xs">Completion</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">{course.avgGrade}%</div>
                        <div className="text-slate-400 text-xs">Avg Grade</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {loading ? 'Loading course performance...' : 'No course performance data available'}
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Student Progress Overview</h3>
            <div className="space-y-4">
              {progressLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : progressData.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No student progress data available
                </div>
              ) : (
                progressData.map((item) => (
                  <div key={`${item.student_email}-${item.course_id}`} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.student_name}`} />
                        <AvatarFallback className="text-white">{item.student_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-white font-medium">{item.student_name}</h4>
                        <p className="text-slate-400 text-sm">{item.course_title}</p>
                        <p className="text-slate-400 text-xs">{item.student_email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-white">
                            {item.course_completion_percentage}%
                          </span>
                          <Badge variant={item.course_completion_percentage === 100 ? 'default' : 'secondary'}>
                            {item.course_completion_percentage === 100 ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                        <Progress 
                          value={item.course_completion_percentage} 
                          className="w-32 mt-2"
                        />
                      </div>
                      
                      <div className="text-right text-sm text-slate-400">
                        <div>Lessons: {item.completed_lessons}/{item.total_lessons}</div>
                        <div>Assignments: {item.completed_assignments}/{item.total_assignments}</div>
                        <div>Quizzes: {item.passed_quizzes}/{item.total_quizzes}</div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStudentProgress(item.student_email, item.course_id)}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Student Engagement Analytics</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Poll Participation */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Poll Participation</h4>
                <div className="space-y-3">
                  {analytics.pollParticipation ? (
                    analytics.pollParticipation.map((poll: any, index: number) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 text-sm">{poll.question}</span>
                          <span className="text-white text-sm">{poll.responseRate}%</span>
                        </div>
                        <Progress 
                          value={poll.responseRate} 
                          className="h-2 bg-white/10"
                        />
                        <div className="text-slate-400 text-xs mt-1">
                          {poll.totalResponses} responses from {poll.totalStudents} students
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400">
                      No poll data available
                    </div>
                  )}
                </div>
              </div>

              {/* Discussion Participation */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Discussion Participation</h4>
                <div className="space-y-3">
                  {analytics.discussionParticipation ? (
                    analytics.discussionParticipation.map((discussion: any, index: number) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 text-sm">{discussion.topic}</span>
                          <span className="text-white text-sm">{discussion.participationRate}%</span>
                        </div>
                        <Progress 
                          value={discussion.participationRate} 
                          className="h-2 bg-white/10"
                        />
                        <div className="text-slate-400 text-xs mt-1">
                          {discussion.totalPosts} posts from {discussion.activeStudents} students
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400">
                      No discussion data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Performance Reports</h3>
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <div className="text-white font-semibold text-xl">{analytics.totalStudents}</div>
                  <div className="text-slate-400 text-sm">Active Students</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <div className="text-white font-semibold text-xl">{analytics.averageCompletion}%</div>
                  <div className="text-slate-400 text-sm">Average Completion</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <div className="text-white font-semibold text-xl">{analytics.totalAssignments}</div>
                  <div className="text-slate-400 text-sm">Total Assignments</div>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Export Reports</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button
                    onClick={handleExportReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Student Progress
                  </Button>
                  <Button
                    onClick={handleExportReport}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Course Analytics
                  </Button>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Recent Reports</h4>
                <div className="space-y-2">
                  {analytics.recentReports ? (
                    analytics.recentReports.map((report: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm">{report.name}</p>
                          <p className="text-slate-400 text-xs">{report.generatedAt}</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-white border-white/20">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400">
                      No recent reports available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
} 