"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UserDisplay } from "@/components/shared/user-avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { getGeneralStudentEngagement } from "@/services/student-progress/api"
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Clock, 
  UserCheck, 
  UserX, 
  Edit,
  Trash2,
  Download,
  Activity,
  Award,
  FileText,
  MessageSquare,
  MoreVertical,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Key
} from "lucide-react"
import { CourseDetailsModal } from "@/components/teacher/course-details-modal"

interface Student {
  email: string
  name: string
  status: 'active' | 'inactive' | 'suspended'
  student_code: string
  first_name?: string
  last_name?: string
  // Comprehensive profile fields
  date_of_birth?: string
  phone_number?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  academic_level?: string
  major?: string
  minor?: string
  graduation_year?: number
  gpa?: number
  academic_interests?: string
  career_goals?: string
  bio?: string
  avatar_url?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  timezone?: string
  preferred_language?: string
  accessibility_needs?: string
  dietary_restrictions?: string
  created_at: string
  updated_at?: string
  total_courses?: number
  active_courses?: number
  completed_courses?: number
  overall_progress?: number
  overall_grade?: number
  latest_activity?: string
  first_enrollment?: string
  courses?: Array<{
    id: string
    title: string
    status: string
    enrolled_at: string
    progress_percentage?: number
    grade_percentage?: number
    last_activity?: string
  }>
}

interface Enrollment {
  id: string
  course_id: string
  student_email: string
  enrolled_at: string
  course: {
    id: string
    title: string
    description: string
    status: string
  }
  progress_percentage?: number
  grade_percentage?: number
  last_activity?: string
  status: string
}

interface Assignment {
  id: string
  title: string
  type: string
  due_date: string
  status: string
  submitted_at: string | null
  grade: number | null
  feedback: string | null
  course_title: string
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  metadata: any
}

interface StudentProgress {
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
  total_assignments: number
  completed_assignments: number
  average_grade: number
  total_time_spent_hours: number
  last_activity: string | null
}

interface EngagementMetrics {
  total_activities: number
  login_frequency: number
  lessons_completed: number
  assignments_submitted: number
  forum_posts: number
  live_sessions_attended: number
  last_activity: string | null
}

