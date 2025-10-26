# Environment Variables Setup

Your `.env` file needs the following variables for Supabase integration:

## Required Environment Variables

```env
# Supabase Project URL and API Key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# PostgreSQL Connection String (from Supabase)
DATABASE_URL=postgresql://postgres.your-project-id:your-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Server Configuration
PORT=5000
NODE_ENV=development
```

## How to Get These Values from Supabase

### 1. NEXT_PUBLIC_SUPABASE_URL
- Go to your Supabase dashboard
- Click on **Settings** (gear icon) in the left sidebar
- Click on **API**
- Copy the **Project URL**

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- Same location as above (Settings → API)
- Copy the **anon public** key

### 3. DATABASE_URL
- Go to **Settings** → **Database**
- Scroll down to **Connection string**
- Select **URI** tab
- Copy the connection string
- Replace `[YOUR-PASSWORD]` with your actual database password

## Example .env File

```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.abc123xyz:my-secure-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
PORT=5000
NODE_ENV=development
```

## Verify Your Setup

After setting up your `.env` file, verify the configuration by running:

```bash
node check-connection.js
```

This will confirm that:
1. Environment variables are correctly set
2. Connection to Supabase works
3. Tables exist in your database

## Next Steps

Once your environment is configured:

1. Run tests: `node test-supabase.js`
2. Start the application: `npm run dev`
3. Access the app at: `http://localhost:5000`