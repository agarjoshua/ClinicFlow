# APOC Documentation System - UX Restructure
**Date:** November 9, 2025  
**Status:** ✅ Complete

## Overview
Restructured patient detail page to make APOC the primary documentation system, with Clinical Cases as a separate quick-entry option.

## Key Changes

### 1. **APOC Documentation - Primary Section** (Independent)
Located at the top of the patient detail page with prominent styling:

**Visual Design:**
- Indigo/purple gradient header
- White text with shadow
- Large "New APOC Documentation" button
- Border highlight (2px indigo-200)

**Features:**
- Lists all APOC-mode cases separately
- Shows chief complaint and diagnosis preview
- "Continue Documentation" button to resume
- Empty state with clear call-to-action

**User Flow:**
1. Click "New APOC Documentation"
2. Dialog opens (already in APOC mode)
3. Click "Create Case"
4. Wizard automatically opens
5. Complete 12-section workflow

---

### 2. **Quick Entry Clinical Cases** (Separate Section)
Located below APOC section with lighter styling:

**Visual Design:**
- Gray/slate gradient header
- Outline button style
- Standard card border

**Features:**
- Lists only legacy/quick-entry cases
- Full media gallery per case
- Traditional symptoms/exam/diagnosis fields
- "Quick Entry Case" button

**User Flow:**
1. Click "Quick Entry Case"
2. Dialog opens (already in legacy mode)
3. Fill all fields in one form
4. Add media inline
5. Create case - done!

---

## Documentation Modes

### APOC Mode
- **Purpose:** Comprehensive, structured clinical documentation
- **Sections:** 12 sequential sections
- **Features:** Auto-save, conditional sections, progress tracking
- **Best For:** Complex cases, thorough assessments, teaching cases

### Legacy Mode  
- **Purpose:** Fast, simple documentation
- **Sections:** Single form with all fields
- **Features:** Quick entry, inline media upload
- **Best For:** Simple follow-ups, quick notes, routine cases

---

## Technical Implementation

### State Management
```typescript
const [documentationMode, setDocumentationMode] = useState<'legacy' | 'apoc'>('legacy');
const [selectedCaseForAPOC, setSelectedCaseForAPOC] = useState<any>(null);
const [apocWizardOpen, setApocWizardOpen] = useState(false);
```

### Button Click Handlers
```typescript
// APOC button - sets mode before opening dialog
onClick={() => {
  setDocumentationMode('apoc');
  setCreateCaseDialogOpen(true);
}}

// Quick Entry button - sets mode before opening dialog  
onClick={() => {
  setDocumentationMode('legacy');
  setCreateCaseDialogOpen(true);
}}
```

### Case Filtering
```typescript
// APOC section - only APOC cases
clinicalCases.filter(c => c.documentation_mode === 'apoc')

// Legacy section - only non-APOC cases
clinicalCases.filter(c => c.documentation_mode !== 'apoc')
```

### Create Mutation Logic
```typescript
if (documentationMode === 'apoc') {
  // Create minimal case
  // Close dialog
  // Open wizard automatically
} else {
  // Create full case with all data
  // Upload media
  // Show success toast
}
```

---

## User Benefits

### Clear Separation
- ✅ Users know which button to click based on their needs
- ✅ No mode confusion - set at button click, not in dialog
- ✅ Visual distinction between comprehensive vs quick documentation

### Improved Workflow
- ✅ APOC prominently positioned as the primary system
- ✅ Legacy cases still accessible for quick entries
- ✅ No need to choose mode in dialog - already set
- ✅ Automatic wizard launch for APOC cases

### Better Organization
- ✅ APOC cases grouped together at top
- ✅ Quick entries grouped separately below
- ✅ Each section shows relevant case count
- ✅ Empty states guide users to appropriate action

---

## Migration Notes

### Database Schema
Both modes use the same `clinical_cases` table with:
- `documentation_mode` field ('apoc' | 'legacy')
- APOC-specific fields (nullable for legacy cases)
- Shared fields (diagnosis_notes, case_date, status, etc.)

### Backward Compatibility
- ✅ All existing cases treated as legacy mode
- ✅ No data migration required
- ✅ Users can continue using quick entry
- ✅ APOC opt-in, not forced

### Future Enhancements
- [ ] Convert legacy case to APOC
- [ ] APOC case templates
- [ ] Export APOC documentation
- [ ] APOC analytics/reports

---

## File Changes
- `/client/src/pages/patient-detail.tsx` - Restructured sections, removed mode selector from dialog, updated button handlers

## Next Steps
1. Execute database migrations (001, 002)
2. Test both workflows end-to-end
3. Gather user feedback on UX
4. Consider adding APOC templates
