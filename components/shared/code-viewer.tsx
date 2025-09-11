"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Copy, 
  CheckCircle, 
  Download, 
  ExternalLink,
  Code,
  FileText,
  Github,
  Globe
} from "lucide-react"

interface CodeViewerProps {
  code: string
  language?: string
  filename?: string
  repositoryUrl?: string
  demoUrl?: string
  readOnly?: boolean
  showHeader?: boolean
  className?: string
}

export function CodeViewer({ 
  code, 
  language = "javascript", 
  filename,
  repositoryUrl,
  demoUrl,
  readOnly = true,
  showHeader = true,
  className = ""
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code: ', err)
    }
  }

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `code.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLanguageIcon = (lang: string) => {
    switch (lang.toLowerCase()) {
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

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript': return 'text-yellow-400'
      case 'typescript': return 'text-blue-400'
      case 'python': return 'text-green-400'
      case 'java': return 'text-orange-400'
      case 'cpp': return 'text-blue-300'
      case 'c': return 'text-blue-300'
      case 'php': return 'text-purple-400'
      case 'ruby': return 'text-red-400'
      case 'go': return 'text-cyan-400'
      case 'rust': return 'text-orange-300'
      case 'swift': return 'text-orange-400'
      case 'kotlin': return 'text-purple-300'
      case 'html': return 'text-orange-400'
      case 'css': return 'text-blue-400'
      case 'scss': return 'text-pink-400'
      case 'json': return 'text-yellow-300'
      case 'xml': return 'text-green-300'
      case 'sql': return 'text-blue-400'
      case 'bash': return 'text-green-400'
      case 'powershell': return 'text-blue-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Code className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-white">
                {filename || 'Code Submission'}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{getLanguageIcon(language)}</span>
                <Badge variant="outline" className="border-slate-500 text-slate-300">
                  {language}
                </Badge>
                <span className="text-sm text-slate-400">
                  {code.split('\n').length} lines
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {copied ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCode}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Code Display */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getLanguageIcon(language)}</span>
            <span className="text-slate-300 text-sm font-medium">
              {filename || `code.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'txt'}`}
            </span>
            <Badge variant="outline" className="border-slate-500 text-slate-300 text-xs">
              {language}
            </Badge>
          </div>
          <div className="text-slate-400 text-sm">
            {code.split('\n').length} lines
          </div>
        </div>
        
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono leading-relaxed">
            <code className={getLanguageColor(language)}>
              {code}
            </code>
          </pre>
        </div>
      </div>

      {/* Repository and Demo Links */}
      {(repositoryUrl || demoUrl) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repositoryUrl && (
            <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Github className="h-4 w-4 text-slate-400" />
                <span className="text-white font-medium">Repository</span>
              </div>
              <a 
                href={repositoryUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                View Repository
              </a>
            </div>
          )}
          
          {demoUrl && (
            <div className="bg-slate-800/30 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-slate-400" />
                <span className="text-white font-medium">Live Demo</span>
              </div>
              <a 
                href={demoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-sm flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                View Demo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
