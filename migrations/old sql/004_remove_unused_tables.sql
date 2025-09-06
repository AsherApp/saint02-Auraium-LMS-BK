-- Remove unused tables that are no longer needed
-- This migration removes tables that were created but never used by the application

-- Remove whiteboard_strokes table (whiteboard functionality removed)
DROP TABLE IF EXISTS whiteboard_strokes CASCADE;

-- Remove profiles table (not used by the application)
DROP TABLE IF EXISTS profiles CASCADE;

-- Remove messages table (messages routes removed)
DROP TABLE IF EXISTS messages CASCADE;

-- Note: These tables were created but never actually used by the frontend
-- The application uses live_messages for live session messaging instead of the general messages table
