// APOC Patient Documentation System - Types & Enums
// Date: November 9, 2025
// Description: TypeScript types for APOC structured clinical documentation workflow

export type DocumentationMode = 'legacy' | 'apoc';

export type StrokeClassification = 'ischemic' | 'hemorrhagic' | 'tia' | 'n/a';

export type InvestigationType = 'lab_work' | 'imaging';

export type InvestigationStatus = 'pending' | 'completed' | 'reviewed' | 'cancelled';

export type InvestigationPriority = 'stat' | 'urgent' | 'routine';

// APOC Sections enum
export enum APOCSection {
  CHIEF_COMPLAINT = 'chief_complaint',
  HISTORY_PRESENTING_ILLNESS = 'history_presenting_illness',
  REVIEW_OF_SYSTEMS = 'review_of_systems',
  PAST_MEDICAL_SURGICAL_HISTORY = 'past_medical_surgical_history',
  DEVELOPMENTAL_HISTORY = 'developmental_history',
  GYNE_OBSTETRIC_HISTORY = 'gyne_obstetric_history',
  PERSONAL_FAMILY_SOCIAL_HISTORY = 'personal_family_social_history',
  VITAL_SIGNS = 'vital_signs',
  EXAMINATION = 'examination',
  DIAGNOSIS = 'diagnosis',
  INVESTIGATIONS = 'investigations',
  PLAN = 'plan',
}

// Section metadata for UI rendering
export interface APOCSectionMetadata {
  id: APOCSection;
  title: string;
  shortTitle: string;
  description: string;
  order: number;
  isConditional: boolean;
  conditionalLogic?: (patient: { gender?: string; age?: number }, caseData?: any) => boolean;
  icon?: string;
  subsections?: string[];
}

// Workflow progress tracking
export interface APOCWorkflowProgress {
  [APOCSection.CHIEF_COMPLAINT]?: { completed: boolean; lastSaved: string };
  [APOCSection.HISTORY_PRESENTING_ILLNESS]?: { completed: boolean; lastSaved: string };
  [APOCSection.REVIEW_OF_SYSTEMS]?: { completed: boolean; lastSaved: string };
  [APOCSection.PAST_MEDICAL_SURGICAL_HISTORY]?: { completed: boolean; lastSaved: string };
  [APOCSection.DEVELOPMENTAL_HISTORY]?: { completed: boolean; lastSaved: string };
  [APOCSection.GYNE_OBSTETRIC_HISTORY]?: { completed: boolean; lastSaved: string };
  [APOCSection.PERSONAL_FAMILY_SOCIAL_HISTORY]?: { completed: boolean; lastSaved: string };
  [APOCSection.VITAL_SIGNS]?: { completed: boolean; lastSaved: string };
  [APOCSection.EXAMINATION]?: { completed: boolean; lastSaved: string };
  [APOCSection.DIAGNOSIS]?: { completed: boolean; lastSaved: string };
  [APOCSection.INVESTIGATIONS]?: { completed: boolean; lastSaved: string };
  [APOCSection.PLAN]?: { completed: boolean; lastSaved: string };
  currentSection?: APOCSection;
  overallProgress?: number; // 0-100
}

