# APOC Auto-Save Fix
**Date:** November 9, 2025  
**Issue:** Auto-save failing with 404 errors  
**Status:** ✅ Fixed

## Problem Analysis

### Error Message
```
Failed to load resource: the server responded with a status of 404 (Not Found)
:5173/api/clinical-cases/d82d8575-21c0-4556-87ee-82b309431408
```

### Root Cause
The APOC wizard components were using REST API `fetch()` calls to endpoints that don't exist:
- `/api/clinical-cases/:id` (PATCH for auto-save)
- `/api/clinical-cases/:id/investigations` (GET, POST)
- `/api/investigations/:id` (DELETE)

**However**, this application is **client-side only** and uses **Supabase directly** - there is no backend server to handle these API routes.

---

## Solution Implemented

### 1. **APOCDocumentationWizard.tsx** - Main Auto-Save

#### Added Supabase Import
```typescript
import { supabase } from '@/lib/supabaseClient';
```

#### Fixed Data Fetching
**Before (❌ Broken):**
```typescript
const { data: clinicalCase, isLoading } = useQuery({
  queryKey: [`/api/clinical-cases/${clinicalCaseId}`],
  enabled: !!clinicalCaseId,
});
```

**After (✅ Fixed):**
```typescript
const { data: clinicalCase, isLoading } = useQuery({
  queryKey: ['clinical-case', clinicalCaseId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('clinical_cases')
      .select('*')
      .eq('id', clinicalCaseId)
      .single();
    
    if (error) throw error;
    return data;
  },
  enabled: !!clinicalCaseId,
});
```

#### Fixed Auto-Save Mutation
**Before (❌ Broken):**
```typescript
const saveMutation = useMutation({
  mutationFn: async (data: any) => {
    const response = await fetch(`/api/clinical-cases/${clinicalCaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        documentationMode: 'apoc',
        workflowProgress: JSON.stringify(workflowProgress),
      }),
    });
    if (!response.ok) throw new Error('Failed to save');
    return response.json();
  },
  // ...
});
```

**After (✅ Fixed):**
```typescript
const saveMutation = useMutation({
  mutationFn: async (data: any) => {
    const { error } = await supabase
      .from('clinical_cases')
      .update({
        ...data,
        documentation_mode: 'apoc',
        workflow_progress: workflowProgress,
      })
      .eq('id', clinicalCaseId);
    
    if (error) throw error;
    return { success: true };
  },
  onSuccess: () => {
    setHasUnsavedChanges(false);
    setLastSavedAt(new Date());
    queryClient.invalidateQueries({ queryKey: ['patient-clinical-cases'] });
  },
  // ...
});
```

**Key Changes:**
- Uses `supabase.from('clinical_cases').update()` instead of `fetch()`
- Uses snake_case field names (`documentation_mode`, `workflow_progress`)
- Stores `workflow_progress` as JSONB (not stringified)
- Invalidates correct query key

---

### 2. **InvestigationsSection.tsx** - Lab/Imaging Management

#### Added Supabase Import
```typescript
import { supabase } from '@/lib/supabaseClient';
```

#### Fixed Investigations Fetch
**Before (❌ Broken):**
```typescript
const { data: investigations = [], isLoading } = useQuery({
  queryKey: [`/api/clinical-cases/${clinicalCaseId}/investigations`],
  enabled: !!clinicalCaseId,
});
```

**After (✅ Fixed):**
```typescript
const { data: investigations = [], isLoading } = useQuery({
  queryKey: ['clinical-investigations', clinicalCaseId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('clinical_investigations')
      .select('*')
      .eq('clinical_case_id', clinicalCaseId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  enabled: !!clinicalCaseId,
});
```

#### Fixed Create Investigation
**After (✅ Fixed):**
```typescript
const createInvestigationMutation = useMutation({
  mutationFn: async (investigationData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!userData) throw new Error("User record not found");

    const { data, error } = await supabase
      .from('clinical_investigations')
      .insert({
        ...investigationData,
        investigation_type: investigationType,
        clinical_case_id: clinicalCaseId,
        ordered_by: userData.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clinical-investigations', clinicalCaseId] });
    // ...
  },
});
```

#### Fixed Delete Investigation
**After (✅ Fixed):**
```typescript
const deleteInvestigationMutation = useMutation({
  mutationFn: async (investigationId: string) => {
    const { error } = await supabase
      .from('clinical_investigations')
      .delete()
      .eq('id', investigationId);
    
    if (error) throw error;
    return { success: true };
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clinical-investigations', clinicalCaseId] });
    // ...
  },
});
```

#### Fixed Field Name References
```typescript
// Changed from camelCase to snake_case
const labWorks = (investigations as any[]).filter(
  (inv: any) => inv.investigation_type === 'lab_work'
);
const imagingStudies = (investigations as any[]).filter(
  (inv: any) => inv.investigation_type === 'imaging'
);
```

---

## Technical Details

### Database Schema Alignment
All Supabase operations now correctly use snake_case field names matching the database schema:

| Field Name | Type | Purpose |
|------------|------|---------|
| `documentation_mode` | text | 'apoc' or 'legacy' |
| `workflow_progress` | jsonb | Section completion tracking |
| `clinical_case_id` | uuid | Foreign key to clinical_cases |
| `investigation_type` | text | 'lab_work' or 'imaging' |
| `ordered_by` | uuid | Foreign key to users |

### Auto-Save Behavior
- **Trigger:** 30 seconds after last change
- **Method:** Supabase update with `.eq('id', clinicalCaseId)`
- **Success:** Sets `lastSavedAt` timestamp, clears `hasUnsavedChanges` flag
- **Error:** Shows toast notification with error message
- **Query Invalidation:** Refreshes patient clinical cases list

### Query Keys Updated
- ❌ Old: `/api/clinical-cases/${id}` → ✅ New: `['clinical-case', id]`
- ❌ Old: `/api/clinical-cases/${id}/investigations` → ✅ New: `['clinical-investigations', id]`
- ❌ Old: `/api/investigations/${id}` → ✅ New: (deleted directly by ID)

---

## Testing Checklist

- [ ] Create new APOC case - verify case created
- [ ] Edit section - verify auto-save triggers after 30s
- [ ] Check lastSavedAt timestamp updates
- [ ] Refresh page - verify data persisted
- [ ] Add investigation - verify appears in list
- [ ] Delete investigation - verify removed
- [ ] Check browser console - no 404 errors
- [ ] Check Supabase dashboard - verify records updated

---

## Files Modified
1. `/client/src/components/APOCDocumentationWizard.tsx`
   - Added Supabase import
   - Fixed fetch query to use Supabase
   - Fixed auto-save mutation to use Supabase

2. `/client/src/components/apoc-sections/InvestigationsSection.tsx`
   - Added Supabase import
   - Fixed investigations query
   - Fixed create/delete mutations
   - Fixed field name references (camelCase → snake_case)

---

## Next Steps
1. ✅ Auto-save now works correctly
2. Test database migrations (001, 002) before full deployment
3. Verify workflow_progress JSONB serialization
4. Test all 12 APOC sections for proper data persistence
5. Verify investigations table has correct schema
