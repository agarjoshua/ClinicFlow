// Database connection setup using Supabase Postgres (uses DATABASE_URL from Supabase)
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Ensure the Supabase/Postgres connection string is provided. In Supabase this is the
// "Connection string" (Postgres) available in the project settings - set it to DATABASE_URL.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Set it to your Supabase project's Postgres connection string.",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
