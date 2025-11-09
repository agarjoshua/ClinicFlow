// Check actual column names in clinical_cases table
// Run this from project root: node check-clinical-cases-columns.js

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Try to read from .env file manually
let supabaseUrl, supabaseKey;

try {
  const envFile = readFileSync('.env', 'utf-8');
  const lines = envFile.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  });
} catch (err) {
  console.error('❌ Could not read .env file:', err.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure .env file contains:');
  console.error('  VITE_SUPABASE_URL=your_url');
  console.error('  VITE_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

console.log('✅ Connected to:', supabaseUrl.substring(0, 30) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Checking clinical_cases table columns...\n');

  // Fetch one record to see all columns
  const { data, error } = await supabase
    .from('clinical_cases')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching data:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No records found in clinical_cases table');
    console.log('Creating a test query to get column structure...\n');
    
    // Try to get table structure via RPC or information_schema
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'clinical_cases' });
    
    if (schemaError) {
      console.log('ℹ️  Cannot query schema directly. Please insert at least one record first.');
      console.log('Or check the Supabase dashboard Table Editor to see columns.\n');
    }
    return;
  }

  const record = data[0];
  const columns = Object.keys(record);

  console.log('✅ Found clinical_cases table with following columns:\n');
  console.log('Total columns:', columns.length);
  console.log('─'.repeat(80));

  // Group columns by category
  const apocColumns = [];
  const legacyColumns = [];
  const systemColumns = [];
  const otherColumns = [];

  columns.forEach(col => {
    const lower = col.toLowerCase();
    
    if (lower.includes('chief') || lower.includes('history') || lower.includes('vital') || 
        lower.includes('examination') || lower.includes('workflow') || lower.includes('apoc')) {
      apocColumns.push(col);
    } else if (lower.includes('symptoms') || lower.includes('neurological') || 
               lower.includes('imaging') || lower.includes('medications') || 
               lower.includes('treatment')) {
      legacyColumns.push(col);
    } else if (lower.includes('id') || lower.includes('created') || lower.includes('updated') || 
               lower.includes('date') || lower.includes('status')) {
      systemColumns.push(col);
    } else {
      otherColumns.push(col);
    }
  });

  if (systemColumns.length > 0) {
    console.log('\n📋 SYSTEM COLUMNS:');
    systemColumns.forEach(col => console.log(`  • ${col} = ${JSON.stringify(record[col])}`));
  }

  if (apocColumns.length > 0) {
    console.log('\n📝 APOC-RELATED COLUMNS:');
    apocColumns.forEach(col => console.log(`  • ${col} = ${JSON.stringify(record[col])}`));
  }

  if (legacyColumns.length > 0) {
    console.log('\n⚡ LEGACY/QUICK-ENTRY COLUMNS:');
    legacyColumns.forEach(col => console.log(`  • ${col} = ${JSON.stringify(record[col])}`));
  }

  if (otherColumns.length > 0) {
    console.log('\n🔧 OTHER COLUMNS:');
    otherColumns.forEach(col => console.log(`  • ${col} = ${JSON.stringify(record[col])}`));
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n🔎 EXPECTED APOC COLUMNS (from migration 001):');
  
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

  console.log('\n' + '─'.repeat(80));
  console.log('\n💡 COLUMN NAME MAPPING NEEDED:\n');
  
  // Check for potential mismatches
  const potentialMatches = {
    'chief_complaint': columns.filter(c => c.toLowerCase().includes('chief')),
    'history_presenting_illness': columns.filter(c => c.toLowerCase().includes('history') && c.toLowerCase().includes('present')),
    'vital_signs_bp': columns.filter(c => c.toLowerCase().includes('vital') && c.toLowerCase().includes('bp')),
    'documentation_mode': columns.filter(c => c.toLowerCase().includes('documentation') || c.toLowerCase().includes('mode')),
    'workflow_progress': columns.filter(c => c.toLowerCase().includes('workflow') || c.toLowerCase().includes('progress'))
  };

  Object.entries(potentialMatches).forEach(([expected, found]) => {
    if (found.length > 0 && !columns.includes(expected)) {
      console.log(`  📌 ${expected} might be: ${found.join(', ')}`);
    }
  });

  console.log('\n' + '─'.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log(`  Total columns in table: ${columns.length}`);
  console.log(`  APOC columns expected: ${expectedApocColumns.length}`);
  console.log(`  APOC columns found: ${apocColumns.length}`);
  console.log(`  Missing APOC columns: ${expectedApocColumns.filter(c => !columns.includes(c)).length}`);
  
  if (expectedApocColumns.filter(c => !columns.includes(c)).length > 0) {
    console.log('\n⚠️  MISSING COLUMNS:');
    expectedApocColumns.filter(c => !columns.includes(c)).forEach(col => {
      console.log(`  • ${col}`);
    });
    console.log('\n💡 You need to run migrations/001_add_apoc_fields.sql');
  }

  console.log('\n');
}

checkColumns().catch(console.error);
