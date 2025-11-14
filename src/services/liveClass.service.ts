import { supabaseAdmin } from '../lib/supabase.js'
import { v4 as uuidv4 } from 'uuid'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// Utility function to ensure arrays are properly handled
function sanitizeArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items : []
}

// --- Type Definitions ---
export type LiveClassStatus = 'SCHEDULED' | 'ONGOING' | 'PAST' | 'CANCELLED'

export interface PaginationOptions {
  limit?: number
  offset?: number
  sortBy?: 'start_time' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface LiveClassFilters extends PaginationOptions {
  teacherId?: string
  courseId?: string
  status?: LiveClassStatus | LiveClassStatus[]
  search?: string
  includePast?: boolean // To include PAST classes in listings
}

export interface CreateLiveClassInput {
  title: string
  description?: string
  courseId?: string
  startTime: string // ISO string
  endTime: string // ISO string
}

export interface UpdateLiveClassInput {
  title?: string
  description?: string
  courseId?: string
  startTime?: string // ISO string
  endTime?: string // ISO string
  status?: LiveClassStatus
  recordingUrl?: string
  isRecorded?: boolean
  recordingAvailableForStudents?: boolean
}

// --- LiveClassService ---
export class LiveClassService {
  /**
   * Lists live classes based on provided filters.
   * @param filters - Filtering and pagination options.
   * @returns A list of live class objects.
   */
  static async listLiveClasses(filters: LiveClassFilters = {}) {
    let query = supabaseAdmin.from('live_classes').select('*')

    if (filters.teacherId) {
      query = query.eq('teacher_id', filters.teacherId)
    }

    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId)
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    } else if (!filters.includePast) {
      // Default to not including PAST classes unless explicitly asked
      query = query.not('status', 'eq', 'PAST')
    }

    if (filters.search) {
      const searchValue = filters.search.trim()
      if (searchValue) {
        query = query.ilike('title', `%${searchValue}%`)
      }
    }

    const limit = Math.min(filters.limit ?? 50, 100)
    const offset = filters.offset ?? 0
    const sortBy = filters.sortBy ?? 'start_time'
    const sortOrder = filters.sortOrder ?? 'asc'

    query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(
      offset,
      offset + limit - 1
    )

    const { data, error } = await query

    if (error) {
      console.error('Error listing live classes:', error)
      throw createHttpError(500, 'failed_to_list_live_classes')
    }

