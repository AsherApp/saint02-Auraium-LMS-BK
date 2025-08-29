'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { ContentService, Tutorial as TutorialType } from '@/services/content/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Video, 
  Search, 
  Play,
  Clock,
  Eye,
  ThumbsUp,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  CreditCard,
  Zap,
  ChevronRight,
  ExternalLink,
  Star,
  Filter,
  Download,
  Share2,
  Bookmark,
  TrendingUp,
  Award,
  Target,
  MessageSquare,
  Calendar
} from 'lucide-react'

// Using the Tutorial interface from ContentService
type Tutorial = TutorialType

export default function TutorialsPage() {
  const { user } = useAuthStore()
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)

  // Load tutorials from ContentService API
  useEffect(() => {
    const loadTutorials = async () => {
      try {
        setLoading(true)
        const data = await ContentService.getTutorials()
        setTutorials(data)
      } catch (error) {
        console.error('Failed to load tutorials:', error)
        // Fallback to empty array on error
        setTutorials([])
      } finally {
        setLoading(false)
      }
    }

    loadTutorials()
  }, [])

  const categories = ['all', 'Getting Started', 'Course Creation', 'Live Sessions', 'Student Management', 'Grading', 'Analytics']
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced']

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || tutorial.category === categoryFilter
    const matchesDifficulty = difficultyFilter === 'all' || tutorial.difficulty === difficultyFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const featuredTutorials = tutorials.filter(tutorial => tutorial.is_featured)
  const popularTutorials = tutorials.filter(tutorial => tutorial.is_popular).sort((a, b) => b.views - a.views)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'advanced': return 'text-red-400 bg-red-500/20'
      default: return 'text-slate-400 bg-slate-500/20'
    }
  }

  const handleTutorialClick = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial)
    // In production, this would open video player or navigate to tutorial page
    console.log(`Playing tutorial: ${tutorial.title}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Video Tutorials</h1>
        <p className="text-xl text-slate-300 mb-6">
          Learn AuraiumLMS through comprehensive video guides and tutorials
        </p>
        {user && (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-400/30">
            {user.role === 'teacher' ? 'Teacher' : 'Student'} focused content available
          </Badge>
        )}
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
                placeholder="Search tutorials and guides..."
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
            <Video className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{tutorials.length}</div>
            <div className="text-sm text-slate-400">Total Videos</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(tutorials.reduce((sum, t) => sum + t.duration, 0) / 3600)}h
            </div>
            <div className="text-sm text-slate-400">Total Content</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {(tutorials.reduce((sum, t) => sum + t.views, 0) / 1000).toFixed(1)}k
            </div>
            <div className="text-sm text-slate-400">Total Views</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{featuredTutorials.length}</div>
            <div className="text-sm text-slate-400">Featured</div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Star className="h-6 w-6 mr-2 text-yellow-400 fill-current" />
            Featured Tutorials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTutorials.map((tutorial) => (
              <Card 
                key={tutorial.id}
                className="cursor-pointer hover:bg-white/5 transition-all duration-200 border-white/10 group overflow-hidden"
                onClick={() => handleTutorialClick(tutorial)}
              >
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="absolute top-2 left-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                    {formatDuration(tutorial.duration)}
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className={getDifficultyColor(tutorial.difficulty)}>
                      {tutorial.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
                    {tutorial.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {tutorial.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {tutorial.views.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {tutorial.likes}
                      </span>
                    </div>
                    <span className="text-purple-400">{tutorial.instructor}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tutorials List */}
        <div className="lg:col-span-3">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2" />
                All Tutorials ({filteredTutorials.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : filteredTutorials.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No tutorials found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTutorials.map((tutorial) => (
                    <div
                      key={tutorial.id}
                      className="flex items-center space-x-4 p-4 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleTutorialClick(tutorial)}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-32 h-18 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                          <Play className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute top-1 right-1 bg-black/50 backdrop-blur-sm px-1 py-0.5 rounded text-xs text-white">
                          {formatDuration(tutorial.duration)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                            {tutorial.title}
                          </h3>
                          {tutorial.is_featured && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                          <Badge className={getDifficultyColor(tutorial.difficulty)}>
                            {tutorial.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">{tutorial.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>{tutorial.instructor}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {tutorial.views.toLocaleString()} views
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {tutorial.likes} likes
                          </span>
                          {tutorial.transcript_available && (
                            <>
                              <span>•</span>
                              <span className="text-green-400">Transcript available</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-400">
                        <Badge variant="outline" className="bg-white/10 border-white/20 text-slate-300">
                          {tutorial.category}
                        </Badge>
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
          {/* Popular Tutorials */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
                Most Popular
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popularTutorials.slice(0, 5).map((tutorial, index) => (
                <div 
                  key={tutorial.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => handleTutorialClick(tutorial)}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs text-orange-400 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tutorial.title}</p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {tutorial.views.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(tutorial.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Learning Paths */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Learning Paths</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                <Zap className="h-4 w-4 mr-2 text-green-400" />
                <div className="text-left">
                  <div className="font-medium">Quick Start</div>
                  <div className="text-xs text-slate-400">3 videos • 45 min</div>
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                <div className="text-left">
                  <div className="font-medium">Master Teacher</div>
                  <div className="text-xs text-slate-400">8 videos • 2.5 hours</div>
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                <Target className="h-4 w-4 mr-2 text-purple-400" />
                <div className="text-left">
                  <div className="font-medium">Advanced Features</div>
                  <div className="text-xs text-slate-400">5 videos • 1.5 hours</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/faq">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  FAQ
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/documentation">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10" asChild>
                <a href="/knowledge-base">
                  <Video className="h-4 w-4 mr-2" />
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

          {/* Role-Specific Suggestions */}
          {user && (
            <Card className="border-purple-400/20 bg-purple-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-purple-400">
                  {user.role === 'teacher' ? 'For Teachers' : 'For Students'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.role === 'teacher' ? (
                  <>
                    <p className="text-sm text-slate-300 mb-3">
                      Recommended tutorials for educators
                    </p>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Course Creation Series
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Users className="h-4 w-4 mr-2" />
                      Student Management
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Award className="h-4 w-4 mr-2" />
                      Assessment Techniques
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-300 mb-3">
                      Tutorials to enhance your learning
                    </p>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Target className="h-4 w-4 mr-2" />
                      Study Strategies
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <Calendar className="h-4 w-4 mr-2" />
                      Time Management
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Getting Help
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}