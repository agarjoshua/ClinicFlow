-- Demo Clinic Seed Data - STEP 3: Create Hospitals
-- Run with RLS DISABLED or as service_role

INSERT INTO hospitals (name, code, address, phone, color, clinic_id) VALUES
  ('Kenyatta National Hospital', 'KNH-DEMO', 'Hospital Rd, Nairobi', '+254 20 2726300', '#3b82f6', 'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid),
  ('Aga Khan University Hospital', 'AKUH-DEMO', '3rd Parklands Ave, Nairobi', '+254 20 3662000', '#10b981', 'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid),
  ('Nairobi Hospital', 'NH-DEMO', 'Argwings Kodhek Rd, Nairobi', '+254 20 2845000', '#f59e0b', 'fabf53a6-8a60-4410-8097-b8aa11d2da20'::uuid)
RETURNING id, name, code;

-- Copy the 3 returned hospital IDs - you'll need them for step 4 (patients) and step 5 (clinic sessions)
