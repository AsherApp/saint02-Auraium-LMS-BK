-- =============================================================================
-- SUPABASE STORAGE SETUP MIGRATION
-- =============================================================================
-- This migration sets up the "Files" bucket and storage policies for the LMS
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- CREATE FILES BUCKET
-- =============================================================================

-- Create the Files bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Files',
  'Files',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/mkv',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/json',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript'
  ]
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for Files" ON storage.objects;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'Files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'Files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'Files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'Files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Public read access for Files bucket (for public URLs)
CREATE POLICY "Public read access for Files" ON storage.objects
  FOR SELECT USING (bucket_id = 'Files');

-- =============================================================================
-- STORAGE FUNCTIONS
-- =============================================================================

-- Function to get file size
CREATE OR REPLACE FUNCTION get_file_size(file_path text)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT (metadata->>'size')::bigint 
    FROM storage.objects 
    WHERE name = file_path AND bucket_id = 'Files'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list user files
CREATE OR REPLACE FUNCTION list_user_files(user_id text)
RETURNS TABLE (
  name text,
  size bigint,
  created_at timestamptz,
  updated_at timestamptz,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name,
    (o.metadata->>'size')::bigint as size,
    o.created_at,
    o.updated_at,
    o.metadata
  FROM storage.objects o
  WHERE o.bucket_id = 'Files' 
    AND o.name LIKE user_id || '/%'
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id text)
RETURNS TABLE (
  file_count bigint,
  total_size_bytes bigint,
  total_size_mb numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as file_count,
    COALESCE(SUM((metadata->>'size')::bigint), 0) as total_size_bytes,
    ROUND(COALESCE(SUM((metadata->>'size')::bigint), 0) / 1024.0 / 1024.0, 2) as total_size_mb
  FROM storage.objects 
  WHERE bucket_id = 'Files' 
    AND name LIKE user_id || '/%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old files (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_files(days_old integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'Files' 
    AND created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify bucket was created
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'Files';

-- Verify policies were created
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Verify functions were created
SELECT 
  routine_name, 
  routine_type, 
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%file%'
ORDER BY routine_name;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Supabase Storage setup completed successfully!';
  RAISE NOTICE '📁 Files bucket created with 100MB limit';
  RAISE NOTICE '🔐 RLS policies configured for user isolation';
  RAISE NOTICE '⚙️ Storage functions created for file management';
  RAISE NOTICE '🚀 Ready for file uploads!';
END $$;
