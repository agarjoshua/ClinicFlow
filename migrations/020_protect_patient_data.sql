-- Migration: Protect Patient Data from Deletion
-- Date: 2025-12-10
-- Purpose: Prevent permanent deletion of patient data, implement soft delete

-- Step 1: Add deleted_at column to patients table for soft delete
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Step 2: Add deleted_at to related tables for audit trail
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE clinical_cases 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE procedures 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Step 3: Change CASCADE DELETE to RESTRICT to prevent accidental data loss
-- This will prevent deletion of patients if they have related records

-- Drop existing foreign key constraints and recreate without CASCADE
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey,
ADD CONSTRAINT appointments_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES patients(id) 
  ON DELETE RESTRICT;

ALTER TABLE clinical_cases
DROP CONSTRAINT IF EXISTS clinical_cases_patient_id_fkey,
ADD CONSTRAINT clinical_cases_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES patients(id) 
  ON DELETE RESTRICT;

ALTER TABLE procedures
DROP CONSTRAINT IF EXISTS procedures_patient_id_fkey,
ADD CONSTRAINT procedures_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES patients(id) 
  ON DELETE RESTRICT;

ALTER TABLE patient_admissions
DROP CONSTRAINT IF EXISTS patient_admissions_patient_id_fkey,
ADD CONSTRAINT patient_admissions_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES patients(id) 
  ON DELETE RESTRICT;

-- Also protect discharges if they reference patients directly
ALTER TABLE discharges
DROP CONSTRAINT IF EXISTS discharges_patient_id_fkey,
ADD CONSTRAINT discharges_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES patients(id) 
  ON DELETE RESTRICT;

-- Step 4: Create function to soft delete patients instead of hard delete
CREATE OR REPLACE FUNCTION soft_delete_patient()
RETURNS TRIGGER AS $$
BEGIN
  -- Instead of deleting, mark as deleted
  UPDATE patients 
  SET deleted_at = NOW() 
  WHERE id = OLD.id;
  
  -- Also soft delete related records
  UPDATE appointments 
  SET deleted_at = NOW() 
  WHERE patient_id = OLD.id AND deleted_at IS NULL;
  
  UPDATE clinical_cases 
  SET deleted_at = NOW() 
  WHERE patient_id = OLD.id AND deleted_at IS NULL;
  
  UPDATE procedures 
  SET deleted_at = NOW() 
  WHERE patient_id = OLD.id AND deleted_at IS NULL;
  
  UPDATE patient_admissions 
  SET deleted_at = NOW() 
  WHERE patient_id = OLD.id AND deleted_at IS NULL;
  
  -- Prevent the actual DELETE
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to intercept DELETE operations
DROP TRIGGER IF EXISTS prevent_patient_delete ON patients;
CREATE TRIGGER prevent_patient_delete
  BEFORE DELETE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_patient();

-- Step 6: Update RLS policies to filter out soft-deleted records
DROP POLICY IF EXISTS "Clinic users can view clinic patients" ON patients;
CREATE POLICY "Clinic users can view clinic patients"
  ON patients FOR SELECT
  USING (
    clinic_id = get_user_clinic_id() 
    AND deleted_at IS NULL
  );

-- Step 7: Create policy to allow viewing deleted patients for recovery
CREATE POLICY "Clinic users can view deleted patients for recovery"
  ON patients FOR SELECT
  USING (
    clinic_id = get_user_clinic_id() 
    AND deleted_at IS NOT NULL
  );

-- Step 8: Update other table policies to exclude soft-deleted records
DROP POLICY IF EXISTS "Clinic users can view clinic appointments" ON appointments;
CREATE POLICY "Clinic users can view clinic appointments"
  ON appointments FOR SELECT
  USING (
    clinic_id = get_user_clinic_id() 
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Clinic users can view clinic clinical_cases" ON clinical_cases;
CREATE POLICY "Clinic users can view clinic clinical_cases"
  ON clinical_cases FOR SELECT
  USING (
    clinic_id = get_user_clinic_id() 
    AND deleted_at IS NULL
  );

-- Step 9: Add index for better performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clinical_cases_deleted_at ON clinical_cases(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_procedures_deleted_at ON procedures(deleted_at) WHERE deleted_at IS NULL;

-- Step 10: Create function to restore soft-deleted patients
CREATE OR REPLACE FUNCTION restore_soft_deleted_patient(patient_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Restore patient
  UPDATE patients 
  SET deleted_at = NULL 
  WHERE id = patient_uuid;
  
  -- Restore related records
  UPDATE appointments 
  SET deleted_at = NULL 
  WHERE patient_id = patient_uuid;
  
  UPDATE clinical_cases 
  SET deleted_at = NULL 
  WHERE patient_id = patient_uuid;
  
  UPDATE procedures 
  SET deleted_at = NULL 
  WHERE patient_id = patient_uuid;
  
  UPDATE patient_admissions 
  SET deleted_at = NULL 
  WHERE patient_id = patient_uuid;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT restore_soft_deleted_patient('patient-id-here');

COMMENT ON COLUMN patients.deleted_at IS 'Timestamp when patient was soft-deleted. NULL means active.';
COMMENT ON FUNCTION soft_delete_patient() IS 'Prevents hard deletion of patients, marks as deleted instead';
COMMENT ON FUNCTION restore_soft_deleted_patient(uuid) IS 'Restores a soft-deleted patient and all related records';
