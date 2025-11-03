-- Add vital signs to appointments table for triage
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS temperature TEXT,
ADD COLUMN IF NOT EXISTS blood_pressure TEXT,
ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER;

COMMENT ON COLUMN appointments.temperature IS 'Patient temperature during triage (e.g., 98.6°F or 37°C)';
COMMENT ON COLUMN appointments.blood_pressure IS 'Blood pressure during triage (e.g., 120/80)';
COMMENT ON COLUMN appointments.heart_rate IS 'Heart rate in beats per minute during triage';
COMMENT ON COLUMN appointments.oxygen_saturation IS 'Oxygen saturation percentage during triage';
