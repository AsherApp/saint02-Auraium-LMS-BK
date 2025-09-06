import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000'
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/billing/start-trial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'x-dev': 'true' // Development bypass
      }
    })

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Start trial error:', error)
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    )
  }
}
