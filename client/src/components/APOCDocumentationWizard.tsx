// APOC Documentation Wizard - Main Component
// Sequential workflow for structured clinical documentation

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { 
  APOCSection, 
  APOCWorkflowProgress, 
  APOC_SECTIONS, 
  getVisibleSections,
  calculateProgress,
  getNextIncompleteSection,
  APOC_AUTO_SAVE_INTERVAL
} from '@/../../shared/apoc-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  Save,
  FileText,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';

import ChiefComplaintSection from './apoc-sections/ChiefComplaintSection';
import HistoryPresentingIllnessSection from './apoc-sections/HistoryPresentingIllnessSection';
import ReviewOfSystemsSection from './apoc-sections/ReviewOfSystemsSection';
import PastMedicalSurgicalHistorySection from './apoc-sections/PastMedicalSurgicalHistorySection';
import DevelopmentalHistorySection from './apoc-sections/DevelopmentalHistorySection';
import GyneObstetricHistorySection from './apoc-sections/GyneObstetricHistorySection';
import PersonalFamilySocialHistorySection from './apoc-sections/PersonalFamilySocialHistorySection';
import VitalSignsSection from './apoc-sections/VitalSignsSection';
import ExaminationSection from './apoc-sections/ExaminationSection';
import DiagnosisSection from './apoc-sections/DiagnosisSection';
import InvestigationsSection from './apoc-sections/InvestigationsSection';
import PlanSection from './apoc-sections/PlanSection';

interface APOCDocumentationWizardProps {
  clinicalCaseId: string;
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
    gender?: string;
    age?: number;
  };
  onComplete?: () => void;
  onCancel?: () => void;
}

// Helper function to convert snake_case to camelCase
const snakeToCamel = (str: string): string => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// Helper function to convert object keys from snake_case to camelCase (recursively)
const convertKeysToCamelCase = (input: any): any => {
  if (Array.isArray(input)) {
    return input.map(convertKeysToCamelCase);
  }

  if (input && typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[snakeToCamel(key)] = convertKeysToCamelCase(value);
      return acc;
    }, {} as Record<string, any>);
  }

  return input;
};

const APOC_FIELD_MAP: Record<string, string> = {
  chiefComplaint: 'chief_complaint',
  historyPresentingIllness: 'history_presenting_illness',
  reviewOfSystems: 'review_of_systems',
  pastMedicalSurgicalHistory: 'past_medical_surgical_history',
  developmentalHistory: 'developmental_history',
  gyneObstetricHistory: 'gyne_obstetric_history',
  personalFamilySocialHistory: 'personal_family_social_history',
  vitalSignsBp: 'vital_signs_bp',
  vitalSignsPr: 'vital_signs_pr',
  vitalSignsSpo2: 'vital_signs_spo2',
  vitalSignsTemp: 'vital_signs_temp',
  cnsMotorExam: 'cns_motor_exam',
  cranialNervesExam: 'cranial_nerves_exam',
  cardiovascularExam: 'cardiovascular_exam',
  respiratoryExam: 'respiratory_exam',
  genitourinaryExam: 'genitourinary_exam',
  gastrointestinalExam: 'gastrointestinal_exam',
  diagnosisImpression: 'diagnosis_impression',
  strokeClassification: 'stroke_classification',
  treatmentPlan: 'treatment_plan',
  isComplete: 'is_complete',
};

const normalizeValue = (value: any) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  return value;
};

const parseWorkflowProgress = (value: any): APOCWorkflowProgress => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to parse workflow progress:', error);
      return {};
    }
  }
  return value;
};

