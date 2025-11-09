// Check actual column names in clinical_cases table
// Usage: node check-columns-interactive.js

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔍 Clinical Cases Column Checker\n');
  console.log('This will check what columns actually exist in your clinical_cases table.\n');
  
  const supabaseUrl = await question('Enter your Supabase URL: ');
  const supabaseKey = await question('Enter your Supabase Anon Key: ');
  
  rl.close();
  
  console.log('\n✅ Connecting to Supabase...\n');
  
  const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

  console.log('🔍 Checking clinical_cases table columns...\n');

  // Fetch one record to see all columns
  const { data, error } = await supabase
    .from('clinical_cases')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching data:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No records found in clinical_cases table');
    console.log('Please create at least one clinical case first, then run this script again.\n');
    process.exit(0);
  }

  const record = data[0];
  const columns = Object.keys(record).sort();

  console.log('✅ Found clinical_cases table with following columns:\n');
  console.log('Total columns:', columns.length);
  console.log('═'.repeat(80));

  // Print all columns with their current values
  console.log('\n📋 ALL COLUMNS IN DATABASE:\n');
  columns.forEach(col => {
    const value = record[col];
    const displayValue = value === null ? 'NULL' : 
                        typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : 
                        String(value).substring(0, 50);
    console.log(`  • ${col.padEnd(35)} = ${displayValue}`);
  });

  console.log('\n' + '═'.repeat(80));
  console.log('\n🔎 EXPECTED APOC COLUMNS (from migration 001):\n');
  
  const expectedApocColumns = [
    'chief_complaint',
    'history_presenting_illness',
    'review_of_systems',
    'past_medical_history',
    'past_surgical_history',
    'developmental_history',
    'gyne_obstetric_history',
    'personal_history',
    'family_history',
    'social_history',
    'vital_signs_bp',
    'vital_signs_hr',
    'vital_signs_rr',
    'vital_signs_temp',
    'vital_signs_spo2',
    'vital_signs_weight',
    'vital_signs_height',
    'vital_signs_bmi',
    'general_examination',
    'systemic_examination',
    'neurological_examination',
    'diagnosis_summary',
    'differential_diagnosis',
    'management_plan',
    'documentation_mode',
    'workflow_progress'
  ];

  expectedApocColumns.forEach(col => {
    const exists = columns.includes(col);
    console.log(`  ${exists ? '✅' : '❌'} ${col}`);
  });

  const missingColumns = expectedApocColumns.filter(c => !columns.includes(c));

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`  Total columns in table: ${columns.length}`);
  console.log(`  APOC columns expected: ${expectedApocColumns.length}`);
  console.log(`  APOC columns found: ${expectedApocColumns.filter(c => columns.includes(c)).length}`);
  console.log(`  Missing APOC columns: ${missingColumns.length}`);
  
  if (missingColumns.length > 0) {
    console.log('\n⚠️  MISSING COLUMNS:\n');
    missingColumns.forEach(col => {
      console.log(`  • ${col}`);
    });
    console.log('\n💡 ACTION REQUIRED:');
    console.log('   You need to run: migrations/001_add_apoc_fields.sql');
    console.log('   This will add all missing APOC columns to your table.\n');
  } else {
    console.log('\n✅ All APOC columns exist! You can use the APOC wizard.\n');
  }

  console.log('═'.repeat(80) + '\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
