-- Add zoom_config column to teacher_settings table
ALTER TABLE teacher_settings 
ADD COLUMN IF NOT EXISTS zoom_config JSONB DEFAULT '{"client_id": "", "client_secret": "", "account_id": ""}'::jsonb;

-- Add comment to column
COMMENT ON COLUMN teacher_settings.zoom_config IS 'Zoom API configuration for live video sessions';
