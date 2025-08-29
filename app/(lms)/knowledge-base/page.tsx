'use client'

import { useState, useEffect } from 'react'
import { ContentService, KnowledgeBaseArticle } from '@/services/content/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Search, 
  Filter,
  Star,
  Clock,
  Eye,
  ThumbsUp,
  Tag,
  User,
  ChevronRight,
  FileText,
  Video,
  Download,
  Zap,
  Users,
  GraduationCap,
  Settings,
  MessageSquare,
  TrendingUp,
  Award,
  PlayCircle
} from 'lucide-react'

// Using the Article interface from ContentService
type Article = KnowledgeBaseArticle & {
  estimated_read_time: number // Map from estimated_time
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  // Load articles from ContentService API
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true)
        const data = await ContentService.getKnowledgeBaseArticles()
        // Map the API data to match our component's expected format
        const mappedArticles = data.map(article => ({
          ...article,
          estimated_read_time: article.estimated_time
        }))
        setArticles(mappedArticles)
      } catch (error) {
        console.error('Failed to load knowledge base articles:', error)
        // Fallback to empty array on error
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [])

  const categories = ['all', 'Getting Started', 'Assignments', 'Live Sessions', 'Teaching Tips', 'Templates', 'Troubleshooting']
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced']

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter
    const matchesDifficulty = difficultyFilter === 'all' || article.difficulty === difficultyFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const featuredArticles = articles.filter(article => article.is_featured)
  const popularArticles = articles.sort((a, b) => b.views - a.views).slice(0, 5)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-purple-400" />
      case 'download': return <Download className="h-4 w-4 text-green-400" />
      default: return <FileText className="h-4 w-4 text-blue-400" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'advanced': return 'text-red-400 bg-red-500/20'
      default: return 'text-slate-400 bg-slate-500/20'
    }
  }

  const handleArticleClick = (articleId: string) => {
    // In production, this would navigate to the full article or open in modal
    console.log(`Opening article: ${articleId}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Knowledge Base</h1>
        <p className="text-xl text-slate-300 mb-6">
          Find answers, tutorials, and best practices to get the most out of AuraiumLMS
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles, guides, and tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder-slate-400"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-md text-white focus:border-blue-400 focus:outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-slate-800">
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-md text-white focus:border-blue-400 focus:outline-none"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty} className="bg-slate-800">
                  {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{articles.length}</div>
            <div className="text-sm text-slate-400">Articles</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Video className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{articles.filter(a => a.type === 'video').length}</div>
            <div className="text-sm text-slate-400">Videos</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Download className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{articles.filter(a => a.type === 'download').length}</div>
            <div className="text-sm text-slate-400">Downloads</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">98.5%</div>
            <div className="text-sm text-slate-400">Helpful Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Star className="h-6 w-6 mr-2 text-yellow-400 fill-current" />
            Featured Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <Card 
                key={article.id} 
                className="cursor-pointer hover:bg-white/5 transition-all duration-200 border-white/10 group"
                onClick={() => handleArticleClick(article.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(article.type)}
                      <Badge className={getDifficultyColor(article.difficulty)}>
                        {article.difficulty}
                      </Badge>
                    </div>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {article.views.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {article.helpful_count}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {article.estimated_read_time} min
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Articles List */}
        <div className="lg:col-span-3">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                All Articles ({filteredArticles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No articles found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleArticleClick(article.id)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(article.type)}
                          {article.is_featured && <Star className="h-3 w-3 text-yellow-400 fill-current" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                              {article.title}
                            </h3>
                            <Badge className={getDifficultyColor(article.difficulty)}>
                              {article.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 mb-2 line-clamp-2">{article.excerpt}</p>
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {article.author}
                            </span>
                            <span className="flex items-center">
                              <Tag className="h-3 w-3 mr-1" />
                              {article.category}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.estimated_read_time} min read
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {article.views.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {article.helpful_count}
                        </span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Articles */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Most Popular</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popularArticles.map((article, index) => (
                <div 
                  key={article.id} 
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => handleArticleClick(article.id)}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{article.title}</p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {article.views.toLocaleString()}
                      </span>
                      {getTypeIcon(article.type)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/faq">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Frequently Asked Questions
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/documentation">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/tutorials">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Video Tutorials
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/contact">
                  <User className="h-4 w-4 mr-2" />
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Browse by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.filter(c => c !== 'all').map((category) => {
                const count = articles.filter(a => a.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className="w-full flex items-center justify-between p-2 text-left text-slate-300 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <span className="text-sm">{category}</span>
                    <Badge variant="secondary" className="bg-white/10 text-slate-400">
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}