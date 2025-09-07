import { http } from "../http"

export interface KnowledgeBaseArticle {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  author: string
  created_at: string
  updated_at: string
  views: number
  likes: number
  is_featured: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_time: number
  type: 'article' | 'video' | 'download'
  helpful_count?: number
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  helpful_count: number
  not_helpful_count: number
  created_at: string
  updated_at: string
  is_popular: boolean
  author: string
  related_articles: string[]
}

export interface DocArticle {
  id: string
  title: string
  description: string
  url: string
  type: 'guide' | 'reference' | 'tutorial' | 'api'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_time: number
  last_updated: string
  is_popular: boolean
}

export interface DocSection {
  id: string
  title: string
  description: string
  icon: string
  articles: DocArticle[]
  color: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  views: number
  likes: number
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  updated_at: string
  is_featured: boolean
  is_popular: boolean
  video_url: string
  transcript_available: boolean
  resources: string[]
  instructor: string
  series?: string
  prerequisites?: string[]
}

export class ContentService {
  // Knowledge Base
  static async getKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
    try {
      return http<KnowledgeBaseArticle[]>('/api/support/knowledge-base')
    } catch (error) {
      // Fallback to mock data if API fails
      console.warn('Content API not available, using fallback data')
      return [
        {
          id: '1',
          title: 'Getting Started with AuraiumLMS - Complete Guide',
          excerpt: 'Everything you need to know to start using AuraiumLMS effectively, from account setup to your first course.',
          content: 'Complete guide content...',
          category: 'Getting Started',
          tags: ['setup', 'basics', 'course-creation'],
          author: 'Sarah Wilson',
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-15T14:30:00Z',
          views: 2847,
          likes: 189,
          is_featured: true,
          difficulty: 'beginner',
          estimated_time: 8,
          type: 'article',
          helpful_count: 267
        },
        {
          id: '2',
          title: 'Advanced Course Management Techniques',
          excerpt: 'Master advanced features like gradebook customization, automated workflows, and student analytics.',
          content: 'Advanced techniques content...',
          category: 'Course Management',
          tags: ['advanced', 'gradebook', 'analytics'],
          author: 'Dr. Michael Chen',
          created_at: '2024-01-08T14:20:00Z',
          updated_at: '2024-01-12T10:15:00Z',
          views: 1534,
          likes: 98,
          is_featured: true,
          difficulty: 'advanced',
          estimated_time: 15,
          type: 'article',
          helpful_count: 145
        }
      ]
    }
  }

  // FAQs
  static async getFAQs(): Promise<FAQ[]> {
    try {
      return http<FAQ[]>('/api/support/faq')
    } catch (error) {
      console.warn('FAQ API not available, using fallback data')
      return [
        {
          id: '1',
          question: 'How do I create my first course?',
          answer: 'Creating your first course is easy! Navigate to your teacher dashboard and click "Create Course". Fill in the course details including title, description, and syllabus. You can then add lessons, assignments, and invite students.',
          category: 'Getting Started',
          tags: ['course', 'create', 'setup', 'teacher'],
          helpful_count: 234,
          not_helpful_count: 12,
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-15T14:30:00Z',
          is_popular: true,
          author: 'Support Team',
          related_articles: ['getting-started', 'course-management']
        },
        {
          id: '2',
          question: 'How do students join my course?',
          answer: 'Students can join your course in several ways: 1) You can send them an invitation link, 2) Share the course code for direct enrollment, or 3) Add them manually from your student management panel.',
          category: 'Student Management',
          tags: ['students', 'enrollment', 'invite', 'course-code'],
          helpful_count: 198,
          not_helpful_count: 8,
          created_at: '2024-01-08T14:20:00Z',
          updated_at: '2024-01-12T10:15:00Z',
          is_popular: true,
          author: 'Support Team',
          related_articles: ['student-management', 'invitations']
        }
      ]
    }
  }

  // Documentation
  static async getDocumentation(): Promise<DocSection[]> {
    try {
      return http<DocSection[]>('/api/support/documentation')
    } catch (error) {
      console.warn('Documentation API not available, using fallback data')
      return [
        {
          id: 'getting-started',
          title: 'Getting Started',
          description: 'Essential guides to help you start using AuraiumLMS effectively',
          icon: 'zap',
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
    }
  }

  // Video Tutorials
  static async getTutorials(): Promise<Tutorial[]> {
    try {
      return http<Tutorial[]>('/api/support/tutorials')
    } catch (error) {
      console.warn('Tutorials API not available, using fallback data')
      return [
        {
          id: '1',
          title: 'Getting Started with AuraiumLMS - Complete Overview',
          description: 'A comprehensive introduction to AuraiumLMS covering all the basic features and setup process.',
          thumbnail: '/api/placeholder/400/225',
          duration: 720,
          views: 8347,
          likes: 456,
          category: 'Getting Started',
          tags: ['setup', 'basics', 'overview', 'introduction'],
          difficulty: 'beginner',
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:00:00Z',
          is_featured: true,
          is_popular: true,
          video_url: 'https://example.com/tutorials/getting-started',
          transcript_available: true,
          resources: ['Quick Start Guide', 'Setup Checklist'],
          instructor: 'Sarah Wilson',
          series: 'AuraiumLMS Basics'
        }
      ]
    }
  }

  // Content Management (for support system)
  static async createContent(content: Partial<KnowledgeBaseArticle | FAQ | DocArticle | Tutorial>): Promise<any> {
    return http<any>('/api/support/content', {
      method: 'POST',
      body: content
    })
  }

  static async updateContent(id: string, content: Partial<KnowledgeBaseArticle | FAQ | DocArticle | Tutorial>): Promise<any> {
    return http<any>(`/api/support/content/${id}`, {
      method: 'PUT',
      body: content
    })
  }

  static async deleteContent(id: string): Promise<void> {
    return http<void>(`/api/support/content/${id}`, {
      method: 'DELETE'
    })
  }

  // Analytics
  static async getContentAnalytics(): Promise<any> {
    try {
      return http<any>('/api/support/content/analytics')
    } catch (error) {
      console.warn('Analytics API not available, using fallback data')
      return {
        totalContent: 45,
        totalViews: 23456,
        totalLikes: 1890,
        topCategories: [
          { name: 'Getting Started', count: 12 },
          { name: 'Course Management', count: 8 }
        ]
      }
    }
  }
}