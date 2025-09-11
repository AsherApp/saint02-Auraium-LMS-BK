"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { 
  FileText, 
  Save, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Eye,
  EyeOff
} from "lucide-react"

interface EssaySubmissionProps {
  content: string
  setContent: (content: string) => void
  readOnly?: boolean
}

export function EssaySubmission({ content, setContent, readOnly = false }: EssaySubmissionProps) {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isPreview, setIsPreview] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (content) {
      const words = content.trim().split(/\s+/).filter(word => word.length > 0).length
      setWordCount(words)
      setCharCount(content.length)
    }
  }, [content])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setLastSaved(new Date())
  }

  const getWordCountColor = () => {
    if (wordCount < 100) return "text-red-400"
    if (wordCount < 500) return "text-yellow-400"
    if (wordCount < 1000) return "text-blue-400"
    return "text-green-400"
  }

  const getWordCountStatus = () => {
    if (wordCount < 100) return "Too short"
    if (wordCount < 500) return "Getting there"
    if (wordCount < 1000) return "Good length"
    return "Excellent"
  }

  return (
    <div className="space-y-6">
      {/* Essay Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Essay Submission</h3>
            <p className="text-slate-400 text-sm">Write your essay response below</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {isPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Word Count Stats */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getWordCountColor()}`}>{wordCount}</div>
            <div className="text-sm text-slate-400">Words</div>
            <Badge variant="outline" className={`mt-1 ${getWordCountColor()} border-current`}>
              {getWordCountStatus()}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-300">{charCount}</div>
            <div className="text-sm text-slate-400">Characters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-300">
              {wordCount > 0 ? Math.round(charCount / wordCount) : 0}
            </div>
            <div className="text-sm text-slate-400">Avg. Word Length</div>
          </div>
        </div>
      </GlassCard>

      {/* Essay Editor */}
      <GlassCard className="p-6">
        {!readOnly ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="essay-content" className="text-white font-medium">
                Essay Content
              </Label>
              {lastSaved && (
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Clock className="h-3 w-3" />
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            
            {isPreview ? (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 min-h-[400px]">
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-slate-300 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: content || 'No content to preview' }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <RichTextEditor
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your essay here..."
                  className="min-h-[400px]"
                />
                
                {/* Writing Tips */}
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">Writing Tips</h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Use clear, concise language</li>
                    <li>• Structure your essay with an introduction, body, and conclusion</li>
                    <li>• Support your arguments with evidence and examples</li>
                    <li>• Proofread for grammar and spelling errors</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Label className="text-white font-medium">Essay Content</Label>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 min-h-[400px]">
              <div className="prose prose-invert max-w-none">
                <div 
                  className="text-slate-300 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: content || 'No essay content available' }}
                />
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Auto-save Indicator */}
      {!readOnly && (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Auto-saving...</span>
          </div>
        </div>
      )}
    </div>
  )
}
