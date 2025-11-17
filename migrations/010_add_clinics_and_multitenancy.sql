-- Migration 010: Multi-tenancy core (clinics, subscriptions, invitations, clinic_id FKs)
-- Date: 2025-11-17

BEGIN;

-- 1. Clinics (tenant boundary)
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES users(id),
  subscription_tier text DEFAULT 'trial', -- trial, basic, pro, enterprise
  subscription_status text DEFAULT 'active',
  max_consultants integer DEFAULT 1,
  max_assistants integer DEFAULT 2,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  settings jsonb
);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  plan_tier text,
  billing_cycle text,
  amount numeric,
  currency text DEFAULT 'KES',
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  mpesa_transactions jsonb[]
);

-- 3. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  amount numeric,
  status text,
  payment_method text,
  mpesa_receipt_number text,
  issued_at timestamptz,
  paid_at timestamptz
);

-- 4. Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text,
  invited_by uuid REFERENCES users(id),
  token text UNIQUE,
  status text DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- 5. Audit logs (for compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid,
  user_id uuid,
  action text,
  resource_type text,
  resource_id uuid,
  ip_address text,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- 6. Add clinic_id to core tables (non-destructive; defaults nullable for backfill)
ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE clinical_cases ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE discharges ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE post_op_plans ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE post_op_updates ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);
ALTER TABLE patient_admissions ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES clinics(id);

COMMIT;
