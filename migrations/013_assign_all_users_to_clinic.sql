-- Migration 013: Assign all users without clinic_id to Dr. Lee Ogutha's clinic
-- Date: 2025-11-17

BEGIN;

DO $$
DECLARE
  clinic_uuid uuid;
BEGIN
  -- Get the Dr. Lee Ogutha clinic ID
  SELECT id INTO clinic_uuid
  FROM clinics 
  WHERE slug = 'dr-lee-ogutha'
  LIMIT 1;

  IF clinic_uuid IS NULL THEN
    RAISE EXCEPTION 'Dr. Lee Ogutha clinic not found. Please run migration 012 first.';
  END IF;

  -- Assign ALL users without a clinic to this clinic
  UPDATE users 
  SET clinic_id = clinic_uuid 
  WHERE clinic_id IS NULL;

  -- Assign ALL other entities without clinic_id to this clinic
  UPDATE patients SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE appointments SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE hospitals SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE clinical_cases SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE procedures SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE discharges SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE post_op_plans SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE post_op_updates SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;
  UPDATE patient_admissions SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  RAISE NOTICE 'Successfully assigned all users and data to Dr. Lee Ogutha clinic';
END $$;

COMMIT;
