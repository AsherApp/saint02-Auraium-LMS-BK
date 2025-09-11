"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, Award, AlertCircle, Eye, EyeOff } from "lucide-react"

interface QuizQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'multi-select' | 'true_false' | 'short_answer'
  options?: string[]
  correctIndex?: number
  correctIndexes?: number[]
  correctAnswer?: string
  points: number
}

interface QuizSubmission {
  questionId: string
  answer: string | string[] | number | number[]
  isCorrect: boolean
  pointsEarned: number
}

interface QuizViewerProps {
  questions: QuizQuestion[]
  submission?: QuizSubmission[]
  showAnswers?: boolean
  isReadOnly?: boolean
  totalPoints?: number
  earnedPoints?: number
  timeLimit?: number
  timeSpent?: number
  submittedAt?: string
  gradedAt?: string
  feedback?: string
}

export function QuizViewer({
  questions,
  submission = [],
  showAnswers = false,
  isReadOnly = false,
  totalPoints = 0,
  earnedPoints = 0,
  timeLimit,
  timeSpent,
  submittedAt,
  gradedAt,
  feedback
}: QuizViewerProps) {
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(showAnswers)

  const getQuestionSubmission = (questionId: string) => {
    return submission.find(s => s.questionId === questionId)
  }

  const getAnswerIcon = (isCorrect: boolean, isAnswered: boolean) => {
    if (!isAnswered) return <Clock className="h-4 w-4 text-slate-400" />
    return isCorrect ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />
  }

  const getAnswerBadge = (isCorrect: boolean, isAnswered: boolean) => {
    if (!isAnswered) return <Badge variant="outline" className="text-slate-400">Not Answered</Badge>
    return isCorrect ? 
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Correct</Badge> :
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Incorrect</Badge>
  }

  const renderQuestion = (question: QuizQuestion, index: number) => {
    const questionSubmission = getQuestionSubmission(question.id)
    const isAnswered = !!questionSubmission
    const isCorrect = questionSubmission?.isCorrect || false
    const pointsEarned = questionSubmission?.pointsEarned || 0

    return (
      <GlassCard key={question.id} className="p-6">
        <div className="space-y-4">
          {/* Question Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-semibold text-white">Question {index + 1}</span>
                <Badge variant="outline" className="text-xs">
                  {question.points} point{question.points !== 1 ? 's' : ''}
                </Badge>
                {getAnswerIcon(isCorrect, isAnswered)}
                {getAnswerBadge(isCorrect, isAnswered)}
              </div>
              <h3 className="text-white text-lg font-medium">{question.question}</h3>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Points Earned</div>
              <div className="text-lg font-bold text-white">{pointsEarned}/{question.points}</div>
            </div>
          </div>

          {/* Question Content */}
          <div className="space-y-3">
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = questionSubmission?.answer === optionIndex
                  const isCorrectOption = optionIndex === question.correctIndex
                  
                  return (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg border ${
                        isSelected
                          ? isCorrectOption
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                          : showCorrectAnswers && isCorrectOption
                          ? 'bg-green-500/5 border-green-500/20 text-green-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                        <span>{option}</span>
                        {showCorrectAnswers && isCorrectOption && (
                          <CheckCircle className="h-4 w-4 text-green-400 ml-auto" />
                        )}
                        {isSelected && !isCorrectOption && (
                          <XCircle className="h-4 w-4 text-red-400 ml-auto" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {question.type === 'multi-select' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const selectedAnswers = questionSubmission?.answer as number[] || []
                  const isSelected = selectedAnswers.includes(optionIndex)
                  const isCorrectOption = question.correctIndexes?.includes(optionIndex) || false
                  
                  return (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg border ${
                        isSelected
                          ? isCorrectOption
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                          : showCorrectAnswers && isCorrectOption
                          ? 'bg-green-500/5 border-green-500/20 text-green-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                        <span>{option}</span>
                        {showCorrectAnswers && isCorrectOption && (
                          <CheckCircle className="h-4 w-4 text-green-400 ml-auto" />
                        )}
                        {isSelected && !isCorrectOption && (
                          <XCircle className="h-4 w-4 text-red-400 ml-auto" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {question.type === 'true_false' && (
              <div className="space-y-2">
                {['True', 'False'].map((option, optionIndex) => {
                  const isSelected = questionSubmission?.answer === optionIndex
                  const isCorrectOption = optionIndex === question.correctIndex
                  
                  return (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg border ${
                        isSelected
                          ? isCorrectOption
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                          : showCorrectAnswers && isCorrectOption
                          ? 'bg-green-500/5 border-green-500/20 text-green-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{option}</span>
                        {showCorrectAnswers && isCorrectOption && (
                          <CheckCircle className="h-4 w-4 text-green-400 ml-auto" />
                        )}
                        {isSelected && !isCorrectOption && (
                          <XCircle className="h-4 w-4 text-red-400 ml-auto" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {question.type === 'short_answer' && (
              <div className="space-y-2">
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Student Answer:</div>
                  <div className="text-white">
                    {questionSubmission?.answer || 'No answer provided'}
                  </div>
                </div>
                {showCorrectAnswers && question.correctAnswer && (
                  <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <div className="text-green-400 text-sm mb-1">Correct Answer:</div>
                    <div className="text-green-300">{question.correctAnswer}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    )
  }

  const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Quiz Results</h2>
          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
            >
              {showCorrectAnswers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showCorrectAnswers ? 'Hide Answers' : 'Show Answers'}
            </Button>
          )}
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">{earnedPoints}/{totalPoints}</div>
            <div className="text-slate-400 text-sm">Points Earned</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">{scorePercentage.toFixed(1)}%</div>
            <div className="text-slate-400 text-sm">Score</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">
              {submission.filter(s => s.isCorrect).length}/{questions.length}
            </div>
            <div className="text-slate-400 text-sm">Correct Answers</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Overall Progress</span>
            <span className="text-white text-sm font-medium">{scorePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={scorePercentage} className="h-2" />
        </div>

        {/* Quiz Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {timeLimit && (
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Time Limit: {timeLimit} minutes</span>
            </div>
          )}
          {timeSpent && (
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Time Spent: {timeSpent} minutes</span>
            </div>
          )}
          {submittedAt && (
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle className="h-4 w-4" />
              <span>Submitted: {new Date(submittedAt).toLocaleString()}</span>
            </div>
          )}
          {gradedAt && (
            <div className="flex items-center gap-2 text-slate-400">
              <Award className="h-4 w-4" />
              <span>Graded: {new Date(gradedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 font-medium">Feedback</span>
            </div>
            <p className="text-slate-300">{feedback}</p>
          </div>
        )}
      </GlassCard>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>
    </div>
  )
}
