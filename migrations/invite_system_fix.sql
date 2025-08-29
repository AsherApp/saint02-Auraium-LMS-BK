-- Fix invite system by adding missing fields and relationships

-- Add missing columns to invites table
ALTER TABLE invites 
ADD COLUMN IF NOT EXISTS created_by text REFERENCES teachers(email) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days');

-- Update existing invites to have default values
UPDATE invites 
SET 
  created_by = COALESCE(created_by, 'teacher@school.edu'),
  expires_at = COALESCE(expires_at, created_at + interval '7 days')
WHERE created_by IS NULL OR expires_at IS NULL;

-- Make created_by required for new records
ALTER TABLE invites 
ALTER COLUMN created_by SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
