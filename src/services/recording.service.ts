import axios from 'axios'
import 'dotenv/config'

import { supabaseAdmin } from '../lib/supabase.js'
import { AgoraRole, AgoraService } from './agora.service.js'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Agora.io Configuration ---
const AGORA_APP_ID = process.env.AGORA_APP_ID
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE
const AGORA_CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID
const AGORA_CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET
const AGORA_STORAGE_VENDOR = process.env.AGORA_STORAGE_VENDOR
const AGORA_STORAGE_REGION = process.env.AGORA_STORAGE_REGION
const AGORA_STORAGE_BUCKET = process.env.AGORA_STORAGE_BUCKET
const AGORA_STORAGE_ACCESS_KEY = process.env.AGORA_STORAGE_ACCESS_KEY
const AGORA_STORAGE_SECRET_KEY = process.env.AGORA_STORAGE_SECRET_KEY
const AGORA_STORAGE_FILE_PREFIX = process.env.AGORA_STORAGE_FILE_PREFIX
const AGORA_RECORDING_FILE_BASE_URL = process.env.AGORA_RECORDING_FILE_BASE_URL

const AGORA_RECORDING_BASE_URL = 'https://api.agora.io/v1/apps'

if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE || !AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
  console.warn('Agora.io environment variables are not fully configured. Recording service may not function.')
}

const normalizeBaseUrl = (value?: string | null) => {
  if (!value) return null
  return value.replace(/\/+$/, '')
}

const getRecordingFileUrl = (filePath: string | null | undefined) => {
  const base = normalizeBaseUrl(AGORA_RECORDING_FILE_BASE_URL)
  if (!base || !filePath) {
    return null
  }
  return `${base}/${filePath.replace(/^\/+/, '')}`
}

const buildStorageConfig = () => {
  const vendor = Number(AGORA_STORAGE_VENDOR ?? 0)
  const region = Number(AGORA_STORAGE_REGION ?? 0)

  if (vendor === 0) {
    return {
      vendor,
      region,
    }
  }

  if (!AGORA_STORAGE_BUCKET || !AGORA_STORAGE_ACCESS_KEY || !AGORA_STORAGE_SECRET_KEY) {
    throw createHttpError(500, 'Agora storage configuration is incomplete. Please provide AGORA_STORAGE_BUCKET, AGORA_STORAGE_ACCESS_KEY, and AGORA_STORAGE_SECRET_KEY.')
  }

  const fileNamePrefix =
    AGORA_STORAGE_FILE_PREFIX
      ? AGORA_STORAGE_FILE_PREFIX.split('/').filter(Boolean)
      : undefined

  return {
    vendor,
    region,
    bucket: AGORA_STORAGE_BUCKET,
    accessKey: AGORA_STORAGE_ACCESS_KEY,
    secretKey: AGORA_STORAGE_SECRET_KEY,
    fileNamePrefix,
  }
}

// Basic Auth header for Agora.io REST API
const getAgoraAuthHeader = () => {
  if (!AGORA_CUSTOMER_ID || !AGORA_CUSTOMER_SECRET) {
    throw createHttpError(500, 'Agora customer ID or secret not configured.')
  }
  const credentials = Buffer.from(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`).toString('base64')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`,
  }
}

