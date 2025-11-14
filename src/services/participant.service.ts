import { supabaseAdmin } from '../lib/supabase.js'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export interface LiveClassParticipant {
  id: string
  userId: string | null
  email: string
  role: 'teacher' | 'student'
  user_type: 'teacher' | 'student'
  joined_at: string
  left_at: string | null
  is_active: boolean
  displayName: string
}

interface RecordParticipantJoinInput {
  liveClassId: string
  userId: string
  email: string
  role: 'teacher' | 'student'
}

interface RecordParticipantLeaveInput {
  liveClassId: string
  userId: string
  role: 'teacher' | 'student'
}

// --- ParticipantService ---
export class ParticipantService {
  static async getParticipants(liveClassId: string): Promise<LiveClassParticipant[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_participants')
      .select('id, user_email, email, user_type, joined_at, left_at, is_active, updated_at')
      .eq('live_class_id', liveClassId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching live class participants:', error)
      throw createHttpError(500, 'failed_to_fetch_participants')
    }

    const participants = (data || []).filter((row): row is typeof data[number] => Boolean(row))

    if (participants.length === 0) {
      return []
    }

    const userEmails = Array.from(
      new Set(
        participants
          .map((row) => row?.user_email || row?.email)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      )
    )

    let profileMap = new Map<
      string,
      { id: string | null; first_name: string | null; last_name: string | null; email: string | null }
    >()

    if (userEmails.length > 0) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, first_name, last_name')
        .in('email', userEmails)

      if (profileError) {
        console.error('Error fetching participant profiles:', profileError)
        throw createHttpError(500, 'failed_to_fetch_participant_profiles')
      }

      profileMap = new Map(
        (profiles || []).map((profile) => [
          profile.email as string,
          {
            id: profile.id ?? null,
            first_name: profile.first_name ?? null,
            last_name: profile.last_name ?? null,
            email: profile.email ?? null
          }
        ])
      )
    }

    const result = participants.map((row) => {
      const participantEmail = row.user_email || row.email
      const profile = participantEmail ? profileMap.get(participantEmail) : undefined
      const firstName = profile?.first_name?.trim() ?? ''
      const lastName = profile?.last_name?.trim() ?? ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
      const fallback = participantEmail

      const isActive = Boolean(row.is_active) && row.left_at === null

      return {
        id: row.id,
        userId: profile?.id ?? null, // Return UUID for Agora matching
        userUuid: profile?.id ?? null, // Explicit UUID field
        email: participantEmail ?? row.email,
        role: row.user_type,
        user_type: row.user_type,
        joined_at: row.joined_at,
        left_at: row.left_at ?? null,
        is_active: isActive,
        displayName: fullName || fallback || row.email
      }
    })
    
    console.log(`[PARTICIPANT SERVICE] Returning ${result.length} participants for class ${liveClassId}:`)
    result.forEach(p => {
      console.log(`  - ${p.displayName} (userId: ${p.userId}, email: ${p.email}, active: ${p.is_active})`)
    })
    
    return result
  }

  static async recordJoin(payload: RecordParticipantJoinInput): Promise<void> {
    const { liveClassId, userId, email, role } = payload

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('live_class_participants')
      .select('*')
      .eq('live_class_id', liveClassId)
      .eq('user_email', email) // Use email for lookups
      .eq('user_type', role)
      .order('joined_at', { ascending: false })
      .limit(1)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing participant record:', existingError)
      throw createHttpError(500, 'failed_to_update_participants')
    }

    const now = new Date().toISOString()

    if (existingError?.code === 'PGRST116' || !existing) {
      // Get user_id (UUID) from user_profiles using email
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profileError || !userProfile) {
        console.error('Error fetching user profile for participant:', profileError)
        throw createHttpError(404, 'user_not_found')
      }

      const { error: insertError } = await supabaseAdmin.from('live_class_participants').insert({
        live_class_id: liveClassId,
        user_id: userProfile.id, // UUID from user_profiles
        user_email: email,
        user_type: role,
        email,
        joined_at: now,
        is_active: true
      })

      if (insertError) {
        console.error('Error inserting live class participant:', insertError)
        throw createHttpError(500, 'failed_to_add_participant')
      }

      return
    }

    if (!existing.left_at) {
      if (!existing.is_active) {
        await supabaseAdmin
          .from('live_class_participants')
          .update({ is_active: true, updated_at: now })
          .eq('id', existing.id)
      }
      return
    }

    const { error: restartError } = await supabaseAdmin
      .from('live_class_participants')
      .update({
        joined_at: now,
        left_at: null,
        is_active: true,
        updated_at: now
      })
      .eq('id', existing.id)

    if (restartError) {
      console.error('Error restarting participant session:', restartError)
      throw createHttpError(500, 'failed_to_update_participants')
    }
  }

  static async recordLeave(payload: RecordParticipantLeaveInput): Promise<void> {
    const { liveClassId, userId, role } = payload

    const now = new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('live_class_participants')
      .update({
        left_at: now,
        is_active: false,
        updated_at: now
      })
      .eq('live_class_id', liveClassId)
      .eq('user_email', userId) // userId now contains email
      .eq('user_type', role)
      .is('left_at', null)

    if (error) {
      console.error('Error recording participant leave:', error)
      throw createHttpError(500, 'failed_to_update_participants')
    }
  }

  static async finalizeParticipants(liveClassId: string, endedAt?: string): Promise<void> {
    const timestamp = endedAt ? new Date(endedAt).toISOString() : new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('live_class_participants')
      .update({
        left_at: timestamp,
        is_active: false,
        updated_at: timestamp
      })
      .eq('live_class_id', liveClassId)
      .is('left_at', null)

    if (error) {
      console.error('Error finalising live class participants:', error)
      throw createHttpError(500, 'failed_to_finalize_participants')
    }
  }
}
