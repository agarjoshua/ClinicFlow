# Migrating to Supabase

This guide explains how to migrate the ClinicFlow application to Supabase.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Get the following credentials from your Supabase project:
   - Project URL (Settings → API → Project URL)
   - Anon key (Settings → API → Project API keys → anon/public)
   - PostgreSQL connection string (Settings → Database → Connection string → URI)

## Step 1: Configure Environment Variables

1. Copy the example environment file to create a new `.env` file:
   ```bash
   cp .env.example.new .env
   ```

2. Update the `.env` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
   ```

## Step 2: Migrate Database Schema to Supabase

There are two ways to create your database schema:

### Option 1: Using the SQL Editor in Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase-migration.sql` 
5. Run the query

### Option 2: Using the Supabase CLI

1. Install the Supabase CLI if you don't have it already:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase CLI:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Run the migration:
   ```bash
   supabase db execute --file supabase-migration.sql
   ```

## Step 3: Test Supabase Integration

To verify that your Supabase setup is working correctly:

1. Run the test script:
   ```bash
   node --experimental-specifier-resolution=node --experimental-modules test-supabase.js
   ```

   This script will:
   - Connect to your Supabase instance
   - Create a sequence record
   - Create a test patient
   - Create a diagnosis for the patient
   - Retrieve patient records

2. Check your Supabase dashboard to see the created records:
   - Go to Table Editor
   - Select the 'patients', 'diagnoses', and 'patient_sequence' tables
   - Verify that your test records are present

## Step 4: Run Your Application with Supabase

Now you can run your application with Supabase integration:

```bash
npm run dev
```

Your application should now be using Supabase for all database operations.

## How It Works

The Supabase integration uses two approaches:

1. **Supabase JavaScript Client**: For most operations, we use the Supabase client for data access through the REST API.
   - This is implemented in `server/supabaseStorage.ts`
   - This provides additional features like realtime subscriptions and Row Level Security

2. **Direct PostgreSQL Connection**: The application can still connect directly to the PostgreSQL database if needed.
   - This is implemented in `server/db.ts`
   - This approach gives you full SQL capabilities

You can switch between the two approaches by changing the exported storage in `server/storage.ts`.

## Authentication (Future Implementation)

To add authentication:

1. Set up authentication providers in Supabase dashboard (Email, Google, GitHub, etc.)
2. Implement sign in/sign up flows using Supabase Auth
3. Update Row Level Security policies to restrict data access based on user authentication

## Troubleshooting

### Connection Issues
- Verify your environment variables are correctly set
- Make sure your IP is whitelisted in Supabase's dashboard if you're using IP restrictions
- Check the network tab in your browser's developer tools for API errors

### Database Errors
- SQL errors can be viewed in the Supabase dashboard under Database → Logs
- Check that your tables are created correctly in Table Editor
- Verify that RLS policies are correctly set up

### Client Errors
- Make sure you're using the latest version of `@supabase/supabase-js`
- Check for CORS issues if your frontend and backend are on different domains