// --- Type Definitions ---
export interface LiveClassRecording {
  id: string
  live_class_id: string
  agora_sid: string
  resource_id: string
  file_url: string | null
  file_path?: string | null
  duration_seconds: number | null
  size_bytes: number | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface StartRecordingInput {
  liveClassId: string
  channelName: string
  uid: string // Teacher's UID in Agora
}

export interface StopRecordingInput {
  liveClassId: string
  agoraSid: string
  resourceId: string
  channelName: string
  uid: string // Teacher's UID in Agora
}

export interface QueryRecordingInput {
  agoraSid: string
  resourceId: string
  uid: string // Teacher's UID in Agora
}

// --- RecordingService ---
export class RecordingService {
  /**
   * Initiates Agora.io cloud recording.
   * @param payload - Recording start data.
   * @returns Agora.io recording session ID and resource ID.
   */
  static async startRecording(payload: StartRecordingInput): Promise<{ agoraSid: string, resourceId: string }> {
    const { liveClassId, channelName, uid } = payload

    if (!AGORA_APP_ID) {
      throw createHttpError(500, 'Agora App ID not configured.')
    }

    try {
      // 1. Acquire a resource
      const acquireResponse = await axios.post(
        `${AGORA_RECORDING_BASE_URL}/${AGORA_APP_ID}/cloud_recording/acquire`,
        {
          cname: channelName,
          uid: uid,
          clientRequest: {
            resourceExpiredHour: 24,
          },
        },
        { headers: getAgoraAuthHeader() }
      )
      const resourceId = acquireResponse.data.resourceId

      const rtcToken = AgoraService.generateRtcToken(channelName, uid, AgoraRole.PUBLISHER, 3600)
      const storageConfig = buildStorageConfig()

      // 2. Start the recording
      const startResponse = await axios.post(
        `${AGORA_RECORDING_BASE_URL}/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/mode/individual/start`,
        {
          cname: channelName,
          uid: uid,
          clientRequest: {
            token: rtcToken,
            recordingConfig: {
              maxIdleTime: 30, // seconds
              streamTypes: 2, // 0: audio only, 1: video only, 2: audio and video
              channelType: 0, // 0: communication, 1: live broadcast
              subscribeAudioUids: ['#allstream#'],
              subscribeVideoUids: ['#allstream#'],
              subscribeUidGroup: 0,
              // Add other recording configurations as needed
            },
            storageConfig,
          },
        },
        { headers: getAgoraAuthHeader() }
      )
      const agoraSid = startResponse.data.sid

      // Save initial recording metadata to database
      await this.saveRecordingMetadata({
        live_class_id: liveClassId,
        agora_sid: agoraSid,
        resource_id: resourceId,
        file_url: null,
        file_path: null,
        duration_seconds: null,
        size_bytes: null,
        status: 'processing', // Initially processing
        updated_at: new Date().toISOString(),
      })

      return { agoraSid, resourceId }
    } catch (error: any) {
      console.error('Error starting Agora.io recording:', error.response?.data || error.message)
      throw createHttpError(error.response?.status || 500, 'failed_to_start_recording')
    }
  }

