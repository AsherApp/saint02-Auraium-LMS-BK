"use client"

import { GlassCard } from "@/components/shared/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  User, 
  FileText,
  CheckCircle,
  AlertCircle,
  Award,
  Target
} from "lucide-react"

interface PeerReviewSubmission {
  reviewed_submission_id: string
  reviewed_student: string
  review_criteria: Record<string, string>
  overall_rating: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
}

interface PeerReviewViewerProps {
  submission: PeerReviewSubmission
  readOnly?: boolean
  showHeader?: boolean
  className?: string
}

export function PeerReviewViewer({ 
  submission, 
  readOnly = true,
  showHeader = true,
  className = ""
}: PeerReviewViewerProps) {
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
      )
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-5 w-5 text-yellow-400 fill-current opacity-50" />
      )
    }
    
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-5 w-5 text-slate-400" />
      )
    }
    
    return stars
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-400"
    if (rating >= 3.5) return "text-yellow-400"
    if (rating >= 2.5) return "text-orange-400"
    return "text-red-400"
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent"
    if (rating >= 3.5) return "Good"
    if (rating >= 2.5) return "Fair"
    if (rating >= 1.5) return "Poor"
    return "Very Poor"
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-white">Peer Review Submission</h4>
              <p className="text-slate-400 text-sm">Review of {submission.reviewed_student}'s work</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-500 text-slate-300">
              Submission ID: {submission.reviewed_submission_id}
            </Badge>
          </div>
        </div>
      )}

      {/* Overall Rating */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-lg font-medium text-white">Overall Rating</h5>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getRatingColor(submission.overall_rating)}`}>
              {submission.overall_rating}/5.0
            </span>
            <Badge className={`${
              submission.overall_rating >= 4.5 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              submission.overall_rating >= 3.5 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              submission.overall_rating >= 2.5 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
              'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {getRatingLabel(submission.overall_rating)}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {renderStars(submission.overall_rating)}
        </div>
      </GlassCard>

      {/* Review Criteria */}
      <GlassCard className="p-6">
        <h5 className="text-lg font-medium text-white mb-4">Review Criteria</h5>
        <div className="space-y-4">
          {Object.entries(submission.review_criteria).map(([criterion, feedback]) => (
            <div key={criterion} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-400" />
                <h6 className="font-medium text-white">{criterion}</h6>
              </div>
              <p className="text-slate-300 text-sm">{feedback}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-5 w-5 text-green-400" />
            <h5 className="text-lg font-medium text-white">Strengths</h5>
          </div>
          <div className="space-y-2">
            {submission.strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{strength}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Improvements */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            <h5 className="text-lg font-medium text-white">Areas for Improvement</h5>
          </div>
          <div className="space-y-2">
            {submission.improvements.map((improvement, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{improvement}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Detailed Feedback */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <h5 className="text-lg font-medium text-white">Detailed Feedback</h5>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {submission.detailed_feedback}
          </p>
        </div>
      </GlassCard>

      {/* Review Summary */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-purple-400" />
          <h5 className="text-lg font-medium text-white">Review Summary</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">{submission.overall_rating}/5.0</div>
            <div className="text-slate-400 text-sm">Overall Rating</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">{submission.strengths.length}</div>
            <div className="text-slate-400 text-sm">Strengths Identified</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">{submission.improvements.length}</div>
            <div className="text-slate-400 text-sm">Improvements Suggested</div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
