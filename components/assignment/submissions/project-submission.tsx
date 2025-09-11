"use client"

import { useState, useRef } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
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
  Github,
  Globe,
  Code,
  Palette,
  Settings,
  Save,
  Send
} from "lucide-react"

interface ProjectSubmissionProps {
  content: any
  setContent: (content: any) => void
  readOnly?: boolean
}

interface ProjectFile {
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

export function ProjectSubmission({ content, setContent, readOnly = false }: ProjectSubmissionProps) {
  const [activeTab, setActiveTab] = useState("description")
  const [description, setDescription] = useState(content?.description || "")
  const [projectTitle, setProjectTitle] = useState(content?.title || "")
  const [technologies, setTechnologies] = useState(content?.technologies || [])
  const [repositoryUrl, setRepositoryUrl] = useState(content?.repository_url || "")
  const [demoUrl, setDemoUrl] = useState(content?.demo_url || "")
  const [documentationUrl, setDocumentationUrl] = useState(content?.documentation_url || "")
  const [files, setFiles] = useState<ProjectFile[]>(content?.files || [])
  const [newTechnology, setNewTechnology] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-4 w-4 text-green-400" />
    if (type.includes('video')) return <Video className="h-4 w-4 text-blue-400" />
    if (type.includes('audio')) return <Music className="h-4 w-4 text-purple-400" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4 text-orange-400" />
    if (type.includes('code') || type.includes('javascript') || type.includes('typescript')) return <Code className="h-4 w-4 text-emerald-400" />
    return <File className="h-4 w-4 text-slate-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const addTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim())) {
      setTechnologies([...technologies, newTechnology.trim()])
      setNewTechnology("")
    }
  }

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech))
  }

  const handleFileUpload = (selectedFiles: FileList) => {
    // Simulate file upload - in real app, this would upload to server
    Array.from(selectedFiles).forEach(file => {
      const fileId = Math.random().toString(36).substr(2, 9)
      const newFile: ProjectFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'completed',
        url: URL.createObjectURL(file)
      }
      setFiles(prev => [...prev, newFile])
    })
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateContent = () => {
    setContent({
      title: projectTitle,
      description,
      technologies,
      repository_url: repositoryUrl,
      demo_url: demoUrl,
      documentation_url: documentationUrl,
      files: files.filter(f => f.status === 'completed')
    })
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <BookOpen className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Project Submission</h3>
            <p className="text-slate-400 text-sm">Submit your project with description and files</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {files.length} files
          </Badge>
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {technologies.length} technologies
          </Badge>
        </div>
      </div>

      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-transparent">
          <TabsTrigger 
            value="description" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <FileText className="h-4 w-4 mr-2" />
            Description
          </TabsTrigger>
          <TabsTrigger 
            value="technologies" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Code className="h-4 w-4 mr-2" />
            Technologies
          </TabsTrigger>
          <TabsTrigger 
            value="links" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Link className="h-4 w-4 mr-2" />
            Links
          </TabsTrigger>
          <TabsTrigger 
            value="files" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Upload className="h-4 w-4 mr-2" />
            Files
          </TabsTrigger>
        </TabsList>

        {/* Description Tab */}
        <TabsContent value="description" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-title" className="text-white font-medium">
                  Project Title
                </Label>
                <Input
                  id="project-title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter your project title..."
                  disabled={readOnly}
                  className="bg-slate-800/50 border-slate-600 text-white mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="project-description" className="text-white font-medium">
                  Project Description
                </Label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project, its purpose, features, and any other relevant details..."
                  disabled={readOnly}
                  className="min-h-[200px] bg-slate-800/50 border-slate-600 text-white mt-1"
                />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">Description Guidelines</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Explain the project's purpose and goals</li>
                  <li>• Describe key features and functionality</li>
                  <li>• Mention any challenges you overcame</li>
                  <li>• Include setup/installation instructions if applicable</li>
                  <li>• Highlight what you learned from this project</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Technologies Tab */}
        <TabsContent value="technologies" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white font-medium">Technologies Used</Label>
                <p className="text-slate-400 text-sm mb-4">
                  List all technologies, frameworks, libraries, and tools used in your project
                </p>
                
                {!readOnly && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newTechnology}
                      onChange={(e) => setNewTechnology(e.target.value)}
                      placeholder="Add a technology..."
                      className="bg-slate-800/50 border-slate-600 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && addTechnology()}
                    />
                    <Button onClick={addTechnology} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech, index) => (
                    <Badge key={index} variant="outline" className="border-slate-500 text-slate-300">
                      {tech}
                      {!readOnly && (
                        <button
                          onClick={() => removeTechnology(tech)}
                          className="ml-2 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                
                {technologies.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No technologies added yet</p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="repository-url" className="text-white font-medium">
                  Repository URL
                </Label>
                <div className="flex gap-2 mt-1">
                  <Github className="h-4 w-4 text-slate-400 mt-3" />
                  <Input
                    id="repository-url"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/username/project-name"
                    disabled={readOnly}
                    className="bg-slate-800/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="demo-url" className="text-white font-medium">
                  Demo URL
                </Label>
                <div className="flex gap-2 mt-1">
                  <Globe className="h-4 w-4 text-slate-400 mt-3" />
                  <Input
                    id="demo-url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://your-project-demo.com"
                    disabled={readOnly}
                    className="bg-slate-800/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="documentation-url" className="text-white font-medium">
                  Documentation URL
                </Label>
                <div className="flex gap-2 mt-1">
                  <FileText className="h-4 w-4 text-slate-400 mt-3" />
                  <Input
                    id="documentation-url"
                    value={documentationUrl}
                    onChange={(e) => setDocumentationUrl(e.target.value)}
                    placeholder="https://your-project-docs.com"
                    disabled={readOnly}
                    className="bg-slate-800/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">Link Guidelines</h4>
                <ul className="text-green-200 text-sm space-y-1">
                  <li>• Repository: Link to your source code (GitHub, GitLab, etc.)</li>
                  <li>• Demo: Link to a live version of your project</li>
                  <li>• Documentation: Link to project documentation or README</li>
                  <li>• Make sure all links are accessible and up-to-date</li>
                </ul>
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
                  <h4 className="text-lg font-medium text-white">Project Files</h4>
                  <p className="text-slate-400 text-sm">Upload project files, screenshots, and documentation</p>
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
                accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.js,.ts,.jsx,.tsx,.css,.html,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.swift,.kt"
              />
              
              {files.length > 0 ? (
                <div className="space-y-3">
                  {files.map((file) => (
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
                  <p className="text-sm">Upload project files, screenshots, or documentation</p>
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
              Project information will be saved automatically
            </div>
            
            <Button
              onClick={updateContent}
              className="bg-green-600/80 hover:bg-green-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Project
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