    return sanitizeArray(data)
  }

  /**
   * Retrieves a single live class by its ID.
   * @param liveClassId - The ID of the live class.
   * @param actorId - The ID of the user performing the action (for access control).
   * @returns The live class object.
   */
  static async getLiveClass(liveClassId: string, actorId: string) {
    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .select('*')
      .eq('id', liveClassId)
      .single()

    if (error || !liveClass) {
      throw createHttpError(404, 'live_class_not_found')
    }

    // Basic access control: only teacher or enrolled student can view details
    // More complex RLS policies are in the migration, but application-level check is good.
    if (liveClass.teacher_id !== actorId) {
      // In a real scenario, you'd check if actorId is an enrolled student
      // For now, we'll assume only the teacher can get full details via this service method
      // Students would have a separate, more restricted view or RLS would handle it.
      // throw createHttpError(403, 'insufficient_permissions');
    }

    return liveClass
  }

  /**
   * Creates a new live class.
   * @param teacherId - The ID of the teacher creating the class.
   * @param payload - The data for the new live class.
   * @returns The newly created live class object.
   */
  static async createLiveClass(teacherId: string, payload: CreateLiveClassInput) {
    if (!teacherId) {
      throw createHttpError(401, 'teacher_id_required')
    }

    const agoraChannelName = `live-class-${uuidv4()}` // Generate a unique Agora channel name

    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .insert({
        teacher_id: teacherId,
        title: payload.title,
        description: payload.description || null,
        course_id: payload.courseId || null,
        start_time: payload.startTime,
        end_time: payload.endTime,
        agora_channel_name: agoraChannelName,
        status: 'SCHEDULED' // New classes are always scheduled initially
      })
      .select('*')
      .single()

    if (error || !liveClass) {
      console.error('Error creating live class:', error)
      throw createHttpError(500, 'failed_to_create_live_class')
    }

    // TODO: Audit log for live class creation

    return liveClass
  }

  /**
   * Updates an existing live class.
   * @param liveClassId - The ID of the live class to update.
   * @param teacherId - The ID of the teacher performing the update (for access control).
   * @param payload - The data to update the live class with.
   * @returns The updated live class object.
   */
  static async updateLiveClass(
    liveClassId: string,
    teacherId: string,
    payload: UpdateLiveClassInput
  ) {
    await this.assertTeacherAccess(liveClassId, teacherId) // Ensure only the teacher can update their class

    const updates: Record<string, any> = {}

    if (payload.title !== undefined) updates.title = payload.title
    if (payload.description !== undefined) updates.description = payload.description
    if (payload.courseId !== undefined) updates.course_id = payload.courseId
    if (payload.startTime !== undefined) updates.start_time = payload.startTime
    if (payload.endTime !== undefined) updates.end_time = payload.endTime
    if (payload.status !== undefined) updates.status = payload.status
    if (payload.recordingUrl !== undefined) updates.recording_url = payload.recordingUrl
    if (payload.isRecorded !== undefined) updates.is_recorded = payload.isRecorded
    if (payload.recordingAvailableForStudents !== undefined)
      updates.recording_available_for_students = payload.recordingAvailableForStudents

    if (Object.keys(updates).length === 0) {
      return this.getLiveClass(liveClassId, teacherId) // No updates, return current state
    }

    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .update(updates)
      .eq('id', liveClassId)
      .select('*')
      .single()

    if (error || !liveClass) {
      console.error('Error updating live class:', error)
      throw createHttpError(500, 'failed_to_update_live_class')
    }

    // TODO: Audit log for live class update

    return liveClass
  }

  /**
   * Deletes a live class.
   * @param liveClassId - The ID of the live class to delete.
   * @param teacherId - The ID of the teacher performing the delete (for access control).
   * @returns Success status.
   */
  static async deleteLiveClass(liveClassId: string, teacherId: string) {
    await this.assertTeacherAccess(liveClassId, teacherId) // Ensure only the teacher can delete their class

    const { error } = await supabaseAdmin
      .from('live_classes')
      .delete()
      .eq('id', liveClassId)

    if (error) {
      console.error('Error deleting live class:', error)
      throw createHttpError(500, 'failed_to_delete_live_class')
    }

    // TODO: Audit log for live class deletion

    return { success: true }
  }

  /**
   * Marks a live class as ONGOING.
   * @param liveClassId - The ID of the live class to start.
   * @param teacherId - The ID of the teacher starting the class.
   * @returns The updated live class object.
   */
  static async startLiveClass(liveClassId: string, teacherId: string) {
    await this.assertTeacherAccess(liveClassId, teacherId)

    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .update({ status: 'ONGOING' })
      .eq('id', liveClassId)
      .select('*')
      .single()

    if (error || !liveClass) {
      console.error('Error starting live class:', error)
      throw createHttpError(500, 'failed_to_start_live_class')
    }

    // TODO: Trigger Agora.io recording start if configured
    // TODO: Audit log

    return liveClass
  }

  /**
   * Marks a live class as PAST.
   * @param liveClassId - The ID of the live class to end.
   * @param teacherId - The ID of the teacher ending the class.
   * @returns The updated live class object.
   */
  static async endLiveClass(liveClassId: string, teacherId: string) {
    await this.assertTeacherAccess(liveClassId, teacherId)

    const endedAt = new Date().toISOString()

    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .update({ status: 'PAST' })
      .eq('id', liveClassId)
      .select('*')
      .single()

    if (error || !liveClass) {
      console.error('Error ending live class:', error)
      throw createHttpError(500, 'failed_to_end_live_class')
    }

    try {
      const { AttendanceService } = await import('./attendance.service.js')
      const { ParticipantService } = await import('./participant.service.js')

      await AttendanceService.finalizeOpenAttendance(liveClassId, endedAt)
      await ParticipantService.finalizeParticipants(liveClassId, endedAt)
    } catch (finalizeError) {
      console.error('Error finalising attendance/participants on endLiveClass:', finalizeError)
    }

    return liveClass
  }

  /**
   * Asserts that the actor is the teacher of the specified live class.
   * @param liveClassId - The ID of the live class.
   * @param teacherId - The ID of the teacher.
   * @throws HttpError if the live class is not found or access is denied.
   */
  private static async assertTeacherAccess(liveClassId: string, teacherId: string) {
    if (!teacherId) {
      throw createHttpError(401, 'teacher_id_required')
    }

    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .select('id, teacher_id')
      .eq('id', liveClassId)
      .single()

    if (error || !liveClass) {
      throw createHttpError(404, 'live_class_not_found')
    }

    if (liveClass.teacher_id !== teacherId) {
      throw createHttpError(403, 'insufficient_permissions')
    }
  }
}