// APOC Section configurations
export const APOC_SECTIONS: APOCSectionMetadata[] = [
  {
    id: APOCSection.CHIEF_COMPLAINT,
    title: 'Chief Complaint',
    shortTitle: 'CC',
    description: 'Patient\'s main presenting concern',
    order: 1,
    isConditional: false,
    icon: '💬',
  },
  {
    id: APOCSection.HISTORY_PRESENTING_ILLNESS,
    title: 'History of Presenting Illness',
    shortTitle: 'HPI',
    description: 'Detailed account of current illness',
    order: 2,
    isConditional: false,
    icon: '📋',
  },
  {
    id: APOCSection.REVIEW_OF_SYSTEMS,
    title: 'Review of Systems',
    shortTitle: 'ROS',
    description: 'Systematic review of body systems',
    order: 3,
    isConditional: false,
    icon: '🔍',
  },
  {
    id: APOCSection.PAST_MEDICAL_SURGICAL_HISTORY,
    title: 'Past Medical & Surgical History',
    shortTitle: 'PMH',
    description: 'Previous medical conditions and surgeries',
    order: 4,
    isConditional: false,
    icon: '🏥',
  },
  {
    id: APOCSection.DEVELOPMENTAL_HISTORY,
    title: 'Developmental History',
    shortTitle: 'Dev Hx',
    description: 'Developmental milestones (pediatric/stroke patients)',
    order: 5,
    isConditional: true,
    conditionalLogic: (patient, caseData) => {
      // Show for pediatric patients (age < 18) or stroke patients
      if (patient.age !== undefined && patient.age < 18) return true;
      if (caseData?.strokeClassification && caseData.strokeClassification !== 'n/a') return true;
      return false;
    },
    icon: '👶',
  },
  {
    id: APOCSection.GYNE_OBSTETRIC_HISTORY,
    title: 'Gynecological & Obstetric History',
    shortTitle: 'Gyne/Obs',
    description: 'Reproductive and pregnancy history (females only)',
    order: 6,
    isConditional: true,
    conditionalLogic: (patient) => patient.gender === 'Female',
    icon: '🤰',
  },
  {
    id: APOCSection.PERSONAL_FAMILY_SOCIAL_HISTORY,
    title: 'Personal, Family & Social History',
    shortTitle: 'PFSHx',
    description: 'Lifestyle, family history, social determinants',
    order: 7,
    isConditional: false,
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: APOCSection.VITAL_SIGNS,
    title: 'Vital Signs',
    shortTitle: 'Vitals',
    description: 'Blood pressure, pulse, SpO2, temperature',
    order: 8,
    isConditional: false,
    icon: '❤️',
    subsections: ['Blood Pressure', 'Pulse Rate', 'SpO2', 'Temperature'],
  },
  {
    id: APOCSection.EXAMINATION,
    title: 'Physical Examination',
    shortTitle: 'Exam',
    description: 'Systematic physical examination findings',
    order: 9,
    isConditional: false,
    icon: '🩺',
    subsections: [
      'CNS Motor Examination',
      'Cranial Nerves',
      'Cardiovascular',
      'Respiratory',
      'Gastrointestinal',
      'Genitourinary',
    ],
  },
  {
    id: APOCSection.DIAGNOSIS,
    title: 'Diagnosis & Impression',
    shortTitle: 'Dx',
    description: 'Clinical diagnosis and impression',
    order: 10,
    isConditional: false,
    icon: '🎯',
  },
  {
    id: APOCSection.INVESTIGATIONS,
    title: 'Investigations',
    shortTitle: 'Ix',
    description: 'Lab works and imaging studies',
    order: 11,
    isConditional: false,
    icon: '🧪',
    subsections: ['Lab Works', 'Imaging'],
  },
  {
    id: APOCSection.PLAN,
    title: 'Treatment Plan',
    shortTitle: 'Plan',
    description: 'Management plan and follow-up',
    order: 12,
    isConditional: false,
    icon: '📝',
  },
];

// Validation rules for sections
export interface APOCValidationRule {
  sectionId: APOCSection;
  field: string;
  rule: 'required' | 'min_length' | 'max_length' | 'numeric_range' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, context?: any) => boolean;
}

export const APOC_VALIDATION_RULES: APOCValidationRule[] = [
  {
    sectionId: APOCSection.CHIEF_COMPLAINT,
    field: 'chiefComplaint',
    rule: 'required',
    message: 'Chief complaint is required',
  },
  {
    sectionId: APOCSection.CHIEF_COMPLAINT,
    field: 'chiefComplaint',
    rule: 'min_length',
    value: 10,
    message: 'Chief complaint should be at least 10 characters',
  },
  {
    sectionId: APOCSection.VITAL_SIGNS,
    field: 'vitalSignsSpo2',
    rule: 'numeric_range',
    value: { min: 0, max: 100 },
    message: 'SpO2 must be between 0 and 100',
  },
  {
    sectionId: APOCSection.VITAL_SIGNS,
    field: 'vitalSignsPr',
    rule: 'numeric_range',
    value: { min: 30, max: 250 },
    message: 'Pulse rate must be between 30 and 250 bpm',
  },
  {
    sectionId: APOCSection.VITAL_SIGNS,
    field: 'vitalSignsTemp',
    rule: 'numeric_range',
    value: { min: 32.0, max: 45.0 },
    message: 'Temperature must be between 32°C and 45°C',
  },
];

