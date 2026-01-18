import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
        return;
      }

      const draft: StoredDraft<T> = JSON.parse(savedDraft);
      
      // Check expiration
      const savedDate = new Date(draft.metadata.savedAt);
      const daysSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSave > expirationDays) {
        localStorage.removeItem(storageKey);
        hasRestoredRef.current = true;
        return;
      }

      // Restore form data
      if (onRestore) {
        onRestore(draft.formData);
        setLastSavedAt(savedDate);
        toast({
          title: 'Draft Restored',
          description: `Your previous work from ${savedDate.toLocaleString()} has been restored.`,
        });
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
      localStorage.removeItem(storageKey);
    } finally {
      hasRestoredRef.current = true;
    }
  }, [storageKey, enabled, expirationDays, onRestore, toast]);

  // Auto-save form state
  useEffect(() => {
    if (!enabled || !hasRestoredRef.current) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Only save if there's actual data
    if (!hasFormData(formState)) {
      return;
    }

    setIsSaving(true);

    saveTimerRef.current = setTimeout(() => {
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
        setIsSaving(false);
      } catch (error) {
        console.error('Failed to save draft:', error);
        setIsSaving(false);
        
        // Check if quota exceeded
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          toast({
            title: 'Storage Full',
            description: 'Unable to save draft. Please submit the form or clear old drafts.',
            variant: 'destructive',
          });
        }
      }
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [formState, storageKey, enabled, debounceMs, toast]);

  // Clear draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      setLastSavedAt(null);
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
    hasUnsavedChanges: hasFormData(formState),
  };
}
