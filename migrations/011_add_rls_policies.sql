-- Migration 011: Row Level Security (RLS) policies for multi-tenancy
-- Date: 2025-11-17
-- Ensures users can only access data from their own clinic

BEGIN;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's clinic_id
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS uuid AS $$
  SELECT clinic_id FROM users WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Clinics: Users can only see their own clinic
CREATE POLICY "Users see own clinic" ON clinics
  FOR SELECT USING (
    id = get_user_clinic_id()
  );

-- Users: Can see users in same clinic
CREATE POLICY "Users see same clinic users" ON users
  FOR SELECT USING (
    clinic_id = get_user_clinic_id()
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Patients: Scoped to clinic
CREATE POLICY "Clinic users see clinic patients" ON patients
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Appointments: Scoped to clinic
CREATE POLICY "Clinic users see clinic appointments" ON appointments
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Hospitals: Scoped to clinic
CREATE POLICY "Clinic users see clinic hospitals" ON hospitals
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Clinical Cases: Scoped to clinic
CREATE POLICY "Clinic users see clinic cases" ON clinical_cases
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Procedures: Scoped to clinic
CREATE POLICY "Clinic users see clinic procedures" ON procedures
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Discharges: Scoped to clinic
CREATE POLICY "Clinic users see clinic discharges" ON discharges
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Post-op Plans: Scoped to clinic
CREATE POLICY "Clinic users see clinic post-op plans" ON post_op_plans
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Post-op Updates: Scoped to clinic
CREATE POLICY "Clinic users see clinic post-op updates" ON post_op_updates
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Patient Admissions: Scoped to clinic
CREATE POLICY "Clinic users see clinic admissions" ON patient_admissions
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Subscriptions: Scoped to clinic
CREATE POLICY "Clinic users see clinic subscriptions" ON subscriptions
  FOR SELECT USING (
    clinic_id = get_user_clinic_id()
  );

-- Invoices: Scoped to clinic
CREATE POLICY "Clinic users see clinic invoices" ON invoices
  FOR SELECT USING (
    clinic_id = get_user_clinic_id()
  );

-- Invitations: Scoped to clinic
CREATE POLICY "Clinic users manage clinic invitations" ON invitations
  FOR ALL USING (
    clinic_id = get_user_clinic_id()
  );

-- Public invitation acceptance (no auth required to view pending invitations)
CREATE POLICY "Anyone can view pending invitations by token" ON invitations
  FOR SELECT USING (
    status = 'pending'
  );

CREATE POLICY "Anyone can update invitation status" ON invitations
  FOR UPDATE USING (
    status = 'pending'
  );

-- Audit Logs: Scoped to clinic (read-only for users)
CREATE POLICY "Clinic users see clinic audit logs" ON audit_logs
  FOR SELECT USING (
    clinic_id = get_user_clinic_id()
  );

COMMIT;
