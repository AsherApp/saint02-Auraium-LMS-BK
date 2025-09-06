import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get live session details
    const { data, error } = await supabaseAdmin
      .from('live_sessions')
      .select(`
        *,
        courses(title, teacher_email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching live session:', error)
      return NextResponse.json(
        { error: 'Live session not found' },
        { status: 404 }
      )
    }

    // Transform the data to match frontend expectations
    const session = {
      id: data.id,
      course_id: data.course_id,
      module_id: data.module_id,
      title: data.title,
      description: data.description,
      start_at: data.start_at,
      end_at: data.end_at,
      status: data.status,
      teacher_email: data.teacher_email,
      session_type: data.session_type || 'general',
      course_title: data.courses?.title,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_started: data.is_started || false,
      started_at: data.started_at
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error in live session API:', error)
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
    const { action } = await request.json()

    if (action === 'join') {
      // Handle join session logic
      const { data, error } = await supabaseAdmin
        .from('live_participants')
        .insert({
          session_id: id,
          email: 'user@example.com', // This should come from auth
          joined_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error joining session:', error)
        return NextResponse.json(
          { error: 'Failed to join session' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, participant: data })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in live session POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
