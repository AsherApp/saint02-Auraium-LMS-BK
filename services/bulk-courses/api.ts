import { http } from '../http'

export interface BulkCourseData {
  title: string
  description: string
  course_mode?: 'normal' | 'public'
  status?: 'draft' | 'published'
  modules: {
    title: string
    description?: string
    order_index: number
    lessons: {
      title: string
      description?: string
      order_index: number
      content_type: 'video' | 'text' | 'file' | 'quiz' | 'assignment'
      content: {
        // Video content
        video?: {
          url: string
          source: 'upload' | 'youtube' | 'vimeo' | 'onedrive' | 'googledrive'
          description?: string
        }
        // Text content
        text?: {
          content: string
        }
        // File content
        file?: {
          url: string
          name: string
          description?: string
        }
        // Quiz content
        quiz?: {
          questions: {
            question: string
            type: 'multiple_choice' | 'true_false' | 'short_answer'
            options?: string[]
            correct_answer: string
            points: number
          }[]
          time_limit?: number
          passing_score: number
        }
        // Assignment content
        assignment?: {
          instructions: string
          type: 'essay' | 'project' | 'discussion' | 'presentation' | 'code_submission' | 'file_upload'
          due_date?: string
          max_points: number
        }
      }
    }[]
  }[]
}

export interface BulkCourseResult {
  courseId: string
  title: string
  modules: {
    moduleId: string
    title: string
    lessons: {
      lessonId: string
      title: string
      contentType: string
      contentCreated: boolean
    }[]
  }[]
}

export interface BulkCourseError {
  index: number
  course: string
  module?: string
  lesson?: string
  error: string
}

export interface BulkCourseResponse {
  success: boolean
  summary: {
    total: number
    created: number
    errors: number
  }
  results: BulkCourseResult[]
  errors: BulkCourseError[]
}

export interface ValidationResult {
  index: number
  title: string
  valid: boolean
  errors: string[]
}

export interface ValidationResponse {
  valid: boolean
  results: ValidationResult[]
  summary: {
    total: number
    valid: number
    invalid: number
  }
}

export interface FileUploadResponse {
  success: boolean
  courses: BulkCourseData[]
  summary: {
    total: number
    totalModules: number
    totalLessons: number
  }
}

export class BulkCoursesAPI {
  /**
   * Create multiple courses with modules, lessons, and content
   */
  static async createBulkCourses(courses: BulkCourseData[]): Promise<BulkCourseResponse> {
    const response = await http<BulkCourseResponse>('/api/bulk-courses/bulk-create', {
      method: 'POST',
      body: { courses }
    })
    return response
  }

  /**
   * Validate bulk course data before creation
   */
  static async validateBulkCourses(courses: BulkCourseData[]): Promise<ValidationResponse> {
    const response = await http<ValidationResponse>('/api/bulk-courses/validate', {
      method: 'POST',
      body: { courses }
    })
    return response
  }

  /**
   * Get template for bulk course creation
   */
  static async getTemplate(): Promise<{ courses: BulkCourseData[] }> {
    const response = await http<{ courses: BulkCourseData[] }>('/api/bulk-courses/template')
    return response
  }

  /**
   * Download template as JSON file
   */
  static downloadTemplate(template: { courses: BulkCourseData[] }): void {
    const dataStr = JSON.stringify(template, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'bulk-courses-template.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Upload and parse file (CSV/Excel/JSON)
   */
  static async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('auth-token')
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    
    const response = await fetch(`${apiBase}/api/bulk-courses/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'File upload failed')
    }
    
    return response.json()
  }

  /**
   * Download Excel template
   */
  static async downloadExcelTemplate(): Promise<void> {
    const token = localStorage.getItem('auth-token')
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    
    const response = await fetch(`${apiBase}/api/bulk-courses/template/excel`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download Excel template')
    }
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'course_template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Download CSV template
   */
  static async downloadCSVTemplate(): Promise<void> {
    const token = localStorage.getItem('auth-token')
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    
    const response = await fetch(`${apiBase}/api/bulk-courses/template/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download CSV template')
    }
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'course_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Parse uploaded JSON file (legacy method)
   */
  static parseUploadedFile(file: File): Promise<BulkCourseData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)
          
          if (!data.courses || !Array.isArray(data.courses)) {
            throw new Error('Invalid file format. Expected object with "courses" array.')
          }
          
          resolve(data.courses)
        } catch (error) {
          reject(new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file)
    })
  }
}
