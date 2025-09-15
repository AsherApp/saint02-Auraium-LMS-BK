"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface QuizQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false'
  options?: string[]
  correct_answer: string
  points: number
}

interface QuizWithTimerProps {
  quiz: {
    id: string
    title: string
    description?: string
    questions: QuizQuestion[]
    time_limit_minutes?: number
    passing_score: number
    max_attempts: number
  }
  onComplete: (score: number, total: number, timeTaken: number) => void
  onTimeExpired: () => void
}

export function QuizWithTimer({ quiz, onComplete, onTimeExpired }: QuizWithTimerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const hasTimer = quiz.time_limit_minutes && quiz.time_limit_minutes > 0
  const totalQuestions = quiz.questions.length

  // Initialize timer when component mounts
  useEffect(() => {
    if (hasTimer) {
      const timeInSeconds = quiz.time_limit_minutes! * 60
      setTimeRemaining(timeInSeconds)
      setStartTime(new Date())
      
      // Start countdown
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Time expired
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
            }
            handleTimeExpired()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Show warning when 2 minutes remaining
      const warningTime = 120 // 2 minutes
      setTimeout(() => {
        if (timeRemaining && timeRemaining <= warningTime) {
          setShowWarning(true)
        }
      }, (timeInSeconds - warningTime) * 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [hasTimer, quiz.time_limit_minutes])

  // Show warning when time is low
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining <= 120 && timeRemaining > 0) {
      setShowWarning(true)
    }
  }, [timeRemaining])

  const handleTimeExpired = () => {
    setSubmitted(true)
    setTimeRemaining(0)
    onTimeExpired()
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = () => {
    if (submitted) return
    
    setSubmitted(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Calculate score
    let correctAnswers = 0
    quiz.questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++
      }
    })

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const timeTaken = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0

    onComplete(score, totalQuestions, timeTaken)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (!timeRemaining) return "text-red-500"
    if (timeRemaining <= 60) return "text-red-500"
    if (timeRemaining <= 300) return "text-yellow-500" // 5 minutes
    return "text-green-500"
  }

  const getProgressPercentage = () => {
    if (!hasTimer || !quiz.time_limit_minutes) return 0
    const totalTime = quiz.time_limit_minutes * 60
    return ((totalTime - (timeRemaining || 0)) / totalTime) * 100
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
          {hasTimer && timeRemaining !== null && (
            <div className={`flex items-center gap-2 text-lg font-mono ${getTimeColor()}`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
        
        {quiz.description && (
          <p className="text-slate-300 text-sm mb-3">{quiz.description}</p>
        )}

        {/* Timer Progress Bar */}
        {hasTimer && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Time Progress</span>
              <span>{formatTime(timeRemaining || 0)} remaining</span>
            </div>
            <Progress 
              value={getProgressPercentage()} 
              className="h-2"
            />
          </div>
        )}

        {/* Time Warning */}
        {showWarning && timeRemaining && timeRemaining <= 120 && timeRemaining > 0 && (
          <Alert className="mt-3 border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              {timeRemaining <= 60 
                ? `⚠️ Less than 1 minute remaining! Submit your answers now.`
                : `⏰ Less than 2 minutes remaining. Please complete your answers soon.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Time Expired Alert */}
        {timeRemaining === 0 && (
          <Alert className="mt-3 border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              Time's up! Your quiz has been automatically submitted.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((question, index) => {
          const selectedAnswer = answers[question.id]
          const isCorrect = submitted && selectedAnswer === question.correct_answer
          const isIncorrect = submitted && selectedAnswer && selectedAnswer !== question.correct_answer

          return (
            <div key={question.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-white font-medium mb-3">
                Q{index + 1}. {question.question}
              </div>

              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const optionLetter = String.fromCharCode(65 + optionIndex) // A, B, C, D
                    const isSelected = selectedAnswer === optionLetter
                    const isCorrectOption = submitted && question.correct_answer === optionLetter
                    const isWrongSelected = submitted && isSelected && !isCorrectOption

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswerSelect(question.id, optionLetter)}
                        disabled={submitted}
                        className={`w-full text-left rounded-md border px-4 py-3 transition-colors ${
                          isSelected
                            ? "border-blue-400 bg-blue-600/20 text-white"
                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                        } ${
                          submitted
                            ? isCorrectOption
                              ? "border-green-400 bg-green-600/20"
                              : isWrongSelected
                              ? "border-red-400 bg-red-600/20 opacity-70"
                              : ""
                            : ""
                        }`}
                      >
                        <span className="font-medium mr-2">{optionLetter}.</span>
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              {question.type === 'true_false' && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAnswerSelect(question.id, 'true')}
                    disabled={submitted}
                    className={`flex-1 rounded-md border px-4 py-3 transition-colors ${
                      selectedAnswer === 'true'
                        ? "border-blue-400 bg-blue-600/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    } ${
                      submitted
                        ? question.correct_answer === 'true'
                          ? "border-green-400 bg-green-600/20"
                          : selectedAnswer === 'true'
                          ? "border-red-400 bg-red-600/20 opacity-70"
                          : ""
                        : ""
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => handleAnswerSelect(question.id, 'false')}
                    disabled={submitted}
                    className={`flex-1 rounded-md border px-4 py-3 transition-colors ${
                      selectedAnswer === 'false'
                        ? "border-blue-400 bg-blue-600/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    } ${
                      submitted
                        ? question.correct_answer === 'false'
                          ? "border-green-400 bg-green-600/20"
                          : selectedAnswer === 'false'
                          ? "border-red-400 bg-red-600/20 opacity-70"
                          : ""
                        : ""
                    }`}
                  >
                    False
                  </button>
                </div>
              )}

              {/* Question Result */}
              {submitted && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${
                  isCorrect ? "text-green-300" : isIncorrect ? "text-red-300" : "text-slate-400"
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Correct! (+{question.points} points)
                    </>
                  ) : isIncorrect ? (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Incorrect. Correct answer: {question.correct_answer}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Not answered. Correct answer: {question.correct_answer}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit Section */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-slate-300 text-sm">
            {submitted ? (
              <span>Quiz completed</span>
            ) : (
              <span>
                {Object.keys(answers).length} of {totalQuestions} questions answered
              </span>
            )}
          </div>
          
          {!submitted && (
            <Button 
              onClick={handleSubmit}
              disabled={timeRemaining === 0}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
