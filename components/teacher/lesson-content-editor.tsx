"use client"

import { useEffect, useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  PlayCircle, 
  FileText, 
  MessageSquare, 
  BarChart2, 
  HelpCircle, 
  Upload, 
  Link, 
  Plus, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import type { Lesson, LessonContent, LessonType } from "@/store/course-store"
import { uploadVideo, uploadFile } from "@/services/upload/api"
import { useToast } from "@/hooks/use-toast"
import { useVideoCompression } from "@/hooks/use-video-compression"
import { needsCompression, formatFileSize } from "@/lib/video-compression"

type Props = {
  lesson: Lesson
  onCancel?: () => void
  onSave?: (content: LessonContent) => void
}

export function LessonContentEditor({ lesson, onCancel = () => {}, onSave = () => {} }: Props) {
  const type: LessonType = lesson.type
  const [content, setContent] = useState<LessonContent>(lesson.content || {})
  const { activeTab, handleTabChange } = useFluidTabs("content")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)
  const { toast } = useToast()
  const { state: compressionState, compress, reset: resetCompression } = useVideoCompression()

  useEffect(() => {
    setContent(lesson.content || {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, lesson.type])

  function setField(path: string[], value: any) {
    // simple path setter e.g., ["video","url"]
    setContent((prev) => {
      const next: LessonContent = { ...prev }
      let obj: any = next
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i]
        obj[k] = obj[k] ?? {}
        obj = obj[k]
      }
      obj[path[path.length - 1]] = value
      return next
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, contentType: 'video' | 'file') => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    resetCompression()

    // Check if file needs compression
    if (needsCompression(file, 50)) {
      toast({
        title: "Large file detected",
        description: `File size (${formatFileSize(file.size)}) exceeds 50MB limit. Compression will be applied automatically.`,
      })
      
      try {
        const compressionResult = await compress(file, {
          maxSizeMB: 50,
          quality: 0.95, // Pixel-perfect clarity
          maxWidth: 1920, // Higher resolution
          maxHeight: 1080,
          audioQuality: 0.9 // High audio quality
        })

        if (compressionResult.success) {
          // Store thumbnail if available
          if (compressionResult.thumbnail) {
            setVideoThumbnail(compressionResult.thumbnail)
          }
          await uploadCompressedFile(compressionResult.compressedFile, contentType)
        } else {
          throw new Error(compressionResult.error || 'Compression failed')
        }
      } catch (error) {
        console.error("Compression error:", error)
        toast({
          title: "Compression failed",
          description: error instanceof Error ? error.message : "Failed to compress file",
          variant: "destructive",
        })
        setSelectedFile(null)
      }
    } else {
      // File is small enough, upload directly
      await uploadCompressedFile(file, contentType)
    }
  }

  const uploadCompressedFile = async (file: File, contentType: 'video' | 'file') => {
    setUploading(true)
    try {
      let uploadResult
      if (contentType === 'video') {
        uploadResult = await uploadVideo(file)
        setField(["video", "url"], uploadResult.file.url)
        setField(["video", "name"], uploadResult.file.name)
        setField(["video", "size"], uploadResult.file.size)
        setField(["video", "type"], uploadResult.file.type)
        // Store thumbnail if available
        if (videoThumbnail) {
          setField(["video", "thumbnail"], videoThumbnail)
        }
      } else {
        uploadResult = await uploadFile(file)
        setField(["file", "url"], uploadResult.file.url)
        setField(["file", "name"], uploadResult.file.name)
        setField(["file", "size"], uploadResult.file.size)
        setField(["file", "type"], uploadResult.file.type)
      }
      
      toast({ 
        title: "Upload successful", 
        description: `${file.name} has been uploaded successfully.` 
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({ 
        title: "Upload failed", 
        description: "Failed to upload file. Please try again.", 
        variant: "destructive" 
      })
    } finally {
      setUploading(false)
      setSelectedFile(null)
    }
  }

  const getContentPreview = () => {
    switch (type) {
      case "video":
        return content?.video?.url ? (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {content.video.source === "upload" ? (
              <div className="relative w-full h-full">
                {/* Show thumbnail as poster if available */}
                <video 
                  controls 
                  className="w-full h-full"
                  poster={content.video.thumbnail}
                >
                  <source src={content.video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : content.video.source === "onedrive" ? (
              <iframe
                src={content.video.url}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : content.video.source === "googledrive" ? (
              <iframe
                src={content.video.url.replace('/view', '/preview')}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full h-full">
                <source src={content.video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ) : null
      case "file":
        return content?.file?.url ? (
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="font-medium">{content.file.name || "File"}</h3>
                <p className="text-sm text-slate-400">{content.file.url}</p>
              </div>
            </div>
          </div>
        ) : null
      case "quiz":
        return content?.quiz?.questions && content.quiz.questions.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium text-white">Quiz Preview ({content.quiz.questions.length} questions)</h3>
            <div className="space-y-4">
              {content.quiz.questions.map((q: any, i: number) => (
                <div key={q.id} className="border border-white/10 rounded-lg p-3">
                  <p className="font-medium mb-2 text-white">
                    {i + 1}. {q.question}
                  </p>
                  <div className="space-y-1">
                    {q.options?.map((opt: string, j: number) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
                          {q.type === "multi-select" 
                            ? (q.correctIndexes || []).includes(j) 
                              ? <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              : <span className="w-2 h-2 bg-transparent rounded-full"></span>
                            : j === q.correctIndex 
                              ? <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              : <span className="w-2 h-2 bg-transparent rounded-full"></span>
                          }
                        </span>
                        <span className={q.type === "multi-select" 
                          ? (q.correctIndexes || []).includes(j) ? "text-green-400" : "text-slate-300"
                          : j === q.correctIndex ? "text-green-400" : "text-slate-300"
                        }>
                          {opt}
                        </span>
                        {(q.type === "multi-select" && (q.correctIndexes || []).includes(j)) || 
                         (q.type !== "multi-select" && j === q.correctIndex) ? (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Correct
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null
      case "discussion":
        return content?.discussion?.prompt ? (
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium text-white">Discussion Topic</h3>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="text-slate-200">{content.discussion.prompt}</p>
              </div>
              {content.discussion.instructions && (
                <div className="mt-3 text-sm text-slate-400">
                  Instructions: {content.discussion.instructions}
                </div>
              )}
            </div>
          </div>
        ) : null
      case "poll":
        return content?.poll?.question ? (
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium text-white">Poll Question</h3>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-3">
                <p className="font-medium text-white">{content.poll.question}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Options:</p>
                {content.poll.options?.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    </span>
                    <span className="text-slate-300">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null
      default:
        return null
    }
  }

  const tabs = [
    {
      id: "content",
      label: "Content",
      icon: <Eye className="h-4 w-4" />
    },
    {
      id: "preview", 
      label: "Preview",
      icon: <PlayCircle className="h-4 w-4" />
    }
  ]

  return (
    <div className="space-y-6">
      <FluidTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="compact"
        width="auto"
        className="mb-6"
      />

      {activeTab === "content" && (
        <div className="space-y-4">
          {type === "video" && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <PlayCircle className="h-5 w-5" />
                  Video Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Video Source</Label>
                  <Select 
                    value={content?.video?.source || "upload"} 
                    onValueChange={(value) => setField(["video", "source"], value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 text-white border-white/10">
                      <SelectItem value="upload">Upload Video File</SelectItem>
                      <SelectItem value="onedrive">OneDrive Link</SelectItem>
                      <SelectItem value="googledrive">Google Drive Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {content?.video?.source === "upload" ? (
                  <div className="space-y-2">
                    <Label>Upload Video</Label>
                    
                    {/* Show video thumbnail if uploaded, otherwise show upload area */}
                    {content?.video?.url ? (
                      <div className="border border-white/20 rounded-lg overflow-hidden">
                        <div className="relative aspect-video bg-black">
                          <video 
                            controls 
                            className="w-full h-full"
                            poster={content.video.thumbnail}
                          >
                            <source src={content.video.url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          {/* Overlay with file info */}
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {content.video.name && (
                              <div className="truncate max-w-32" title={content.video.name}>
                                {content.video.name}
                              </div>
                            )}
                            {content.video.size && (
                              <div className="text-gray-300">
                                {formatFileSize(content.video.size)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-white">Video uploaded successfully</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              Replace Video
                            </Button>
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'video')}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-sm text-slate-400 mb-2">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-slate-500 mb-4">
                            MP4, WebM, or OGG up to 50MB (larger files will be compressed automatically)
                          </p>
                          <Button
                            variant="secondary"
                            className="bg-white/10 hover:bg-white/20"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || compressionState.isCompressing}
                          >
                            {uploading || compressionState.isCompressing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploading ? 'Uploading...' : compressionState.isCompressing ? 'Compressing...' : 'Choose File'}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'video')}
                          />
                        </div>
                        
                        {/* Simple Upload Progress - Only show when processing */}
                        {(uploading || compressionState.isCompressing) && (
                          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                              <div className="flex-1">
                                <p className="text-sm text-white">
                                  {compressionState.isCompressing ? 'Compressing video...' : 'Uploading...'}
                                </p>
                                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${compressionState.progress}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">
                                {Math.round(compressionState.progress)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : content?.video?.source === "onedrive" ? (
                  <div className="space-y-2">
                    <Label>OneDrive Video Link</Label>
                    <Input
                      placeholder="https://onedrive.live.com/embed?resid=..."
                      className="bg-white/5 border-white/10 text-white"
                      value={content.video?.url || ""}
                      onChange={(e) => setField(["video", "url"], e.target.value)}
                    />
                    <p className="text-xs text-slate-400">
                      Paste your OneDrive video embed link. Make sure the video is set to "Anyone with the link can view"
                    </p>
                  </div>
                ) : content?.video?.source === "googledrive" ? (
                  <div className="space-y-2">
                    <Label>Google Drive Video Link</Label>
                    <Input
                      placeholder="https://drive.google.com/file/d/.../view"
                      className="bg-white/5 border-white/10 text-white"
                      value={content.video?.url || ""}
                      onChange={(e) => setField(["video", "url"], e.target.value)}
                    />
                    <p className="text-xs text-slate-400">
                      Paste your Google Drive video link. Make sure the video is set to "Anyone with the link can view"
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Brief description of the video content..."
                    className="bg-white/5 border-white/10 text-white min-h-20"
                    value={content.video?.description || ""}
                    onChange={(e) => setField(["video", "description"], e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "file" && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  File Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>File Source</Label>
                  <Select 
                    value={content?.file?.source || "url"} 
                    onValueChange={(value) => setField(["file", "source"], value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 text-white border-white/10">
                      <SelectItem value="url">File URL</SelectItem>
                      <SelectItem value="upload">Upload File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {content?.file?.source === "url" ? (
                  <div className="space-y-2">
                    <Label>File URL</Label>
                    <Input
                      placeholder="https://..."
                      className="bg-white/5 border-white/10 text-white"
                      value={content.file?.url || ""}
                      onChange={(e) => setField(["file", "url"], e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-400 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 mb-4">
                        PDF, DOC, PPT, or any file up to 50MB
                      </p>
                      <Button
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || compressionState.isCompressing}
                      >
                        {uploading || compressionState.isCompressing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploading ? 'Uploading...' : compressionState.isCompressing ? 'Compressing...' : 'Choose File'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'file')}
                      />
                    </div>
                    
                    {/* Simple File Upload Progress - Only show when processing */}
                    {(uploading || compressionState.isCompressing) && (
                      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-400" />
                          <div className="flex-1">
                            <p className="text-sm text-white">
                              {compressionState.isCompressing ? 'Compressing file...' : 'Uploading...'}
                            </p>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${compressionState.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {Math.round(compressionState.progress)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>File Name</Label>
                  <Input
                    placeholder="Assignment.pdf"
                    className="bg-white/5 border-white/10 text-white"
                    value={content.file?.name || ""}
                    onChange={(e) => setField(["file", "name"], e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    className="bg-white/5 border-white/10 text-white min-h-20"
                    value={content.file?.description || ""}
                    onChange={(e) => setField(["file", "description"], e.target.value)}
                    placeholder="Notes about this file..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "discussion" && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquare className="h-5 w-5" />
                  Discussion Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Discussion Prompt</Label>
                  <Textarea
                    className="bg-white/5 border-white/10 text-white min-h-24"
                    value={content.discussion?.prompt || ""}
                    onChange={(e) => setField(["discussion", "prompt"], e.target.value)}
                    placeholder="Describe the topic for discussion..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instructions (optional)</Label>
                  <Textarea
                    className="bg-white/5 border-white/10 text-white min-h-20"
                    value={content.discussion?.instructions || ""}
                    onChange={(e) => setField(["discussion", "instructions"], e.target.value)}
                    placeholder="Additional instructions for students..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "poll" && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart2 className="h-5 w-5" />
                  Poll Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    className="bg-white/5 border-white/10 text-white"
                    value={content.poll?.question || ""}
                    onChange={(e) => setField(["poll", "question"], e.target.value)}
                    placeholder="Your poll question"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  <OptionList 
                    values={content.poll?.options || []} 
                    onChange={(vals) => setField(["poll", "options"], vals)} 
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "quiz" && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <HelpCircle className="h-5 w-5" />
                  Quiz Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuizEditor
                  questions={content.quiz?.questions || []}
                  onChange={(qs) => setField(["quiz", "questions"], qs)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-white">Content Preview</h3>
            {getContentPreview() || (
              <div className="text-center py-8 text-slate-400">
                <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No content to preview</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="bg-blue-600/80 hover:bg-blue-600 text-white" onClick={() => onSave(content)}>
          Save Content
        </Button>
      </div>
    </div>
  )
}

function OptionList({ values, onChange }: { values: string[]; onChange: (vals: string[]) => void }) {
  function setVal(idx: number, v: string) {
    const next = [...values]
    next[idx] = v
    onChange(next)
  }
  function add() {
    onChange([...(values || []), ""])
  }
  function remove(idx: number) {
    const next = values.filter((_, i) => i !== idx)
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {(values.length ? values : ["", ""]).map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={v}
            onChange={(e) => setVal(i, e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder={`Option ${i + 1}`}
          />
          <Button 
            variant="secondary" 
            size="sm"
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30" 
            onClick={() => remove(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white" onClick={add}>
        <Plus className="h-4 w-4 mr-2" />
        Add Option
      </Button>
    </div>
  )
}

function QuizEditor({
  questions,
  onChange,
}: {
  questions: { id: string; question: string; options: string[]; correctIndex?: number; correctIndexes?: number[]; type?: string }[]
  onChange: (qs: { id: string; question: string; options: string[]; correctIndex?: number; correctIndexes?: number[]; type?: string }[]) => void
}) {
  function addQ() {
    onChange([
      ...questions,
      {
        id: Math.random().toString(36).slice(2),
        question: "New question",
        options: ["Option 1", "Option 2"],
        correctIndex: 0,
        correctIndexes: [0],
        type: "multiple-choice"
      },
    ])
  }
  function update(idx: number, patch: Partial<{ question: string; options: string[]; correctIndex?: number; correctIndexes?: number[]; type?: string }>) {
    const next = [...questions]
    next[idx] = { ...next[idx], ...patch }
    onChange(next)
  }
  function setOpt(qIdx: number, optIdx: number, value: string) {
    const next = [...questions]
    const opts = [...(next[qIdx].options || [])]
    opts[optIdx] = value
    next[qIdx].options = opts
    onChange(next)
  }
  function addOpt(qIdx: number) {
    const next = [...questions]
    next[qIdx].options = [...(next[qIdx].options || []), `Option ${next[qIdx].options.length + 1}`]
    onChange(next)
  }
  function removeQ(idx: number) {
    const next = questions.filter((_, i) => i !== idx)
    onChange(next)
  }
  function removeOpt(qIdx: number, optIdx: number) {
    const next = [...questions]
    next[qIdx].options = next[qIdx].options.filter((_, i) => i !== optIdx)
    // Adjust correctIndex if needed
    if (next[qIdx].correctIndex !== undefined && next[qIdx].correctIndex >= optIdx) {
      next[qIdx].correctIndex = Math.max(0, next[qIdx].correctIndex - 1)
    }
    // Adjust correctIndexes if needed
    if (next[qIdx].correctIndexes) {
      next[qIdx].correctIndexes = next[qIdx].correctIndexes
        .filter(idx => idx !== optIdx)
        .map(idx => idx > optIdx ? idx - 1 : idx)
    }
    onChange(next)
  }

  function handleTypeChange(qIdx: number, newType: string) {
    const next = [...questions]
    const question = next[qIdx]
    
    if (newType === "true-false") {
      question.options = ["True", "False"]
      question.correctIndex = 0
      question.correctIndexes = [0]
    } else if (newType === "multiple-choice") {
      question.correctIndex = question.correctIndexes?.[0] || 0
      question.correctIndexes = [question.correctIndexes?.[0] || 0]
    } else if (newType === "multi-select") {
      question.correctIndexes = question.correctIndexes || [question.correctIndex || 0]
    }
    
    question.type = newType
    onChange(next)
  }

  function handleCorrectAnswerChange(qIdx: number, optIdx: number, isMultiSelect: boolean) {
    const next = [...questions]
    const question = next[qIdx]
    
    if (isMultiSelect) {
      // Multi-select: toggle the option
      const currentIndexes = question.correctIndexes || []
      const newIndexes = currentIndexes.includes(optIdx)
        ? currentIndexes.filter(idx => idx !== optIdx)
        : [...currentIndexes, optIdx]
      question.correctIndexes = newIndexes
      question.correctIndex = newIndexes[0] // Keep for backward compatibility
    } else {
      // Single select: set the option
      question.correctIndex = optIdx
      question.correctIndexes = [optIdx]
    }
    
    onChange(next)
  }
  
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">Question {i + 1}</h4>
            <div className="flex items-center gap-2">
              <Select value={q.type || "multiple-choice"} onValueChange={(value) => handleTypeChange(i, value)}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="multiple-choice">Single Choice</SelectItem>
                  <SelectItem value="multi-select">Multi Select</SelectItem>
                  <SelectItem value="true-false">True/False</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30" 
                onClick={() => removeQ(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Question Text</Label>
              <Textarea
                value={q.question}
                onChange={(e) => update(i, { question: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-20"
                placeholder="Enter your question..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Options</Label>
              {(q.options || []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => setOpt(i, oi, e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder={`Option ${oi + 1}`}
                    disabled={q.type === "true-false"}
                  />
                  <label className="text-xs text-slate-300 inline-flex items-center gap-1">
                    <input
                      type={q.type === "multi-select" ? "checkbox" : "radio"}
                      name={`correct-${q.id}`}
                      checked={q.type === "multi-select" 
                        ? (q.correctIndexes || []).includes(oi)
                        : q.correctIndex === oi
                      }
                      onChange={() => handleCorrectAnswerChange(i, oi, q.type === "multi-select")}
                      className="text-blue-500"
                    />
                    <CheckCircle className="h-3 w-3" />
                    Correct
                  </label>
                  {q.type !== "true-false" && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30" 
                      onClick={() => removeOpt(i, oi)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {q.type !== "true-false" && (
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white" onClick={() => addOpt(i)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/15" onClick={addQ}>
        <Plus className="h-4 w-4 mr-2" />
        Add Question
      </Button>
    </div>
  )
}
