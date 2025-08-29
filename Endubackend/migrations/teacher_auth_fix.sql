-- Add missing columns to teachers table for authentication
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS password_hash text;

-- Update existing teachers to have default values
UPDATE teachers 
SET 
  first_name = COALESCE(first_name, 'Teacher'),
  last_name = COALESCE(last_name, 'User')
WHERE first_name IS NULL OR last_name IS NULL;

-- Make first_name and last_name required for new records
ALTER TABLE teachers 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;
