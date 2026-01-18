# Form Persistence Implementation Guide

## Overview

This document describes the comprehensive form state persistence solution implemented for ClinicFlow to prevent data loss when users receive calls, switch apps, or navigate away from forms.

## Problem Solved

Previously, all form data was lost when:
- Users received phone calls (especially on mobile)
- Users switched to another app or browser tab
- Users accidentally closed the browser/tab
- Users navigated away without saving
- Network issues interrupted form submission

## Solution Components

### 1. Core Utilities

#### `useFormPersistence` Hook
**Location:** `/client/src/hooks/useFormPersistence.ts`

A reusable React hook that provides automatic form state persistence with:
- **Auto-save**: Debounced saving (1 second default) to localStorage
- **Auto-restore**: Loads saved drafts on component mount
- **Expiration**: Automatically removes drafts older than 7 days
- **Storage management**: Handles quota errors gracefully
- **Field exclusion**: Can exclude sensitive fields from persistence
- **Visual feedback**: Returns saving status and last saved timestamp

**Usage Example:**
```typescript
const persistence = useFormPersistence({
  storageKey: `draft-patient-${userId}-new`,
  formState: patientForm,
  enabled: dialogOpen,
  onRestore: (data) => setPatientForm(data),
});

// Clear draft on successful submission
persistence.clearDraft();
```

#### `useFormNavigationGuard` Hook
**Location:** `/client/src/hooks/useFormNavigationGuard.ts`

Prevents accidental data loss by:
- Showing browser warning before closing/refreshing with unsaved changes
- Providing confirmation dialogs for internal navigation
- Works with both browser events and Wouter router

**Usage Example:**
```typescript
useFormNavigationGuard(
  persistence.hasUnsavedChanges && dialogOpen,
  "You have unsaved changes. Are you sure you want to leave?"
);
```

#### `SaveIndicator` Component
**Location:** `/client/src/components/SaveIndicator.tsx`

Visual feedback component showing:
- "Saving..." with spinner when auto-saving
- "Saved [time]" with checkmark when saved
- "Not saved" when no data present

**Usage Example:**
```tsx
<SaveIndicator
  isSaving={persistence.isSaving}
  lastSavedAt={persistence.lastSavedAt}
  className="text-xs"
/>
```

#### `DraftCleanupService`
**Location:** `/client/src/lib/draftCleanup.ts`

Manages draft lifecycle:
- **Auto-cleanup**: Removes expired drafts (>7 days old)
- **User cleanup**: Clears all drafts for a specific user (on logout)
- **Storage monitoring**: Tracks storage usage and warns at 4MB
- **Draft management**: List, view, and delete saved drafts

**Key Methods:**
```typescript
// Initialize on app startup
DraftCleanupService.initializeAutoCleanup();

// Clear user drafts on logout
DraftCleanupService.clearUserDrafts(userId);

// Get storage stats
const { totalKB, draftCount } = DraftCleanupService.getDraftStorageSize();
```

### 2. Implementation in Forms

#### Patient Registration Form
**Location:** `/client/src/pages/consultant-patients.tsx`

**What's Persisted:**
- All 14 patient fields (firstName, lastName, DOB, gender, contact info, medical history, etc.)
- Separate drafts for new patients vs editing existing patients

**Storage Key Pattern:** `draft-patient-${userId}-${patientId || 'new'}`

**Features:**
- Auto-saves every 1 second after user stops typing
- Shows "Saved" indicator in dialog header
- Restores previous work with toast notification
- Clears draft on successful creation/update
- Navigation guard prevents accidental closing

#### Appointment Booking Form
**Location:** `/client/src/pages/consultant-patients.tsx`

**What's Persisted:**
- Clinic session selection
- Chief complaint
- Priority status and reason
- Triage notes

**Storage Key Pattern:** `draft-booking-${userId}-${patientId || 'new'}`

**Features:**
- Separate persistence from patient form
- Clears on successful booking
- Visual save indicator

#### Triage Assessment Form
**Location:** `/client/src/pages/triage.tsx`

**What's Persisted:**
- Triage notes
- Priority status and reason
- All vital signs (temperature, blood pressure, heart rate, oxygen saturation)

**Storage Key Pattern:** `draft-triage-${appointmentId || 'none'}`

**Features:**
- Comprehensive vitals preservation
- Immediate restore on dialog open
- Clears on successful triage completion
- Navigation guard active during assessment

#### Post-Op Update Form
**Location:** `/client/src/pages/post-op-updates.tsx`

**What's Persisted:**
- Day post-op
- Glasgow Coma Scale (GCS) score
- Motor function scores (UR, UL, LR, LL)
- All vital signs (BP, pulse, temperature, respiratory rate, SpO2)
- Current medications
- Improvement notes
- New complaints
- Neurological exam findings
- Wound status

**Storage Key Pattern:** `draft-postop-${procedureId || 'none'}-${updateId || 'new'}`

**Features:**
- 18+ fields preserved
- Critical medical data protected
- Edit vs create mode handling
- Clears on successful save

