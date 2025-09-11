"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { UserDisplay } from "@/components/shared/user-avatar"
import { useAuthStore } from "@/store/auth-store"
import { useCoursesFn } from "@/services/courses/hook"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { PendingInvitesWidget } from "@/components/teacher/pending-invites-widget"
import { StudentLimitEnforcer, useStudentLimit } from "@/components/shared/student-limit-enforcer"
import { 
  Users, 
  Search, 
  Mail, 
  BookOpen, 
  UserPlus, 
  Plus, 
  Download, 
  Filter,
  Calendar,
  Clock,
  MoreVertical,
  GraduationCap,
  UserCheck,
  UserX,
  Clock3,
  Eye,
  Trash2,
  BookOpenCheck,
  Target,
  TrendingUp,
  Activity
} from "lucide-react"

interface ConsolidatedStudent {
  id: string
  email: string
  name: string
  status: string
  student_code: string
  created_at: string
  total_courses: number
  active_courses: number
  completed_courses: number
  overall_progress: number
  overall_grade: number | null
  latest_activity: string
  first_enrollment: string | null
  courses: Array<{
    id: string
    title: string
    status: string
    enrolled_at: string
  }>
}

export default function TeacherStudentManagement() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { courses } = useCoursesFn()
  const router = useRouter()
  const [students, setStudents] = useState<ConsolidatedStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    email: "",
    name: "",
    course_id: ""
  })
  const [signupInfo, setSignupInfo] = useState<{
    studentCode: string;
    signupUrl: string;
    email: string;
  } | null>(null)

  // Student limit enforcement
  const { canAddStudents, getUpgradeMessage, subscriptionStatus } = useStudentLimit()

  // Fetch consolidated student data with live updates
  useEffect(() => {
    if (!user?.email) return
    
    setLoading(true)
    setError(null)
    
    const fetchStudents = async () => {
      try {
        const response = await http<any>('/api/students/consolidated')
        setStudents(response.items || [])
      } catch (err: any) {
        setError(err.message || "Failed to fetch students")
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
    
    // Set up polling for live updates every 60 seconds (reduced frequency)
    const interval = setInterval(async () => {
      try {
        const response = await http<any>('/api/students/consolidated')
        setStudents(response.items || [])
      } catch (err: any) {
        console.error('Failed to refresh student data:', err)
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [user?.email])

  const filteredStudents = students.filter(student =>
    (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (student.student_code?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  ).filter(student => 
    selectedStatus === "all" || student.status === selectedStatus
  )

  // Calculate summary statistics
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  const studentsWithCourses = students.filter(s => s.total_courses > 0).length
  const averageProgress = students.length > 0 
    ? Math.round(students.reduce((sum, s) => sum + s.overall_progress, 0) / students.length)
    : 0

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline" className="text-xs">unknown</Badge>
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-white text-xs">active</Badge>
      case 'suspended':
        return <Badge variant="destructive" className="text-xs">suspended</Badge>
      case 'invited':
        return <Badge variant="secondary" className="text-xs">invited</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-500"
    if (grade >= 80) return "text-blue-500"
    if (grade >= 70) return "text-orange-500"
    return "text-red-500"
  }

  const formatLastActivity = (date: string) => {
    if (!date) return "Never"
    
    try {
      const now = new Date()
      const activityDate = new Date(date)
      const diffTime = Math.abs(now.getTime() - activityDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return "1 day ago"
      if (diffDays < 30) return `${diffDays} days ago`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
      return `${Math.floor(diffDays / 365)} years ago`
    } catch (error) {
      return "Unknown"
    }
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedStatus("all")
  }

  const handleExport = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Student Code', 'Status', 'Total Courses', 'Active Courses', 'Overall Progress', 'Overall Grade', 'Last Activity'],
      ...filteredStudents.map(student => [
        student.name,
        student.email,
        student.student_code,
        student.status,
        student.total_courses,
        student.active_courses,
        `${student.overall_progress}%`,
        student.overall_grade ? `${student.overall_grade}%` : '-',
        formatLastActivity(student.latest_activity)
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({ title: "Students exported successfully" })
  }

  const handleAddStudent = async () => {
    if (!newStudent.email || !newStudent.name || !newStudent.course_id) {
      toast({ title: "Please fill in all fields", variant: "destructive" })
      return
    }

    try {
      // Create invite instead of direct student creation (like course detail page)
      const inviteResponse = await http<any>('/api/invites', {
        method: 'POST',
        body: {
          student_email: newStudent.email,
          student_name: newStudent.name,
          course_id: newStudent.course_id
        }
      })

      // Show success message with invite link (using the correct invite page)
      const inviteUrl = `${window.location.origin}/invite/${inviteResponse.code}`
      setSignupInfo({
        studentCode: inviteResponse.code,
        signupUrl: inviteUrl,
        email: newStudent.email
      })
      
      toast({ 
        title: "Student invited successfully!", 
        description: "Please share the invite link with the student.",
        duration: 5000
      })
      
      setAddStudentOpen(false)
      setNewStudent({ email: "", name: "", course_id: "" })
      // Refresh students list
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Failed to invite student", description: err.message, variant: "destructive" })
    }
  }

  const handleSuspendStudent = async (student: ConsolidatedStudent) => {
    try {
      await http(`/api/students/${student.id}`, {
        method: 'PUT',
        body: { status: 'suspended' }
      })
      
      toast({ title: "Student suspended successfully" })
      // Refresh the page to update the list
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Failed to suspend student", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteStudent = async (student: ConsolidatedStudent) => {
    if (!confirm(`Are you sure you want to delete ${student.name} (${student.email})? This action cannot be undone.`)) {
      return
    }

    try {
      await http(`/api/students/${student.id}`, {
        method: 'DELETE'
      })
      
      toast({ title: "Student deleted successfully" })
      // Refresh the page to update the list
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Failed to delete student", description: err.message, variant: "destructive" })
    }
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

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-600/20 text-blue-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-white font-semibold">{totalStudents}</div>
              <div className="text-slate-400 text-sm">Total Students</div>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-600/20 text-green-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-white font-semibold">{activeStudents}</div>
              <div className="text-slate-400 text-sm">Active Students</div>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-600/20 text-purple-300">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-white font-semibold">{studentsWithCourses}</div>
              <div className="text-slate-400 text-sm">Enrolled Students</div>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-orange-600/20 text-orange-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-white font-semibold">{averageProgress}%</div>
              <div className="text-slate-400 text-sm">Avg Progress</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Pending Invites Section */}
      <PendingInvitesWidget 
        title="Pending Student Invites" 
        showCourseInfo={true}
      />

      {/* Main Content */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-xl font-semibold">Student Management</h2>
            <p className="text-slate-400 mt-1">Manage all students and their course enrollments.</p>
            {subscriptionStatus && (
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={subscriptionStatus.subscription_status === 'pro' ? 'default' : 'secondary'}
                  className={`${
                    subscriptionStatus.subscription_status === 'pro' 
                      ? 'bg-green-600/80 text-white' 
                      : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {subscriptionStatus.subscription_status === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </Badge>
                <span className="text-sm text-slate-400">
                  {students.length} / {subscriptionStatus.max_students_allowed} students
                </span>
                {!canAddStudents(students.length) && (
                  <span className="text-sm text-orange-400">
                    • {getUpgradeMessage(students.length)}
                  </span>
                )}
              </div>
            )}
          </div>
          <StudentLimitEnforcer 
            currentStudentCount={students.length}
            showUpgradePrompt={true}
          >
            <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-slate-900/95 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Create a new student account and enroll them in a course.
                </DialogDescription>
              </DialogHeader>
              
              {signupInfo ? (
                <div className="space-y-4">
                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                    <h3 className="text-green-300 font-semibold mb-2">Student Created Successfully!</h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Share this information with the student so they can set up their account:
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Student Code:</label>
                        <div className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white font-mono text-lg">
                          {signupInfo.studentCode}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-300">Signup Link:</label>
                        <div className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white font-mono text-sm break-all">
                          {signupInfo.signupUrl}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-300">Email:</label>
                        <div className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                          {signupInfo.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${signupInfo.signupUrl}\nStudent Code: ${signupInfo.studentCode}\nEmail: ${signupInfo.email}`)
                          toast({ title: "Signup information copied to clipboard" })
                        }}
                        className=""
                      >
                        Copy to Clipboard
                      </Button>
                      <Button 
                        onClick={() => {
                          setSignupInfo(null)
                          setAddStudentOpen(false)
                          setNewStudent({ email: "", name: "", course_id: "" })
                          window.location.reload()
                        }}
                        variant="success"
                        className=""
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Email:</label>
                    <Input
                      value={newStudent.email}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="student@school.edu"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Name:</label>
                    <Input
                      value={newStudent.name}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Student Name"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Enroll in Course:</label>
                    <select
                      value={newStudent.course_id}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, course_id: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddStudent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAddStudentOpen(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          </StudentLimitEnforcer>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, or ID..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
            />
          </div>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 text-white border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
          
          <Button 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Courses</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Overall Progress</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Overall Grade</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Last Activity</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <UserDisplay 
                          user={{
                            name: student.name,
                            email: student.email,
                            studentCode: student.student_code,
                            profile_picture_url: student.profile_picture_url
                          }}
                          avatarSize="sm"
                          className="flex-1"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-white">{student.total_courses}</div>
                      <div className="text-slate-400 text-sm">
                        {student.active_courses} active • {student.completed_courses} completed
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24">
                        <Progress value={student.overall_progress} className="h-2" />
                        <div className="text-slate-300 text-sm mt-1">{student.overall_progress}%</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {student.overall_grade ? (
                        <div className={`font-medium ${getGradeColor(student.overall_grade)}`}>
                          {student.overall_grade}%
                        </div>
                      ) : (
                        <div className="text-slate-500">-</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-300 text-sm">
                        {formatLastActivity(student.latest_activity)}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {student.latest_activity ? new Date(student.latest_activity).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/teacher/student-management/${student.student_code}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleSuspendStudent(student)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteStudent(student)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-slate-400 text-sm">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </GlassCard>
    </div>
  )
}

