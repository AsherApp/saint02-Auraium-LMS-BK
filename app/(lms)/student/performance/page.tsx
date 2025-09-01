"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth-store"
import { ProgressAPI, StudentProgress } from '@/services/progress/api'
import { http } from "@/services/http"
import { CourseCompletionCertificate } from "@/components/shared/course-completion-certificate"
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle, 
  Users, 
  Activity,
  BarChart3,
  Target,
  Calendar,
  FileText,
  MessageSquare,
  Video,
  Play,
  Eye
} from "lucide-react"

interface CourseProgress {
  course_id: string
  course_title: string
  completion_percentage: number
  completed_lessons: number
  total_lessons: number
  completed_assignments: number
  total_assignments: number
  passed_quizzes: number
  total_quizzes: number
  started_at: string
  completed_at?: string
}

interface ActivityItem {
  id: string
  type: string
  description: string
  course_title: string
  created_at: string
  metadata?: any
}

export default function StudentPerformancePage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("overview")
  const [progressData, setProgressData] = useState<any>(null)
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    totalQuizzes: 0,
    passedQuizzes: 0,
    totalPolls: 0,
    respondedPolls: 0,
    totalDiscussions: 0,
    participatedDiscussions: 0,
    averageCompletion: 0,
    totalStudyTime: 0
  })
  const [showCertificate, setShowCertificate] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)

  useEffect(() => {
    if (!user?.email) return
    fetchPerformanceData()
  }, [user?.email])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      
      // Fetch enrolled courses first
      const enrollmentsResponse = await http<{ items: any[] }>(`/api/students/${user?.email}/enrollments`)
      const enrollments = enrollmentsResponse.items || []
      console.log('Enrolled courses:', enrollments)
      
      // Calculate stats
      const totalCourses = enrollments.length
      let completedCourses = 0
      let totalLessons = 0
      let completedLessons = 0
      let totalAssignments = 0
      let completedAssignments = 0
      let totalQuizzes = 0
      let passedQuizzes = 0
      let totalCompletion = 0

      const courseProgressData: CourseProgress[] = []

      for (const enrollment of enrollments) {
        try {
          // Get course details to calculate totals
          const courseResponse = await http<any>(`/api/courses/${enrollment.course.id}`)
          const course = courseResponse
          
          // Get course progress if available
          let courseProgress = null
          try {
            courseProgress = await ProgressAPI.getCourseProgress(enrollment.course.id)
          } catch (error) {
            console.log(`No progress data for course ${enrollment.course.id}, using defaults`)
          }
          
          // Calculate totals from course structure
          const totalLessonsInCourse = course.modules?.reduce((acc: number, module: any) => 
            acc + (module.lessons?.length || 0), 0) || 0
          
          const totalAssignmentsInCourse = course.assignments?.length || 0
          const totalQuizzesInCourse = course.modules?.reduce((acc: number, module: any) => 
            acc + (module.quizzes?.length || 0), 0) || 0
          
          const courseStats = {
            course_id: enrollment.course.id,
            course_title: enrollment.course.title,
            completion_percentage: courseProgress?.courseCompletion?.completion_percentage || 0,
            completed_lessons: courseProgress?.courseCompletion?.completed_lessons || 0,
            total_lessons: totalLessonsInCourse,
            completed_assignments: courseProgress?.courseCompletion?.completed_assignments || 0,
            total_assignments: totalAssignmentsInCourse,
            passed_quizzes: courseProgress?.courseCompletion?.passed_quizzes || 0,
            total_quizzes: totalQuizzesInCourse,
            started_at: enrollment.created_at,
            completed_at: courseProgress?.courseCompletion?.completed_at
          }

          courseProgressData.push(courseStats)

          totalLessons += courseStats.total_lessons
          completedLessons += courseStats.completed_lessons
          totalAssignments += courseStats.total_assignments
          completedAssignments += courseStats.completed_assignments
          totalQuizzes += courseStats.total_quizzes
          passedQuizzes += courseStats.passed_quizzes
          totalCompletion += courseStats.completion_percentage
          
          if (courseStats.completion_percentage === 100) {
            completedCourses++
          }

        } catch (error) {
          console.error(`Error fetching data for course ${enrollment.course.id}:`, error)
        }
      }

      setCourseProgress(courseProgressData)
      const finalStats = {
        totalCourses,
        completedCourses,
        totalLessons,
        completedLessons,
        totalAssignments,
        completedAssignments,
        totalQuizzes,
        passedQuizzes,
        totalPolls: 0, // Will be updated when poll data is available
        respondedPolls: 0,
        totalDiscussions: 0, // Will be updated when discussion data is available
        participatedDiscussions: 0,
        averageCompletion: totalCourses > 0 ? Math.round(totalCompletion / totalCourses) : 0,
        totalStudyTime: 0 // Will be updated when study time tracking is available
      }
      setStats(finalStats)
      console.log('Calculated stats:', finalStats)
      console.log('Course progress data:', courseProgressData)

      // Fetch recent activities
      try {
        const activitiesResponse = await http<ActivityItem[]>('/api/student-progress/activities')
        setRecentActivities(activitiesResponse.slice(0, 10))
      } catch (error) {
        console.error('Error fetching activities:', error)
        setRecentActivities([])
      }

      // Set progress data if available
      try {
        const progressResponse = await ProgressAPI.getMyProgress()
        setProgressData(progressResponse)
      } catch (error) {
        console.error('Failed to fetch progress data:', error)
        setProgressData(null)
      }

      // Fetch engagement data (polls, discussions, study time)
      try {
        // Get poll participation data
        const pollResponse = await http<any[]>(`/api/students/${user?.email}/poll-participation`)
        const pollData = pollResponse || []
        
        // Get discussion participation data
        const discussionResponse = await http<any[]>(`/api/students/${user?.email}/discussion-participation`)
        const discussionData = discussionResponse || []
        
        // Get study time data
        const studyTimeResponse = await http<any>(`/api/students/${user?.email}/study-time`)
        const studyTimeData = studyTimeResponse || { total_seconds: 0 }
        
        // Update stats with real engagement data
        setStats(prevStats => ({
          ...prevStats,
          totalPolls: pollData.length,
          respondedPolls: pollData.filter((p: any) => p.responded).length,
          totalDiscussions: discussionData.length,
          participatedDiscussions: discussionData.filter((d: any) => d.participated).length,
          totalStudyTime: studyTimeData.total_seconds || 0
        }))
        
        console.log('Engagement data:', { pollData, discussionData, studyTimeData })
      } catch (error) {
        console.error('Failed to fetch engagement data:', error)
        // Keep existing stats with zeros for engagement data
      }

    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return <BookOpen className="h-4 w-4 text-blue-400" />
      case 'quiz_completed':
        return <Target className="h-4 w-4 text-green-400" />
      case 'assignment_submitted':
        return <FileText className="h-4 w-4 text-purple-400" />
      case 'discussion_participated':
        return <MessageSquare className="h-4 w-4 text-orange-400" />
      case 'poll_responded':
        return <Users className="h-4 w-4 text-pink-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return 'Lesson Completed'
      case 'quiz_completed':
        return 'Quiz Completed'
      case 'assignment_submitted':
        return 'Assignment Submitted'
      case 'discussion_participated':
        return 'Discussion Participated'
      case 'poll_responded':
        return 'Poll Responded'
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const handleShowCertificate = (course: any) => {
    setSelectedCourse(course)
    setShowCertificate(true)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Performance</h1>
          <p className="text-slate-400 mt-1">Track your learning progress and achievements</p>
        </div>
      </div>

      {/* Student Performance Navigation */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { 
              id: 'overview', 
              label: 'Overview', 
              icon: <Eye className="h-4 w-4" />
            },
            { 
              id: 'courses', 
              label: 'Course Progress', 
              icon: <BookOpen className="h-4 w-4" />, 
              badge: progressData?.length || 0 
            },
            { 
              id: 'activities', 
              label: 'Recent Activities', 
              icon: <Activity className="h-4 w-4" />
            },
            { 
              id: 'analytics', 
              label: 'Analytics', 
              icon: <BarChart3 className="h-4 w-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="wide"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-600/20 text-blue-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{stats.totalCourses}</div>
                  <div className="text-slate-400 text-sm">Enrolled Courses</div>
                  <div className="text-blue-400 text-xs">{stats.completedCourses} Completed</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-600/20 text-green-300">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{stats.completedLessons}</div>
                  <div className="text-slate-400 text-sm">Lessons Completed</div>
                  <div className="text-green-400 text-xs">of {stats.totalLessons} Total</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-600/20 text-purple-300">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{stats.completedAssignments}</div>
                  <div className="text-slate-400 text-sm">Assignments Done</div>
                  <div className="text-purple-400 text-xs">of {stats.totalAssignments} Total</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-600/20 text-orange-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xl">{stats.averageCompletion}%</div>
                  <div className="text-slate-400 text-sm">Avg. Completion</div>
                  <div className="text-orange-400 text-xs">Overall Progress</div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Overall Progress */}
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Overall Learning Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Course Completion</span>
                  <span className="text-white">{stats.completedCourses}/{stats.totalCourses} Courses</span>
                </div>
                <Progress 
                  value={stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0} 
                  className="h-3 bg-white/10"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Lesson Progress</span>
                  <span className="text-white">{stats.completedLessons}/{stats.totalLessons} Lessons</span>
                </div>
                <Progress 
                  value={stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0} 
                  className="h-3 bg-white/10"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Assignment Completion</span>
                  <span className="text-white">{stats.completedAssignments}/{stats.totalAssignments} Assignments</span>
                </div>
                <Progress 
                  value={stats.totalAssignments > 0 ? (stats.completedAssignments / stats.totalAssignments) * 100 : 0} 
                  className="h-3 bg-white/10"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Quiz Performance</span>
                  <span className="text-white">{stats.passedQuizzes}/{stats.totalQuizzes} Passed</span>
                </div>
                <Progress 
                  value={stats.totalQuizzes > 0 ? (stats.passedQuizzes / stats.totalQuizzes) * 100 : 0} 
                  className="h-3 bg-white/10"
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Course Progress Details</h3>
            {courseProgress.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No course progress data available
              </div>
            ) : (
              <div className="space-y-4">
                {courseProgress.map((course) => (
                  <div key={course.course_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.course_title}`} />
                        <AvatarFallback className="text-white">{course.course_title.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-white font-medium">{course.course_title}</h4>
                        <p className="text-slate-400 text-sm">
                          Started {course.started_at ? new Date(course.started_at).toLocaleDateString() : 'Recently'}
                        </p>
                        {course.completed_at && (
                          <p className="text-green-400 text-xs">
                            Completed {new Date(course.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-white">
                            {course.completion_percentage}%
                          </span>
                          <Badge variant={course.completion_percentage === 100 ? 'default' : 'secondary'}>
                            {course.completion_percentage === 100 ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                        <Progress 
                          value={course.completion_percentage} 
                          className="w-32 mt-2"
                        />
                      </div>
                      
                      <div className="text-right text-sm text-slate-400">
                        <div>Lessons: {course.completed_lessons}/{course.total_lessons}</div>
                        <div>Assignments: {course.completed_assignments}/{course.total_assignments}</div>
                        <div>Quizzes: {course.passed_quizzes}/{course.total_quizzes}</div>
                      </div>

                      {course.completion_percentage === 100 && (
                        <Button
                          size="sm"
                          onClick={() => handleShowCertificate(course)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Award className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Recent Learning Activities</h3>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No recent activities available
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.description}</p>
                      <p className="text-slate-400 text-xs">{activity.course_title}</p>
                      <p className="text-slate-400 text-xs">
                        {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getActivityLabel(activity.type)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-white font-semibold mb-4">Learning Analytics</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Engagement Metrics */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Engagement Metrics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-300">Poll Participation</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{stats.respondedPolls}/{stats.totalPolls}</div>
                      <div className="text-slate-400 text-xs">
                        {stats.totalPolls > 0 ? Math.round((stats.respondedPolls / stats.totalPolls) * 100) : 0}% Response Rate
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-400" />
                      <span className="text-slate-300">Discussion Participation</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{stats.participatedDiscussions}/{stats.totalDiscussions}</div>
                      <div className="text-slate-400 text-xs">
                        {stats.totalDiscussions > 0 ? Math.round((stats.participatedDiscussions / stats.totalDiscussions) * 100) : 0}% Participation Rate
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-slate-300">Total Study Time</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{formatStudyTime(stats.totalStudyTime)}</div>
                      <div className="text-slate-400 text-xs">Cumulative Time</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Breakdown */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Performance Breakdown</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Lesson Completion</span>
                      <span className="text-white text-sm">{Math.round((stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100} 
                      className="h-2 bg-white/10"
                    />
                  </div>
                  
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Assignment Completion</span>
                      <span className="text-white text-sm">{Math.round((stats.completedAssignments / Math.max(stats.totalAssignments, 1)) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(stats.completedAssignments / Math.max(stats.totalAssignments, 1)) * 100} 
                      className="h-2 bg-white/10"
                    />
                  </div>
                  
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm">Quiz Success Rate</span>
                      <span className="text-white text-sm">{Math.round((stats.passedQuizzes / Math.max(stats.totalQuizzes, 1)) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(stats.passedQuizzes / Math.max(stats.totalQuizzes, 1)) * 100} 
                      className="h-2 bg-white/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Course Completion Certificate */}
      {showCertificate && selectedCourse && (
        <CourseCompletionCertificate
          courseTitle={selectedCourse.course_title}
          studentName={user?.name || user?.email || 'Student'}
          completionDate={selectedCourse.completed_at || new Date().toISOString()}
          courseId={selectedCourse.course_id}
          totalLessons={selectedCourse.total_lessons}
          completedLessons={selectedCourse.completed_lessons}
          totalAssignments={selectedCourse.total_assignments}
          completedAssignments={selectedCourse.completed_assignments}
          totalQuizzes={selectedCourse.total_quizzes}
          passedQuizzes={selectedCourse.passed_quizzes}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  )
}

function formatStudyTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
