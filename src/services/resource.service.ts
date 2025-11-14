import { supabaseAdmin } from '../lib/supabase.js'
import path from 'path'
import fs from 'fs/promises' // Use fs/promises for async file operations

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export interface LiveClassResource {
  id: string
  live_class_id: string
  teacher_id: string
  title: string
  url?: string
  file_path?: string // Relative path to uploaded file
  file_name?: string // Original file name
  created_at: string
  updated_at: string
}

export interface CreateLiveClassResourceInput {
  liveClassId: string
  teacherId: string
  title: string
  url?: string
  file?: {
    path: string // Temporary path of the uploaded file
    originalname: string
  }
}

export interface UpdateLiveClassResourceInput {
  title?: string
  url?: string | null
  file?: {
    path: string // Temporary path of the uploaded file
    originalname: string
  } | null
  removeFile?: boolean // Flag to indicate removal of existing file
}

// --- ResourceService ---
export class ResourceService {
  private static UPLOADS_DIR = path.join(process.cwd(), 'uploads')

  /**
   * Creates a new live class resource.
   * @param payload - The resource data.
   * @returns The newly created resource object.
   */
  static async createResource(payload: CreateLiveClassResourceInput): Promise<LiveClassResource> {
    const { liveClassId, teacherId, title, url, file } = payload
    let filePath: string | undefined
    let fileName: string | undefined

    if (!url && !file) {
      throw createHttpError(400, 'Resource must have either a URL or a file.')
    }

    if (file) {
      // Move the uploaded file from temp location to permanent uploads directory
      const uniqueFileName = `${Date.now()}-${file.originalname}`
      const destinationPath = path.join(this.UPLOADS_DIR, uniqueFileName)
      try {
        await fs.rename(file.path, destinationPath)
        filePath = `/uploads/${uniqueFileName}` // Store relative path for access
        fileName = file.originalname
      } catch (err) {
        console.error('Error moving uploaded file:', err)
        throw createHttpError(500, 'failed_to_upload_file')
      }
    }

    const { data: resource, error } = await supabaseAdmin
      .from('live_class_resources')
      .insert({
        live_class_id: liveClassId,
        teacher_id: teacherId,
        title: title,
        url: url || null,
        file_path: filePath || null,
        file_name: fileName || null,
      })
      .select('*')
      .single()

    if (error || !resource) {
      console.error('Error creating live class resource:', error)
      // Clean up uploaded file if DB insert fails
      if (filePath) {
        await fs.unlink(path.join(this.UPLOADS_DIR, path.basename(filePath))).catch(console.error)
      }
      throw createHttpError(500, 'failed_to_create_resource')
    }

    return resource
  }

  /**
   * Retrieves resources for a specific live class.
   * @param liveClassId - The ID of the live class.
   * @returns A list of live class resources.
   */
  static async getLiveClassResources(liveClassId: string): Promise<LiveClassResource[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_resources')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error retrieving live class resources:', error)
      throw createHttpError(500, 'failed_to_retrieve_resources')
    }

    return data || []
  }

  /**
   * Updates an existing live class resource.
   * @param resourceId - The ID of the resource to update.
   * @param teacherId - The ID of the teacher updating the resource (for access control).
   * @param payload - The data to update the resource with.
   * @returns The updated resource object.
   */
  static async updateResource(
    resourceId: string,
    teacherId: string,
    payload: UpdateLiveClassResourceInput
  ): Promise<LiveClassResource> {
    const existingResource = await this.assertTeacherAccess(resourceId, teacherId)

    const updates: Record<string, any> = {}
    let newFilePath: string | undefined
    let newFileName: string | undefined

    if (payload.title !== undefined) updates.title = payload.title
    if (payload.url !== undefined) updates.url = payload.url
    
    // Handle file removal
    if (payload.removeFile && existingResource.file_path) {
      await fs.unlink(path.join(this.UPLOADS_DIR, path.basename(existingResource.file_path))).catch(console.error)
      updates.file_path = null
      updates.file_name = null
    }

    // Handle new file upload
    if (payload.file) {
      // If there was an old file, delete it first
      if (existingResource.file_path) {
        await fs.unlink(path.join(this.UPLOADS_DIR, path.basename(existingResource.file_path))).catch(console.error)
      }
      const uniqueFileName = `${Date.now()}-${payload.file.originalname}`
      const destinationPath = path.join(this.UPLOADS_DIR, uniqueFileName)
      try {
        await fs.rename(payload.file.path, destinationPath)
        newFilePath = `/uploads/${uniqueFileName}`
        newFileName = payload.file.originalname
        updates.file_path = newFilePath
        updates.file_name = newFileName
      } catch (err) {
        console.error('Error moving uploaded file:', err)
        throw createHttpError(500, 'failed_to_upload_file')
      }
    } else if (payload.file === null) { // Explicitly setting file to null
        if (existingResource.file_path) {
            await fs.unlink(path.join(this.UPLOADS_DIR, path.basename(existingResource.file_path))).catch(console.error)
        }
        updates.file_path = null
        updates.file_name = null
    }


    const { data: resource, error } = await supabaseAdmin
      .from('live_class_resources')
      .update(updates)
      .eq('id', resourceId)
      .select('*')
      .single()

    if (error || !resource) {
      console.error('Error updating live class resource:', error)
      // Clean up new uploaded file if DB update fails
      if (newFilePath) {
        await fs.unlink(path.join(this.UPLOADS_DIR, path.basename(newFilePath))).catch(console.error)
      }
      throw createHttpError(500, 'failed_to_update_resource')
    }

    return resource
  }

  /**
   * Deletes a live class resource.
   * @param resourceId - The ID of the resource to delete.
   * @param teacherId - The ID of the teacher deleting the resource (for access control).
   * @returns Success status.
   */
  static async deleteResource(resourceId: string, teacherId: string): Promise<{ success: boolean }> {
    const existingResource = await this.assertTeacherAccess(resourceId, teacherId)

    const { error } = await supabaseAdmin
      .from('live_class_resources')
      .delete()
      .eq('id', resourceId)

    if (error) {
      console.error('Error deleting live class resource:', error)
      throw createHttpError(500, 'failed_to_delete_resource')
    }

    // If there was an associated file, delete it from the file system
    if (existingResource.file_path) {
      await fs.unlink(path.join(this.UPLOADS_DIR, path.basename(existingResource.file_path))).catch(console.error)
    }

    return { success: true }
  }

  /**
   * Asserts that the actor is the teacher of the specified resource.
   * @param resourceId - The ID of the resource.
   * @param teacherId - The ID of the teacher.
   * @throws HttpError if the resource is not found or access is denied.
   */
  private static async assertTeacherAccess(resourceId: string, teacherId: string): Promise<LiveClassResource> {
    if (!teacherId) {
      throw createHttpError(401, 'teacher_id_required')
    }

    const { data: resource, error } = await supabaseAdmin
      .from('live_class_resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    if (error || !resource) {
      throw createHttpError(404, 'resource_not_found')
    }

    if (resource.teacher_id !== teacherId) {
      throw createHttpError(403, 'insufficient_permissions')
    }
    return resource
  }
}
