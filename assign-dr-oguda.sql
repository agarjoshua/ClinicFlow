-- ============================================
-- Assign Dr. Lee Oguda to Existing Records
-- ============================================

-- Step 1: Find Dr. Lee Oguda's user ID
-- Run this first to get the ID:
SELECT id, name, email, role 
FROM users 
WHERE name ILIKE '%Lee%Oguda%' OR name ILIKE '%Oguda%';

-- Dr. Lee Oguda's ID: f115b734-f4c1-4050-9345-e046a4399e86

-- Step 2: Update all procedures, appointments, and clinical cases

-- Update procedures
UPDATE procedures 
SET consultant_id = 'f115b734-f4c1-4050-9345-e046a4399e86'
WHERE consultant_id IS NULL;

-- Update appointments (created_by field)
UPDATE appointments 
SET created_by = 'f115b734-f4c1-4050-9345-e046a4399e86'
WHERE created_by IS NULL;

-- Update clinical cases (consultant_id field)
UPDATE clinical_cases 
SET consultant_id = 'f115b734-f4c1-4050-9345-e046a4399e86'
WHERE consultant_id IS NULL;

-- Step 3: Verify the updates
-- Verify procedures
SELECT p.id, p.procedure_type, p.status, u.name as consultant_name
FROM procedures p
LEFT JOIN users u ON p.consultant_id = u.id;

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
