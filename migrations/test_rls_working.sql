-- CRITICAL: Test RLS is working properly
-- Run this while logged in as leeogutha@gmail.com

-- 1. What clinic_id does the current user get?
SELECT get_user_clinic_id() as my_clinic_id, auth.uid() as my_auth_uid;

-- 2. How many patients can I see?
SELECT COUNT(*) as patient_count, clinic_id 
FROM patients 
GROUP BY clinic_id;

-- 3. How many hospitals can I see?
SELECT COUNT(*) as hospital_count, clinic_id 
FROM hospitals 
GROUP BY clinic_id;

-- 4. How many clinic sessions can I see?
SELECT COUNT(*) as session_count
FROM clinic_sessions;

-- If you see data from BOTH clinics, RLS is NOT working correctly!
-- You should ONLY see data from clinic e41fdf1e-0836-46a6-afad-81b1874d5df5
