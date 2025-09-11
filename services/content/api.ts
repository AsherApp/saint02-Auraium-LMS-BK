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
    return http<KnowledgeBaseArticle[]>('/api/support/knowledge-base')
  }

  // FAQs
  static async getFAQs(): Promise<FAQ[]> {
    return http<FAQ[]>('/api/support/faq')
  }

  // Documentation
  static async getDocumentation(): Promise<DocSection[]> {
    return http<DocSection[]>('/api/support/documentation')
  }

  // Video Tutorials
  static async getTutorials(): Promise<Tutorial[]> {
    return http<Tutorial[]>('/api/support/tutorials')
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
    return http<any>('/api/support/content/analytics')
  }
}