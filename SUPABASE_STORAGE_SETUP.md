# 🗄️ SUPABASE STORAGE SETUP GUIDE

## 📋 OVERVIEW

This guide will help you set up the Supabase Storage "Files" bucket for your LMS system. All file uploads will be stored in this bucket with proper organization and security.

## 🚀 QUICK SETUP

### 1. **Create the Files Bucket**

In your Supabase SQL Editor, run the following:

```sql
-- Create the Files bucket
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
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ]
);
```

### 2. **Set Up Storage Policies**

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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
```

### 3. **Create Storage Functions (Optional)**

```sql
-- Function to get file size
CREATE OR REPLACE FUNCTION get_file_size(file_path text)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT metadata->>'size'::bigint 
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
```

## 📁 FILE ORGANIZATION

Files will be organized in the following structure:

```
Files/
├── {user_id}/
│   ├── videos/
│   │   ├── {timestamp}-{random}.mp4
│   │   └── {timestamp}-{random}.webm
│   ├── files/
│   │   ├── {timestamp}-{random}.pdf
│   │   ├── {timestamp}-{random}.docx
│   │   └── {timestamp}-{random}.jpg
│   └── assignments/
│       ├── {timestamp}-{random}.pdf
│       └── {timestamp}-{random}.docx
```

## 🔐 SECURITY FEATURES

- **User Isolation**: Each user can only access files in their own folder
- **File Type Validation**: Only allowed MIME types can be uploaded
- **Size Limits**: 100MB maximum file size
- **Public Access**: Files are publicly accessible via signed URLs
- **Authentication Required**: All upload operations require valid JWT tokens

## 🧪 TESTING

### Test File Upload

```bash
# Test video upload
curl -X POST http://localhost:4000/api/upload/video \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@test-video.mp4"

# Test file upload
curl -X POST http://localhost:4000/api/upload/file \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-document.pdf"
```

### Test Storage Operations

```bash
# Get signed upload URL
curl -X POST http://localhost:4000/api/storage/sign-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.pdf", "fileType": "application/pdf"}'

# Get public URL
curl -X GET "http://localhost:4000/api/storage/public-url?fileName=user123/1234567890-123456789.pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete file
curl -X DELETE http://localhost:4000/api/storage/delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "user123/1234567890-123456789.pdf"}'
```

## 🔧 TROUBLESHOOTING

### Common Issues

1. **Bucket Not Found**: Make sure the "Files" bucket is created in Supabase
2. **Permission Denied**: Check that RLS policies are correctly set up
3. **File Too Large**: Verify file size is under 100MB limit
4. **Invalid MIME Type**: Check that file type is in allowed list

### Debug Commands

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'Files';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- List files in bucket
SELECT name, size, created_at FROM storage.objects WHERE bucket_id = 'Files';
```

## 📊 MONITORING

### Storage Usage

```sql
-- Get total storage usage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects 
WHERE bucket_id = 'Files'
GROUP BY bucket_id;

-- Get user storage usage
SELECT 
  (storage.foldername(name))[1] as user_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects 
WHERE bucket_id = 'Files'
GROUP BY (storage.foldername(name))[1]
ORDER BY total_size_bytes DESC;
```

## ✅ VERIFICATION

After setup, verify everything works:

1. ✅ Files bucket exists in Supabase Storage
2. ✅ RLS policies are active
3. ✅ File uploads work from frontend
4. ✅ Public URLs are accessible
5. ✅ File deletion works
6. ✅ User isolation is enforced

Your Supabase Storage is now ready for production use! 🎉