#### Clinical Cases (Already Implemented)
**Location:** `/client/src/pages/patient-detail.tsx`

**Note:** This form already had localStorage persistence implemented. The pattern was:
- Storage key: `draft-case-${patientId}`
- Manual save on field changes
- Restore on page load

### 3. App-Level Integration

#### App Initialization
**Location:** `/client/src/App.tsx`

On app startup:
```typescript
useEffect(() => {
  DraftCleanupService.initializeAutoCleanup();
}, []);
```

This:
- Removes expired drafts (>7 days)
- Logs cleanup statistics to console
- Monitors storage usage

#### Logout Handler
**Location:** `/client/src/components/app-sidebar.tsx`

On user logout:
```typescript
const handleLogout = async () => {
  if (userData?.id) {
    DraftCleanupService.clearUserDrafts(userData.id);
  }
  await supabase.auth.signOut();
  window.location.href = "/auth";
};
```

This ensures:
- User privacy (drafts cleared on logout)
- Multi-user device safety
- Compliance with security best practices

## Storage Strategy

### localStorage vs Database

**Current Implementation: localStorage**

**Why localStorage?**
- ✅ Instant save/restore (no network latency)
- ✅ Works offline
- ✅ No backend changes required
- ✅ Simple implementation
- ✅ Follows existing pattern (patient-detail.tsx)

**Limitations:**
- ❌ 5-10MB storage limit per domain
- ❌ Not synced across devices
- ❌ Lost if user clears browser data
- ❌ Potential HIPAA/privacy concerns for medical data

**Future Enhancement (Optional):**
For highly sensitive forms (clinical documentation), consider migrating to:
- Supabase table: `form_drafts`
- Encrypted localStorage
- IndexedDB for larger data (with files/media)

### Storage Key Convention

Pattern: `draft-{formType}-{uniqueId1}-{uniqueId2}`

Examples:
- `draft-patient-user123-new`
- `draft-patient-user123-patient456`
- `draft-booking-user123-patient789`
- `draft-triage-appointment456`
- `draft-postop-procedure789-new`

**Benefits:**
- Unique per user and context
- Easy to clean up by user or form type
- Prevents conflicts in multi-user scenarios

## Data Structure

Each stored draft follows this schema:

```typescript
interface StoredDraft<T> {
  formData: T;                    // The actual form fields
  metadata: {
    savedAt: string;              // ISO timestamp
    version: string;              // Schema version (future-proofing)
    formType: string;             // Extracted from storage key
  };
}
```

## Security & Privacy Considerations

### Current Implementation

1. **User-Scoped Drafts**: Storage keys include user ID
2. **Logout Cleanup**: All user drafts removed on signout
3. **Expiration**: 7-day automatic deletion
4. **Field Exclusion**: Sensitive fields can be excluded via `excludeFields` option

### HIPAA Compliance Notes

⚠️ **Important:** Medical data in localStorage may not be HIPAA compliant.

**Recommendations for Production:**
1. Encrypt sensitive fields before storing
2. Implement backend draft storage for clinical forms
3. Add audit logging for draft access
4. User consent/notice about local storage
5. Shorter expiration for medical data (24-48 hours)

**To Encrypt Drafts:**
```typescript
import CryptoJS from 'crypto-js';

const encryptData = (data: any, secret: string) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
};

const decryptData = (encrypted: string, secret: string) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, secret);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
```

## Performance Considerations

### Debouncing

All auto-save operations are debounced (1 second default) to:
- Reduce localStorage write operations
- Prevent performance issues during rapid typing
- Balance between data safety and efficiency

### Storage Monitoring

The system monitors storage usage:
- Warns at 4MB (80% of typical 5MB limit)
- Shows toast notification
- Suggests clearing old drafts or submitting forms

### Cleanup Frequency

- **On app startup**: Expired drafts removed
- **On logout**: All user drafts cleared
- **Manual**: Users can access draft management (future feature)

## Testing Recommendations

### Manual Testing Scenarios

1. **Mobile Call Test**
   - Fill out patient registration form
   - Receive/simulate phone call
   - Return to form
   - ✅ Data should be restored

2. **Browser Refresh Test**
   - Fill out triage form halfway
   - Refresh browser (F5)
   - ✅ Confirm restore and warning dialog

3. **Navigation Test**
   - Start filling post-op update
   - Try to navigate away
   - ✅ Confirmation dialog should appear

4. **Offline Test**
   - Disconnect network
   - Fill out appointment booking form
   - ✅ Auto-save should work (localStorage)
   - Reconnect and submit
   - ✅ Draft should be cleared

5. **Storage Limit Test**
   - Fill multiple long-form drafts
   - ✅ Check for storage warning at 4MB

6. **Logout Test**
   - Create drafts as User A
   - Logout
   - Login as User B
   - ✅ User A's drafts should be gone

### Automated Testing (TODO)

```typescript
describe('useFormPersistence', () => {
  it('should save form data to localStorage', () => {
    // Test implementation
  });

  it('should restore form data on mount', () => {
    // Test implementation
  });

  it('should clear draft on clearDraft call', () => {
    // Test implementation
  });

  it('should expire drafts older than 7 days', () => {
    // Test implementation
  });
});
```

