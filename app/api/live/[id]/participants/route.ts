import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get participants for the live session
    const { data, error } = await supabaseAdmin
      .from('live_participants')
      .select('*')
      .eq('session_id', id)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      )
    }

    // Transform the data to include user names
    const participantsWithNames = await Promise.all(
      (data || []).map(async (participant) => {
        // Try to get user profile information
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('name, email')
          .eq('email', participant.email)
          .single()

        return {
          id: participant.id,
          email: participant.email,
          name: profile?.name || participant.email.split('@')[0],
          joined_at: participant.joined_at,
          session_id: participant.session_id
        }
      })
    )

    return NextResponse.json({ items: participantsWithNames })
  } catch (error) {
    console.error('Error in participants API:', error)
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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Add participant to the live session
    const { data, error } = await supabaseAdmin
      .from('live_participants')
      .insert({
        session_id: id,
        email: email.toLowerCase(),
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding participant:', error)
      return NextResponse.json(
        { error: 'Failed to add participant' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in participants POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
