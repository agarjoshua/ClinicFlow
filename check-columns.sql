-- Check actual columns in clinical_cases table
-- Run this in Supabase SQL Editor

-- Show all columns in clinical_cases table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'clinical_cases'
ORDER BY 
    ordinal_position;

-- Expected APOC columns that should exist:
-- chief_complaint
-- history_presenting_illness
-- review_of_systems
-- past_medical_history
-- past_surgical_history
-- developmental_history
-- gyne_obstetric_history
-- personal_history
-- family_history
-- social_history
-- vital_signs_bp
-- vital_signs_hr
-- vital_signs_rr
-- vital_signs_temp
-- vital_signs_spo2
-- vital_signs_weight
-- vital_signs_height
-- vital_signs_bmi
-- general_examination
-- systemic_examination
-- neurological_examination
-- diagnosis_summary
-- differential_diagnosis
-- management_plan
-- documentation_mode
-- workflow_progress
