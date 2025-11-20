-- SuperAdmin Row Level Security Policies
-- These policies allow superadmin users to access all data across all clinics

-- =====================================================
-- STEP 1: Create is_superadmin helper function
-- =====================================================

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: Update Clinics Table RLS Policies
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "superadmin_all_clinics" ON clinics;

-- SuperAdmin can view all clinics
CREATE POLICY "superadmin_all_clinics"
ON clinics
FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Regular users can view their own clinic
CREATE POLICY "users_own_clinic" ON clinics
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT clinic_id FROM users WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- STEP 3: Update Users Table RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "superadmin_all_users" ON users;

-- SuperAdmin can view all users
CREATE POLICY "superadmin_all_users"
ON users
FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- =====================================================
-- STEP 4: Update Patients Table RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "superadmin_all_patients" ON patients;

-- SuperAdmin can view all patients
CREATE POLICY "superadmin_all_patients"
ON patients
FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- =====================================================
-- STEP 5: Update Appointments Table RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "superadmin_all_appointments" ON appointments;

-- SuperAdmin can view all appointments
CREATE POLICY "superadmin_all_appointments"
ON appointments
FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if user is superadmin
-- SELECT is_superadmin();

-- View all policies on clinics table
-- SELECT * FROM pg_policies WHERE tablename = 'clinics';

-- Test clinic access as superadmin
-- SELECT * FROM clinics;
