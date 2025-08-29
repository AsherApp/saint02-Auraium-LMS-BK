'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { ContentService, DocSection as DocSectionType } from '@/services/content/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Search, 
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  Video,
  CreditCard,
  Zap,
  ChevronRight,
  ExternalLink,
  Download,
  Eye,
  Clock,
  Code,
  Globe,
  Shield,
  BarChart3,
  MessageSquare,
  Calendar,
  Award,
  Target
} from 'lucide-react'

// Using interfaces from ContentService
type DocSection = DocSectionType & {
  icon: React.ReactNode // Override to allow React components
}

export default function DocumentationPage() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [docSections, setDocSections] = useState<DocSection[]>([])

  // Load documentation from ContentService API
  useEffect(() => {
    const loadDocumentation = async () => {
      try {
        setLoading(true)
        const data = await ContentService.getDocumentation()
        // Map the API data to include React icons
        const mappedSections = data.map(section => ({
          ...section,
          icon: getIconForSection(section.icon)
        }))
        setDocSections(mappedSections)
      } catch (error) {
        console.error('Failed to load documentation:', error)
        // Fallback to default structure
        setDocSections(getDefaultDocSections())
      } finally {
        setLoading(false)
      }
    }

    loadDocumentation()
  }, [])

  const getIconForSection = (iconName: string) => {
    switch (iconName) {
      case 'zap': return <Zap className="h-6 w-6" />
      case 'graduation-cap': return <GraduationCap className="h-6 w-6" />
      case 'users': return <Users className="h-6 w-6" />
      case 'code': return <Code className="h-6 w-6" />
      default: return <FileText className="h-6 w-6" />
    }
  }

  const getDefaultDocSections = (): DocSection[] => [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Essential guides to help you start using AuraiumLMS effectively',
      icon: <Zap className="h-6 w-6" />,
      color: 'text-green-400 bg-green-500/20',
      articles: [
        {
          id: 'quick-start',
          title: 'Quick Start Guide',
          description: 'Get up and running with AuraiumLMS in 5 minutes',
          url: '/docs/quick-start',
          type: 'guide',
          difficulty: 'beginner',
          estimated_time: 5,
          last_updated: '2024-01-15',
          is_popular: true
        }
      ]
    }
  ]

  const allArticles = docSections.flatMap(section => section.articles)
  const filteredSections = docSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.articles.length > 0 || searchTerm === '')

  const popularArticles = allArticles.filter(article => article.is_popular).slice(0, 5)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'advanced': return 'text-red-400 bg-red-500/20'
      default: return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return <Video className="h-4 w-4 text-purple-400" />
      case 'reference': return <BookOpen className="h-4 w-4 text-blue-400" />
      case 'api': return <Code className="h-4 w-4 text-orange-400" />
      default: return <FileText className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Documentation</h1>
        <p className="text-xl text-slate-300 mb-6">
          Comprehensive guides and references to help you master AuraiumLMS
        </p>
        {user && (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
            Logged in as {user.role === 'teacher' ? 'Teacher' : 'Student'} • Personalized content available
          </Badge>
        )}
      </div>

      {/* Search */}
      <Card className="border-white/10">
        <CardContent className="p-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg bg-white/5 border-white/20 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{allArticles.length}</div>
            <div className="text-sm text-slate-400">Articles</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Video className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{allArticles.filter(a => a.type === 'tutorial').length}</div>
            <div className="text-sm text-slate-400">Tutorials</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Code className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{allArticles.filter(a => a.type === 'reference').length}</div>
            <div className="text-sm text-slate-400">References</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{Math.round(allArticles.reduce((sum, a) => sum + a.estimated_time, 0) / allArticles.length)}</div>
            <div className="text-sm text-slate-400">Avg Minutes</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Documentation Sections */}
        <div className="lg:col-span-3">
          <div className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : filteredSections.map((section) => (
              <Card key={section.id} className="border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className={`p-2 rounded-lg ${section.color} mr-3`}>
                      {section.icon}
                    </div>
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.articles.map((article) => (
                      <div
                        key={article.id}
                        className="p-4 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(article.type)}
                            <Badge className={getDifficultyColor(article.difficulty)}>
                              {article.difficulty}
                            </Badge>
                            {article.is_popular && (
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        
                        <h3 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {article.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.estimated_time} min
                            </span>
                            <span>Updated {article.last_updated}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Articles */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Popular Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popularArticles.map((article, index) => (
                <div 
                  key={article.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{article.title}</p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {article.estimated_time} min
                      </span>
                      {getTypeIcon(article.type)}
                      <Badge className={getDifficultyColor(article.difficulty)}>
                        {article.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/faq">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View FAQ
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/tutorials">
                  <Video className="h-4 w-4 mr-2" />
                  Video Tutorials
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/knowledge-base">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Knowledge Base
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/contact">
                  <Users className="h-4 w-4 mr-2" />
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Role-Specific Resources */}
          {user && (
            <Card className="border-blue-400/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-blue-400">
                  {user.role === 'teacher' ? 'Teacher Resources' : 'Student Resources'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.role === 'teacher' ? (
                  <>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Teaching Best Practices
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics Guide
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Target className="h-4 w-4 mr-2" />
                      Study Tips
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Award className="h-4 w-4 mr-2" />
                      Assignment Help
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Calendar className="h-4 w-4 mr-2" />
                      Time Management
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Support Information */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Need More Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">
                Can't find what you're looking for? Our documentation is constantly updated.
              </p>
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Guide
                </Button>
                <Button className="w-full" variant="ghost">
                  <Globe className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}