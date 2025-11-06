-- ============================================
-- Add consultant_id to appointments table
-- This allows assistants to assign appointments TO specific doctors
-- ============================================

-- First, check the actual type of users.id
-- Run this to see what type it is:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'id';

-- Add consultant_id column to appointments (matching the type of users.id)
ALTER TABLE appointments 
ADD COLUMN consultant_id text REFERENCES users(id);

-- Update existing appointments to use the consultant from their clinic session
UPDATE appointments a
SET consultant_id = cs.consultant_id
FROM clinic_sessions cs
WHERE a.clinic_session_id = cs.id;

-- Verify the update
SELECT 
  a.id,
  a.booking_number,
  a.chief_complaint,
  a.created_by,
  a.consultant_id,
  creator.name as created_by_name,
  consultant.name as consultant_name,
  cs.session_date
FROM appointments a
LEFT JOIN users creator ON a.created_by = creator.id
LEFT JOIN users consultant ON a.consultant_id = consultant.id
LEFT JOIN clinic_sessions cs ON a.clinic_session_id = cs.id
ORDER BY cs.session_date DESC
LIMIT 10;
