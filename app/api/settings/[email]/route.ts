import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params
    
    // Get teacher settings from database
    const { data, error } = await supabaseAdmin
      .from('teacher_settings')
      .select('*')
      .eq('teacher_email', email)
      .single()
    
    if (error) {
      // If settings not found, return default settings
      return NextResponse.json({
        theme: "dark",
        notifications: {
          email: true,
          push: true,
          course_updates: true,
          student_activity: true
        },
        privacy: {
          profile_visible: true,
          show_email: false,
          allow_messages: true
        },
        preferences: {
          language: "en",
          timezone: "UTC",
          date_format: "MM/DD/YYYY"
        }
      })
    }
    
    return NextResponse.json(data.settings || {
      theme: "dark",
      notifications: {
        email: true,
        push: true,
        course_updates: true,
        student_activity: true
      },
      privacy: {
        profile_visible: true,
        show_email: false,
        allow_messages: true
      },
      preferences: {
        language: "en",
        timezone: "UTC",
        date_format: "MM/DD/YYYY"
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params
    const body = await request.json()
    
    // Update teacher settings in database
    const { data, error } = await supabaseAdmin
      .from('teacher_settings')
      .upsert({
        teacher_email: email,
        settings: body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data.settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
