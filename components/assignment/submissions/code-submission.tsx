"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Code, 
  Github, 
  ExternalLink, 
  Globe,
  Link,
  File,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  Play,
  Settings,
  Save,
  Send,
  Terminal,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Edit,
  Trash2,
  Plus,
  FolderOpen,
  Upload,
  Archive,
  FileText
} from "lucide-react"

interface CodeSubmissionProps {
  code: string
  setCode: (code: string) => void
  repositoryUrl: string
  setRepositoryUrl: (url: string) => void
  demoUrl: string
  setDemoUrl: (url: string) => void
  readOnly?: boolean
}

interface CodeFile {
  id: string
  name: string
  content: string
  language: string
  size: number
  lastModified: Date
}

export function CodeSubmission({ 
  code, 
  setCode, 
  repositoryUrl, 
  setRepositoryUrl, 
  demoUrl, 
  setDemoUrl, 
  readOnly = false 
}: CodeSubmissionProps) {
  const [activeTab, setActiveTab] = useState("code")
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([])
  const [newFileName, setNewFileName] = useState("")
  const [newFileContent, setNewFileContent] = useState("")
  const [newFileLanguage, setNewFileLanguage] = useState("javascript")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const languages = [
    { value: "javascript", label: "JavaScript", extension: ".js" },
    { value: "typescript", label: "TypeScript", extension: ".ts" },
    { value: "python", label: "Python", extension: ".py" },
    { value: "java", label: "Java", extension: ".java" },
    { value: "cpp", label: "C++", extension: ".cpp" },
    { value: "c", label: "C", extension: ".c" },
    { value: "php", label: "PHP", extension: ".php" },
    { value: "ruby", label: "Ruby", extension: ".rb" },
    { value: "go", label: "Go", extension: ".go" },
    { value: "rust", label: "Rust", extension: ".rs" },
    { value: "swift", label: "Swift", extension: ".swift" },
    { value: "kotlin", label: "Kotlin", extension: ".kt" },
    { value: "html", label: "HTML", extension: ".html" },
    { value: "css", label: "CSS", extension: ".css" },
    { value: "scss", label: "SCSS", extension: ".scss" },
    { value: "json", label: "JSON", extension: ".json" },
    { value: "xml", label: "XML", extension: ".xml" },
    { value: "sql", label: "SQL", extension: ".sql" },
    { value: "bash", label: "Bash", extension: ".sh" },
    { value: "powershell", label: "PowerShell", extension: ".ps1" }
  ]

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'javascript': return '🟨'
      case 'typescript': return '🔷'
      case 'python': return '🐍'
      case 'java': return '☕'
      case 'cpp': return '⚡'
      case 'c': return '⚡'
      case 'php': return '🐘'
      case 'ruby': return '💎'
      case 'go': return '🐹'
      case 'rust': return '🦀'
      case 'swift': return '🦉'
      case 'kotlin': return '🟣'
      case 'html': return '🌐'
      case 'css': return '🎨'
      case 'scss': return '🎨'
      case 'json': return '📄'
      case 'xml': return '📄'
      case 'sql': return '🗄️'
      case 'bash': return '💻'
      case 'powershell': return '💻'
      default: return '📄'
    }
  }

  const addCodeFile = () => {
    if (newFileName.trim() && newFileContent.trim()) {
      const language = languages.find(l => l.value === newFileLanguage)
      const fileName = newFileName.endsWith(language?.extension || '') 
        ? newFileName 
        : `${newFileName}${language?.extension || ''}`
      
      const newFile: CodeFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: fileName,
        content: newFileContent,
        language: newFileLanguage,
        size: newFileContent.length,
        lastModified: new Date()
      }
      
      setCodeFiles([...codeFiles, newFile])
      setNewFileName("")
      setNewFileContent("")
      setNewFileLanguage("javascript")
    }
  }

  const removeCodeFile = (fileId: string) => {
    setCodeFiles(codeFiles.filter(f => f.id !== fileId))
    if (selectedFile === fileId) {
      setSelectedFile(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const validateUrl = (url: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    return urlPattern.test(url)
  }

  const getTotalLines = () => {
    return codeFiles.reduce((total, file) => total + file.content.split('\n').length, 0)
  }

  const getTotalSize = () => {
    return codeFiles.reduce((total, file) => total + file.size, 0)
  }

  return (
    <div className="space-y-6">
      {/* Code Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Code className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Code Submission</h3>
            <p className="text-slate-400 text-sm">Submit your code, repository, and demo links</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {codeFiles.length} files
          </Badge>
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {getTotalLines()} lines
          </Badge>
        </div>
      </div>

      {/* Code Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-transparent">
          <TabsTrigger 
            value="code" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Code className="h-4 w-4 mr-2" />
            Code
          </TabsTrigger>
          <TabsTrigger 
            value="repository" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Github className="h-4 w-4 mr-2" />
            Repository
          </TabsTrigger>
          <TabsTrigger 
            value="demo" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Globe className="h-4 w-4 mr-2" />
            Demo
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-white">Code Files</h4>
                
                {!readOnly && (
                  <Button
                    onClick={() => setActiveTab("add-file")}
                    className="bg-blue-600/80 hover:bg-blue-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add File
                  </Button>
                )}
              </div>
              
              {codeFiles.length > 0 ? (
                <div className="space-y-3">
                  {codeFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{getLanguageIcon(file.language)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium truncate">{file.name}</p>
                          <Badge variant="outline" className="border-slate-500 text-slate-300">
                            {file.language}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{file.content.split('\n').length} lines</span>
                          <span>{file.size} characters</span>
                          <span>{file.lastModified.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(file.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(file.content)}
                        >
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCodeFile(file.id)}
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
                  <p>No code files added yet</p>
                  <p className="text-sm">Add your code files to get started</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Add File Form */}
          {!readOnly && (
            <GlassCard className="p-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Add New File</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="file-name" className="text-white font-medium">
                      File Name
                    </Label>
                    <Input
                      id="file-name"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="main.js"
                      className="bg-slate-800/50 border-slate-600 text-white mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="file-language" className="text-white font-medium">
                      Language
                    </Label>
                    <select
                      id="file-language"
                      value={newFileLanguage}
                      onChange={(e) => setNewFileLanguage(e.target.value)}
                      className="w-full mt-1 p-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white"
                    >
                      {languages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="file-content" className="text-white font-medium">
                    Code Content
                  </Label>
                  <Textarea
                    id="file-content"
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    placeholder="// Enter your code here..."
                    className="min-h-[200px] bg-slate-800/50 border-slate-600 text-white mt-1 font-mono text-sm"
                  />
                </div>
                
                <Button
                  onClick={addCodeFile}
                  disabled={!newFileName.trim() || !newFileContent.trim()}
                  className="bg-green-600/80 hover:bg-green-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add File
                </Button>
              </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* Repository Tab */}
        <TabsContent value="repository" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="repository-url" className="text-white font-medium">
                  Repository URL
                </Label>
                <p className="text-slate-400 text-sm mb-4">
                  Link to your code repository (GitHub, GitLab, Bitbucket, etc.)
                </p>
                
                <div className="flex gap-2">
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
                
                {repositoryUrl && validateUrl(repositoryUrl) && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-medium">Repository URL Valid</span>
                    </div>
                    <p className="text-green-200 text-sm mt-1">{repositoryUrl}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">Repository Guidelines</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Make sure your repository is public or accessible</li>
                  <li>• Include a comprehensive README.md file</li>
                  <li>• Use clear commit messages and organized branches</li>
                  <li>• Include proper documentation and comments in your code</li>
                  <li>• Ensure all dependencies are listed in package.json or requirements.txt</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Demo Tab */}
        <TabsContent value="demo" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="demo-url" className="text-white font-medium">
                  Demo URL
                </Label>
                <p className="text-slate-400 text-sm mb-4">
                  Link to a live demo of your project (Vercel, Netlify, Heroku, etc.)
                </p>
                
                <div className="flex gap-2">
                  <Globe className="h-4 w-4 text-slate-400 mt-3" />
                  <Input
                    id="demo-url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://your-project-demo.vercel.app"
                    disabled={readOnly}
                    className="bg-slate-800/50 border-slate-600 text-white"
                  />
                </div>
                
                {demoUrl && validateUrl(demoUrl) && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-medium">Demo URL Valid</span>
                    </div>
                    <p className="text-green-200 text-sm mt-1">{demoUrl}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">Demo Guidelines</h4>
                <ul className="text-green-200 text-sm space-y-1">
                  <li>• Ensure your demo is fully functional and accessible</li>
                  <li>• Include sample data or test accounts if needed</li>
                  <li>• Make sure the demo reflects your latest code changes</li>
                  <li>• Provide clear instructions for using the demo</li>
                  <li>• Test your demo on different devices and browsers</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6 mt-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">Code Preview</h4>
              
              {selectedFile ? (
                <div className="space-y-4">
                  {(() => {
                    const file = codeFiles.find(f => f.id === selectedFile)
                    if (!file) return null
                    
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getLanguageIcon(file.language)}</span>
                            <span className="text-white font-medium">{file.name}</span>
                            <Badge variant="outline" className="border-slate-500 text-slate-300">
                              {file.language}
                            </Badge>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(file.content)}
                          >
                            {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copied ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
                          <pre className="p-4 overflow-x-auto">
                            <code className="text-slate-300 text-sm font-mono">
                              {file.content}
                            </code>
                          </pre>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No file selected</p>
                  <p className="text-sm">Select a file from the Code tab to preview it here</p>
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
              Code submission will be saved automatically
            </div>
            
            <Button
              onClick={() => {
                setCode(codeFiles.map(f => f.content).join('\n\n'))
              }}
              className="bg-green-600/80 hover:bg-green-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Code
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
