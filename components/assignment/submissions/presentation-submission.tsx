"use client"

import { useState, useRef } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Presentation, 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Plus,
  FolderOpen,
  Link,
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
  Globe,
  Youtube,
  Vimeo,
  Monitor,
  Smartphone,
  Tablet,
  Settings,
  Save,
  Send
} from "lucide-react"

interface PresentationSubmissionProps {
  url: string
  setUrl: (url: string) => void
  files: File[]
  setFiles: (files: File[]) => void
  readOnly?: boolean
}

interface PresentationFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt: Date
  status: 'uploading' | 'completed' | 'error'
  progress?: number
  error?: string
}

export function PresentationSubmission({ 
  url, 
  setUrl, 
  files, 
  setFiles, 
  readOnly = false 
}: PresentationSubmissionProps) {
  const [activeTab, setActiveTab] = useState("url")
  const [presentationUrl, setPresentationUrl] = useState(url)
  const [presentationTitle, setPresentationTitle] = useState("")
  const [presentationDescription, setPresentationDescription] = useState("")
  const [presentationFiles, setPresentationFiles] = useState<PresentationFile[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-4 w-4 text-green-400" />
    if (type.includes('video')) return <Video className="h-4 w-4 text-blue-400" />
    if (type.includes('audio')) return <Music className="h-4 w-4 text-purple-400" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4 text-orange-400" />
    if (type.includes('ppt') || type.includes('pptx')) return <Presentation className="h-4 w-4 text-orange-400" />
    return <File className="h-4 w-4 text-slate-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateUrl = (url: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    return urlPattern.test(url)
  }

  const getUrlType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('vimeo.com')) return 'vimeo'
    if (url.includes('slideshare.net')) return 'slideshare'
    if (url.includes('prezi.com')) return 'prezi'
    if (url.includes('canva.com')) return 'canva'
    if (url.includes('google.com/presentation')) return 'google-slides'
    if (url.includes('powerpoint') || url.includes('ppt')) return 'powerpoint'
    return 'other'
  }

  const getUrlIcon = (urlType: string) => {
    switch (urlType) {
      case 'youtube': return <Youtube className="h-4 w-4 text-red-400" />
      case 'vimeo': return <Vimeo className="h-4 w-4 text-blue-400" />
      case 'slideshare': return <Presentation className="h-4 w-4 text-orange-400" />
      case 'prezi': return <Presentation className="h-4 w-4 text-green-400" />
      case 'canva': return <Presentation className="h-4 w-4 text-purple-400" />
      case 'google-slides': return <Presentation className="h-4 w-4 text-blue-400" />
      case 'powerpoint': return <Presentation className="h-4 w-4 text-orange-400" />
      default: return <Globe className="h-4 w-4 text-slate-400" />
    }
  }

  const handleFileUpload = (selectedFiles: FileList) => {
    Array.from(selectedFiles).forEach(file => {
      const fileId = Math.random().toString(36).substr(2, 9)
      const newFile: PresentationFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'completed',
        url: URL.createObjectURL(file)
      }
      setPresentationFiles(prev => [...prev, newFile])
    })
  }

  const removeFile = (fileId: string) => {
    setPresentationFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleUrlSubmit = () => {
    if (validateUrl(presentationUrl)) {
      setUrl(presentationUrl)
    }
  }

  return (
    <div className="space-y-6">
      {/* Presentation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/20 rounded-lg">
            <Presentation className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Presentation Submission</h3>
            <p className="text-slate-400 text-sm">Submit your presentation URL or files</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {presentationFiles.length} files
          </Badge>
          {url && (
            <Badge className="bg-green-500/20 text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              URL Set
            </Badge>
          )}
        </div>
      </div>

      {/* Presentation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-transparent">
          <TabsTrigger 
            value="url" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Link className="h-4 w-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger 
            value="files" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Upload className="h-4 w-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="presentation-url" className="text-white font-medium">
                  Presentation URL
                </Label>
                <p className="text-slate-400 text-sm mb-4">
                  Share a link to your presentation (YouTube, Vimeo, Google Slides, PowerPoint Online, etc.)
                </p>
                
                <div className="flex gap-2">
                  <Input
                    id="presentation-url"
                    value={presentationUrl}
                    onChange={(e) => setPresentationUrl(e.target.value)}
                    placeholder="https://docs.google.com/presentation/d/..."
                    disabled={readOnly}
                    className="bg-slate-800/50 border-slate-600 text-white"
                  />
                  {!readOnly && (
                    <Button
                      onClick={handleUrlSubmit}
                      disabled={!validateUrl(presentationUrl)}
                      className="bg-blue-600/80 hover:bg-blue-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Set URL
                    </Button>
                  )}
                </div>
                
                {presentationUrl && validateUrl(presentationUrl) && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getUrlIcon(getUrlType(presentationUrl))}
                      <span className="text-green-400 font-medium">
                        {getUrlType(presentationUrl).replace('_', ' ').toUpperCase()} URL Detected
                      </span>
                    </div>
                    <p className="text-green-200 text-sm mt-1">{presentationUrl}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="presentation-title" className="text-white font-medium">
                    Presentation Title
                  </Label>
                  <Input
                    id="presentation-title"
                    value={presentationTitle}
                    onChange={(e) => setPresentationTitle(e.target.value)}
                    placeholder="Enter presentation title..."
                    disabled={readOnly}
                    className="bg-slate-800/50 border-slate-600 text-white mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-white font-medium">Platform</Label>
                  <div className="mt-1 p-2 bg-slate-800/50 border border-slate-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      {presentationUrl ? getUrlIcon(getUrlType(presentationUrl)) : <Globe className="h-4 w-4 text-slate-400" />}
                      <span className="text-slate-300 text-sm">
                        {presentationUrl ? getUrlType(presentationUrl).replace('_', ' ').toUpperCase() : 'No URL set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="presentation-description" className="text-white font-medium">
                  Presentation Description
                </Label>
                <Textarea
                  id="presentation-description"
                  value={presentationDescription}
                  onChange={(e) => setPresentationDescription(e.target.value)}
                  placeholder="Describe your presentation, key topics covered, and any special features..."
                  disabled={readOnly}
                  className="min-h-[120px] bg-slate-800/50 border-slate-600 text-white mt-1"
                />
              </div>
            </div>
          </GlassCard>

          {/* Supported Platforms */}
          <GlassCard className="p-4">
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Supported Platforms</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Google Slides', icon: <Presentation className="h-4 w-4" /> },
                  { name: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
                  { name: 'Vimeo', icon: <Vimeo className="h-4 w-4" /> },
                  { name: 'PowerPoint Online', icon: <Presentation className="h-4 w-4" /> },
                  { name: 'Prezi', icon: <Presentation className="h-4 w-4" /> },
                  { name: 'Canva', icon: <Presentation className="h-4 w-4" /> },
                  { name: 'SlideShare', icon: <Presentation className="h-4 w-4" /> },
                  { name: 'Other', icon: <Globe className="h-4 w-4" /> }
                ].map((platform, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-300 text-sm">
                    {platform.icon}
                    <span>{platform.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-white">Presentation Files</h4>
                  <p className="text-slate-400 text-sm">Upload presentation files, slides, or supporting materials</p>
                </div>
                
                {!readOnly && (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600/80 hover:bg-blue-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Files
                  </Button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                accept=".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.zip,.rar,.7z"
              />
              
              {presentationFiles.length > 0 ? (
                <div className="space-y-3">
                  {presentationFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium truncate">{file.name}</p>
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.type}</span>
                          <span>{file.uploadedAt.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm">Upload presentation files or supporting materials</p>
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-white">Presentation Preview</h4>
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
              
              {url ? (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={url}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Presentation className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No presentation URL set</p>
                  <p className="text-sm">Add a presentation URL to preview it here</p>
                </div>
              )}
              
              {presentationTitle && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2">{presentationTitle}</h5>
                  {presentationDescription && (
                    <p className="text-slate-300 text-sm">{presentationDescription}</p>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {!readOnly && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-slate-400">
              Presentation information will be saved automatically
            </div>
            
            <Button
              onClick={() => {
                setUrl(presentationUrl)
                setFiles(presentationFiles.map(f => f.url ? new File([], f.name) : new File([], f.name)))
              }}
              className="bg-green-600/80 hover:bg-green-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Presentation
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
