# SuperAdmin Dashboard Troubleshooting

## Issue: Blank/Empty Subscription Data

If you're seeing blank rows or "0" counts in the SuperAdmin dashboard despite having clinics in your database, follow these steps:

### 1. Verify SuperAdmin Role

Check that your user has the `superadmin` role:

```sql
SELECT id, name, email, role FROM users WHERE email = 'your-email@example.com';
```

If the role is not `superadmin`, update it:

```sql
UPDATE users SET role = 'superadmin' WHERE email = 'your-email@example.com';
```

### 2. Apply SuperAdmin RLS Policies

The most common issue is missing Row Level Security (RLS) policies for superadmin access.

**Run this SQL in Supabase SQL Editor:**

```bash
# In your project, run:
psql -h your-supabase-host -U postgres -d postgres -f migrations/superadmin_rls_policies.sql
```

Or manually execute the contents of `migrations/superadmin_rls_policies.sql` in Supabase Dashboard → SQL Editor.

### 3. Verify Clinics Exist

Check that clinics are actually in the database:

```sql
SELECT id, name, subscription_tier, subscription_status, created_at FROM clinics;
```

If no clinics exist, create one using the "Create New Clinic" button in the SuperAdmin dashboard.

### 4. Check Browser Console

Open browser DevTools (F12) → Console tab. Look for:

- **Red error messages**: Indicates query failures
- **"Fetched clinics:" log**: Should show array of clinic objects
- **"Error fetching clinics:"**: Shows specific error details

Common errors:
- `permission denied for table clinics` → RLS policies not applied
- `relation "clinics" does not exist` → Table not created
- `column "subscription_end_date" does not exist` → Run migration

### 5. Run Missing Migrations

If you see column errors:

```sql
-- Add subscription_end_date column
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clinics';
```

### 6. Test SuperAdmin Function

Verify the helper function works:

```sql
-- Should return true if you're a superadmin
SELECT is_superadmin();
```

If it returns `false` or error, re-create the function from `superadmin_rls_policies.sql`.

### 7. Check Policy Application

View current RLS policies:

```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('clinics', 'users', 'patients', 'appointments');
```

You should see policies like `superadmin_all_clinics`, `superadmin_all_users`, etc.

### 8. Clear Query Cache

Sometimes React Query caches empty results. Hard refresh:

- **Chrome/Edge**: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- **Firefox**: Ctrl+F5
- Or: Clear browser cache and reload

### 9. Check Supabase Connection

Verify environment variables are correct:

```bash
# Check .env or Netlify environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 10. Test Direct Query

Test in Supabase Dashboard → Table Editor:

1. Navigate to `clinics` table
2. If you see data there but not in app → RLS issue
3. If you don't see data → No clinics created yet

## Quick Fix Script

Run this in Supabase SQL Editor to fix most issues:

```sql
-- 1. Create superadmin function
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add missing column
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- 3. Create superadmin policy
DROP POLICY IF EXISTS "superadmin_all_clinics" ON clinics;
CREATE POLICY "superadmin_all_clinics" ON clinics
FOR ALL TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- 4. Set your user as superadmin (replace email)
UPDATE users SET role = 'superadmin' 
WHERE email = 'your-email@example.com';

-- 5. Verify setup
SELECT 
  (SELECT COUNT(*) FROM clinics) as total_clinics,
  (SELECT COUNT(*) FROM users WHERE role = 'superadmin') as superadmin_count,
  (SELECT is_superadmin()) as i_am_superadmin;
```

## Still Not Working?

1. **Sign out and sign back in** - Role changes require new session
2. **Check Supabase logs** - Dashboard → Logs → look for errors
3. **Verify network requests** - DevTools → Network tab → look for failed requests
4. **Check CORS** - Ensure Supabase project allows your domain
5. **Contact support** - tech@zahaniflow.com with:
   - Browser console errors
   - Supabase project URL
   - User email

## Expected Behavior

When working correctly, you should see:

✅ Subscription tier cards showing counts (e.g., "2" for Starter)
✅ Revenue calculations (e.g., "KES 10,000/mo revenue")
✅ Full table with clinic names, tiers, statuses
✅ "Manage" buttons in each row
✅ No error messages at top of page
✅ Console log: "Fetched clinics: [{...}, {...}]"
