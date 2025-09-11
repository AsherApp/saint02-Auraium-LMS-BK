"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Assignment, type Submission } from "@/services/assignments/api"
import { 
  FileText, 
  Upload, 
  Code, 
  MessageSquare, 
  Presentation, 
  Users, 
  BookOpen,
  Eye,
  Download,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Github,
  Link,
  Monitor,
  Smartphone,
  Tablet,
  Calendar,
  User,
  ThumbsUp,
  ThumbsDown,
  Star,
  Flag,
  Share2,
  Copy,
  Edit,
  Settings,
  HelpCircle,
  Info
} from "lucide-react"

interface AssignmentViewerProps {
  assignment: MockAssignment
  submission?: MockSubmission | null
  content?: any
}

export function AssignmentViewer({ assignment, submission, content }: AssignmentViewerProps) {
  const [activeView, setActiveView] = useState("content")
  const [fullscreen, setFullscreen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)

  const renderViewer = () => {
    switch (assignment.type) {
      case 'essay':
        return <EssayViewer content={content} />
      case 'file_upload':
        return <FileUploadViewer content={content} />
      case 'quiz':
        return <QuizViewer content={content} />
      case 'project':
        return <ProjectViewer content={content} />
      case 'discussion':
        return <DiscussionViewer content={content} />
      case 'presentation':
        return <PresentationViewer 
          content={content}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          fullscreen={fullscreen}
          setFullscreen={setFullscreen}
          volume={volume}
          setVolume={setVolume}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      case 'code_submission':
        return <CodeViewer content={content} />
      case 'peer_review':
        return <PeerReviewViewer content={content} />
      default:
        return <div className="text-center text-slate-400">No viewer available for this assignment type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Viewer Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-white">Assignment Viewer</h3>
          <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
            {assignment.type.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Viewer Content */}
      <div className={`${fullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
        <GlassCard className={`${fullscreen ? 'h-full' : ''}`}>
          <div className={`${fullscreen ? 'h-full overflow-auto' : ''}`}>
            {renderViewer()}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// Essay Viewer
function EssayViewer({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Essay Content</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-slate-300 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content?.essay || 'No essay content available' }}
          />
        </div>
      </div>
      
      {content?.word_count && (
        <div className="text-sm text-slate-400">
          Word count: {content.word_count}
        </div>
      )}
    </div>
  )
}

// File Upload Viewer
function FileUploadViewer({ content }: { content: any }) {
  const files = content?.files || []
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Uploaded Files</h4>
        <Badge variant="outline" className="border-slate-500 text-slate-300">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {files.length > 0 ? (
        <div className="grid gap-4">
          {files.map((file: any, index: number) => (
            <FilePreview key={index} file={file} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No files uploaded</p>
        </div>
      )}
    </div>
  )
}

// Quiz Viewer
function QuizViewer({ content }: { content: any }) {
  const answers = content?.quiz || {}
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Quiz Results</h4>
        <Badge variant="outline" className="border-slate-500 text-slate-300">
          {Object.keys(answers).length} questions
        </Badge>
      </div>
      
      <div className="space-y-4">
        {Object.entries(answers).map(([questionId, answer]) => (
          <div key={questionId} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h5 className="text-white font-medium">Question {questionId}</h5>
              <Badge className="bg-green-500/20 text-green-400">Answered</Badge>
            </div>
            <div className="text-slate-300">
              {Array.isArray(answer) ? answer.join(', ') : answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Project Viewer
function ProjectViewer({ content }: { content: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Project Submission</h4>
      </div>
      
      {content?.description && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h5 className="text-white font-medium mb-2">Project Description</h5>
          <p className="text-slate-300 whitespace-pre-wrap">{content.description}</p>
        </div>
      )}
      
      {content?.files && content.files.length > 0 && (
        <div>
          <h5 className="text-white font-medium mb-2">Project Files</h5>
          <div className="grid gap-2">
            {content.files.map((file: any, index: number) => (
              <FilePreview key={index} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Discussion Viewer
function DiscussionViewer({ content }: { content: any }) {
  const post = content?.discussion_post || ''
  const replies = content?.replies || []
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Discussion Post</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ThumbsUp className="h-4 w-4 mr-1" />
            Like
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />
            Reply
          </Button>
        </div>
      </div>
      
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium">Student</span>
              <span className="text-slate-400 text-sm">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">{post}</p>
          </div>
        </div>
      </div>
      
      {replies.length > 0 && (
        <div>
          <h5 className="text-white font-medium mb-2">Replies ({replies.length})</h5>
          <div className="space-y-3">
            {replies.map((reply: any, index: number) => (
              <div key={index} className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">{reply.reply_to}</span>
                      <span className="text-slate-400 text-xs">
                        {new Date(reply.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{reply.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Presentation Viewer
function PresentationViewer({ 
  content, 
  currentSlide, 
  setCurrentSlide, 
  fullscreen, 
  setFullscreen,
  volume,
  setVolume,
  isPlaying,
  setIsPlaying
}: { 
  content: any
  currentSlide: number
  setCurrentSlide: (slide: number) => void
  fullscreen: boolean
  setFullscreen: (fullscreen: boolean) => void
  volume: number
  setVolume: (volume: number) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
}) {
  const presentationUrl = content?.presentation_url || ''
  const slides = content?.slides || []
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Presentation</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {presentationUrl ? (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={presentationUrl}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <Presentation className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No presentation URL provided</p>
        </div>
      )}
      
      {content?.features && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h5 className="text-white font-medium mb-2">Features Covered</h5>
          <div className="flex flex-wrap gap-2">
            {content.features.map((feature: string, index: number) => (
              <Badge key={index} variant="outline" className="border-slate-500 text-slate-300">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Code Viewer
function CodeViewer({ content }: { content: any }) {
  const code = content?.code || ''
  const repositoryUrl = content?.repository_url || ''
  const demoUrl = content?.demo_url || ''
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Code Submission</h4>
        <div className="flex gap-2">
          {repositoryUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-1" />
                Repository
              </a>
            </Button>
          )}
          {demoUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Demo
              </a>
            </Button>
          )}
        </div>
      </div>
      
      {code && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300 text-sm">Code</span>
            </div>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-slate-300 text-sm">{code}</code>
          </pre>
        </div>
      )}
      
      {content?.features && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h5 className="text-white font-medium mb-2">Features Implemented</h5>
          <div className="flex flex-wrap gap-2">
            {content.features.map((feature: string, index: number) => (
              <Badge key={index} variant="outline" className="border-slate-500 text-slate-300">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Peer Review Viewer
function PeerReviewViewer({ content }: { content: any }) {
  const reviewedStudent = content?.reviewed_student || ''
  const criteria = content?.review_criteria || {}
  const feedback = content?.detailed_feedback || ''
  const rating = content?.overall_rating || 0
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-white">Peer Review</h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-slate-400'
                }`}
              />
            ))}
          </div>
          <span className="text-slate-300 text-sm">{rating}/5</span>
        </div>
      </div>
      
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
        <h5 className="text-white font-medium mb-2">Reviewed: {reviewedStudent}</h5>
        
        {Object.keys(criteria).length > 0 && (
          <div className="mb-4">
            <h6 className="text-slate-300 font-medium mb-2">Review Criteria</h6>
            <div className="space-y-2">
              {Object.entries(criteria).map(([criterion, score]) => (
                <div key={criterion} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{criterion}</span>
                  <Badge variant="outline" className="border-slate-500 text-slate-300">
                    {score}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {feedback && (
          <div>
            <h6 className="text-slate-300 font-medium mb-2">Detailed Feedback</h6>
            <p className="text-slate-300 whitespace-pre-wrap">{feedback}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// File Preview Component
function FilePreview({ file }: { file: any }) {
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-4 w-4" />
    if (type.includes('video')) return <Video className="h-4 w-4" />
    if (type.includes('audio')) return <Music className="h-4 w-4" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
      <div className="p-2 bg-slate-700/50 rounded">
        {getFileIcon(file.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{file.name}</p>
        <p className="text-slate-400 text-xs">{formatFileSize(file.size)}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
