"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"

interface Question {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false'
  options?: string[]
  correct_answer: string
  points: number
}

interface ModuleExamCreatorProps {
  moduleId: string
  courseId: string
  onClose: () => void
  onSuccess?: () => void
}

export function ModuleExamCreator({ moduleId, courseId, onClose, onSuccess }: ModuleExamCreatorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    time_limit_minutes: 30,
    passing_score: 70,
    max_attempts: 2
  })
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      points: 1
    }
  ])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: (questions.length + 1).toString(),
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      points: 1
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (questionId: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId))
    }
  }

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ))
  }

  const updateQuestionOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options]
        newOptions[optionIndex] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const validateExam = () => {
    if (!examData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Exam title is required",
        variant: "destructive"
      })
      return false
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one question is required",
        variant: "destructive"
      })
      return false
    }

    for (const question of questions) {
      if (!question.question.trim()) {
        toast({
          title: "Validation Error",
          description: "All questions must have text",
          variant: "destructive"
        })
        return false
      }

      if (question.type === "multiple_choice") {
        if (!question.options || question.options.some(opt => !opt.trim())) {
          toast({
            title: "Validation Error",
            description: "All multiple choice options must be filled",
            variant: "destructive"
          })
          return false
        }
        if (!question.correct_answer) {
          toast({
            title: "Validation Error",
            description: "Correct answer must be selected for all questions",
            variant: "destructive"
          })
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateExam()) return

    setLoading(true)
    try {
      const examPayload = {
        course_id: courseId,
        module_id: moduleId,
        title: examData.title,
        description: examData.description,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.type === "multiple_choice" ? q.options : undefined,
          correct_answer: q.correct_answer,
          points: q.points
        })),
        time_limit_minutes: examData.time_limit_minutes,
        passing_score: examData.passing_score,
        max_attempts: examData.max_attempts,
        is_module_exam: true,
        is_published: true
      }

      await http.post("/quizzes", examPayload)

      toast({
        title: "Success",
        description: "Module exam created successfully!",
      })

      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create module exam",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Module Exam</Badge>
            Create Module Exam
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Exam Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                placeholder="e.g., Module 1 Final Exam"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_limit">Time Limit (minutes)</Label>
              <Input
                id="time_limit"
                type="number"
                value={examData.time_limit_minutes}
                onChange={(e) => setExamData({ ...examData, time_limit_minutes: parseInt(e.target.value) || 30 })}
                min="5"
                max="180"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passing_score">Passing Score (%)</Label>
              <Input
                id="passing_score"
                type="number"
                value={examData.passing_score}
                onChange={(e) => setExamData({ ...examData, passing_score: parseInt(e.target.value) || 70 })}
                min="50"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_attempts">Max Attempts</Label>
              <Input
                id="max_attempts"
                type="number"
                value={examData.max_attempts}
                onChange={(e) => setExamData({ ...examData, max_attempts: parseInt(e.target.value) || 2 })}
                min="1"
                max="5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={examData.description}
              onChange={(e) => setExamData({ ...examData, description: e.target.value })}
              placeholder="Brief description of the exam..."
              rows={3}
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
              <Button onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Text *</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                        placeholder="Enter your question here..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(question.id, "type", e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, "points", parseInt(e.target.value) || 1)}
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>

                    {question.type === "multiple_choice" && (
                      <div className="space-y-2">
                        <Label>Answer Options *</Label>
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateQuestionOption(question.id, optionIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                            />
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              value={String.fromCharCode(65 + optionIndex)}
                              checked={question.correct_answer === String.fromCharCode(65 + optionIndex)}
                              onChange={(e) => updateQuestion(question.id, "correct_answer", e.target.value)}
                              className="w-4 h-4"
                            />
                            <Label className="text-sm">Correct</Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "true_false" && (
                      <div className="space-y-2">
                        <Label>Correct Answer *</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              value="true"
                              checked={question.correct_answer === "true"}
                              onChange={(e) => updateQuestion(question.id, "correct_answer", e.target.value)}
                              className="w-4 h-4"
                            />
                            True
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              value="false"
                              checked={question.correct_answer === "false"}
                              onChange={(e) => updateQuestion(question.id, "correct_answer", e.target.value)}
                              className="w-4 h-4"
                            />
                            False
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Exam
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
