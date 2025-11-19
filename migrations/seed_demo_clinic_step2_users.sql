-- Demo Clinic Seed Data - STEP 2: Get Auth User IDs
-- IMPORTANT: Before running this script:
--   1. Create auth users in Supabase Auth Dashboard:
--      * demo.consultant@zahaniflow.com (password: DemoConsultant2025!)
--      * demo.assistant@zahaniflow.com (password: DemoAssistant2025!)
--   2. Run this query to get their auth UIDs

-- Query to get auth user IDs (run this first, copy the IDs, then proceed to step 2b)
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('demo.consultant@zahaniflow.com', 'demo.assistant@zahaniflow.com')
ORDER BY email;

COMMIT;

-- ============================================
-- NOTES
-- ============================================
-- After running this script successfully, proceed to step 3
