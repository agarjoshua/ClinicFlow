// Run migration 021 (hospital_id to bookings) on Supabase
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
  console.error('  3. Copy the contents of migrations/021_add_hospital_to_bookings.sql');
  console.error('  4. Paste and run it');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function runMigration() {
  console.log('Running migration 021: Add hospital_id to booking tables...\n');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./migrations/021_add_hospital_to_bookings.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✓ Migration 021 completed successfully!');
    console.log('\nColumns added:');
    console.log('  - appointments.hospital_id (NOT NULL)');
    console.log('  - clinical_cases.hospital_id (nullable)');
    console.log('  - clinical_investigations.hospital_id (nullable)');
    console.log('  - post_op_plans.hospital_id (NOT NULL)');
    console.log('  - post_op_updates.hospital_id (NOT NULL)');
    console.log('  - discharges.hospital_id (NOT NULL)');
    console.log('\nIndexes created for query performance');
    console.log('RLS policies updated to include hospital checks');
    console.log('\n✓ All existing data backfilled successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('\nIf you see constraint violations, some existing data may lack required hospital references.');
    console.error('Please review the migration file and your data, or run via Supabase SQL Editor.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