export default function APOCDocumentationWizard({
  clinicalCaseId,
  patient,
  onComplete,
  onCancel,
}: APOCDocumentationWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentSectionId, setCurrentSectionId] = useState<APOCSection>(APOCSection.CHIEF_COMPLAINT);
  const [formData, setFormData] = useState<any>({});
  const [workflowProgress, setWorkflowProgress] = useState<APOCWorkflowProgress>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastLoadedCaseId, setLastLoadedCaseId] = useState<string | null>(null);
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

  // Initialize form data from existing case
  useEffect(() => {
    if (clinicalCase && clinicalCase.id !== lastLoadedCaseId) {
      const camelCaseCase = convertKeysToCamelCase(clinicalCase);

      const progress = parseWorkflowProgress(camelCaseCase.workflowProgress);
      const normalizedData: Record<string, any> = { ...camelCaseCase };

      delete normalizedData.workflowProgress;

      Object.keys(APOC_FIELD_MAP).forEach((camelKey) => {
        const value = normalizedData[camelKey];
        if (camelKey === 'isComplete') {
          normalizedData[camelKey] = value ?? false;
        } else if (value === undefined || value === null) {
          normalizedData[camelKey] = '';
        }
      });

      normalizedData.documentationMode = 'apoc';

      setFormData(normalizedData);
      setWorkflowProgress(progress);
      setLastLoadedCaseId(clinicalCase.id);
      setHasUnsavedChanges(false);

      if (progress.currentSection) {
        setCurrentSectionId(progress.currentSection as APOCSection);
      } else {
        const nextSection = getNextIncompleteSection(progress, patient, normalizedData);
        if (nextSection) setCurrentSectionId(nextSection);
      }
    }
  }, [clinicalCase, patient, lastLoadedCaseId]);

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const apocFields = Object.entries(APOC_FIELD_MAP).reduce<Record<string, any>>((acc, [camelKey, snakeKey]) => {
        acc[snakeKey] = normalizeValue(data[camelKey]);
        return acc;
      }, {});

      const progressPayload = data.workflowProgress ?? workflowProgress;
      const workflowProgressString = typeof progressPayload === 'string'
        ? progressPayload
        : JSON.stringify(progressPayload || {});

      apocFields.documentation_mode = 'apoc';
      apocFields.workflow_progress = workflowProgressString;

      const { error } = await supabase
        .from('clinical_cases')
        .update(apocFields)
        .eq('id', clinicalCaseId);
      
      if (error) {
        console.error('❌ Save error:', error);
        throw error;
      }
      return { success: true };
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      // Don't invalidate queries - this causes the form to reload and lose data
      // queryClient.invalidateQueries({ queryKey: ['patient-clinical-cases'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Auto-save failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete APOC case mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First delete all related investigations
      await supabase
        .from('clinical_investigations')
        .delete()
        .eq('clinical_case_id', clinicalCaseId);
      
      // Then delete the clinical case
      const { error } = await supabase
        .from('clinical_cases')
        .delete()
        .eq('id', clinicalCaseId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-clinical-cases'] });
      toast({
        title: 'APOC documentation deleted',
        description: 'The clinical case has been permanently removed.',
      });
      onCancel?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteCase = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveMutation.mutate(formData);
    }, APOC_AUTO_SAVE_INTERVAL);

    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges]);

  // Manual save handler
  const handleManualSave = useCallback(() => {
    saveMutation.mutate(formData);
  }, [formData, saveMutation]);

  // Form data update handler
  const updateFormData = useCallback((updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Mark section as complete
  const markSectionComplete = useCallback((sectionId: APOCSection, completed: boolean) => {
    setWorkflowProgress((prev) => ({
      ...prev,
      [sectionId]: {
        completed,
        lastSaved: new Date().toISOString(),
      },
      currentSection: currentSectionId,
    }));
    setHasUnsavedChanges(true);
  }, [currentSectionId]);

  // Get visible sections based on patient data
  const visibleSections = getVisibleSections(patient, formData);
  const currentSectionIndex = visibleSections.findIndex((s) => s.id === currentSectionId);
  const currentSection = visibleSections[currentSectionIndex];
  const progress = calculateProgress(workflowProgress, patient, formData);

  // Navigation handlers
  const goToNextSection = () => {
    if (currentSectionIndex < visibleSections.length - 1) {
      setCurrentSectionId(visibleSections[currentSectionIndex + 1].id);
      handleManualSave();
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionId(visibleSections[currentSectionIndex - 1].id);
      handleManualSave();
    }
  };

  const goToSection = (sectionId: APOCSection) => {
    setCurrentSectionId(sectionId);
    handleManualSave();
  };

  // Complete documentation
  const handleCompleteDocumentation = async () => {
    const completedProgress = {
      ...workflowProgress,
      overallProgress: 100,
    };

    setWorkflowProgress(completedProgress);

    const updatedFormData = { ...formData, isComplete: true };
    setFormData(updatedFormData);

    await saveMutation.mutateAsync({
      ...updatedFormData,
      workflowProgress: completedProgress,
    });
    
    toast({
      title: 'Documentation completed',
      description: 'Clinical case documentation has been finalized.',
    });
    
    onComplete?.();
  };

  // Render current section component
  const renderCurrentSection = () => {
    const commonProps = {
      data: formData,
      onUpdate: updateFormData,
      onMarkComplete: (completed: boolean) => markSectionComplete(currentSectionId, completed),
      isCompleted: workflowProgress[currentSectionId]?.completed || false,
    };

    switch (currentSectionId) {
      case APOCSection.CHIEF_COMPLAINT:
        return <ChiefComplaintSection {...commonProps} />;
      case APOCSection.HISTORY_PRESENTING_ILLNESS:
        return <HistoryPresentingIllnessSection {...commonProps} />;
      case APOCSection.REVIEW_OF_SYSTEMS:
        return <ReviewOfSystemsSection {...commonProps} />;
      case APOCSection.PAST_MEDICAL_SURGICAL_HISTORY:
        return <PastMedicalSurgicalHistorySection {...commonProps} />;
      case APOCSection.DEVELOPMENTAL_HISTORY:
        return <DevelopmentalHistorySection {...commonProps} />;
      case APOCSection.GYNE_OBSTETRIC_HISTORY:
        return <GyneObstetricHistorySection {...commonProps} />;
      case APOCSection.PERSONAL_FAMILY_SOCIAL_HISTORY:
        return <PersonalFamilySocialHistorySection {...commonProps} />;
      case APOCSection.VITAL_SIGNS:
        return <VitalSignsSection {...commonProps} patient={patient} />;
      case APOCSection.EXAMINATION:
        return <ExaminationSection {...commonProps} />;
      case APOCSection.DIAGNOSIS:
        return <DiagnosisSection {...commonProps} />;
      case APOCSection.INVESTIGATIONS:
        return <InvestigationsSection {...commonProps} clinicalCaseId={clinicalCaseId} />;
      case APOCSection.PLAN:
        return <PlanSection {...commonProps} />;
      default:
        return <div>Section not implemented</div>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
        {/* Sidebar - Section Navigation (Hidden on mobile, drawer on tablet) */}
        <div className="hidden lg:flex lg:w-72 border-r bg-muted/30 flex-col">
          <div className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0">
              <h3 className="font-semibold text-sm mb-2">Documentation Progress</h3>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
            </div>

            <Separator className="my-4 flex-shrink-0" />

            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-1 pr-3">
                {visibleSections.map((section) => {
                  const isActive = section.id === currentSectionId;
                  const isCompleted = workflowProgress[section.id]?.completed;

                  return (
                    <button
                      key={section.id}
                      onClick={() => goToSection(section.id)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors
                        ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base">{section.icon}</span>
                          <span className="font-medium truncate">{section.shortTitle}</span>
                        </div>
                        {isCompleted && <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />}
                      </div>
                      <p className="text-xs opacity-80 mt-1 line-clamp-2 pl-6">{section.description}</p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="border-b bg-background flex-shrink-0">
            <div className="p-4 lg:p-6 min-h-[88px] lg:min-h-[104px] flex items-center">
              <div className="flex items-start justify-between gap-4 w-full">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2 mb-1">
                    <span className="text-2xl">{currentSection?.icon}</span>
                    <span className="truncate">{currentSection?.title}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {patient.firstName} {patient.lastName} • Section {currentSectionIndex + 1} of {visibleSections.length}
                  </p>
                  {/* Mobile progress bar */}
                  <div className="lg:hidden mt-3">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {lastSavedAt && (
                    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="hidden xl:inline">Saved</span> {lastSavedAt.toLocaleTimeString()}
                    </div>
                  )}
                  
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="gap-1 hidden md:flex">
                      <AlertCircle className="h-3 w-3" />
                      <span className="hidden lg:inline">Unsaved</span>
                    </Badge>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleManualSave}
                    disabled={saveMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save Now</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 lg:p-6 pb-8 lg:pb-12 max-w-5xl mx-auto w-full">
              {renderCurrentSection()}
            </div>
          </ScrollArea>

          {/* Footer - Navigation */}
          <div className="border-t bg-background flex-shrink-0">
            <div className="p-4 lg:p-6 min-h-[88px] lg:min-h-[104px] flex items-center">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={goToPreviousSection}
                    disabled={currentSectionIndex === 0}
                    className="flex-1 sm:flex-none"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={onCancel}
                    className="flex-1 sm:flex-none"
                  >
                    Save & Exit
                  </Button>

                  {currentSectionIndex === visibleSections.length - 1 ? (
                    <Button 
                      onClick={handleCompleteDocumentation}
                      className="flex-1 sm:flex-none"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  ) : (
                    <Button 
                      onClick={goToNextSection}
                      className="flex-1 sm:flex-none"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete APOC Documentation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this clinical case and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All 12 sections of documentation</li>
                <li>Lab work and imaging investigations</li>
                <li>Workflow progress</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
