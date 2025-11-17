# Clinic Scoping Status - ClinicFlow Database Queries

## Current Status
Multi-tenancy infrastructure exists but has been **DISABLED** to allow development to proceed. RLS policies are enabled at the database level but application-level scoping has been removed.

## Migration Status
- ✅ **Migration 010**: Added `clinic_id` columns to all tables
- ✅ **Migration 011**: Created RLS policies (ENABLED at DB level)
- ✅ **Migration 012**: Created default "Dr. Lee Ogutha" clinic
- ✅ **Migration 013**: Attempted user clinic assignment (duplicate of 015)
- ✅ **Migration 014**: Added reminders table with clinic_id
- ⏳ **Migration 015**: Ready to assign ALL data to Dr. Lee clinic (NOT YET RUN)
- ⏳ **Migration 016**: Ready to disable RLS temporarily (NOT YET RUN)

---

## Tables Without Clinic Scoping (Intentionally Removed)

### ✅ Fully De-Scoped (Working)
These queries have had clinic scoping removed and work for all users:

| Table | File | Status | Notes |
|-------|------|--------|-------|
| `patients` | `pages/patients.tsx` | ✅ Fixed | Removed `scopeToClinic()` call, removed `useClinicScope` import |
| `patients` (inpatients) | `pages/inpatients.tsx` | ✅ Fixed | Removed `scopeToClinic()` call, shows all inpatients |
| `hospitals` | `pages/hospitals.tsx` | ✅ Fixed | Removed clinic filtering, conditionally adds clinic_id on insert |
| `reminders` | `pages/reminders.tsx` | ✅ Fixed | No clinic filtering, conditionally adds clinic_id if available |
| `discharges` | `pages/discharged.tsx` | ✅ Never Scoped | Never used clinic scoping |
| `patient_admissions` | `pages/patient-detail.tsx` | ✅ Never Scoped | Direct query by `patient_id` only |

---

## Tables Still Using Queries (May Be Blocked by RLS)

### 🔴 Critical - Core Functionality
These tables are queried directly and may be affected by RLS policies:

| Table | Files | Scoping Status | RLS Enabled | Impact |
|-------|-------|----------------|-------------|--------|
| `appointments` | Multiple | ❌ No app scoping | ✅ Yes | **Blocked** - assistants can't see appointments |
| `clinic_sessions` | Calendar pages | ❌ No app scoping | ❌ No RLS | ✅ Working |
| `clinical_cases` | Multiple | ❌ No app scoping | ✅ Yes | **Blocked** - APOC documentation fails |
| `procedures` | Multiple | ❌ No app scoping | ✅ Yes | **Blocked** - procedure management fails |
| `post_op_plans` | N/A | ❌ No app scoping | ✅ Yes | **Blocked** - if used |
| `post_op_updates` | `pages/post-op-updates.tsx` | ❌ No app scoping | ✅ Yes | **Blocked** - updates fail |
| `medical_images` | `pages/patient-detail.tsx` | ❌ No app scoping | ❌ No RLS | ✅ Working |
| `clinical_investigations` | APOC wizard | ❌ No app scoping | ❌ No RLS | ✅ Working (if table exists) |

### ⚠️ Moderate - Multi-Tenancy Features
These tables support multi-tenancy features:

| Table | Files | Scoping Status | RLS Enabled | Impact |
|-------|-------|----------------|-------------|--------|
| `clinics` | Context, Onboarding | ✅ Scoped by `id` | ✅ Yes | ⚠️ Users without clinic_id can't see clinic |
| `users` | Multiple | ✅ Scoped by auth | ✅ Yes | ⚠️ May block team management |
| `subscriptions` | `pages/subscription.tsx` | ✅ Scoped | ✅ Yes | ⚠️ Requires clinic context |
| `invoices` | `pages/billing.tsx` | ✅ Scoped | ✅ Yes | ⚠️ Requires clinic context |
| `invitations` | Team mgmt | ✅ Scoped | ✅ Yes + Public | ⚠️ Insert requires clinic_id |
| `audit_logs` | N/A | N/A | ✅ Yes | ⚠️ Likely not used yet |

---

## Detailed Query Breakdown

### Appointments (BLOCKED by RLS)
**Files affected:**
- `pages/appointments.tsx` - Lines 49, 76, 147
- `pages/triage.tsx` - Lines 72, 204
- `pages/diagnoses.tsx` - Lines 96, 302
- `pages/appointment-form.tsx` - Lines 149, 156
- `pages/assistant-dashboard.tsx` - Line 77
- `pages/consultant-patients.tsx` - Lines 437, 444

**Current queries:** Direct `.from("appointments")` with no clinic filtering

**RLS Policy:** 
```sql
CREATE POLICY "Clinic users see clinic appointments" ON appointments
  FOR ALL USING (clinic_id = get_user_clinic_id());
```