export default function StudentDetailPage() {
  const params = useParams<{ studentCode: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [student, setStudent] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [showCourseDetails, setShowCourseDetails] = useState(false)

  const studentCode = params.studentCode

  // Fetch student data
  useEffect(() => {
    if (!studentCode || !user?.email) return
    
    setLoading(true)
    setError(null)
    
    const fetchStudentData = async () => {
      try {
        // Get student by student code
        const studentResponse = await http<Student>(`/api/students/code/${studentCode}`)
        setStudent(studentResponse)
        
        // Get enrollments
        const enrollmentsResponse = await http<{ items: Enrollment[] }>(`/api/students/${studentResponse.email}/enrollments`)
        setEnrollments(enrollmentsResponse.items || [])
        
        // Get progress for each course
        if (enrollmentsResponse.items && enrollmentsResponse.items.length > 0) {
          const progressData = await Promise.all(
            enrollmentsResponse.items.map(async (enrollment) => {
              try {
                return await http<StudentProgress>(`/api/student-progress/${studentCode}/course/${enrollment.course_id}/progress`)
              } catch (err) {
                console.log(`Progress not available for course ${enrollment.course_id}`)
                return null
              }
            })
          )
          setStudentProgress(progressData.filter(Boolean))
        }
        
        // Fetch engagement metrics
        try {
          const engagement = await getGeneralStudentEngagement(studentCode)
          setEngagementMetrics(engagement)
        } catch (err) {
          console.log('Engagement metrics not available')
        }
        
        // Fetch assignments
        try {
          const assignmentsResponse = await http<{ items: Assignment[] }>(`/api/students/${studentResponse.email}/assignments`)
          setAssignments(assignmentsResponse.items || [])
        } catch (err) {
          console.log('Assignments API not available yet')
          setAssignments([])
        }
        
        // Fetch activities
        try {
          const activitiesResponse = await http<{ items: Activity[] }>(`/api/students/${studentResponse.email}/activities`)
          setActivities(activitiesResponse.items || [])
        } catch (err) {
          console.log('Activities API not available yet')
          setActivities([])
        }
        
      } catch (err: any) {
        setError(err.message || "Failed to fetch student data")
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [studentCode, user?.email])

  const handleSuspendStudent = async () => {
    if (!student) return
    
    try {
      await http(`/api/students/${student.email}`, {
        method: 'PUT',
        body: { status: 'suspended' }
      })
      
      setStudent(prev => prev ? { ...prev, status: 'suspended' } : null)
      setSuspendDialogOpen(false)
      toast({ title: "Student suspended successfully" })
    } catch (err: any) {
      toast({ title: "Failed to suspend student", description: err.message, variant: "destructive" })
    }
  }

  const handleActivateStudent = async () => {
    if (!student) return
    
    try {
      await http(`/api/students/${student.email}`, {
        method: 'PUT',
        body: { status: 'active' }
      })
      
      setStudent(prev => prev ? { ...prev, status: 'active' } : null)
      toast({ title: "Student activated successfully" })
    } catch (err: any) {
      toast({ title: "Failed to activate student", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteStudent = async () => {
    if (!student) return
    
    try {
      await http(`/api/students/${student.email}`, {
        method: 'DELETE'
      })
      
      setDeleteDialogOpen(false)
      toast({ title: "Student deleted successfully" })
      router.push('/teacher/student-management')
    } catch (err: any) {
      toast({ title: "Failed to delete student", description: err.message, variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-white">Active</Badge>
      case 'suspended':
        return <Badge className="bg-orange-600 text-white">Suspended</Badge>
      case 'inactive':
        return <Badge className="bg-red-600 text-white">Inactive</Badge>
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="animate-pulse bg-white/10 h-8 w-48 rounded"></div>
        </div>
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading student details...</div>
        </GlassCard>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <GlassCard className="p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Student Not Found</h2>
            <p className="text-slate-300">{error || "The student you're looking for doesn't exist."}</p>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{student.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Key className="h-4 w-4 text-slate-400" />
              <span className="text-slate-400 font-mono">{student.student_code}</span>
              {getStatusBadge(student.status)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {student.status === 'active' ? (
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(true)}
              className="bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
            >
              <UserX className="h-4 w-4 mr-1" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleActivateStudent}
              className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Activate
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Student Info Card */}
      <GlassCard className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <UserDisplay 
              user={{
                name: student.name,
                email: student.email,
                studentCode: student.student_code,
                profile_picture_url: student.profile_picture_url
              }}
              avatarSize="lg"
              className="mb-4"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Student Code</p>
                <p className="text-white font-mono">{student.student_code}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                {getStatusBadge(student.status)}
              </div>
              <div>
                <p className="text-slate-400 text-sm">Joined</p>
                <p className="text-white">{new Date(student.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Courses</p>
                <p className="text-white">{enrollments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Active Courses</p>
                <p className="text-white text-xl font-bold">{enrollments.filter(e => e.status === 'active').length}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-white text-xl font-bold">{enrollments.filter(e => e.status === 'completed').length}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Assignments</p>
                <p className="text-white text-xl font-bold">{assignments.length}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-slate-400 text-sm">Activities</p>
                <p className="text-white text-xl font-bold">{engagementMetrics?.total_activities || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Student Management Navigation */}
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
              label: 'Courses', 
              icon: <BookOpen className="h-4 w-4" />, 
              badge: enrollments?.length || 0 
            },
            { 
              id: 'assignments', 
              label: 'Assignments', 
              icon: <FileText className="h-4 w-4" />, 
              badge: assignments?.length || 0 
            },
            { 
              id: 'activities', 
              label: 'Activities', 
              icon: <Activity className="h-4 w-4" />, 
              badge: activities?.length || 0 
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="wide"
        />
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          <TabsContent value="overview" className="p-6">
            <div className="space-y-6">
              {/* Engagement Metrics */}
              {engagementMetrics && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Engagement Metrics (Last 30 Days)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-400 text-sm">Login Frequency</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{engagementMetrics.login_frequency}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-green-400" />
                        <span className="text-slate-400 text-sm">Lessons Completed</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{engagementMetrics.lessons_completed}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-400 text-sm">Assignments</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{engagementMetrics.assignments_submitted}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-orange-400" />
                        <span className="text-slate-400 text-sm">Forum Posts</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{engagementMetrics.forum_posts}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-yellow-400" />
                        <span className="text-slate-400 text-sm">Live Sessions</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{engagementMetrics.live_sessions_attended}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-red-400" />
                        <span className="text-slate-400 text-sm">Total Activities</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{engagementMetrics.total_activities}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.description}</p>
                        <p className="text-slate-400 text-xs">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-slate-400 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="p-6">
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">{enrollment.course.title}</h4>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(enrollment.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCourse(enrollment.course)
                          setShowCourseDetails(true)
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Enrolled</p>
                      <p className="text-white">{new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={enrollment.progress_percentage || 0} className="flex-1" />
                        <span className="text-white text-sm">{enrollment.progress_percentage || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Grade</p>
                      <p className="text-white">{enrollment.grade_percentage || 0}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Last Activity</p>
                      <p className="text-white text-sm">
                        {enrollment.last_activity 
                          ? new Date(enrollment.last_activity).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {enrollments.length === 0 && (
                <p className="text-slate-400 text-center py-8">No courses enrolled</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="p-6">
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{assignment.title}</h4>
                    <Badge className={assignment.status === 'submitted' ? 'bg-green-600' : 'bg-orange-600'}>
                      {assignment.status}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{assignment.course_title}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Type</p>
                      <p className="text-white">{assignment.type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Due Date</p>
                      <p className="text-white">{new Date(assignment.due_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Submitted</p>
                      <p className="text-white">
                        {assignment.submitted_at 
                          ? new Date(assignment.submitted_at).toLocaleDateString()
                          : 'Not submitted'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Grade</p>
                      <p className="text-white">{assignment.grade || 'Not graded'}</p>
                    </div>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-slate-400 text-center py-8">No assignments found</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activities" className="p-6">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-white">{activity.description}</p>
                      <p className="text-slate-400 text-sm">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-slate-400 text-center py-8">No activities found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </GlassCard>

      {/* Dialogs */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
          <DialogHeader>
            <DialogTitle>Suspend Student</DialogTitle>
          </DialogHeader>
          <p className="text-slate-300">
            Are you sure you want to suspend {student.name}? They will not be able to access the platform until reactivated.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSuspendStudent} className="bg-orange-600 hover:bg-orange-700">
              Suspend Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
          </DialogHeader>
          <p className="text-slate-300">
            Are you sure you want to delete {student.name}? This action cannot be undone and will remove all their data.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteStudent} variant="destructive">
              Delete Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          open={showCourseDetails}
          onOpenChange={setShowCourseDetails}
        />
      )}
    </div>
  )
}
