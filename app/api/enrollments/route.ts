import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    const response = await fetch(`${apiBase}/students/with-enrollments`, {
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

    const enrollments = await response.json()
    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    
    // Return empty array if API fails
    return NextResponse.json({ items: [] })
  }
}
