'use client'

import { useState, useEffect } from 'react'
import { ContentService, FAQ as FAQType } from '@/services/content/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  HelpCircle, 
  Search, 
  ChevronDown,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  User,
  Clock,
  Star,
  BookOpen,
  Phone,
  Mail,
  Users,
  GraduationCap,
  CreditCard,
  Settings,
  Video,
  FileText,
  Zap
} from 'lucide-react'

// Using the FAQ interface from ContentService
type FAQ = FAQType

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  // Load FAQs from ContentService API
  useEffect(() => {
    const loadFAQs = async () => {
      try {
        setLoading(true)
        const data = await ContentService.getFAQs()
        setFaqs(data)
      } catch (error) {
        console.error('Failed to load FAQs:', error)
        // Fallback to empty array on error
        setFaqs([])
      } finally {
        setLoading(false)
      }
    }

    loadFAQs()
  }, [])

  const categories = ['all', 'Getting Started', 'Student Management', 'Live Sessions', 'Assignments', 'Billing & Plans', 'Troubleshooting', 'Customization']

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const popularFAQs = faqs.filter(faq => faq.is_popular).sort((a, b) => b.helpful_count - a.helpful_count)

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  const handleHelpful = (faqId: string, isHelpful: boolean) => {
    setFaqs(faqs.map(faq => 
      faq.id === faqId 
        ? { 
            ...faq, 
            helpful_count: isHelpful ? faq.helpful_count + 1 : faq.helpful_count,
            not_helpful_count: !isHelpful ? faq.not_helpful_count + 1 : faq.not_helpful_count
          }
        : faq
    ))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-slate-300 mb-6">
          Quick answers to common questions about AuraiumLMS
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
                placeholder="Search questions and answers..."
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
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <HelpCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{faqs.length}</div>
            <div className="text-sm text-slate-400">Total FAQs</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{popularFAQs.length}</div>
            <div className="text-sm text-slate-400">Popular</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <ThumbsUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">94%</div>
            <div className="text-sm text-slate-400">Helpful Rate</div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">2.1k</div>
            <div className="text-sm text-slate-400">Total Ratings</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FAQ List */}
        <div className="lg:col-span-3">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                All Questions ({filteredFAQs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : filteredFAQs.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No questions found</p>
                  <p className="text-sm">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-white/10 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full p-4 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {faq.is_popular && (
                            <Star className="h-4 w-4 text-yellow-400 fill-current flex-shrink-0" />
                          )}
                          <h3 className="font-medium text-white">{faq.question}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-white/10 border-white/20 text-slate-300">
                            {faq.category}
                          </Badge>
                          {expandedFAQ === faq.id ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {expandedFAQ === faq.id && (
                        <div className="p-4 pt-0 border-t border-white/10">
                          <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-slate-300 leading-relaxed mb-4">{faq.answer}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-slate-400">
                                <span>By {faq.author}</span>
                                <span>•</span>
                                <span>{new Date(faq.updated_at).toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <span className="text-sm text-slate-400">Was this helpful?</span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleHelpful(faq.id, true)}
                                    className="h-8 w-8 p-0 text-green-400 hover:bg-green-400/20"
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                  </Button>
                                  <span className="text-xs text-slate-500">{faq.helpful_count}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleHelpful(faq.id, false)}
                                    className="h-8 w-8 p-0 text-red-400 hover:bg-red-400/20"
                                  >
                                    <ThumbsDown className="h-4 w-4" />
                                  </Button>
                                  <span className="text-xs text-slate-500">{faq.not_helpful_count}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Questions */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400" />
                Most Popular
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popularFAQs.slice(0, 5).map((faq, index) => (
                <button
                  key={faq.id}
                  onClick={() => {
                    setCategoryFilter(faq.category)
                    setExpandedFAQ(faq.id)
                  }}
                  className="w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs text-yellow-400 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{faq.question}</p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                      <span className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {faq.helpful_count}
                      </span>
                      <Badge variant="outline" className="bg-white/10 border-white/20 text-slate-400 text-xs">
                        {faq.category}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Browse by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.filter(c => c !== 'all').map((category) => {
                const count = faqs.filter(f => f.category === category).length
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

          {/* Still Need Help */}
          <Card className="border-blue-400/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">
                Can't find what you're looking for? Our support team is ready to assist you.
              </p>
              <div className="space-y-2">
                <Button className="w-full" variant="outline" asChild>
                  <a href="/contact">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
                <Button className="w-full" variant="ghost" asChild>
                  <a href="/knowledge-base">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Knowledge Base
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}