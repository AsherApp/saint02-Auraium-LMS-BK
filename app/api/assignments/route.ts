import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://auraiumlmsbk.up.railway.app'
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    const response = await fetch(`${apiBase}/assignments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const assignments = await response.json()
    
    // Transform backend format to frontend format
    const transformedAssignments = assignments.map((assignment: any) => ({
      id: assignment.id,
      course_id: assignment.courseId,
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      due_at: assignment.dueAt,
      points: assignment.points,
      submission_count: assignment.submissionCount || 0,
      created_at: assignment.createdAt,
      updated_at: assignment.updatedAt
    }))

    return NextResponse.json({ items: transformedAssignments })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    
    // Return empty array if API fails
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://auraiumlmsbk.up.railway.app'
    const body = await request.json()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    const response = await fetch(`${apiBase}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const assignment = await response.json()
    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
