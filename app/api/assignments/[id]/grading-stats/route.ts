import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    const response = await fetch(`${apiBase}/assignments/${params.id}/grading-stats`, {
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

    const stats = await response.json()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching grading stats:', error)
    return NextResponse.json({ error: 'Failed to fetch grading stats' }, { status: 500 })
  }
}
