-- Migration 002: Create Clinical Investigations Table
-- Date: November 9, 2025
-- Description: Creates structured investigation tracking system for lab works and imaging

BEGIN;

-- Create clinical_investigations table
CREATE TABLE IF NOT EXISTS clinical_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_case_id uuid NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
  investigation_type TEXT NOT NULL CHECK (investigation_type IN ('lab_work', 'imaging')),
  
  -- Investigation details
  category TEXT, -- e.g., 'CBC', 'MRI Brain', 'CT Angiography'
  test_name TEXT,
  result_text TEXT,
  result_value TEXT,
  result_unit TEXT,
  reference_range TEXT,
  
  -- Dates and tracking
  result_date DATE,
  ordering_provider uuid REFERENCES users(id),
  reviewing_provider uuid REFERENCES users(id),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'reviewed', 'cancelled')),
  priority TEXT DEFAULT 'routine' CHECK (priority IN ('stat', 'urgent', 'routine')),
  
  -- Additional information
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Enhance medical_images table to link with investigations
ALTER TABLE medical_images
  ADD COLUMN IF NOT EXISTS investigation_id uuid REFERENCES clinical_investigations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS section_context TEXT DEFAULT 'clinical_photo',
  ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS viewing_notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investigations_case 
  ON clinical_investigations(clinical_case_id);

CREATE INDEX IF NOT EXISTS idx_investigations_type 
  ON clinical_investigations(investigation_type);

CREATE INDEX IF NOT EXISTS idx_investigations_status 
  ON clinical_investigations(status);

CREATE INDEX IF NOT EXISTS idx_investigations_date 
  ON clinical_investigations(result_date);

CREATE INDEX IF NOT EXISTS idx_images_investigation 
  ON medical_images(investigation_id);

CREATE INDEX IF NOT EXISTS idx_images_section 
  ON medical_images(section_context);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_investigations_updated_at ON clinical_investigations;

CREATE TRIGGER update_investigations_updated_at 
  BEFORE UPDATE ON clinical_investigations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Rollback script (save separately if needed)
-- DROP TRIGGER IF EXISTS update_investigations_updated_at ON clinical_investigations;
-- DROP TABLE IF EXISTS clinical_investigations CASCADE;
-- ALTER TABLE medical_images
--   DROP COLUMN IF EXISTS investigation_id,
--   DROP COLUMN IF EXISTS section_context,
--   DROP COLUMN IF EXISTS order_index,
--   DROP COLUMN IF EXISTS is_primary,
--   DROP COLUMN IF EXISTS viewing_notes;
