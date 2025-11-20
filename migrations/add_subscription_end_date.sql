-- Add subscription_end_date column to clinics table
-- This column tracks when the current subscription period ends

ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Optionally, set a default end date for existing clinics (30 days from now)
-- Uncomment if needed:
-- UPDATE clinics 
-- SET subscription_end_date = NOW() + INTERVAL '30 days'
-- WHERE subscription_end_date IS NULL AND subscription_status = 'active';

-- Add comment to document the column
COMMENT ON COLUMN clinics.subscription_end_date IS 'Timestamp when the current subscription period ends. Updated after successful payments.';
