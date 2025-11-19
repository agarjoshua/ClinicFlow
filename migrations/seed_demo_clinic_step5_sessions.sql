-- Demo Clinic Seed Data - STEP 5: Create Clinic Sessions
-- Run with RLS DISABLED or as service_role

INSERT INTO clinic_sessions (hospital_id, consultant_id, session_date, start_time, end_time, max_patients, status) VALUES
  -- Past sessions (last 2 weeks)
  ('d4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE - INTERVAL '14 days', '09:00', '17:00', 20, 'completed'),
  ('e1018d9c-dd19-4273-acb7-d0723d948c9a'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE - INTERVAL '13 days', '10:00', '16:00', 15, 'completed'),
  ('d4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE - INTERVAL '10 days', '09:00', '17:00', 20, 'completed'),
  ('d3f8ddc6-6563-4f94-ac3e-d6ee6fddd291'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE - INTERVAL '7 days', '09:00', '15:00', 15, 'completed'),
  ('d4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE - INTERVAL '5 days', '09:00', '17:00', 20, 'completed'),
  
  -- Today's session
  ('d4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE, '09:00', '17:00', 20, 'scheduled'),
  
  -- Upcoming sessions
  ('e1018d9c-dd19-4273-acb7-d0723d948c9a'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE + INTERVAL '2 days', '10:00', '16:00', 15, 'scheduled'),
  ('d4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE + INTERVAL '5 days', '09:00', '17:00', 20, 'scheduled'),
  ('d3f8ddc6-6563-4f94-ac3e-d6ee6fddd291'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE + INTERVAL '7 days', '09:00', '15:00', 15, 'scheduled'),
  ('d4e8d743-354a-4dac-a0f8-19ae3f84a355'::uuid, '3b9315ca-a3a6-4aae-95a2-516b957feda0', CURRENT_DATE + INTERVAL '10 days', '09:00', '17:00', 20, 'scheduled')
RETURNING id, session_date, status;

-- ============================================
-- DEMO CLINIC SETUP COMPLETE!
-- ============================================
-- You now have:
-- ✓ 1 Demo clinic (Nairobi Neurosurgery Center)
-- ✓ 2 Users (Dr. Sarah Mwangi - consultant, Jane Kamau - assistant)
-- ✓ 3 Hospitals (KNH, Aga Khan, Nairobi Hospital)
-- ✓ 30 Diverse patients (including 3 inpatients)
-- ✓ 10 Clinic sessions (5 past, 1 today, 4 upcoming)
--
-- Login credentials:
-- Consultant: demo.consultant@zahaniflow.com / DemoConsultant2025!
-- Assistant: demo.assistant@zahaniflow.com / DemoAssistant2025!