// Auto-save configuration
export const APOC_AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// Investigation categories by type
export const LAB_WORK_CATEGORIES = [
  'Complete Blood Count (CBC)',
  'Basic Metabolic Panel (BMP)',
  'Comprehensive Metabolic Panel (CMP)',
  'Lipid Panel',
  'Liver Function Tests (LFTs)',
  'Thyroid Function Tests',
  'Coagulation Panel (PT/INR, PTT)',
  'Urinalysis',
  'Blood Culture',
  'Cerebrospinal Fluid (CSF) Analysis',
  'Other Lab Work',
];

export const IMAGING_CATEGORIES = [
  'CT Brain (Non-Contrast)',
  'CT Brain (Contrast)',
  'CT Angiography (CTA)',
  'MRI Brain (T1/T2)',
  'MRI Brain (FLAIR)',
  'MRI Angiography (MRA)',
  'MRI Spine (Cervical)',
  'MRI Spine (Thoracic)',
  'MRI Spine (Lumbar)',
  'X-Ray (Skull)',
  'X-Ray (Spine)',
  'Ultrasound (Carotid Doppler)',
  'Ultrasound (Transcranial Doppler)',
  'Angiography (Cerebral)',
  'Other Imaging',
];

// Helper functions
export function getVisibleSections(
  patient: { gender?: string; age?: number },
  caseData?: any
): APOCSectionMetadata[] {
  return APOC_SECTIONS.filter((section) => {
    if (!section.isConditional) return true;
    return section.conditionalLogic ? section.conditionalLogic(patient, caseData) : true;
  });
}

export function calculateProgress(workflowProgress: APOCWorkflowProgress, patient: any, caseData: any): number {
  const visibleSections = getVisibleSections(patient, caseData);
  const completedCount = visibleSections.filter((section) => {
    const progress = workflowProgress[section.id];
    return progress?.completed === true;
  }).length;
  
  return visibleSections.length > 0 ? Math.round((completedCount / visibleSections.length) * 100) : 0;
}

export function getNextIncompleteSection(
  workflowProgress: APOCWorkflowProgress,
  patient: any,
  caseData: any
): APOCSection | null {
  const visibleSections = getVisibleSections(patient, caseData);
  
  for (const section of visibleSections) {
    const progress = workflowProgress[section.id];
    if (!progress || !progress.completed) {
      return section.id;
    }
  }
  
  return null;
}

export function validateSection(
  sectionId: APOCSection,
  data: any
): { isValid: boolean; errors: string[] } {
  const rules = APOC_VALIDATION_RULES.filter((rule) => rule.sectionId === sectionId);
  const errors: string[] = [];
  
  for (const rule of rules) {
    const value = data[rule.field];
    
    switch (rule.rule) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(rule.message);
        }
        break;
        
      case 'min_length':
        if (typeof value === 'string' && value.length < (rule.value || 0)) {
          errors.push(rule.message);
        }
        break;
        
      case 'max_length':
        if (typeof value === 'string' && value.length > (rule.value || 0)) {
          errors.push(rule.message);
        }
        break;
        
      case 'numeric_range':
        if (typeof value === 'number') {
          const { min, max } = rule.value || { min: 0, max: 0 };
          if (value < min || value > max) {
            errors.push(rule.message);
          }
        }
        break;
        
      case 'custom':
        if (rule.validator && !rule.validator(value, data)) {
          errors.push(rule.message);
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