## User Experience

### Visual Feedback

Users see:
1. **"Saving..."** - While debounce timer is active
2. **"Saved 2m ago"** - After successful save (updates in real-time)
3. **Toast: "Draft Restored"** - When returning to a form with saved data
4. **Browser warning** - When trying to close with unsaved changes
5. **Confirmation dialog** - When navigating away internally

### Error Handling

When localStorage quota exceeded:
```
Toast:
  Title: "Storage Full"
  Description: "Unable to save draft. Please submit the form or clear old drafts."
  Variant: destructive
```

When draft is corrupted:
- Silently removes the corrupted draft
- Logs error to console
- User can start fresh

## Maintenance & Monitoring

### Checking Storage Usage

Open browser console on production:
```javascript
// Get all drafts
Object.keys(localStorage)
  .filter(key => key.startsWith('draft-'))
  .forEach(key => console.log(key, localStorage[key].length, 'bytes'));

// Total storage
let total = 0;
for (let key in localStorage) {
  total += localStorage[key].length + key.length;
}
console.log('Total storage:', (total / 1024).toFixed(2), 'KB');
```

### Console Logs

On app startup, you'll see:
```
Cleaned up 3 expired draft(s)
Draft storage: 87KB across 5 draft(s)
```

## Future Enhancements

### Phase 1 (Next 1-2 months)
- [ ] Draft management UI (view/delete old drafts)
- [ ] User settings: enable/disable auto-save
- [ ] Export/import drafts feature
- [ ] Storage usage indicator in UI

### Phase 2 (3-6 months)
- [ ] Backend draft storage (Supabase table)
- [ ] Cross-device sync
- [ ] Draft versioning/history
- [ ] Collaborative editing warnings
- [ ] Encryption for sensitive fields

### Phase 3 (6+ months)
- [ ] Offline-first architecture with IndexedDB
- [ ] Conflict resolution for multi-device scenarios
- [ ] AI-powered draft recovery suggestions
- [ ] Audit trail for medical data drafts
- [ ] Draft analytics and insights

## Troubleshooting

### Problem: Drafts not saving
**Check:**
1. Is `enabled` prop set to true?
2. Is storage quota exceeded? (Check console)
3. Are private browsing/incognito settings blocking localStorage?

### Problem: Drafts not restoring
**Check:**
1. Is `onRestore` callback properly updating state?
2. Is the storage key consistent?
3. Has the draft expired (>7 days)?

### Problem: Performance issues
**Check:**
1. Debounce duration (increase if needed)
2. Form state size (consider excluding large fields)
3. Number of simultaneous auto-saves

### Problem: Storage full warning
**Solution:**
1. Run: `DraftCleanupService.cleanupExpiredDrafts()`
2. Manually clear old drafts
3. Submit pending forms
4. Consider IndexedDB migration

## Migration from Existing Code

The patient-detail.tsx already had manual localStorage persistence. If you want to migrate it:

**Before:**
```typescript
useEffect(() => {
  const savedDraft = localStorage.getItem(storageKey);
  if (savedDraft) {
    const draft = JSON.parse(savedDraft);
    setCaseSymptoms(draft.symptoms || "");
    // ... restore other fields
  }
}, [patientId]);

useEffect(() => {
  if (caseSymptoms || caseDiagnosisNotes) {
    localStorage.setItem(storageKey, JSON.stringify({
      symptoms: caseSymptoms,
      // ... other fields
    }));
  }
}, [caseSymptoms, caseDiagnosisNotes]);
```

**After:**
```typescript
const persistence = useFormPersistence({
  storageKey: `draft-case-${patientId}`,
  formState: { caseSymptoms, caseDiagnosisNotes, /* ... */ },
  onRestore: (data) => {
    setCaseSymptoms(data.caseSymptoms || "");
    setCaseDiagnosisNotes(data.caseDiagnosisNotes || "");
    // ... restore other fields
  },
});

// Add SaveIndicator to UI
<SaveIndicator
  isSaving={persistence.isSaving}
  lastSavedAt={persistence.lastSavedAt}
/>
```

## Summary

This implementation provides:
- ✅ Automatic form state persistence across 5+ critical forms
- ✅ Visual feedback with save indicators
- ✅ Browser navigation warnings
- ✅ Automatic draft cleanup (7-day expiration)
- ✅ User privacy (logout clears drafts)
- ✅ Storage monitoring and warnings
- ✅ Reusable hooks and components
- ✅ Consistent UX patterns

**Result:** Users can safely switch between apps, take calls, or recover from browser crashes without losing their work.

## Support & Questions

For questions or issues with form persistence:
1. Check console logs for draft-related messages
2. Review storage usage with browser DevTools
3. Test with the troubleshooting scenarios above
4. Refer to this documentation for implementation patterns

---

**Implementation Date:** January 18, 2026  
**Version:** 1.0  
**Maintained by:** ClinicFlow Development Team
