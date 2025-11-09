-- Add missing APOC columns to clinical_cases table
-- Run this in Supabase SQL Editor

ALTER TABLE clinical_cases
ADD COLUMN IF NOT EXISTS differential_diagnosis TEXT,
ADD COLUMN IF NOT EXISTS management_plan TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'clinical_cases'
  AND column_name IN ('differential_diagnosis', 'management_plan')
ORDER BY column_name;
