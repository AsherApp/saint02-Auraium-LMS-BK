"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  PlayCircle, 
  FileText, 
  MessageSquare, 
  BarChart2, 
  HelpCircle, 
  Download,
  Link,
  CheckCircle,
  XCircle,
  Send
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { http } from "@/services/http"
import { ProgressAPI } from '@/services/progress/api'
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/auth-store"
import { VideoProgressTracker } from "./video-progress-tracker"

type ContentViewerProps = {
  lesson: {
    id: string
    title: string
    type: "video" | "quiz" | "file" | "discussion" | "poll"
    content: any
    description?: string
  }
  courseId?: string
  moduleId?: string
}

export function ContentViewer({ lesson, courseId, moduleId }: ContentViewerProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({})
  const [discussionResponse, setDiscussionResponse] = useState("")
  const [pollVote, setPollVote] = useState<number | null>(null)
  const [pollSubmitted, setPollSubmitted] = useState(false)
  const [submittingPoll, setSubmittingPoll] = useState(false)

  const getTypeIcon = () => {
    switch (lesson.type) {
      case "video":
        return <PlayCircle className="h-6 w-6" />
      case "quiz":
        return <HelpCircle className="h-6 w-6" />
      case "file":
        return <FileText className="h-6 w-6" />
      case "discussion":
        return <MessageSquare className="h-6 w-6" />
      case "poll":
        return <BarChart2 className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  const renderContent = () => {
    switch (lesson.type) {
      case "video":
        return <VideoViewer content={lesson.content} />
      case "quiz":
        return <QuizViewer 
          content={lesson.content} 
          answers={quizAnswers}
          setAnswers={setQuizAnswers}
          submitted={quizSubmitted}
          setSubmitted={setQuizSubmitted}
          results={quizResults}
          setResults={setQuizResults}
        />
      case "file":
        return <FileViewer content={lesson.content} />
      case "discussion":
        return <DiscussionViewer 
          content={lesson.content}
          response={discussionResponse}
          setResponse={setDiscussionResponse}
        />
      case "poll":
        return <PollViewer 
          content={lesson.content}
          vote={pollVote}
          setVote={setPollVote}
          submitted={pollSubmitted}
          setSubmitted={setPollSubmitted}
          onSubmitVote={handlePollVote}
          submitting={submittingPoll}
        />
      default:
        return <div className="text-slate-400">No content available</div>
    }
  }

  const handlePollVote = async () => {
    if (pollVote === null || !courseId || !user?.email) return

    setSubmittingPoll(true)
    try {
      // Submit poll vote
      await http(`/api/polls/${lesson.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({
          optionIndex: pollVote,
          studentEmail: user.email,
          courseId,
          moduleId
        })
      })

      // Record poll participation in progress
      await ProgressAPI.recordPollParticipation({
        courseId,
        moduleId,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        pollQuestion: lesson.content?.poll?.question,
        selectedOption: lesson.content?.poll?.options?.[pollVote]
      })

      setPollSubmitted(true)
      toast({
        title: "Vote Submitted!",
        description: "Your poll response has been recorded.",
      })
    } catch (error) {
      console.error('Error submitting poll vote:', error)
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmittingPoll(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            {getTypeIcon()}
            <div className="flex-1">
              <CardTitle className="text-white">{lesson.title}</CardTitle>
              {lesson.description && (
                <p className="text-slate-400 text-sm mt-1">{lesson.description}</p>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {lesson.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}

function VideoViewer({ content }: { content: any }) {
  if (!content?.video?.url) {
    return (
      <div className="text-center py-8 text-slate-400">
        <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No video content available</p>
      </div>
    )
  }

  const renderVideoContent = () => {
    if (content.video.source === "upload") {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video 
            controls 
            className="w-full h-full"
            id={`video-${content.lessonId}`}
          >
            <source src={content.video.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    } else if (content.video.source === "onedrive") {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={content.video.url}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    } else if (content.video.source === "googledrive") {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={content.video.url.replace('/view', '/preview')}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    // Fallback for direct video URLs
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video 
          controls 
          className="w-full h-full"
          id={`video-${content.lessonId}`}
        >
          <source src={content.video.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderVideoContent()}
      
      {/* Progress Tracker */}
      <VideoProgressTracker
        lessonId={content.lessonId}
        courseId={content.courseId}
        moduleId={content.moduleId}
        videoSource={content.video.source || 'upload'}
        allowSkip={true}
        minWatchTime={30}
      />

      {content.video.description && (
        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-sm text-slate-300">{content.video.description}</p>
        </div>
      )}
    </div>
  )
}

function QuizViewer({ 
  content, 
  answers, 
  setAnswers, 
  submitted, 
  setSubmitted, 
  results, 
  setResults 
}: { 
  content: any
  answers: Record<string, number>
  setAnswers: (answers: Record<string, number>) => void
  submitted: boolean
  setSubmitted: (submitted: boolean) => void
  results: Record<string, boolean>
  setResults: (results: Record<string, boolean>) => void
}) {
  const questions = content?.quiz?.questions || []

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No quiz questions available</p>
      </div>
    )
  }

  const handleSubmit = () => {
    const newResults: Record<string, boolean> = {}
    questions.forEach((q: any) => {
      newResults[q.id] = answers[q.id] === q.correctIndex
    })
    setResults(newResults)
    setSubmitted(true)
  }

  const correctAnswers = Object.values(results).filter(Boolean).length
  const score = Math.round((correctAnswers / questions.length) * 100)

  return (
    <div className="space-y-4">
      {submitted && (
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-white">Quiz Results</h3>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {score}% ({correctAnswers}/{questions.length})
            </Badge>
          </div>
          <Progress value={score} className="h-2" />
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q: any, i: number) => (
          <div key={q.id} className="border border-white/10 rounded-lg p-4">
            <p className="font-medium mb-3 text-white">
              {i + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options?.map((opt: string, j: number) => (
                <label key={j} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`quiz-${q.id}`}
                    value={j}
                    checked={answers[q.id] === j}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: parseInt(e.target.value) })}
                    disabled={submitted}
                    className="text-blue-500"
                  />
                  <span className={`text-sm ${
                    submitted 
                      ? j === q.correctIndex 
                        ? 'text-green-400' 
                        : answers[q.id] === j && j !== q.correctIndex
                        ? 'text-red-400'
                        : 'text-slate-300'
                      : 'text-slate-300'
                  }`}>
                    {opt}
                  </span>
                  {submitted && j === q.correctIndex && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                  {submitted && answers[q.id] === j && j !== q.correctIndex && (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <Button 
          onClick={handleSubmit}
          className="bg-blue-600/80 hover:bg-blue-600 text-white"
          disabled={Object.keys(answers).length < questions.length}
        >
          Submit Quiz
        </Button>
      )}
    </div>
  )
}

function FileViewer({ content }: { content: any }) {
  if (!content?.file?.url) {
    return (
      <div className="text-center py-8 text-slate-400">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No file content available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-8 w-8 text-blue-400" />
          <div>
            <h3 className="font-medium text-white">{content.file.name || "File"}</h3>
            <p className="text-sm text-slate-400">{content.file.url}</p>
          </div>
        </div>
        {content.file.description && (
          <p className="text-sm text-slate-300 mb-3">{content.file.description}</p>
        )}
        <div className="flex gap-2">
          <Button asChild className="bg-blue-600/80 hover:bg-blue-600">
            <a href={content.file.url} target="_blank" rel="noopener noreferrer">
              <Link className="h-4 w-4 mr-1" />
              Open File
            </a>
          </Button>
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}

function DiscussionViewer({ 
  content, 
  response, 
  setResponse 
}: { 
  content: any
  response: string
  setResponse: (response: string) => void
}) {
  if (!content?.discussion?.prompt) {
    return (
      <div className="text-center py-8 text-slate-400">
        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No discussion prompt available</p>
      </div>
    )
  }

  const handleSubmit = () => {
    // In a real implementation, this would save to the backend
    console.log('Discussion response:', response)
    setResponse("")
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <h3 className="font-medium text-white">Discussion Topic</h3>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-4">
          <p className="text-slate-200">{content.discussion.prompt}</p>
        </div>
        {content.discussion.instructions && (
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-4">
            <p className="text-sm text-blue-300">{content.discussion.instructions}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-white">Your Response</Label>
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Share your thoughts on this discussion topic..."
          className="bg-white/5 border-white/10 text-white min-h-24"
        />
        <Button 
          onClick={handleSubmit}
          className="bg-blue-600/80 hover:bg-blue-600 text-white"
          disabled={!response.trim()}
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Response
        </Button>
      </div>
    </div>
  )
}

function PollViewer({ 
  content, 
  vote, 
  setVote, 
  submitted, 
  setSubmitted, 
  onSubmitVote,
  submitting
}: { 
  content: any
  vote: number | null
  setVote: (vote: number | null) => void
  submitted: boolean
  setSubmitted: (submitted: boolean) => void
  onSubmitVote: () => Promise<void>
  submitting: boolean
}) {
  if (!content?.poll?.question) {
    return (
      <div className="text-center py-8 text-slate-400">
        <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No poll question available</p>
      </div>
    )
  }

  const handleVote = () => {
    if (vote !== null) {
      onSubmitVote()
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-5 w-5 text-blue-400" />
          <h3 className="font-medium text-white">Poll Question</h3>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-4">
          <p className="font-medium text-white">{content.poll.question}</p>
        </div>
      </div>

      {!submitted ? (
        <div className="space-y-3">
          <Label className="text-white">Select your answer:</Label>
          <div className="space-y-2">
            {content.poll.options?.map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="poll-vote"
                  value={i}
                  checked={vote === i}
                  onChange={(e) => setVote(parseInt(e.target.value))}
                  className="text-blue-500"
                />
                <span className="text-slate-300">{opt}</span>
              </label>
            ))}
          </div>
          <Button 
            onClick={handleVote}
            className="bg-blue-600/80 hover:bg-blue-600 text-white"
            disabled={vote === null || submitting}
          >
            {submitting ? "Submitting..." : "Submit Vote"}
          </Button>
        </div>
      ) : (
        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-green-400">Thank you for voting!</p>
          </div>
        </div>
      )}
    </div>
  )
} 