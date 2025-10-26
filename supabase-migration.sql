-- Migration for Supabase
-- This SQL script creates the necessary tables for the ClinicFlow app

-- Patient sequence table for generating unique patient IDs
CREATE TABLE IF NOT EXISTS patient_sequence (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  contact TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  address TEXT NOT NULL,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  admission_date TIMESTAMP NOT NULL DEFAULT now(),
  discharge_date TIMESTAMP
);

-- Diagnoses table
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  temperature TEXT,
  blood_pressure TEXT,
  heart_rate INTEGER,
  oxygen_saturation INTEGER,
  diagnosis_notes TEXT NOT NULL,
  medications TEXT,
  treatment_plan TEXT,
  diagnosis_date TIMESTAMP NOT NULL DEFAULT now()
);

-- Discharges table
CREATE TABLE IF NOT EXISTS discharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  discharge_summary TEXT NOT NULL,
  prescribed_medications TEXT,
  follow_up_instructions TEXT NOT NULL,
  discharge_date TIMESTAMP NOT NULL DEFAULT now(),
  discharge_reason TEXT
);

-- Create Row Level Security (RLS) policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_sequence ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
  ON patients FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" 
  ON diagnoses FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" 
  ON discharges FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" 
  ON patient_sequence FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);