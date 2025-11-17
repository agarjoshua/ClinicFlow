// Run migration 010 (multi-tenancy) on Supabase
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set in your .env file');
  console.error('You can also run this migration directly in the Supabase SQL Editor:');
  console.error('  1. Go to your Supabase dashboard');
  console.error('  2. Navigate to SQL Editor');
  console.error('  3. Copy the contents of migrations/010_add_clinics_and_multitenancy.sql');
  console.error('  4. Paste and run it');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function runMigration() {
  console.log('Running migration 010: Multi-tenancy core...\n');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./migrations/010_add_clinics_and_multitenancy.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✓ Migration 010 completed successfully!');
    console.log('\nTables created:');
    console.log('  - clinics');
    console.log('  - subscriptions');
    console.log('  - invoices');
    console.log('  - invitations');
    console.log('  - audit_logs');
    console.log('\nColumns added to existing tables:');
    console.log('  - users.clinic_id');
    console.log('  - patients.clinic_id');
    console.log('  - appointments.clinic_id');
    console.log('  - hospitals.clinic_id');
    console.log('  - clinical_cases.clinic_id');
    console.log('  - procedures.clinic_id');
    console.log('  - discharges.clinic_id');
    console.log('  - post_op_plans.clinic_id');
    console.log('  - post_op_updates.clinic_id');
    console.log('  - patient_admissions.clinic_id');
    console.log('\nYou can now create clinics and use multi-tenancy features!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('\nIf the error is about existing tables, they may already be created.');
    console.error('You can also run this migration manually in the Supabase SQL Editor.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
