// Simple script to check Supabase connection
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Checking Supabase configuration...');
console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Not set');
console.log('Supabase Key:', supabaseKey ? '✓ Set' : '✗ Not set');

if (!supabaseUrl || !supabaseKey) {
  console.error('\nERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log('\nTesting connection to Supabase...');
  
  try {
    // Try to query any table or use the health check
    const { data, error } = await supabase.from('patients').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('Could not find the table')) {
        console.log('✓ Connected to Supabase successfully!');
        console.log('⚠ Tables do not exist yet. You need to run the migration.');
        console.log('\nNext steps:');
        console.log('1. Go to your Supabase dashboard: ' + supabaseUrl);
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of supabase-migration.sql');
        console.log('4. Click "Run" to create the tables');
        console.log('5. Run this test again: node check-connection.js');
        return;
      }
      console.error('Error:', error);
      return;
    }
    
    console.log('✓ Connected to Supabase successfully!');
    console.log('✓ Tables exist and are accessible!');
    console.log('\nYou can now run: node test-supabase.js');
    
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

checkConnection();