import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params
    
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }
    
    // Get teacher profile from database
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email,
      bio: data.bio || '',
      avatar_url: data.avatar_url || '',
      website: data.website || '',
      location: data.location || '',
      expertise: data.expertise || '',
      education: data.education || '',
      experience: data.experience || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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
    
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }
    
    // Update teacher profile in database
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        bio: body.bio,
        avatar_url: body.avatar_url,
        website: body.website,
        location: body.location,
        expertise: body.expertise,
        education: body.education,
        experience: body.experience,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      bio: data.bio,
      avatar_url: data.avatar_url,
      website: data.website,
      location: data.location,
      expertise: data.expertise,
      education: data.education,
      experience: data.experience,
      updated_at: data.updated_at
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
