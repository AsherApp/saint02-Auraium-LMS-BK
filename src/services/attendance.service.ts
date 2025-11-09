import { supabaseAdmin } from '../lib/supabase.js'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export interface LiveClassAttendance {
  id: string
  live_class_id: string
  student_id: string
  join_time: string
  leave_time: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface RecordJoinInput {
  liveClassId: string
  studentId: string
}

export interface RecordLeaveInput {
  liveClassId: string
  studentId: string
}

// --- AttendanceService ---
export class AttendanceService {
  /**
   * Records a student's join time for a live class.
   * If an existing record for the student in this class is found without a leave_time,
   * it means they reconnected, so we don't create a new record.
   * @param payload - The join data.
   * @returns The attendance record.
   */
  static async recordJoin(payload: RecordJoinInput): Promise<LiveClassAttendance> {
    const { liveClassId, studentId } = payload

    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('live_class_attendance')
      .select('*')
      .eq('live_class_id', liveClassId)
      .eq('student_id', studentId)
      .order('join_time', { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing attendance record:', fetchError)
      throw createHttpError(500, 'failed_to_check_attendance')
    }

    const joinTime = new Date().toISOString()

    if (fetchError?.code === 'PGRST116' || !existingRecord) {
      const { data: attendance, error } = await supabaseAdmin
        .from('live_class_attendance')
        .insert({
          live_class_id: liveClassId,
          student_id: studentId,
          join_time: joinTime,
        })
        .select('*')
        .single()

      if (error || !attendance) {
        console.error('Error recording student join time:', error)
        throw createHttpError(500, 'failed_to_record_join_time')
      }

      return attendance
    }

    if (!existingRecord.leave_time) {
      return existingRecord
    }

    const { data: updatedRecord, error: updateError } = await supabaseAdmin
      .from('live_class_attendance')
      .update({
        join_time: joinTime,
        leave_time: null,
        duration_minutes: null
      })
      .eq('id', existingRecord.id)
      .select('*')
      .single()

    if (updateError || !updatedRecord) {
      console.error('Error restarting attendance record:', updateError)
      throw createHttpError(500, 'failed_to_record_join_time')
    }

    return updatedRecord
  }

  /**
   * Records a student's leave time and calculates duration for a live class.
   * @param payload - The leave data.
   * @returns The updated attendance record.
   */
  static async recordLeave(payload: RecordLeaveInput): Promise<LiveClassAttendance | null> {
    const { liveClassId, studentId } = payload
    const leaveTime = new Date()

    // Find the most recent open attendance record for this student in this class
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('live_class_attendance')
      .select('*')
      .eq('live_class_id', liveClassId)
      .eq('student_id', studentId)
      .is('leave_time', null)
      .order('join_time', { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing attendance record for leave:', fetchError)
      // Don't throw, just log and return null as it might be a non-critical issue
      return null
    }

    if (!existingRecord) {
      console.warn(`No open attendance record found for student ${studentId} in live class ${liveClassId} to record leave time.`)
      return null
    }

    const joinTime = new Date(existingRecord.join_time)
    const durationMinutes = Math.round((leaveTime.getTime() - joinTime.getTime()) / (1000 * 60))

    const { data: updatedAttendance, error } = await supabaseAdmin
      .from('live_class_attendance')
      .update({
        leave_time: leaveTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', existingRecord.id)
      .select('*')
      .single()

    if (error || !updatedAttendance) {
      console.error('Error recording student leave time:', error)
      // Don't throw, just log and return null
      return null
    }

    return updatedAttendance
  }

  /**
   * Retrieves attendance records for a specific live class.
   * @param liveClassId - The ID of the live class.
   * @returns A list of attendance records.
   */
  static async getAttendanceRecords(liveClassId: string): Promise<LiveClassAttendance[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_attendance')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('join_time', { ascending: true })

    if (error) {
      console.error('Error retrieving attendance records:', error)
      throw createHttpError(500, 'failed_to_retrieve_attendance_records')
    }

    return data || []
  }
}
