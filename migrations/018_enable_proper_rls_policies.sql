-- Migration 018: Re-enable RLS with proper multi-tenancy policies
-- Date: 2025-11-19
-- This migration implements proper clinic-scoped RLS policies for true SaaS multi-tenancy

BEGIN;

-- ============================================
-- STEP 1: Re-enable RLS on all data tables
-- ============================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_investigations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop old policies (if they exist)
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users see same clinic users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Clinic users can view clinic users" ON users;
DROP POLICY IF EXISTS "Clinic users can insert clinic users" ON users;
DROP POLICY IF EXISTS "Clinic users can update clinic users" ON users;
DROP POLICY IF EXISTS "Clinic users can delete clinic users" ON users;

-- Patients policies
DROP POLICY IF EXISTS "Clinic users see clinic patients" ON patients;
DROP POLICY IF EXISTS "Clinic users can view clinic patients" ON patients;
DROP POLICY IF EXISTS "Clinic users can insert clinic patients" ON patients;
DROP POLICY IF EXISTS "Clinic users can update clinic patients" ON patients;
DROP POLICY IF EXISTS "Clinic users can delete clinic patients" ON patients;

-- Appointments policies
DROP POLICY IF EXISTS "Clinic users see clinic appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic users can view clinic appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic users can insert clinic appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic users can update clinic appointments" ON appointments;
DROP POLICY IF EXISTS "Clinic users can delete clinic appointments" ON appointments;

-- Hospitals policies
DROP POLICY IF EXISTS "Clinic users see clinic hospitals" ON hospitals;
DROP POLICY IF EXISTS "Clinic users can view clinic hospitals" ON hospitals;
DROP POLICY IF EXISTS "Clinic users can insert clinic hospitals" ON hospitals;
DROP POLICY IF EXISTS "Clinic users can update clinic hospitals" ON hospitals;
DROP POLICY IF EXISTS "Clinic users can delete clinic hospitals" ON hospitals;

-- Clinical cases policies
DROP POLICY IF EXISTS "Clinic users see clinic cases" ON clinical_cases;
DROP POLICY IF EXISTS "Clinic users can view clinic cases" ON clinical_cases;
DROP POLICY IF EXISTS "Clinic users can insert clinic cases" ON clinical_cases;
DROP POLICY IF EXISTS "Clinic users can update clinic cases" ON clinical_cases;
DROP POLICY IF EXISTS "Clinic users can delete clinic cases" ON clinical_cases;

-- Procedures policies
DROP POLICY IF EXISTS "Clinic users see clinic procedures" ON procedures;
DROP POLICY IF EXISTS "Clinic users can view clinic procedures" ON procedures;
DROP POLICY IF EXISTS "Clinic users can insert clinic procedures" ON procedures;
DROP POLICY IF EXISTS "Clinic users can update clinic procedures" ON procedures;
DROP POLICY IF EXISTS "Clinic users can delete clinic procedures" ON procedures;

-- Discharges policies
DROP POLICY IF EXISTS "Clinic users see clinic discharges" ON discharges;
DROP POLICY IF EXISTS "Clinic users can view clinic discharges" ON discharges;
DROP POLICY IF EXISTS "Clinic users can insert clinic discharges" ON discharges;
DROP POLICY IF EXISTS "Clinic users can update clinic discharges" ON discharges;
DROP POLICY IF EXISTS "Clinic users can delete clinic discharges" ON discharges;

-- Post-op plans policies
DROP POLICY IF EXISTS "Clinic users see clinic post-op plans" ON post_op_plans;
DROP POLICY IF EXISTS "Clinic users can view clinic post-op plans" ON post_op_plans;
DROP POLICY IF EXISTS "Clinic users can insert clinic post-op plans" ON post_op_plans;
DROP POLICY IF EXISTS "Clinic users can update clinic post-op plans" ON post_op_plans;
DROP POLICY IF EXISTS "Clinic users can delete clinic post-op plans" ON post_op_plans;