**Problem:** If user has no `clinic_id` or appointments have NULL `clinic_id`, queries return empty

**Fix needed:** Run migration 016 to disable RLS, or run migration 015 to assign clinic_id to all data

---

### Clinical Cases (BLOCKED by RLS)
**Files affected:**
- `pages/patient-detail.tsx` - Lines 236, 683, 700
- `pages/clinical-cases.tsx` - Line 57
- `pages/diagnoses.tsx` - Line 217
- `pages/procedures.tsx` - Line 156
- `components/APOCDocumentationWizard.tsx` - Lines 156, 219, 255

**Current queries:** Direct `.from("clinical_cases")` with no clinic filtering

**RLS Policy:**
```sql
CREATE POLICY "Clinic users see clinic cases" ON clinical_cases
  FOR ALL USING (clinic_id = get_user_clinic_id());
```

**Problem:** APOC documentation wizard fails when trying to create cases

**Fix needed:** Disable RLS on `clinical_cases` or ensure all inserts include `clinic_id`

---

### Procedures (BLOCKED by RLS)
**Files affected:**
- `pages/procedures.tsx` - Lines 94, 222, 273, 301, 337
- `pages/assistant-dashboard.tsx` - Lines 110, 159
- `pages/consultant-patients.tsx` - Line 235

**Current queries:** Direct `.from("procedures")` with no clinic filtering

**RLS Policy:**
```sql
CREATE POLICY "Clinic users see clinic procedures" ON procedures
  FOR ALL USING (clinic_id = get_user_clinic_id());
```

**Problem:** Procedure management completely broken for users without clinic_id

**Fix needed:** Disable RLS on `procedures`

---

### Post-Op Updates (BLOCKED by RLS)
**Files affected:**
- `pages/post-op-updates.tsx` - Lines 73, 137, 143

**Current queries:** Direct `.from("post_op_updates")` with no clinic filtering

**RLS Policy:**
```sql
CREATE POLICY "Clinic users see clinic post-op updates" ON post_op_updates
  FOR ALL USING (clinic_id = get_user_clinic_id());
```

**Problem:** Post-op updates invisible to users without clinic_id

**Fix needed:** Disable RLS on `post_op_updates`, `post_op_plans`

---

### Discharges (WORKING - No RLS enforced in query)
**Files affected:**
- `pages/discharged.tsx` - Line 39
- `pages/assistant-dashboard.tsx` - Line 137
- `pages/consultant-patients.tsx` - Line 258

**Current queries:** Direct `.from("discharges")` - NO clinic scoping ever added

**RLS Policy:** 
```sql
CREATE POLICY "Clinic users see clinic discharges" ON discharges
  FOR ALL USING (clinic_id = get_user_clinic_id());
```

**Status:** May be working if RLS isn't strictly enforced or service role is used

---

## Authentication Queries (Not Scoped)
These use Supabase auth and don't need clinic scoping:
- `supabase.auth.getUser()` - All pages
- `supabase.auth.getSession()` - App.tsx, various pages
- `supabase.auth.signInWithPassword()` - auth.tsx
- `supabase.auth.signUp()` - auth.tsx, accept-invitation.tsx
- `supabase.auth.signOut()` - App.tsx, app-sidebar.tsx
- `supabase.auth.onAuthStateChange()` - App.tsx, patients.tsx

---

## Storage Queries (Not Scoped)
Medical image uploads don't use clinic scoping:
- `supabase.storage.from("medical-media")` - Multiple files
- No RLS on storage buckets (handled by bucket policies)

---

## Recommendations

### Immediate Fix (Run These Migrations)
1. **Run Migration 015** - Assigns all existing data to Dr. Lee Ogutha's clinic
   - Updates: users, patients, appointments, hospitals, clinical_cases, procedures, discharges, patient_admissions
   - Will populate all NULL clinic_id fields

2. **Run Migration 016** - Disables RLS on data tables
   - Keeps RLS on: clinics, users, subscriptions, invoices, invitations, audit_logs
   - Disables RLS on: patients, appointments, hospitals, clinical_cases, procedures, discharges, post_op_plans, post_op_updates, patient_admissions

### Long-Term Multi-Tenancy Strategy
When ready to re-enable multi-tenancy:
1. Re-enable onboarding redirect in `App.tsx`
2. Re-enable RLS policies (reverse migration 016)
3. Add clinic scoping back to queries that need it
4. Ensure all INSERT operations include `clinic_id`
5. Test with multiple clinic contexts

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| Tables with clinic_id column | 10+ | ✅ Schema ready |
| RLS policies created | 14 | ✅ Defined but disabled |
| Queries de-scoped | 6 | ✅ Working |
| Queries still blocked by RLS | 5-7 | 🔴 Needs migration 016 |
| Migration files ready | 7 | ⏳ Waiting to run |

**Next Action:** Run migrations 015 and 016 to fully unblock development
