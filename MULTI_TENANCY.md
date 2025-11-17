# Multi-Tenancy Clinic Scoping - Implementation Guide

## Overview
ClinicFlow now enforces data isolation at both the database (RLS) and application (query) levels to ensure each clinic only sees their own data.

## Database Layer (RLS Policies)

### Migration: `migrations/011_add_rls_policies.sql`

**Key Components:**
1. **Helper Function**: `get_user_clinic_id()`
   - Returns the clinic_id for the currently authenticated user
   - Used by all RLS policies to scope data

2. **RLS Policies Created**:
   - `clinics`: Users can only see their own clinic
   - `users`: Can see users in same clinic
   - `patients`, `appointments`, `hospitals`, `clinical_cases`, `procedures`: All scoped to clinic
   - `patient_admissions`, `post_op_plans`, `post_op_updates`: Scoped to clinic
   - `subscriptions`, `invoices`: Read-only for clinic users
   - `invitations`: Full access for clinic users, public read for pending invitations
   - `audit_logs`: Read-only for clinic users

3. **Special Cases**:
   - Invitations have public SELECT for pending status (needed for acceptance flow)
   - Invitations allow public UPDATE for status changes (acceptance)

## Application Layer (Query Scoping)

### Helper Hooks: `client/src/hooks/use-clinic-scope.ts`

**1. `useClinicScope()`**
Returns a function that automatically adds `.eq('clinic_id', clinic.id)` to queries:

```typescript
const scopeToClinic = useClinicScope();
const query = supabase.from('patients').select('*');
const { data } = await scopeToClinic(query);
```

**2. `useRequiredClinicId()`**
Returns the current clinic ID or throws an error:

```typescript
const clinicId = useRequiredClinicId();
await supabase.from('patients').insert({ ...data, clinic_id: clinicId });
```

## Updated Pages

### 1. **patients.tsx** (Assistant Patient List)
- ✅ Added `useClinicScope()` import
- ✅ Scoped patient query with `scopeToClinic(query)`
- ✅ Automatically filters patients by clinic

### 2. **inpatients.tsx** (Inpatient Overview)
- ✅ Added `useClinicScope()` import
- ✅ Scoped inpatient query with clinic filter
- ✅ Only shows inpatients from current clinic

### 3. **patient-form.tsx** (Patient Registration)
- ✅ Added `useRequiredClinicId()` import
- ✅ Automatically sets `clinic_id` on new patient creation
- ✅ Ensures all new patients belong to the current clinic

### 4. **hospitals.tsx** (Hospital Management)
- ✅ Added both `useClinicScope()` and `useRequiredClinicId()`
- ✅ Scoped hospital list query
- ✅ Sets `clinic_id` when creating new hospitals
- ✅ Only shows/edits hospitals belonging to current clinic

## Pages Already Scoped by Design

These pages were created during multi-tenancy implementation and already include clinic scoping:

- ✅ **team-management.tsx**: Queries users with `.eq('clinic_id', clinic.id)`
- ✅ **clinic-onboarding.tsx**: Creates clinic and associates user
- ✅ **accept-invitation.tsx**: Sets clinic_id from invitation
- ✅ **subscription.tsx**: Queries subscriptions by clinic_id
- ✅ **billing.tsx**: Queries invoices by clinic_id

## Remaining Pages to Scope

The following pages still need clinic scoping applied:

### High Priority
- [ ] **consultant-patients.tsx**: Consultant patient list
- [ ] **patient-detail.tsx**: Patient details, admissions, clinical cases
- [ ] **appointments.tsx**: Appointment list and creation
- [ ] **diagnoses.tsx**: Diagnosis list
- [ ] **procedures.tsx**: Procedures list
- [ ] **clinical-cases.tsx**: Clinical cases management
- [ ] **discharged.tsx**: Discharged patients view
- [ ] **post-op-updates.tsx**: Post-operative updates

### Medium Priority
- [ ] **triage.tsx**: Triage queue
- [ ] **consultant-calendar.tsx**: Consultant schedule
- [ ] **assistant-calendar.tsx**: Assistant schedule
- [ ] **schedule-clinic.tsx**: Clinic session scheduling
- [ ] **clinic-session-detail.tsx**: Session details
- [ ] **assistant-dashboard.tsx**: Dashboard metrics

## Implementation Pattern

For each remaining page, follow this pattern:

### 1. Add Imports
```typescript
import { useClinicScope, useRequiredClinicId } from "@/hooks/use-clinic-scope";
```

### 2. Get Hooks in Component
```typescript
const scopeToClinic = useClinicScope();
const clinicId = useRequiredClinicId(); // Only if creating records
```

### 3. Scope Read Queries
```typescript
// Before
const { data } = await supabase.from('table').select('*');

// After
const query = supabase.from('table').select('*');
const { data } = await scopeToClinic(query);
```

### 4. Add clinic_id to Inserts
```typescript
// Before
await supabase.from('table').insert({ ...data });

// After
await supabase.from('table').insert({ ...data, clinic_id: clinicId });
```

## Testing Multi-Tenancy

### 1. **Create Multiple Clinics**
- Create 2-3 test clinics via the onboarding flow
- Invite users to each clinic

### 2. **Verify Data Isolation**
- Log in as users from different clinics
- Ensure Patient A from Clinic 1 is not visible to Clinic 2 users
- Verify hospitals, appointments, procedures are scoped correctly

### 3. **Test RLS Enforcement**
- Try to query data directly in Supabase SQL editor
- Confirm RLS policies block cross-clinic access
- Verify the `get_user_clinic_id()` function returns correct clinic

### 4. **Migration Path for Existing Data**
If you have existing data without `clinic_id`:

```sql
-- Create a default clinic for migration
INSERT INTO clinics (id, name, slug, subscription_tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Clinic', 'default', 'pro');

-- Assign all existing data to default clinic
UPDATE users SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE patients SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE appointments SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
-- Repeat for all tables...
```

## Security Considerations

1. **RLS is the Last Line of Defense**: Even if application code misses a filter, RLS prevents data leakage
2. **Both Layers Required**: Application filtering improves performance; RLS ensures security
3. **Audit Logging**: Consider logging all data access for compliance (Kenya Data Protection Act)
4. **Regular Audits**: Periodically review RLS policies and query patterns

## Performance Tips

1. **Indexes**: Ensure `clinic_id` columns are indexed for fast filtering
2. **Composite Indexes**: Consider indexes on `(clinic_id, created_at)` for common queries
3. **Query Planning**: Use `.explain()` in Supabase to verify query plans use indexes

## Next Steps

1. ✅ Run migration 011 to enable RLS policies
2. ⏳ Update remaining pages with clinic scoping
3. ⏳ Add comprehensive tests for multi-tenancy
4. ⏳ Document clinic management workflows for end users
5. ⏳ Consider adding clinic switching UI for super-admins
