"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { 
  Users, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  User,
  Clock,
  Target,
  Award,
  Heart,
  Flag,
  Share2,
  Copy,
  Edit,
  Trash2,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Save,
  Send
} from "lucide-react"

interface PeerReviewSubmissionProps {
  target: string
  setTarget: (target: string) => void
  criteria: Record<string, number>
  setCriteria: (criteria: Record<string, number>) => void
  feedback: string
  setFeedback: (feedback: string) => void
  readOnly?: boolean
}

interface ReviewCriteria {
  id: string
  name: string
  description: string
  weight: number
  maxScore: number
}

interface StudentSubmission {
  id: string
  name: string
  email: string
  submission: string
  submittedAt: Date
}

// Mock review criteria - in a real app, this would come from the assignment data
const mockCriteria: ReviewCriteria[] = [
  {
    id: 'clarity',
    name: 'Clarity of Communication',
    description: 'How clearly and effectively the student communicates their ideas',
    weight: 20,
    maxScore: 10
  },
  {
    id: 'content',
    name: 'Content Quality',
    description: 'The depth, accuracy, and relevance of the content presented',
    weight: 30,
    maxScore: 10
  },
  {
    id: 'creativity',
    name: 'Creativity and Innovation',
    description: 'How original and creative the approach or solution is',
    weight: 15,
    maxScore: 10
  },
  {
    id: 'technical',
    name: 'Technical Accuracy',
    description: 'The technical correctness and implementation quality',
    weight: 25,
    maxScore: 10
  },
  {
    id: 'presentation',
    name: 'Presentation and Formatting',
    description: 'How well the work is presented and formatted',
    weight: 10,
    maxScore: 10
  }
]

// Mock students to review - in a real app, this would come from the assignment data
const mockStudents: StudentSubmission[] = [
  {
    id: 'student1',
    name: 'Alice Johnson',
    email: 'alice.johnson@email.com',
    submission: 'This is Alice\'s project submission about web development...',
    submittedAt: new Date('2024-01-15')
  },
  {
    id: 'student2',
    name: 'Bob Smith',
    email: 'bob.smith@email.com',
    submission: 'This is Bob\'s project submission about data analysis...',
    submittedAt: new Date('2024-01-14')
  },
  {
    id: 'student3',
    name: 'Carol Davis',
    email: 'carol.davis@email.com',
    submission: 'This is Carol\'s project submission about mobile app development...',
    submittedAt: new Date('2024-01-16')
  }
]

