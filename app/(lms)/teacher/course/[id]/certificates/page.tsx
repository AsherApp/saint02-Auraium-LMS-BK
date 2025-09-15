"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { CertificateConfiguration } from "@/components/teacher/certificate-configuration"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { 
  ArrowLeft, 
  Award, 
  Settings,
  Eye,
  Download,
  Users
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  teacher_email: string
  certificate_config?: any
}

export default function CourseCertificatesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [certificateStats, setCertificateStats] = useState<any>(null)

  const courseId = params.id as string

  useEffect(() => {
    if (!user?.email || !courseId) return
    fetchCourseData()
  }, [user?.email, courseId])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch course details
      const courseResponse = await http<Course>(`/api/courses/${courseId}`)
      setCourse(courseResponse)
      
      // Fetch certificate statistics
      const statsResponse = await http<any>(`/api/certificates/course/${courseId}/stats`)
      setCertificateStats(statsResponse)
      
    } catch (err: any) {
      console.error('Error fetching course data:', err)
      setError(err.message || "Failed to fetch course data")
    } finally {
      setLoading(false)
    }
  }

  const handleCertificateConfigSave = (config: any) => {
    if (course) {
      setCourse({ ...course, certificate_config: config })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading certificate configuration...</p>
            </div>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-center py-12">
            <div className="text-red-300 mb-4">Error: {error}</div>
            <Button onClick={fetchCourseData} variant="outline">
              Try Again
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-center py-12">
            <div className="text-slate-300 mb-4">Course not found</div>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
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
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-400" />
              Certificate Management
            </h1>
            <p className="text-slate-400 mt-1">{course.title}</p>
          </div>
        </div>
      </div>

      {/* Certificate Statistics */}
      {certificateStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{certificateStats.total_students || 0}</p>
                <p className="text-slate-400 text-sm">Total Students</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Award className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{certificateStats.certificates_issued || 0}</p>
                <p className="text-slate-400 text-sm">Certificates Issued</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Eye className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{certificateStats.pending_completion || 0}</p>
                <p className="text-slate-400 text-sm">Pending Completion</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Settings className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {course.certificate_config?.enabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-slate-400 text-sm">Certificate Status</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Certificate Configuration */}
      <CertificateConfiguration 
        courseId={courseId}
        onSave={handleCertificateConfigSave}
      />

      {/* Certificate Management Actions */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Certificate Management</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => router.push(`/teacher/course/${courseId}/certificates/preview`)}
            variant="outline"
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Certificate
          </Button>
          
          <Button
            onClick={() => router.push(`/teacher/course/${courseId}/certificates/issued`)}
            variant="outline"
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            View Issued Certificates
          </Button>
          
          <Button
            onClick={() => router.push(`/teacher/course/${courseId}/certificates/templates`)}
            variant="outline"
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Award className="h-4 w-4 mr-2" />
            Manage Templates
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
