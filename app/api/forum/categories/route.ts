import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    const response = await fetch(`${apiBase}/forum/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-dev': 'true',
        'x-user-email': 'mecki@test.com',
        'x-user-role': 'teacher'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const categories = await response.json()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching forum categories:', error)
    
    // Return default categories if API fails
    return NextResponse.json([
      {
        id: 'general',
        name: 'General Discussion',
        description: 'General topics and discussions',
        color: '#3b82f6',
        icon: 'message-circle'
      },
      {
        id: 'course-help',
        name: 'Course Help',
        description: 'Questions and help related to courses',
        color: '#10b981',
        icon: 'book-open'
      },
      {
        id: 'technical',
        name: 'Technical Support',
        description: 'Technical issues and support',
        color: '#f59e0b',
        icon: 'settings'
      },
      {
        id: 'announcements',
        name: 'Announcements',
        description: 'Important announcements and updates',
        color: '#ef4444',
        icon: 'megaphone'
      },
      {
        id: 'student-life',
        name: 'Student Life',
        description: 'Student-related discussions and activities',
        color: '#8b5cf6',
        icon: 'users'
      }
    ])
  }
}
