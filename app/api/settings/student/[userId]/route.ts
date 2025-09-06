import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyToken } from "@/lib/jwt"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID parameter is required' },
        { status: 400 }
      )
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get student settings from database
    const { data, error } = await supabaseAdmin
      .from('student_settings')
      .select('*')
      .eq('student_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Return default settings if none exist
    if (!data) {
      return NextResponse.json({
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          assignments: true,
          announcements: true,
          live_class: true
        },
        privacy: {
          profile_visible: true,
          show_email: false,
          show_bio: true
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          date_format: 'MM/DD/YYYY'
        }
      })
    }
    
    return NextResponse.json({
      theme: data.theme,
      notifications: data.notifications,
      privacy: data.privacy,
      preferences: data.preferences
    })
  } catch (error) {
    console.error('Error fetching student settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID parameter is required' },
        { status: 400 }
      )
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    const { theme, notifications, privacy, preferences } = body
    
    // Update student settings in database
    const { data, error } = await supabaseAdmin
      .from('student_settings')
      .upsert({
        student_id: userId,
        theme,
        notifications,
        privacy,
        preferences
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error updating student settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      theme: data.theme,
      notifications: data.notifications,
      privacy: data.privacy,
      preferences: data.preferences
    })
  } catch (error) {
    console.error('Error updating student settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
