"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth-store"
import { Download, Share2, Award, Calendar, BookOpen, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CourseCompletionCertificateProps {
  courseTitle: string
  studentName: string
  completionDate: string
  courseId: string
  grade?: number
  totalLessons: number
  completedLessons: number
  totalAssignments: number
  completedAssignments: number
  totalQuizzes: number
  passedQuizzes: number
  onClose: () => void
}

export function CourseCompletionCertificate({
  courseTitle,
  studentName,
  completionDate,
  courseId,
  grade,
  totalLessons,
  completedLessons,
  totalAssignments,
  completedAssignments,
  totalQuizzes,
  passedQuizzes,
  onClose
}: CourseCompletionCertificateProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [downloading, setDownloading] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      // In a real implementation, this would generate a PDF certificate
      // For now, we'll just show a success message
      toast({
        title: "Certificate Downloaded!",
        description: "Your course completion certificate has been saved.",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = () => {
    // In a real implementation, this would share the certificate
    toast({
      title: "Certificate Shared!",
      description: "Your course completion has been shared.",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-8">
        {/* Certificate Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-12 w-12 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Certificate of Completion</h1>
            <Trophy className="h-12 w-12 text-yellow-400" />
          </div>
          <p className="text-slate-400">This is to certify that</p>
        </div>

        {/* Student Name */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">{studentName}</h2>
          <p className="text-slate-300 text-lg">has successfully completed the course</p>
        </div>

        {/* Course Title */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-blue-400 mb-2">{courseTitle}</h3>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>Completed on {formatDate(completionDate)}</span>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <BookOpen className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-white font-semibold text-xl">{completedLessons}/{totalLessons}</div>
            <div className="text-slate-400 text-sm">Lessons Completed</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <Award className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-white font-semibold text-xl">{completedAssignments}/{totalAssignments}</div>
            <div className="text-slate-400 text-sm">Assignments Submitted</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <Trophy className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-white font-semibold text-xl">{passedQuizzes}/{totalQuizzes}</div>
            <div className="text-slate-400 text-sm">Quizzes Passed</div>
          </div>
        </div>

        {/* Grade (if available) */}
        {grade && (
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
              <div className="text-white font-bold text-2xl">{grade}%</div>
              <div className="text-slate-300 text-sm">Final Grade</div>
            </div>
          </div>
        )}

        {/* Certificate Footer */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-white/50"></div>
              <span>Course ID: {courseId}</span>
              <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-white/50"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Downloading..." : "Download Certificate"}
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Achievement
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            Close
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-yellow-400/30 rounded-full"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-2 border-yellow-400/30 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-yellow-400/30 rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-yellow-400/30 rounded-full"></div>
      </Card>
    </div>
  )
}
