"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Calculator,
  Lightbulb,
  Target,
  Award,
  Timer,
  Play,
  Pause,
  RotateCcw
} from "lucide-react"

interface QuizSubmissionProps {
  answers: Record<string, any>
  setAnswers: (answers: Record<string, any>) => void
  readOnly?: boolean
}

interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer' | 'essay'
  question: string
  options?: string[]
  correct_answer?: any
  points: number
  explanation?: string
  time_limit?: number
}

// Mock quiz questions - in a real app, this would come from the assignment data
const mockQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_answer: 'Paris',
    points: 10,
    explanation: 'Paris has been the capital of France since the 12th century.'
  },
  {
    id: 'q2',
    type: 'multiple_select',
    question: 'Which of the following are programming languages?',
    options: ['JavaScript', 'HTML', 'Python', 'CSS', 'Java', 'SQL'],
    correct_answer: ['JavaScript', 'Python', 'Java', 'SQL'],
    points: 15,
    explanation: 'JavaScript, Python, Java, and SQL are programming languages. HTML and CSS are markup languages.'
  },
  {
    id: 'q3',
    type: 'true_false',
    question: 'The Earth revolves around the Sun.',
    options: ['True', 'False'],
    correct_answer: true,
    points: 5,
    explanation: 'This is a fundamental fact of our solar system.'
  },
  {
    id: 'q4',
    type: 'short_answer',
    question: 'What does CPU stand for?',
    correct_answer: 'Central Processing Unit',
    points: 10,
    explanation: 'CPU stands for Central Processing Unit, the main processor in a computer.'
  },
  {
    id: 'q5',
    type: 'essay',
    question: 'Explain the concept of object-oriented programming and provide examples.',
    points: 25,
    explanation: 'Object-oriented programming is a programming paradigm based on objects and classes.'
  }
]

