-- Migration 012: Create default clinic for Dr. Lee Ogutha and assign existing data
-- Date: 2025-11-17

BEGIN;

-- 1. Find Dr. Lee Ogutha's user record
DO $$
DECLARE
  dr_lee_user_id uuid;
  dr_lee_db_id uuid;
  clinic_uuid uuid;
BEGIN
  -- Find Dr. Lee Ogutha by email or name
  SELECT user_id, id INTO dr_lee_user_id, dr_lee_db_id
  FROM users 
  WHERE email ILIKE '%lee%' OR name ILIKE '%lee%ogutha%'
  LIMIT 1;

  IF dr_lee_user_id IS NULL THEN
    RAISE NOTICE 'Dr. Lee Ogutha not found, creating default clinic without owner';
    clinic_uuid := gen_random_uuid();
  ELSE
    RAISE NOTICE 'Found Dr. Lee Ogutha with user_id: %', dr_lee_user_id;
    clinic_uuid := gen_random_uuid();
  END IF;

  -- 2. Create Dr. Lee Ogutha's clinic
  INSERT INTO clinics (id, name, slug, owner_id, subscription_tier, subscription_status, max_consultants, max_assistants, settings)
  VALUES (
    clinic_uuid,
    'Dr. Lee Ogutha Neurosurgery Clinic',
    'dr-lee-ogutha',
    dr_lee_db_id,
    'professional', -- Give full access to existing clinic
    'active',
    10, -- Allow multiple consultants
    20, -- Allow multiple assistants
    '{"timezone": "Africa/Nairobi", "currency": "KES"}'::jsonb
  )
  ON CONFLICT (slug) DO NOTHING;

  -- 3. Assign all existing users to this clinic
  UPDATE users SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 4. Assign all existing patients to this clinic
  UPDATE patients SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 5. Assign all existing appointments to this clinic
  UPDATE appointments SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 6. Assign all existing hospitals to this clinic
  UPDATE hospitals SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 7. Assign all existing clinical cases to this clinic
  UPDATE clinical_cases SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 8. Assign all existing procedures to this clinic
  UPDATE procedures SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 9. Assign all existing discharges to this clinic
  UPDATE discharges SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 10. Assign all existing post-op plans to this clinic
  UPDATE post_op_plans SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 11. Assign all existing post-op updates to this clinic
  UPDATE post_op_updates SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  -- 12. Assign all existing patient admissions to this clinic
  UPDATE patient_admissions SET clinic_id = clinic_uuid WHERE clinic_id IS NULL;

  RAISE NOTICE 'Successfully created clinic and assigned all existing data to Dr. Lee Ogutha''s clinic';
END $$;

COMMIT;
