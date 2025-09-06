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
    
    // Get teacher settings from database
    const { data, error } = await supabaseAdmin
      .from('teacher_settings')
      .select('*')
      .eq('teacher_id', userId)
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
          live_class: true,
          student_questions: true,
          course_announcements: true,
          live_session_reminders: true
        },
        privacy: {
          profile_visibility: 'public',
          show_email_to_students: false,
          allow_student_messages: true
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          date_format: 'MM/DD/YYYY'
        },
        course_settings: {
          default_course_duration: 60,
          auto_publish_courses: false,
          allow_student_discussions: true
        },
        grading_settings: {
          default_grading_scale: 'percentage',
          allow_late_submissions: true,
          late_submission_penalty: 10,
          auto_grade_quizzes: true
        },
        live_class_settings: {
          default_session_duration: 60,
          allow_recording: true,
          require_approval_to_join: false,
          max_participants: 50
        },
        advanced_settings: {
          data_export_enabled: true,
          analytics_tracking: true,
          beta_features: false
        }
      })
    }
    
    return NextResponse.json({
      theme: data.theme,
      notifications: data.notifications,
      privacy: data.privacy,
      preferences: data.preferences,
      course_settings: data.course_settings,
      grading_settings: data.grading_settings,
      live_class_settings: data.live_class_settings,
      advanced_settings: data.advanced_settings
    })
  } catch (error) {
    console.error('Error fetching teacher settings:', error)
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
    
    const { 
      theme, 
      notifications, 
      privacy, 
      preferences, 
      course_settings, 
      grading_settings, 
      live_class_settings, 
      advanced_settings 
    } = body
    
    // Update teacher settings in database
    const { data, error } = await supabaseAdmin
      .from('teacher_settings')
      .upsert({
        teacher_id: userId,
        theme,
        notifications,
        privacy,
        preferences,
        course_settings,
        grading_settings,
        live_class_settings,
        advanced_settings
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error updating teacher settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      theme: data.theme,
      notifications: data.notifications,
      privacy: data.privacy,
      preferences: data.preferences,
      course_settings: data.course_settings,
      grading_settings: data.grading_settings,
      live_class_settings: data.live_class_settings,
      advanced_settings: data.advanced_settings
    })
  } catch (error) {
    console.error('Error updating teacher settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
