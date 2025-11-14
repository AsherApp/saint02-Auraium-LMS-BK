import { z } from 'zod'

// Schema for creating a new recording
export const createRecordingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  session_id: z.string().min(1, 'Session ID is required'),
  course_id: z.string().uuid('Invalid course ID format').optional(), // Optional if recording is not tied to a specific course
  duration: z.number().int().min(0, 'Duration must be a non-negative integer').optional().default(0),
  file_size: z.number().int().min(0, 'File size must be a non-negative integer').optional().default(0),
  file_url: z.string().url('Invalid file URL format').optional(),
  thumbnail_url: z.string().url('Invalid thumbnail URL format').optional(),
  quality: z.enum(['low', 'medium', 'high', 'hd', 'fullhd']).optional().default('medium'),
  format: z.enum(['mp4', 'webm', 'mov', 'flv']).optional().default('mp4'),
  tags: z.array(z.string()).optional().default([]),
})

// Schema for updating an existing recording
export const updateRecordingSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().optional(),
  session_id: z.string().min(1, 'Session ID cannot be empty').optional(),
  course_id: z.string().uuid('Invalid course ID format').optional(),
  duration: z.number().int().min(0, 'Duration must be a non-negative integer').optional(),
  file_size: z.number().int().min(0, 'File size must be a non-negative integer').optional(),
  file_url: z.string().url('Invalid file URL format').optional(),
  thumbnail_url: z.string().url('Invalid thumbnail URL format').optional(),
  quality: z.enum(['low', 'medium', 'high', 'hd', 'fullhd']).optional(),
  format: z.enum(['mp4', 'webm', 'mov', 'flv']).optional(),
  tags: z.array(z.string()).optional(),
  view_count: z.number().int().min(0, 'View count must be a non-negative integer').optional(),
  is_bookmarked: z.boolean().optional(),
}).partial() // All fields are optional for a partial update

// Schema for recording ID parameter
export const recordingIdSchema = z.string().uuid('Invalid recording ID format')
