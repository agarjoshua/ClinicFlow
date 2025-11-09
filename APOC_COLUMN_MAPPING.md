# APOC Column Name Mapping - Actual vs Expected

## ✅ COLUMNS THAT EXIST (Correct Names)

| Expected Column | Actual Column | Status |
|----------------|---------------|---------|
| `chief_complaint` | `chief_complaint` | ✅ EXISTS |
| `history_presenting_illness` | `history_presenting_illness` | ✅ EXISTS |
| `review_of_systems` | `review_of_systems` | ✅ EXISTS |
| `developmental_history` | `developmental_history` | ✅ EXISTS |
| `gyne_obstetric_history` | `gyne_obstetric_history` | ✅ EXISTS |
| `vital_signs_bp` | `vital_signs_bp` | ✅ EXISTS |
| `vital_signs_spo2` | `vital_signs_spo2` | ✅ EXISTS |
| `vital_signs_temp` | `vital_signs_temp` | ✅ EXISTS |
| `documentation_mode` | `documentation_mode` | ✅ EXISTS |
| `workflow_progress` | `workflow_progress` | ✅ EXISTS |

## ⚠️ COLUMNS WITH DIFFERENT NAMES

| Expected Column | Actual Column | Notes |
|----------------|---------------|-------|
| `past_medical_history` | `past_medical_surgical_history` | Combined into one column |
| `past_surgical_history` | `past_medical_surgical_history` | Combined into one column |
| `personal_history` | `personal_family_social_history` | Combined into one column |
| `family_history` | `personal_family_social_history` | Combined into one column |
| `social_history` | `personal_family_social_history` | Combined into one column |
| `vital_signs_hr` | `vital_signs_pr` | PR (Pulse Rate) instead of HR |
| `general_examination` | *(multiple columns)* | Split into specific exams |
| `systemic_examination` | *(multiple columns)* | Split into specific exams |
| `neurological_examination` | `cns_motor_exam` + `cranial_nerves_exam` | Split into CNS and cranial nerves |
| `diagnosis_summary` | `diagnosis_impression` | Different name |
| `differential_diagnosis` | ❌ MISSING | Need to add |
| `management_plan` | ❌ MISSING | Need to add |

## 🆕 EXAMINATION COLUMNS (Instead of general/systemic)

| Actual Column | Purpose |
|--------------|---------|
| `cns_motor_exam` | Central nervous system motor examination |
| `cranial_nerves_exam` | Cranial nerves examination |
| `cardiovascular_exam` | Cardiovascular system examination |
| `respiratory_exam` | Respiratory system examination |
| `genitourinary_exam` | Genitourinary system examination |
| `gastrointestinal_exam` | Gastrointestinal system examination |

## 🔧 CODE CHANGES NEEDED

### 1. Update Schema Types (`shared/schema.ts`)
```typescript
// Change these field names:
past_medical_surgical_history: text;  // instead of separate past_medical_history and past_surgical_history
personal_family_social_history: text; // instead of separate personal/family/social
vital_signs_pr: text;                 // instead of vital_signs_hr
diagnosis_impression: text;           // instead of diagnosis_summary

// Add specific examination fields:
cns_motor_exam: text;
cranial_nerves_exam: text;
cardiovascular_exam: text;
respiratory_exam: text;
genitourinary_exam: text;
gastrointestinal_exam: text;
```

### 2. Update APOC Section Components

**PastMedicalSurgicalHistorySection.tsx:**
- Use single field: `past_medical_surgical_history`
- Split UI into two text areas but save to one field

**PersonalFamilySocialHistorySection.tsx:**
- Use single field: `personal_family_social_history`
- Split UI into three sections but save to one field

**VitalSignsSection.tsx:**
- Change `vital_signs_hr` → `vital_signs_pr`

**ExaminationSection.tsx:**
- Use multiple specific fields instead of `general_examination` and `systemic_examination`:
  - `cns_motor_exam`
  - `cranial_nerves_exam`
  - `cardiovascular_exam`
  - `respiratory_exam`
  - `genitourinary_exam`
  - `gastrointestinal_exam`

**DiagnosisSection.tsx:**
- Change `diagnosis_summary` → `diagnosis_impression`
- Add field: `differential_diagnosis` (currently missing - needs migration)

**PlanSection.tsx:**
- Add field: `management_plan` (currently missing - needs migration)

## 📋 MISSING COLUMNS (Need Migration)

Run this SQL to add missing columns:

```sql
ALTER TABLE clinical_cases
ADD COLUMN IF NOT EXISTS differential_diagnosis TEXT,
ADD COLUMN IF NOT EXISTS management_plan TEXT;
```

## ✅ COLUMNS THAT ALREADY EXIST (No Changes Needed)

- `chief_complaint` ✅
- `history_presenting_illness` ✅
- `review_of_systems` ✅
- `developmental_history` ✅
- `gyne_obstetric_history` ✅
- `vital_signs_bp` ✅
- `vital_signs_pr` ✅ (was expecting hr)
- `vital_signs_spo2` ✅
- `vital_signs_temp` ✅
- `documentation_mode` ✅
- `workflow_progress` ✅
- All examination columns ✅

## 🎯 SUMMARY

**Good News:** Most APOC columns exist, just with slightly different names!

**Actions Required:**
1. ✅ Update TypeScript types to match actual database columns
2. ✅ Update section components to use correct field names
3. ⚠️ Add 2 missing columns: `differential_diagnosis`, `management_plan`
4. ✅ Adjust UI components to work with combined fields
