// Test using direct PostgreSQL connection
import * as dotenv from 'dotenv';
dotenv.config(); // Make sure to load environment variables
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set in your .env file');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function testDatabase() {
  console.log('Testing direct database connection...\n');
  
  try {
    // Test 1: Create a sequence record
    console.log('Test 1: Creating a sequence record...');
    const seqResult = await pool.query(
      'INSERT INTO patient_sequence DEFAULT VALUES RETURNING id'
    );
    const seqId = seqResult.rows[0].id;
    console.log('✓ Sequence record created:', seqId);
    
    // Generate patient ID
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const patientNumber = String(seqId).padStart(3, '0');
    const generatedPatientId = `P-${date}-${patientNumber}`;
    console.log('✓ Generated patient ID:', generatedPatientId);
    
    // Test 2: Create a patient
    console.log('\nTest 2: Creating a patient record...');
    const patientResult = await pool.query(
      `INSERT INTO patients (
        patient_id, name, age, gender, contact, emergency_contact, 
        address, medical_history, allergies, current_medications, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        generatedPatientId,
        'John Doe',
        45,
        'Male',
        '+1-555-123-4567',
        '+1-555-987-6543',
        '123 Main St, Anytown, USA',
        'Hypertension, Diabetes',
        'Penicillin',
        'Metformin, Lisinopril',
        'active'
      ]
    );
    const patient = patientResult.rows[0];
    console.log('✓ Patient created:', {
      id: patient.id,
      patient_id: patient.patient_id,
      name: patient.name,
      age: patient.age
    });
    
    // Test 3: Create a diagnosis
    console.log('\nTest 3: Creating a diagnosis record...');
    const diagnosisResult = await pool.query(
      `INSERT INTO diagnoses (
        patient_id, symptoms, temperature, blood_pressure, heart_rate,
        oxygen_saturation, diagnosis_notes, medications, treatment_plan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        patient.id,
        'Fever, Cough, Fatigue',
        '38.5°C',
        '130/85',
        90,
        96,
        'Patient presents with symptoms consistent with influenza. Recommended rest and fluids.',
        'Acetaminophen for fever',
        'Rest, fluids, follow-up in 7 days if symptoms persist'
      ]
    );
    const diagnosis = diagnosisResult.rows[0];
    console.log('✓ Diagnosis created:', {
      id: diagnosis.id,
      patient_id: diagnosis.patient_id,
      symptoms: diagnosis.symptoms
    });
    
    // Test 4: Query all patients
    console.log('\nTest 4: Retrieving all patients...');
    const patientsResult = await pool.query(
      'SELECT * FROM patients ORDER BY admission_date DESC LIMIT 5'
    );
    console.log(`✓ Found ${patientsResult.rows.length} patients`);
    patientsResult.rows.forEach(p => {
      console.log(`  - ${p.patient_id}: ${p.name} (${p.age} years old)`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ All database tests passed successfully!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testDatabase();