export function PeerReviewSubmission({ 
  target, 
  setTarget, 
  criteria, 
  setCriteria, 
  feedback, 
  setFeedback, 
  readOnly = false 
}: PeerReviewSubmissionProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentSubmission | null>(
    mockStudents.find(s => s.id === target) || null
  )
  const [overallRating, setOverallRating] = useState(0)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(true)

  const handleCriteriaChange = (criterionId: string, value: number) => {
    setCriteria({
      ...criteria,
      [criterionId]: value
    })
  }

  const getTotalScore = () => {
    let totalWeightedScore = 0
    let totalWeight = 0
    
    Object.entries(criteria).forEach(([criterionId, score]) => {
      const criterion = mockCriteria.find(c => c.id === criterionId)
      if (criterion) {
        totalWeightedScore += (score / criterion.maxScore) * criterion.weight
        totalWeight += criterion.weight
      }
    })
    
    return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Satisfactory'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  const handleStudentSelect = (student: StudentSubmission) => {
    setSelectedStudent(student)
    setTarget(student.id)
  }

  const isReviewComplete = () => {
    return selectedStudent && 
           Object.keys(criteria).length === mockCriteria.length &&
           feedback.trim().length > 0
  }

  return (
    <div className="space-y-6">
      {/* Peer Review Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Peer Review</h3>
            <p className="text-slate-400 text-sm">Review another student's work and provide feedback</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {Object.keys(criteria).length}/{mockCriteria.length} criteria
          </Badge>
          {isReviewComplete() && (
            <Badge className="bg-green-500/20 text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
      </div>

      {/* Review Guidelines */}
      {showGuidelines && (
        <GlassCard className="p-4">
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-blue-400 font-medium">Peer Review Guidelines</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuidelines(false)}
                className="text-blue-400 hover:text-blue-300"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Be constructive and respectful in your feedback</li>
              <li>• Focus on the work, not the person</li>
              <li>• Provide specific examples and suggestions for improvement</li>
              <li>• Balance criticism with positive observations</li>
              <li>• Consider the assignment requirements and learning objectives</li>
            </ul>
          </div>
        </GlassCard>
      )}

      {/* Student Selection */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Select Student to Review</h4>
          
          <div className="grid gap-3">
            {mockStudents.map((student) => (
              <div
                key={student.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedStudent?.id === student.id
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                }`}
                onClick={() => !readOnly && handleStudentSelect(student)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{student.name}</p>
                      <p className="text-slate-400 text-sm">{student.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline" className="border-slate-500 text-slate-300">
                      Submitted
                    </Badge>
                    <p className="text-slate-400 text-xs mt-1">
                      {student.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Selected Student's Work */}
      {selectedStudent && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white">
                Reviewing: {selectedStudent.name}
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Submission
              </Button>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Submission Preview</h5>
              <p className="text-slate-300 text-sm">
                {selectedStudent.submission}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Review Criteria */}
      {selectedStudent && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-white">Review Criteria</h4>
            
            <div className="space-y-6">
              {mockCriteria.map((criterion) => (
                <div key={criterion.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-white font-medium">{criterion.name}</h5>
                      <p className="text-slate-400 text-sm">{criterion.description}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-500 text-slate-300">
                      {criterion.weight}% weight
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">Score</span>
                      <span className="text-white font-medium">
                        {criteria[criterion.id] || 0} / {criterion.maxScore}
                      </span>
                    </div>
                    
                    <Slider
                      value={[criteria[criterion.id] || 0]}
                      onValueChange={(value) => handleCriteriaChange(criterion.id, value[0])}
                      max={criterion.maxScore}
                      step={0.5}
                      disabled={readOnly}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>0</span>
                      <span>{criterion.maxScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Overall Rating */}
      {selectedStudent && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Overall Rating</h4>
            
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(getTotalScore())}`}>
                {getTotalScore()}%
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {getScoreLabel(getTotalScore())}
              </p>
            </div>
            
            <Progress value={getTotalScore()} className="h-3" />
          </div>
        </GlassCard>
      )}

      {/* Detailed Feedback */}
      {selectedStudent && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Detailed Feedback</h4>
            
            <div>
              <Label htmlFor="feedback" className="text-white font-medium">
                Written Feedback
              </Label>
              <p className="text-slate-400 text-sm mb-3">
                Provide specific, constructive feedback about the student's work
              </p>
              
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write your detailed feedback here. Be specific about what was done well and what could be improved..."
                disabled={readOnly}
                className="min-h-[200px] bg-slate-800/50 border-slate-600 text-white"
              />
              
              <div className="flex items-center justify-between mt-2">
                <div className="text-slate-400 text-sm">
                  {feedback.length} characters
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    disabled={readOnly}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <Label htmlFor="anonymous" className="text-slate-300 text-sm">
                    Submit anonymously
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Review Summary */}
      {selectedStudent && isReviewComplete() && (
        <GlassCard className="p-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Review Summary</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Student</h5>
                <p className="text-slate-300">{selectedStudent.name}</p>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Overall Score</h5>
                <p className={`text-2xl font-bold ${getScoreColor(getTotalScore())}`}>
                  {getTotalScore()}%
                </p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Feedback Preview</h5>
              <p className="text-slate-300 text-sm">
                {feedback.length > 100 ? `${feedback.substring(0, 100)}...` : feedback}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Submit Button */}
      {!readOnly && selectedStudent && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-slate-400">
              {isReviewComplete() ? 'Review is complete and ready to submit' : 'Complete all sections to submit your review'}
            </div>
            
            <Button
              disabled={!isReviewComplete()}
              className="bg-green-600/80 hover:bg-green-600 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Review
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
