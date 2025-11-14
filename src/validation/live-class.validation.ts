import { z } from 'zod'

// Schema for creating a new live class
export const createLiveClassSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  course_id: z.string().uuid('Invalid course ID format').optional(),
  scheduled_at: z.string().datetime('Invalid scheduled_at date format'), // ISO string
  duration_minutes: z.number().int().positive('Duration must be a positive integer').optional().default(60),
  timezone: z.string().optional().default('UTC'),
  enable_waiting_room: z.boolean().optional().default(false),
  enable_chat: z.boolean().optional().default(true),
  enable_polls: z.boolean().optional().default(true),
  enable_breakout_rooms: z.boolean().optional().default(true),
  enable_whiteboard: z.boolean().optional().default(true),
  enable_screen_sharing: z.boolean().optional().default(true),
  auto_record: z.boolean().optional().default(false),
  allow_recording: z.boolean().optional().default(true),
  require_registration: z.boolean().optional().default(false),
  max_participants: z.number().int().positive('Max participants must be a positive integer').optional().default(100),
})

// Schema for updating an existing live class
export const updateLiveClassSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().optional(),
  course_id: z.string().uuid('Invalid course ID format').optional(),
  scheduled_at: z.string().datetime('Invalid scheduled_at date format').optional(), // ISO string
  duration_minutes: z.number().int().positive('Duration must be a positive integer').optional(),
  timezone: z.string().optional(),
  enable_waiting_room: z.boolean().optional(),
  enable_chat: z.boolean().optional(),
  enable_polls: z.boolean().optional(),
  enable_breakout_rooms: z.boolean().optional(),
  enable_whiteboard: z.boolean().optional(),
  enable_screen_sharing: z.boolean().optional(),
  auto_record: z.boolean().optional(),
  allow_recording: z.boolean().optional(),
  require_registration: z.boolean().optional(),
  max_participants: z.number().int().positive('Max participants must be a positive integer').optional(),
  status: z.enum(['SCHEDULED', 'ONGOING', 'PAST', 'CANCELLED']).optional(),
  recording_url: z.string().url('Invalid recording URL format').optional(),
  is_recorded: z.boolean().optional(),
  recording_available_for_students: z.boolean().optional(),
}).partial() // All fields are optional for a partial update

// Schema for live class ID parameter
export const liveClassIdSchema = z.string().uuid('Invalid live class ID format')