-- Post-op updates policies
DROP POLICY IF EXISTS "Clinic users see clinic post-op updates" ON post_op_updates;
DROP POLICY IF EXISTS "Clinic users can view clinic post-op updates" ON post_op_updates;
DROP POLICY IF EXISTS "Clinic users can insert clinic post-op updates" ON post_op_updates;
DROP POLICY IF EXISTS "Clinic users can update clinic post-op updates" ON post_op_updates;
DROP POLICY IF EXISTS "Clinic users can delete clinic post-op updates" ON post_op_updates;

-- Patient admissions policies
DROP POLICY IF EXISTS "Clinic users see clinic admissions" ON patient_admissions;
DROP POLICY IF EXISTS "Clinic users can view clinic admissions" ON patient_admissions;
DROP POLICY IF EXISTS "Clinic users can insert clinic admissions" ON patient_admissions;
DROP POLICY IF EXISTS "Clinic users can update clinic admissions" ON patient_admissions;
DROP POLICY IF EXISTS "Clinic users can delete clinic admissions" ON patient_admissions;

-- Reminders policies
DROP POLICY IF EXISTS "Clinic users can view clinic reminders" ON reminders;
DROP POLICY IF EXISTS "Clinic users can insert clinic reminders" ON reminders;
DROP POLICY IF EXISTS "Clinic users can update clinic reminders" ON reminders;
DROP POLICY IF EXISTS "Clinic users can delete clinic reminders" ON reminders;

-- Clinic sessions policies
DROP POLICY IF EXISTS "Clinic users can view clinic sessions" ON clinic_sessions;
DROP POLICY IF EXISTS "Clinic users can insert clinic sessions" ON clinic_sessions;
DROP POLICY IF EXISTS "Clinic users can update clinic sessions" ON clinic_sessions;
DROP POLICY IF EXISTS "Clinic users can delete clinic sessions" ON clinic_sessions;

-- Medical images policies
DROP POLICY IF EXISTS "Clinic users can view clinic medical images" ON medical_images;
DROP POLICY IF EXISTS "Clinic users can insert clinic medical images" ON medical_images;
DROP POLICY IF EXISTS "Clinic users can update clinic medical images" ON medical_images;
DROP POLICY IF EXISTS "Clinic users can delete clinic medical images" ON medical_images;

-- Clinical investigations policies
DROP POLICY IF EXISTS "Clinic users can view clinic investigations" ON clinical_investigations;
DROP POLICY IF EXISTS "Clinic users can insert clinic investigations" ON clinical_investigations;
DROP POLICY IF EXISTS "Clinic users can update clinic investigations" ON clinical_investigations;
DROP POLICY IF EXISTS "Clinic users can delete clinic investigations" ON clinical_investigations;

-- ============================================
-- STEP 3: Create comprehensive RLS policies
-- ============================================

-- -----------------------------
-- USERS: Full CRUD for clinic users
-- Special handling: Users can always see/update themselves, and create profiles
-- -----------------------------
CREATE POLICY "Clinic users can view clinic users"
  ON users FOR SELECT
  USING (
    clinic_id = get_user_clinic_id() OR 
    user_id = auth.uid()
  );

CREATE POLICY "Clinic users can insert clinic users"
  ON users FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    clinic_id = get_user_clinic_id()
  );

CREATE POLICY "Clinic users can update clinic users"
  ON users FOR UPDATE
  USING (
    user_id = auth.uid() OR
    clinic_id = get_user_clinic_id()
  )
  WITH CHECK (
    user_id = auth.uid() OR
    clinic_id = get_user_clinic_id()
  );

