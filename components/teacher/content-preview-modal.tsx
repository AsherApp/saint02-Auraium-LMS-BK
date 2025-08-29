"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlayCircle, FileText, MessageSquare, BarChart2, HelpCircle, Upload, Link, Download, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { http } from "@/services/http"

type ContentPreviewProps = {
  lesson: {
    id: string
    title: string
    type: "video" | "quiz" | "file" | "discussion" | "poll"
    content: any
    description?: string
  }
  trigger?: React.ReactNode
}

export function ContentPreviewModal({ lesson, trigger }: ContentPreviewProps) {
  const [open, setOpen] = useState(false)
  const [freshLesson, setFreshLesson] = useState(lesson)
  const [loading, setLoading] = useState(false)

  // Fetch fresh lesson data when modal opens
  useEffect(() => {
    if (open) {
      fetchFreshLesson()
    }
  }, [open, lesson.id])

  const fetchFreshLesson = async () => {
    setLoading(true)
    try {
      const updatedLesson = await http<any>(`/api/lessons/${lesson.id}`)
      setFreshLesson(updatedLesson)
    } catch (error) {
      console.error('Error fetching fresh lesson data:', error)
      // Fallback to original lesson data
      setFreshLesson(lesson)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8 text-slate-400">
          <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin opacity-50" />
          <p>Loading content...</p>
        </div>
      )
    }

    switch (freshLesson.type) {
      case "video":
        return <VideoPreview content={freshLesson.content} />
      case "quiz":
        return <QuizPreview content={freshLesson.content} />
      case "file":
        return <FilePreview content={freshLesson.content} />
      case "discussion":
        return <DiscussionPreview content={freshLesson.content} />
      case "poll":
        return <PollPreview content={freshLesson.content} />
      default:
        return <div className="text-slate-400">No content available</div>
    }
  }

  const getTypeIcon = () => {
    switch (freshLesson.type) {
      case "video":
        return <PlayCircle className="h-5 w-5" />
      case "quiz":
        return <HelpCircle className="h-5 w-5" />
      case "file":
        return <FileText className="h-5 w-5" />
      case "discussion":
        return <MessageSquare className="h-5 w-5" />
      case "poll":
        return <BarChart2 className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
            <PlayCircle className="h-4 w-4 mr-1" />
            Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <DialogTitle>{freshLesson.title}</DialogTitle>
            <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/10 capitalize">
              {freshLesson.type}
            </Badge>
          </div>
          {freshLesson.description && (
            <DialogDescription className="text-slate-300">
              {freshLesson.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VideoPreview({ content }: { content: any }) {
  if (!content?.video?.url) {
    return (
      <div className="text-center py-8 text-slate-400">
        <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No video content available</p>
      </div>
    )
  }

  const isYouTube = content.video.url.includes('youtube.com') || content.video.url.includes('youtu.be')
  const isVimeo = content.video.url.includes('vimeo.com')

  const getEmbedUrl = (url: string) => {
    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (isVimeo) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
    return null
  }

  const embedUrl = getEmbedUrl(content.video.url)

  return (
    <div className="space-y-4">
      {embedUrl ? (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
          <div className="text-center">
            <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-slate-400">Video preview not available</p>
            <a
              href={content.video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Open video in new tab
            </a>
          </div>
        </div>
      )}
      {content.video.description && (
        <div className="bg-white/5 p-3 rounded-lg">
          <p className="text-sm text-slate-300">{content.video.description}</p>
        </div>
      )}
    </div>
  )
}

function QuizPreview({ content }: { content: any }) {
  const questions = content?.quiz?.questions || []

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No quiz questions available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Quiz Preview ({questions.length} questions)</h3>
        <div className="space-y-4">
          {questions.map((q: any, i: number) => (
            <div key={q.id} className="border border-white/10 rounded-lg p-3">
              <p className="font-medium mb-2">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-1">
                {q.options?.map((opt: string, j: number) => (
                  <div key={j} className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
                      {j === q.correctIndex ? (
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      ) : (
                        <span className="w-2 h-2 bg-transparent rounded-full"></span>
                      )}
                    </span>
                    <span className={j === q.correctIndex ? "text-green-400" : "text-slate-300"}>
                      {opt}
                    </span>
                    {j === q.correctIndex && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        Correct
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FilePreview({ content }: { content: any }) {
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
            <h3 className="font-medium">{content.file.name || "File"}</h3>
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

function DiscussionPreview({ content }: { content: any }) {
  if (!content?.discussion?.prompt) {
    return (
      <div className="text-center py-8 text-slate-400">
        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No discussion prompt available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <h3 className="font-medium">Discussion Topic</h3>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <p className="text-slate-200">{content.discussion.prompt}</p>
        </div>
        <div className="mt-3 text-sm text-slate-400">
          Students will be able to respond to this discussion prompt and engage with each other's responses.
        </div>
      </div>
    </div>
  )
}

function PollPreview({ content }: { content: any }) {
  if (!content?.poll?.question) {
    return (
      <div className="text-center py-8 text-slate-400">
        <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No poll question available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-5 w-5 text-blue-400" />
          <h3 className="font-medium">Poll Question</h3>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-3">
          <p className="font-medium">{content.poll.question}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-400 mb-2">Options:</p>
          {content.poll.options?.map((opt: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              </span>
              <span className="text-slate-300">{opt}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-slate-400">
          Students will be able to vote on these options and see the results.
        </div>
      </div>
    </div>
  )
} 