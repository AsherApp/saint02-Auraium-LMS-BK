import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get whiteboard strokes for the live session
    const { data, error } = await supabaseAdmin
      .from('whiteboard_strokes')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching whiteboard strokes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch whiteboard strokes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    console.error('Error in whiteboard GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { points, color, width, by } = await request.json()

    if (!points || !color || !width) {
      return NextResponse.json(
        { error: 'Missing required fields: points, color, width' },
        { status: 400 }
      )
    }

    // Add whiteboard stroke
    const { data, error } = await supabaseAdmin
      .from('whiteboard_strokes')
      .insert({
        session_id: id,
        points: typeof points === 'string' ? points : JSON.stringify(points),
        color,
        width,
        by: by || 'anonymous',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding whiteboard stroke:', error)
      return NextResponse.json(
        { error: 'Failed to add whiteboard stroke' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in whiteboard POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
