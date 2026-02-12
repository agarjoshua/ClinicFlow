import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

console.log('🟢🟢🟢 useFormPersistence.ts MODULE LOADED - CODE IS UPDATED 🟢🟢🟢');

interface UseFormPersistenceOptions<T> {
  storageKey: string;
  formState: T;
  enabled?: boolean;
  debounceMs?: number;
  expirationDays?: number;
  onRestore?: (data: T) => void;
  excludeFields?: (keyof T)[];
}

interface DraftMetadata {
  savedAt: string;
  version: string;
  formType: string;
}

interface StoredDraft<T> {
  formData: T;
  metadata: DraftMetadata;
}

export function useFormPersistence<T extends Record<string, any>>({
  storageKey,
  formState,
  enabled = true,
  debounceMs = 1000,
  expirationDays = 7,
  onRestore,
  excludeFields = [],
}: UseFormPersistenceOptions<T>) {
  const { toast } = useToast();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasRestoredRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();
  const initialFormStateRef = useRef<T | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Filter out excluded fields
  const getFilteredFormState = (state: T): Partial<T> => {
    const filtered = { ...state };
    excludeFields.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  };

  // Check if form has any data
  const hasFormData = (state: T): boolean => {
    return Object.entries(state).some(([key, value]) => {
      if (excludeFields.includes(key as keyof T)) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return value !== 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      return value !== null && value !== undefined;
    });
  };

  // Load draft on mount
  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (!savedDraft) {
        hasRestoredRef.current = true;
        // Capture initial state when there's no draft
        initialFormStateRef.current = JSON.parse(JSON.stringify(formState));
        return;
      }

      const draft: StoredDraft<T> = JSON.parse(savedDraft);
      
      // Check expiration
      const savedDate = new Date(draft.metadata.savedAt);
      const daysSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSave > expirationDays) {
        localStorage.removeItem(storageKey);
        hasRestoredRef.current = true;
        // Capture initial state when draft is expired
        initialFormStateRef.current = JSON.parse(JSON.stringify(formState));
        return;
      }

      // Restore form data
      if (onRestore) {
        onRestore(draft.formData);
        setLastSavedAt(savedDate);
        setIsFormDirty(true); // Restored draft means the form has unsaved changes
        toast({
          title: 'Draft Restored',
          description: `Your previous work from ${savedDate.toLocaleString()} has been restored.`,
        });
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
      localStorage.removeItem(storageKey);
      // Capture initial state on error
      initialFormStateRef.current = JSON.parse(JSON.stringify(formState));
    } finally {
      hasRestoredRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, enabled]);

  // Auto-save form state
  useEffect(() => {
    console.log('[Form Persistence] Effect disabled for testing');
    return; // TEMPORARILY DISABLED
    
    // if (!enabled || !hasRestoredRef.current) return;

    // // Capture initial state once form is ready
    // if (initialFormStateRef.current === null) {
    //   initialFormStateRef.current = JSON.parse(JSON.stringify(formState));
    //   return;
    // }

    // // Check if form has been modified from initial state
    // const formHasChanged = JSON.stringify(getFilteredFormState(formState)) !== 
    //                        JSON.stringify(getFilteredFormState(initialFormStateRef.current));
    
    // if (formHasChanged !== isFormDirty) {
    //   console.log(`[Form Persistence] Dirty state changed: ${formHasChanged}`, {
    //     storageKey,
    //     formHasChanged,
    //     hasData: hasFormData(formState)
    //   });
    // }
    // setIsFormDirty(formHasChanged);

    // // Only save if there's actual data and form is dirty
    // if (!hasFormData(formState) || !formHasChanged) {
    //   return;
    // }

    // // Clear existing timer
    // if (saveTimerRef.current) {
    //   clearTimeout(saveTimerRef.current);
    // }

    // setIsSaving(true);

    // saveTimerRef.current = setTimeout(() => {
    //   try {
    //     const draft: StoredDraft<T> = {
    //       formData: getFilteredFormState(formState) as T,
    //       metadata: {
    //         savedAt: new Date().toISOString(),
    //         version: '1.0',
    //         formType: storageKey.split('-')[1] || 'unknown',
    //       },
    //     };

    //     localStorage.setItem(storageKey, JSON.stringify(draft));
    //     setLastSavedAt(new Date());
    //     setIsSaving(false);
    //   } catch (error) {
    //     console.error('Failed to save draft:', error);
    //     setIsSaving(false);
        
    //     // Check if quota exceeded
    //     if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    //       toast({
    //         title: 'Storage Full',
    //         description: 'Unable to save draft. Please submit the form or clear old drafts.',
    //         variant: 'destructive',
    //       });
    //     }
    //   }
    // }, debounceMs);

    // return () => {
    //   if (saveTimerRef.current) {
    //     clearTimeout(saveTimerRef.current);
    //   }
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState, enabled]);

  // Clear draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      setLastSavedAt(null);
      setIsFormDirty(false);
      // Reset initial state to current (clean) state
      initialFormStateRef.current = JSON.parse(JSON.stringify(formState));
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  // Manual save
  const saveDraft = () => {
    if (!enabled || !hasFormData(formState)) return;

    try {
      const draft: StoredDraft<T> = {
        formData: getFilteredFormState(formState) as T,
        metadata: {
          savedAt: new Date().toISOString(),
          version: '1.0',
          formType: storageKey.split('-')[1] || 'unknown',
        },
      };

      localStorage.setItem(storageKey, JSON.stringify(draft));
      setLastSavedAt(new Date());
      
      toast({
        title: 'Draft Saved',
        description: 'Your work has been saved locally.',
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Save Failed',
        description: 'Unable to save your work. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    lastSavedAt,
    isSaving,
    clearDraft,
    saveDraft,
    hasUnsavedChanges: isFormDirty,
    _debug: { isFormDirty, initialState: initialFormStateRef.current, currentState: formState }, // Debug info
  };
}