export function QuizSubmission({ answers, setAnswers, readOnly = false }: QuizSubmissionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1)
      }, 1000)
    } else if (timeRemaining === 0) {
      handleSubmit()
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerActive, timeRemaining])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setShowResults(true)
    setIsTimerActive(false)
  }

  const handleStartQuiz = () => {
    setIsTimerActive(true)
  }

  const handleReset = () => {
    setAnswers({})
    setCurrentQuestion(0)
    setTimeRemaining(30 * 60)
    setIsTimerActive(false)
    setShowResults(false)
    setSubmitted(false)
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getTotalPoints = () => {
    return mockQuestions.reduce((total, q) => total + q.points, 0)
  }

  const getAnsweredPoints = () => {
    return mockQuestions
      .filter(q => answers[q.id])
      .reduce((total, q) => total + q.points, 0)
  }

  const isAnswerCorrect = (question: QuizQuestion, answer: any) => {
    if (!answer) return false
    
    switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
      case 'short_answer':
        return answer === question.correct_answer
      case 'multiple_select':
        return Array.isArray(answer) && 
               Array.isArray(question.correct_answer) &&
               answer.length === question.correct_answer.length &&
               answer.every(a => question.correct_answer.includes(a))
      case 'essay':
        return answer && answer.trim().length > 0
      default:
        return false
    }
  }

  const renderQuestion = (question: QuizQuestion) => {
    const currentAnswer = answers[question.id]

    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            disabled={readOnly}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-slate-300 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'multiple_select':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(currentAnswer) ? currentAnswer : []
                    const newAnswer = checked
                      ? [...current, option]
                      : current.filter((a: string) => a !== option)
                    handleAnswerChange(question.id, newAnswer)
                  }}
                  disabled={readOnly}
                />
                <Label htmlFor={`${question.id}-${index}`} className="text-slate-300 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'true_false':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value === 'True')}
            disabled={readOnly}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-slate-300 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'short_answer':
        return (
          <Input
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            disabled={readOnly}
            className="bg-slate-800/50 border-slate-600 text-white"
          />
        )

      case 'essay':
        return (
          <Textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your detailed answer..."
            disabled={readOnly}
            className="min-h-[200px] bg-slate-800/50 border-slate-600 text-white"
          />
        )

      default:
        return <div className="text-slate-400">Unknown question type</div>
    }
  }

  if (!isTimerActive && !submitted && !readOnly) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Quiz Ready</h3>
          <p className="text-slate-400 mb-6">
            This quiz contains {mockQuestions.length} questions with a total of {getTotalPoints()} points.
            <br />
            You have 30 minutes to complete it.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{mockQuestions.length}</div>
              <div className="text-sm text-slate-400">Questions</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{getTotalPoints()}</div>
              <div className="text-sm text-slate-400">Total Points</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">30:00</div>
              <div className="text-sm text-slate-400">Time Limit</div>
            </div>
          </div>
          
          <Button
            onClick={handleStartQuiz}
            className="bg-blue-600/80 hover:bg-blue-600 text-white px-8 py-3"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Quiz
          </Button>
        </GlassCard>
      </div>
    )
  }

  if (showResults && submitted) {
    const correctAnswers = mockQuestions.filter(q => isAnswerCorrect(q, answers[q.id])).length
    const score = (correctAnswers / mockQuestions.length) * 100

    return (
      <div className="space-y-6">
        <GlassCard className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-green-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h3>
          <p className="text-slate-400 mb-6">
            You answered {correctAnswers} out of {mockQuestions.length} questions correctly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{score.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">Score</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{correctAnswers}/{mockQuestions.length}</div>
              <div className="text-sm text-slate-400">Correct</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{getAnsweredPoints()}/{getTotalPoints()}</div>
              <div className="text-sm text-slate-400">Points</div>
            </div>
          </div>
          
          {!readOnly && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          )}
        </GlassCard>

        {/* Results Details */}
        <GlassCard className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Question Review</h4>
          <div className="space-y-6">
            {mockQuestions.map((question, index) => {
              const answer = answers[question.id]
              const isCorrect = isAnswerCorrect(question, answer)
              
              return (
                <div key={question.id} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-500 text-slate-300">
                        Question {index + 1}
                      </Badge>
                      <Badge variant="outline" className="border-slate-500 text-slate-300">
                        {question.points} points
                      </Badge>
                    </div>
                    <Badge className={
                      isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </div>
                  
                  <p className="text-white font-medium mb-3">{question.question}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 text-sm">Your answer: </span>
                      <span className="text-slate-300">
                        {Array.isArray(answer) ? answer.join(', ') : String(answer || 'No answer')}
                      </span>
                    </div>
                    
                    {question.type !== 'essay' && (
                      <div>
                        <span className="text-slate-400 text-sm">Correct answer: </span>
                        <span className="text-green-400">
                          {Array.isArray(question.correct_answer) 
                            ? question.correct_answer.join(', ') 
                            : String(question.correct_answer)
                          }
                        </span>
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400 font-medium text-sm">Explanation</span>
                        </div>
                        <p className="text-blue-200 text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Quiz Submission</h3>
              <p className="text-slate-400 text-sm">Answer all questions to complete the quiz</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Time Remaining</div>
              <div className={`text-lg font-bold ${
                timeRemaining < 300 ? 'text-red-400' : 'text-white'
              }`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-400">Progress</div>
              <div className="text-lg font-bold text-white">
                {getAnsweredCount()}/{mockQuestions.length}
              </div>
            </div>
          </div>
        </div>
        
        <Progress 
          value={(getAnsweredCount() / mockQuestions.length) * 100} 
          className="mt-4 h-2"
        />
      </GlassCard>

      {/* Question Navigation */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {mockQuestions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestion ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                className={
                  index === currentQuestion 
                    ? "bg-blue-600 text-white" 
                    : "border-white/20 text-white hover:bg-white/10"
                }
              >
                {index + 1}
                {answers[mockQuestions[index].id] && (
                  <CheckCircle className="h-3 w-3 ml-1" />
                )}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion(Math.min(mockQuestions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === mockQuestions.length - 1}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Current Question */}
      <GlassCard className="p-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-slate-500 text-slate-300">
                Question {currentQuestion + 1} of {mockQuestions.length}
              </Badge>
              <Badge variant="outline" className="border-slate-500 text-slate-300">
                {mockQuestions[currentQuestion].points} points
              </Badge>
              <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                {mockQuestions[currentQuestion].type.replace('_', ' ')}
              </Badge>
            </div>
            
            {answers[mockQuestions[currentQuestion].id] && (
              <Badge className="bg-green-500/20 text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Answered
              </Badge>
            )}
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-white mb-4">
              {mockQuestions[currentQuestion].question}
            </h4>
            
            {renderQuestion(mockQuestions[currentQuestion])}
          </div>
        </div>
      </GlassCard>

      {/* Submit Button */}
      {!readOnly && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-slate-400">
              {getAnsweredCount()} of {mockQuestions.length} questions answered
            </div>
            
            <Button
              onClick={handleSubmit}
              className="bg-green-600/80 hover:bg-green-600 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Quiz
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
