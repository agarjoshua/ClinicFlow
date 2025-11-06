-- ============================================
-- Assign Dr. Lee Oguda to Existing Records
-- ============================================

-- Step 1: Find Dr. Lee Oguda's user ID
-- Run this first to get the ID:
SELECT id, name, email, role 
FROM users 
WHERE name ILIKE '%Lee%Oguda%' OR name ILIKE '%Oguda%';

-- Dr. Lee Oguda's ID: 55ac9f67-78ad-4152-9470-fd137a7625ea

-- Step 2: Update all procedures, appointments, clinic sessions, and clinical cases

-- Update ALL clinic sessions to Dr. Oguda (this is the critical one!)
UPDATE clinic_sessions 
SET consultant_id = '55ac9f67-78ad-4152-9470-fd137a7625ea';

-- Update ALL appointments to be assigned to Dr. Oguda
UPDATE appointments 
SET consultant_id = '55ac9f67-78ad-4152-9470-fd137a7625ea';

-- Update procedures
UPDATE procedures 
SET consultant_id = '55ac9f67-78ad-4152-9470-fd137a7625ea'
WHERE consultant_id IS NULL;

-- Update clinical cases (consultant_id field)
UPDATE clinical_cases 
SET consultant_id = '55ac9f67-78ad-4152-9470-fd137a7625ea'
WHERE consultant_id IS NULL;

-- Step 3: Verify the updates

-- Verify clinic sessions
SELECT cs.id, cs.session_date, cs.start_time, u.name as consultant_name, h.name as hospital_name
FROM clinic_sessions cs
LEFT JOIN users u ON cs.consultant_id = u.id
LEFT JOIN hospitals h ON cs.hospital_id = h.id
ORDER BY cs.session_date DESC
LIMIT 10;

-- Verify procedures
SELECT p.id, p.procedure_type, p.status, u.name as consultant_name
FROM procedures p
LEFT JOIN users u ON p.consultant_id = u.id
LIMIT 10;

-- Verify appointments
SELECT a.id, a.chief_complaint, a.status, u.name as created_by_name
FROM appointments a
LEFT JOIN users u ON a.created_by = u.id
LIMIT 10;

-- Verify clinical cases
SELECT cc.id, cc.diagnosis, cc.status, u.name as consultant_name
FROM clinical_cases cc
LEFT JOIN users u ON cc.consultant_id = u.id
LIMIT 10;
