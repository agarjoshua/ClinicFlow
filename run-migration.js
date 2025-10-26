// Run SQL migration directly on the database
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set in your .env file');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function runMigration() {
  console.log('Running database migration...\n');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('supabase-migration.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✓ Migration completed successfully!');
    console.log('\nTables created:');
    console.log('  - patient_sequence');
    console.log('  - patients');
    console.log('  - diagnoses');
    console.log('  - discharges');
    console.log('\nYou can now run: node test-supabase.js');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();