  /**
   * Stops Agora.io cloud recording.
   * @param payload - Recording stop data.
   */
  static async stopRecording(payload: StopRecordingInput): Promise<void> {
    const { liveClassId, agoraSid, resourceId, channelName, uid } = payload

    if (!AGORA_APP_ID) {
      throw createHttpError(500, 'Agora App ID not configured.')
    }

    try {
      await axios.post(
        `${AGORA_RECORDING_BASE_URL}/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${agoraSid}/stop`,
        {
          cname: channelName,
          uid: uid,
          clientRequest: {},
        },
        { headers: getAgoraAuthHeader() }
      )

      let filePath: string | null = null
      let durationSeconds: number | null = null
      let sizeBytes: number | null = null

      try {
        const queryResult = await this.queryRecording({
          agoraSid,
          resourceId,
          uid,
        })

        const serverResponse = queryResult?.serverResponse ?? queryResult
        let fileList: any[] = []

        if (serverResponse?.fileList) {
          if (Array.isArray(serverResponse.fileList)) {
            fileList = serverResponse.fileList
          } else if (typeof serverResponse.fileList === 'string') {
            try {
              const parsed = JSON.parse(serverResponse.fileList)
              if (Array.isArray(parsed)) {
                fileList = parsed
              }
            } catch (parseError) {
              console.warn('Failed to parse Agora recording file list JSON:', (parseError as any)?.message)
            }
          }
        }

        if (fileList.length > 0) {
          const primaryFile = fileList[0]
          filePath = primaryFile?.fileName ?? null
          durationSeconds = primaryFile?.duration ? Number(primaryFile.duration) : null
          sizeBytes = primaryFile?.fileSize ? Number(primaryFile.fileSize) : null
        }
      } catch (queryError) {
        console.warn('Unable to fetch Agora recording metadata after stop:', (queryError as any)?.response?.data || (queryError as any)?.message)
      }

      const fileUrl = getRecordingFileUrl(filePath ?? undefined)

      await this.saveRecordingMetadata({
        live_class_id: liveClassId,
        agora_sid: agoraSid,
        resource_id: resourceId,
        status: 'completed',
        file_path: filePath,
        file_url: fileUrl,
        duration_seconds: durationSeconds,
        size_bytes: sizeBytes,
        updated_at: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error('Error stopping Agora.io recording:', error.response?.data || error.message)
      // Update status to failed if stop fails
      await supabaseAdmin
        .from('live_class_recordings')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('live_class_id', liveClassId)
        .eq('agora_sid', agoraSid)
      throw createHttpError(error.response?.status || 500, 'failed_to_stop_recording')
    }
  }

  /**
   * Queries the status of an Agora.io cloud recording.
   * @param payload - Recording query data.
   * @returns Recording status and file list.
   */
  static async queryRecording(payload: QueryRecordingInput): Promise<any> {
    const { agoraSid, resourceId, uid } = payload

    if (!AGORA_APP_ID) {
      throw createHttpError(500, 'Agora App ID not configured.')
    }

    try {
      const response = await axios.get(
        `${AGORA_RECORDING_BASE_URL}/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${agoraSid}/mode/individual/query`,
        { headers: getAgoraAuthHeader() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error querying Agora.io recording:', error.response?.data || error.message)
      throw createHttpError(error.response?.status || 500, 'failed_to_query_recording')
    }
  }

  /**
   * Saves or updates recording metadata in the database.
   * @param data - Recording metadata.
   * @returns The saved recording record.
   */
  static async saveRecordingMetadata(metadata: Partial<LiveClassRecording>): Promise<LiveClassRecording> {
    const { data, error } = await supabaseAdmin
      .from('live_class_recordings')
      .upsert(metadata, { onConflict: 'agora_sid' }) // Upsert based on agora_sid
      .select('*')

    const recording = Array.isArray(data) ? data[0] : data

    if (error || !recording) {
      console.error('Error saving recording metadata:', error)
      throw createHttpError(500, 'failed_to_save_recording_metadata')
    }
    return recording
  }

  /**
   * Retrieves recording records for a specific live class.
   * @param liveClassId - The ID of the live class.
   * @returns A list of recording records.
   */
  static async getRecordingsByLiveClassId(liveClassId: string): Promise<LiveClassRecording[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_recordings')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error retrieving recording records:', error)
      throw createHttpError(500, 'failed_to_retrieve_recording_records')
    }

    return data || []
  }

  /**
   * Retrieves all recordings (for teachers).
   * @returns A list of all recording records.
   */
  static async getAllRecordings(): Promise<LiveClassRecording[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_recordings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error retrieving all recordings:', error)
      throw createHttpError(500, 'failed_to_retrieve_recordings')
    }

    return data || []
  }

  /**
   * Retrieves recordings accessible to a specific student (based on enrolled courses).
   * @param studentEmail - The email of the student.
   * @returns A list of recording records the student can access.
   */
  static async getStudentRecordings(studentEmail: string): Promise<LiveClassRecording[]> {
    // Get all courses the student is enrolled in
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('student_email', studentEmail)

    if (enrollError) {
      console.error('Error retrieving student enrollments:', enrollError)
      throw createHttpError(500, 'failed_to_retrieve_enrollments')
    }

    if (!enrollments || enrollments.length === 0) {
      return []
    }

    const courseIds = enrollments.map((e: any) => e.course_id)

    // Get live classes for those courses
    const { data: liveClasses, error: classError } = await supabaseAdmin
      .from('live_classes')
      .select('id')
      .in('course_id', courseIds)

    if (classError) {
      console.error('Error retrieving student live classes:', classError)
      throw createHttpError(500, 'failed_to_retrieve_live_classes')
    }

    if (!liveClasses || liveClasses.length === 0) {
      return []
    }

    const liveClassIds = liveClasses.map((lc: any) => lc.id)

    // Get recordings for those live classes where recording is available for students
    const { data: recordings, error: recordingError } = await supabaseAdmin
      .from('live_class_recordings')
      .select(`
        *,
        live_classes!inner (
          id,
          title,
          course_id,
          recording_available_for_students
        )
      `)
      .in('live_class_id', liveClassIds)
      .eq('live_classes.recording_available_for_students', true)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (recordingError) {
      console.error('Error retrieving student recordings:', recordingError)
      throw createHttpError(500, 'failed_to_retrieve_student_recordings')
    }

    return recordings || []
  }
}
