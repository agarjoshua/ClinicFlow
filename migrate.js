// Migration script for Supabase
import 'dotenv/config';
import { execSync } from 'child_process';

// Verify that DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set in your .env file');
  console.error('Please add your Supabase PostgreSQL connection string to your .env file:');
  console.error('DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres');
  process.exit(1);
}

console.log('Running database migrations...');

try {
  // Run Drizzle migrations
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}