CREATE POLICY "Clinic users can delete clinic users"
  ON users FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- PATIENTS: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic patients"
  ON patients FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic patients"
  ON patients FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic patients"
  ON patients FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic patients"
  ON patients FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- APPOINTMENTS: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic appointments"
  ON appointments FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic appointments"
  ON appointments FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic appointments"
  ON appointments FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic appointments"
  ON appointments FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- HOSPITALS: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic hospitals"
  ON hospitals FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic hospitals"
  ON hospitals FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic hospitals"
  ON hospitals FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic hospitals"
  ON hospitals FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- CLINICAL CASES: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic cases"
  ON clinical_cases FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic cases"
  ON clinical_cases FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic cases"
  ON clinical_cases FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic cases"
  ON clinical_cases FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- PROCEDURES: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic procedures"
  ON procedures FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic procedures"
  ON procedures FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic procedures"
  ON procedures FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic procedures"
  ON procedures FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- DISCHARGES: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic discharges"
  ON discharges FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic discharges"
  ON discharges FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic discharges"
  ON discharges FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic discharges"
  ON discharges FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- POST-OP PLANS: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic post-op plans"
  ON post_op_plans FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic post-op plans"
  ON post_op_plans FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic post-op plans"
  ON post_op_plans FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic post-op plans"
  ON post_op_plans FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- POST-OP UPDATES: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic post-op updates"
  ON post_op_updates FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic post-op updates"
  ON post_op_updates FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic post-op updates"
  ON post_op_updates FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic post-op updates"
  ON post_op_updates FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- PATIENT ADMISSIONS: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic admissions"
  ON patient_admissions FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic admissions"
  ON patient_admissions FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic admissions"
  ON patient_admissions FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic admissions"
  ON patient_admissions FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- REMINDERS: Full CRUD for clinic users
-- -----------------------------
CREATE POLICY "Clinic users can view clinic reminders"
  ON reminders FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can insert clinic reminders"
  ON reminders FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can update clinic reminders"
  ON reminders FOR UPDATE
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic users can delete clinic reminders"
  ON reminders FOR DELETE
  USING (clinic_id = get_user_clinic_id());

-- -----------------------------
-- CLINIC SESSIONS: Full CRUD for clinic users
-- Note: Clinic sessions are linked to hospitals, which are clinic-scoped
-- -----------------------------
CREATE POLICY "Clinic users can view clinic sessions"
  ON clinic_sessions FOR SELECT
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can insert clinic sessions"
  ON clinic_sessions FOR INSERT
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM hospitals WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can update clinic sessions"
  ON clinic_sessions FOR UPDATE
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE clinic_id = get_user_clinic_id()
    )
  )
  WITH CHECK (
    hospital_id IN (
      SELECT id FROM hospitals WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can delete clinic sessions"
  ON clinic_sessions FOR DELETE
  USING (
    hospital_id IN (
      SELECT id FROM hospitals WHERE clinic_id = get_user_clinic_id()
    )
  );

-- -----------------------------
-- MEDICAL IMAGES: Full CRUD for clinic users
-- Note: Medical images are linked to clinical_cases, which are clinic-scoped
-- -----------------------------
CREATE POLICY "Clinic users can view clinic medical images"
  ON medical_images FOR SELECT
  USING (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can insert clinic medical images"
  ON medical_images FOR INSERT
  WITH CHECK (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can update clinic medical images"
  ON medical_images FOR UPDATE
  USING (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  )
  WITH CHECK (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can delete clinic medical images"
  ON medical_images FOR DELETE
  USING (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

-- -----------------------------
-- CLINICAL INVESTIGATIONS: Full CRUD for clinic users
-- Note: Clinical investigations are linked to clinical_cases, which are clinic-scoped
-- -----------------------------
CREATE POLICY "Clinic users can view clinic investigations"
  ON clinical_investigations FOR SELECT
  USING (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can insert clinic investigations"
  ON clinical_investigations FOR INSERT
  WITH CHECK (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can update clinic investigations"
  ON clinical_investigations FOR UPDATE
  USING (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  )
  WITH CHECK (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

CREATE POLICY "Clinic users can delete clinic investigations"
  ON clinical_investigations FOR DELETE
  USING (
    clinical_case_id IN (
      SELECT id FROM clinical_cases WHERE clinic_id = get_user_clinic_id()
    )
  );

COMMIT;

-- ============================================
-- NOTES
-- ============================================
-- 1. All policies use get_user_clinic_id() to scope data to the user's clinic
-- 2. Each table has separate policies for SELECT, INSERT, UPDATE, DELETE
-- 3. WITH CHECK ensures inserted/updated data belongs to user's clinic
-- 4. Related tables (clinic_sessions, medical_images, clinical_investigations) 
--    use subqueries to enforce clinic scoping through parent relationships
-- 5. Users without a clinic_id will not be able to access any data
