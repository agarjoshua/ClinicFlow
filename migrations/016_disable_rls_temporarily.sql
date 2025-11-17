-- Migration 016: Temporarily disable RLS to unblock development
-- Date: 2025-11-17
-- This allows the app to work while we sort out clinic assignments

BEGIN;

-- Disable RLS on all tables to allow full data access
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_admissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE procedures DISABLE ROW LEVEL SECURITY;
ALTER TABLE discharges DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_updates DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on these security-critical tables
-- ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

COMMIT;
