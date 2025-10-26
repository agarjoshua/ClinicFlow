// Test script for Supabase integration
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Create a sequence record to get a unique ID
  console.log('Test 1: Creating a sequence record...');
  const { data: seqData, error: seqError } = await supabase
    .from('patient_sequence')
    .insert({})
    .select('id')
    .single();
    
  if (seqError) {
    console.error('Failed to create sequence record:', seqError);
    return;
  }
  console.log('Sequence record created successfully:', seqData);
  
  // Generate patient ID
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const patientNumber = String(seqData.id).padStart(3, '0');
  const generatedPatientId = `P-${date}-${patientNumber}`;
  
  // Test 2: Create a patient
  console.log('Test 2: Creating a patient record...');
  const patientData = {
    patient_id: generatedPatientId,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    contact: '+1-555-123-4567',
    emergency_contact: '+1-555-987-6543',
    address: '123 Main St, Anytown, USA',
    medical_history: 'Hypertension, Diabetes',
    allergies: 'Penicillin',
    current_medications: 'Metformin, Lisinopril',
    status: 'active'
  };
  
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .insert(patientData)
    .select()
    .single();
    
  if (patientError) {
    console.error('Failed to create patient:', patientError);
    return;
  }
  console.log('Patient created successfully:', patient);
  
  // Test 3: Create a diagnosis for the patient
  console.log('Test 3: Creating a diagnosis record...');
  const diagnosisData = {
    patient_id: patient.id,
    symptoms: 'Fever, Cough, Fatigue',
    temperature: '38.5°C',
    blood_pressure: '130/85',
    heart_rate: 90,
    oxygen_saturation: 96,
    diagnosis_notes: 'Patient presents with symptoms consistent with influenza. Recommended rest and fluids.',
    medications: 'Acetaminophen for fever',
    treatment_plan: 'Rest, fluids, follow-up in 7 days if symptoms persist'
  };
  
  const { data: diagnosis, error: diagnosisError } = await supabase
    .from('diagnoses')
    .insert(diagnosisData)
    .select()
    .single();
    
  if (diagnosisError) {
    console.error('Failed to create diagnosis:', diagnosisError);
    return;
  }
  console.log('Diagnosis created successfully:', diagnosis);
  
  // Test 4: Retrieve patient with their diagnosis
  console.log('Test 4: Retrieving patient records...');
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select()
    .order('admission_date', { ascending: false })
    .limit(5);
    
  if (patientsError) {
    console.error('Failed to retrieve patients:', patientsError);
    return;
  }
  console.log('Recent patients:', patients);
  
  console.log('All tests completed successfully!');
}

main().catch(err => {
  console.error('Error in test script:', err);
});