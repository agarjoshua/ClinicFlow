-- Fix RLS policies to allow anon key access for testing
-- This allows anonymous users to access the tables during development

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patients;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON diagnoses;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON discharges;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patient_sequence;

-- Create policies that allow both authenticated AND anonymous users
CREATE POLICY "Allow all operations for all users" 
  ON patients FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" 
  ON diagnoses FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" 
  ON discharges FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" 
  ON patient_sequence FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Note: In production, you should restrict these policies based on user authentication
-- For example:
-- CREATE POLICY "Allow authenticated users only" 
--   ON patients FOR ALL TO authenticated
--   USING (true) 
--   WITH CHECK (true);