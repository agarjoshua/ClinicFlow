-- Migration 001: Add APOC Patient Documentation Fields
-- Date: November 9, 2025
-- Description: Enhances clinical_cases table with structured APOC documentation fields

BEGIN;

-- Add new columns to clinical_cases table
ALTER TABLE clinical_cases
  -- History sections
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS history_presenting_illness TEXT,
  ADD COLUMN IF NOT EXISTS review_of_systems TEXT,
  ADD COLUMN IF NOT EXISTS past_medical_surgical_history TEXT,
  ADD COLUMN IF NOT EXISTS developmental_history TEXT,
  ADD COLUMN IF NOT EXISTS gyne_obstetric_history TEXT,
  ADD COLUMN IF NOT EXISTS personal_family_social_history TEXT,
  
  -- Enhanced vital signs (keeping existing for compatibility)
  ADD COLUMN IF NOT EXISTS vital_signs_bp TEXT,
  ADD COLUMN IF NOT EXISTS vital_signs_pr TEXT,
  ADD COLUMN IF NOT EXISTS vital_signs_spo2 TEXT,
  ADD COLUMN IF NOT EXISTS vital_signs_temp TEXT,
  
  -- Detailed examination sections
  ADD COLUMN IF NOT EXISTS cns_motor_exam TEXT,
  ADD COLUMN IF NOT EXISTS cranial_nerves_exam TEXT,
  ADD COLUMN IF NOT EXISTS cardiovascular_exam TEXT,
  ADD COLUMN IF NOT EXISTS respiratory_exam TEXT,
  ADD COLUMN IF NOT EXISTS genitourinary_exam TEXT,
  ADD COLUMN IF NOT EXISTS gastrointestinal_exam TEXT,
  
  -- Enhanced diagnosis
  ADD COLUMN IF NOT EXISTS diagnosis_impression TEXT,
  ADD COLUMN IF NOT EXISTS stroke_classification TEXT,
  
  -- Workflow metadata
  ADD COLUMN IF NOT EXISTS documentation_mode TEXT DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS workflow_progress JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add check constraint for documentation_mode
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clinical_cases_documentation_mode_check'
  ) THEN
    ALTER TABLE clinical_cases 
    ADD CONSTRAINT clinical_cases_documentation_mode_check 
    CHECK (documentation_mode IN ('legacy', 'apoc'));
  END IF;
END $$;

-- Migrate existing data to new fields
UPDATE clinical_cases SET
  vital_signs_bp = blood_pressure,
  vital_signs_temp = temperature,
  vital_signs_pr = CAST(heart_rate AS TEXT),
  vital_signs_spo2 = CAST(oxygen_saturation AS TEXT),
  cns_motor_exam = neurological_exam,
  diagnosis_impression = diagnosis,
  documentation_mode = 'legacy',
  is_complete = true,
  completed_at = updated_at
WHERE documentation_mode IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_clinical_cases_documentation_mode 
  ON clinical_cases(documentation_mode);

CREATE INDEX IF NOT EXISTS idx_clinical_cases_is_complete 
  ON clinical_cases(is_complete);

COMMIT;

-- Rollback script (save separately if needed)
-- ALTER TABLE clinical_cases
--   DROP COLUMN IF EXISTS chief_complaint,
--   DROP COLUMN IF EXISTS history_presenting_illness,
--   DROP COLUMN IF EXISTS review_of_systems,
--   DROP COLUMN IF EXISTS past_medical_surgical_history,
--   DROP COLUMN IF EXISTS developmental_history,
--   DROP COLUMN IF EXISTS gyne_obstetric_history,
--   DROP COLUMN IF EXISTS personal_family_social_history,
--   DROP COLUMN IF EXISTS vital_signs_bp,
--   DROP COLUMN IF EXISTS vital_signs_pr,
--   DROP COLUMN IF EXISTS vital_signs_spo2,
--   DROP COLUMN IF EXISTS vital_signs_temp,
--   DROP COLUMN IF EXISTS cns_motor_exam,
--   DROP COLUMN IF EXISTS cranial_nerves_exam,
--   DROP COLUMN IF EXISTS cardiovascular_exam,
--   DROP COLUMN IF EXISTS respiratory_exam,
--   DROP COLUMN IF EXISTS genitourinary_exam,
--   DROP COLUMN IF EXISTS gastrointestinal_exam,
--   DROP COLUMN IF EXISTS diagnosis_impression,
--   DROP COLUMN IF EXISTS stroke_classification,
--   DROP COLUMN IF EXISTS documentation_mode,
--   DROP COLUMN IF EXISTS workflow_progress,
--   DROP COLUMN IF EXISTS is_complete,
--   DROP COLUMN IF EXISTS completed_at;
