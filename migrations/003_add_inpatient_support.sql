-- Migration 003: Inpatient tracking and admissions history
-- Date: November 12, 2025
-- Description: Adds inpatient status fields to patients table and introduces patient_admissions table

BEGIN;

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS is_inpatient BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_hospital_id uuid REFERENCES hospitals(id),
  ADD COLUMN IF NOT EXISTS inpatient_admitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inpatient_notes TEXT;

CREATE TABLE IF NOT EXISTS patient_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  consultant_id uuid REFERENCES users(id),
  clinical_case_id uuid REFERENCES clinical_cases(id) ON DELETE SET NULL,
  admission_reason TEXT,
  diagnosis_summary TEXT,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharged', 'transferred')),
  discharge_date TIMESTAMPTZ,
  discharge_summary TEXT,
  created_by uuid REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_patient_admissions_patient ON patient_admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_status ON patient_admissions(status);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_hospital ON patient_admissions(hospital_id);

COMMIT;
