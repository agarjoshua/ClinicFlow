-- Add vital signs and diagnosis notes to clinical_cases table
ALTER TABLE clinical_cases 
ADD COLUMN IF NOT EXISTS diagnosis_notes TEXT,
ADD COLUMN IF NOT EXISTS temperature TEXT,
ADD COLUMN IF NOT EXISTS blood_pressure TEXT,
ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER;

-- Update medical_images table to support various file types
ALTER TABLE medical_images 
ADD COLUMN IF NOT EXISTS file_type TEXT NOT NULL DEFAULT 'image',
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Rename imageUrl to fileUrl if it exists (backward compatibility)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='medical_images' AND column_name='image_url') THEN
    -- Copy data from image_url to file_url if file_url doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='medical_images' AND column_name='file_url') THEN
      ALTER TABLE medical_images RENAME COLUMN image_url TO file_url;
    END IF;
  END IF;
END $$;

-- Make imageType optional (can be null for non-image files)
ALTER TABLE medical_images ALTER COLUMN image_type DROP NOT NULL;

COMMENT ON COLUMN clinical_cases.diagnosis_notes IS 'Detailed diagnosis notes from the consultant';
COMMENT ON COLUMN clinical_cases.temperature IS 'Patient temperature reading (e.g., 98.6°F or 37°C)';
COMMENT ON COLUMN clinical_cases.blood_pressure IS 'Blood pressure reading (e.g., 120/80)';
COMMENT ON COLUMN clinical_cases.heart_rate IS 'Heart rate in beats per minute';
COMMENT ON COLUMN clinical_cases.oxygen_saturation IS 'Oxygen saturation percentage';

COMMENT ON COLUMN medical_images.file_type IS 'Type of file: image, video, document, or link';
COMMENT ON COLUMN medical_images.file_url IS 'URL to the file or external link';
COMMENT ON COLUMN medical_images.file_name IS 'Original file name';
COMMENT ON COLUMN medical_images.file_size IS 'File size in bytes';
