-- Check the actual schema of appointments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
