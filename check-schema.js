// Check the actual schema of tables in Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking actual table schema in Supabase...\n');
  
  try {
    // Try to get one record from each table to see the actual column names
    console.log('=== PATIENTS TABLE ===');
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (patientError) {
      console.error('Patients table error:', patientError);
    } else if (patientData && patientData.length > 0) {
      console.log('Patient record columns:', Object.keys(patientData[0]));
    } else {
      console.log('No patients found, trying to insert a test record...');
      
      // Try inserting a minimal record to see what columns are expected
      const { data, error } = await supabase
        .from('patients')
        .insert({ 
          first_name: 'Test',
          last_name: 'User' 
        })
        .select()
        .single();
        
      if (error) {
        console.log('Insert error (this shows us required columns):', error.message);
      } else {
        console.log('Successfully inserted, columns:', Object.keys(data));
      }
    }
    
    console.log('\n=== DIAGNOSES TABLE ===');
    const { data: diagnosisData, error: diagnosisError } = await supabase
      .from('diagnoses')
      .select('*')
      .limit(1);
    
    if (diagnosisError) {
      console.error('Diagnoses table error:', diagnosisError);
    } else if (diagnosisData && diagnosisData.length > 0) {
      console.log('Diagnosis record columns:', Object.keys(diagnosisData[0]));
    } else {
      console.log('No diagnoses found');
    }
    
    console.log('\n=== PATIENT_SEQUENCE TABLE ===');
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('patient_sequence')
      .select('*')
      .limit(1);
    
    if (sequenceError) {
      console.error('Sequence table error:', sequenceError);
    } else if (sequenceData && sequenceData.length > 0) {
      console.log('Sequence record columns:', Object.keys(sequenceData[0]));
    } else {
      console.log('No sequence records found');
    }
    
  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkSchema();