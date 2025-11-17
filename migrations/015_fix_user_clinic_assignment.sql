-- Migration 015: Ensure all existing data is assigned to Dr. Lee Ogutha's clinic
-- Date: 2025-11-17

BEGIN;

DO $$
DECLARE
  clinic_uuid uuid;
  users_count integer;
  patients_count integer;
  appointments_count integer;
  hospitals_count integer;
  cases_count integer;
  procedures_count integer;
  discharges_count integer;
  admissions_count integer;
BEGIN
  -- Get the Dr. Lee Ogutha clinic ID
  SELECT id INTO clinic_uuid
  FROM clinics 
  WHERE slug = 'dr-lee-ogutha'
  LIMIT 1;

  IF clinic_uuid IS NULL THEN
    RAISE EXCEPTION 'Dr. Lee Ogutha clinic not found. Please run migration 012 first.';
  END IF;

  -- Update ALL users without a clinic_id to this clinic
  UPDATE users 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS users_count = ROW_COUNT;

  -- Update ALL patients without a clinic_id to this clinic
  UPDATE patients 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS patients_count = ROW_COUNT;

  -- Update ALL appointments without a clinic_id to this clinic
  UPDATE appointments 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS appointments_count = ROW_COUNT;

  -- Update ALL hospitals without a clinic_id to this clinic
  UPDATE hospitals 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS hospitals_count = ROW_COUNT;

  -- Update ALL clinical_cases without a clinic_id to this clinic (if table exists)
  UPDATE clinical_cases 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS cases_count = ROW_COUNT;

  -- Update ALL procedures without a clinic_id to this clinic (if table exists)
  UPDATE procedures 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS procedures_count = ROW_COUNT;

  -- Update ALL discharges without a clinic_id to this clinic (if table exists)
  UPDATE discharges 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS discharges_count = ROW_COUNT;

  -- Update ALL patient_admissions without a clinic_id to this clinic (if table exists)
  UPDATE patient_admissions 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;
  
  GET DIAGNOSTICS admissions_count = ROW_COUNT;

  -- Report results
  RAISE NOTICE 'Migration 015 completed:';
  RAISE NOTICE '  - Assigned % users to Dr. Lee Ogutha clinic', users_count;
  RAISE NOTICE '  - Assigned % patients to Dr. Lee Ogutha clinic', patients_count;
  RAISE NOTICE '  - Assigned % appointments to Dr. Lee Ogutha clinic', appointments_count;
  RAISE NOTICE '  - Assigned % hospitals to Dr. Lee Ogutha clinic', hospitals_count;
  RAISE NOTICE '  - Assigned % clinical cases to Dr. Lee Ogutha clinic', cases_count;
  RAISE NOTICE '  - Assigned % procedures to Dr. Lee Ogutha clinic', procedures_count;
  RAISE NOTICE '  - Assigned % discharges to Dr. Lee Ogutha clinic', discharges_count;
  RAISE NOTICE '  - Assigned % patient admissions to Dr. Lee Ogutha clinic', admissions_count;
END $$;

COMMIT;
