import { useToast } from '@/hooks/use-toast';

interface DraftMetadata {
  savedAt: string;
  version: string;
  formType: string;
}

interface StoredDraft<T> {
  formData: T;
  metadata: DraftMetadata;
}

export class DraftCleanupService {
  private static readonly DRAFT_PREFIX = 'draft-';
  private static readonly DEFAULT_EXPIRATION_DAYS = 7;
  private static readonly STORAGE_WARNING_THRESHOLD_KB = 4000; // 4MB

  /**
   * Clean up expired drafts from localStorage
   */
  static cleanupExpiredDrafts(expirationDays: number = this.DEFAULT_EXPIRATION_DAYS): number {
    let cleanedCount = 0;
    const now = Date.now();
    const draftKeys = this.getAllDraftKeys();

    draftKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        const draft: StoredDraft<any> = JSON.parse(item);
        const savedAt = new Date(draft.metadata.savedAt).getTime();
        const ageInDays = (now - savedAt) / (1000 * 60 * 60 * 24);

        if (ageInDays > expirationDays) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (error) {
        // Invalid draft, remove it
        console.warn(`Removing corrupted draft: ${key}`, error);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Get all draft keys from localStorage
   */
  static getAllDraftKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.DRAFT_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Get all drafts with metadata
   */
  static getAllDrafts(): Array<{ key: string; draft: StoredDraft<any> }> {
    const drafts: Array<{ key: string; draft: StoredDraft<any> }> = [];
    const draftKeys = this.getAllDraftKeys();

    draftKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const draft: StoredDraft<any> = JSON.parse(item);
          drafts.push({ key, draft });
        }
      } catch (error) {
        console.warn(`Failed to parse draft: ${key}`, error);
      }
    });

    // Sort by saved date (newest first)
    return drafts.sort((a, b) => {
      const dateA = new Date(a.draft.metadata.savedAt).getTime();
      const dateB = new Date(b.draft.metadata.savedAt).getTime();
      return dateB - dateA;
    });
  }

  /**
   * Get total storage size used by drafts
   */
  static getDraftStorageSize(): { totalKB: number; draftCount: number } {
    let totalBytes = 0;
    const draftKeys = this.getAllDraftKeys();

    draftKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalBytes += key.length + item.length;
      }
    });

    return {
      totalKB: Math.round(totalBytes / 1024),
      draftCount: draftKeys.length,
    };
  }

  /**
   * Check if storage is approaching limit
   */
  static isStorageNearLimit(): boolean {
    const { totalKB } = this.getDraftStorageSize();
    return totalKB >= this.STORAGE_WARNING_THRESHOLD_KB;
  }

  /**
   * Clear all drafts for a specific user
   */
  static clearUserDrafts(userId: string): number {
    let clearedCount = 0;
    const draftKeys = this.getAllDraftKeys();

    draftKeys.forEach(key => {
      if (key.includes(userId)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    return clearedCount;
  }

  /**
   * Clear all drafts (use with caution)
   */
  static clearAllDrafts(): number {
    const draftKeys = this.getAllDraftKeys();
    draftKeys.forEach(key => localStorage.removeItem(key));
    return draftKeys.length;
  }

  /**
   * Initialize automatic cleanup on app startup
   */
  static initializeAutoCleanup(expirationDays?: number) {
    // Run cleanup immediately
    const cleaned = this.cleanupExpiredDrafts(expirationDays);
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired draft(s)`);
    }

    // Check storage size
    const { totalKB, draftCount } = this.getDraftStorageSize();
    console.log(`Draft storage: ${totalKB}KB across ${draftCount} draft(s)`);

    return { cleaned, totalKB, draftCount };
  }
}

/**
 * Hook for draft management with UI feedback
 */
export function useDraftCleanup() {
  const { toast } = useToast();

  const cleanupExpired = (expirationDays?: number) => {
    const cleaned = DraftCleanupService.cleanupExpiredDrafts(expirationDays);
    
    if (cleaned > 0) {
      toast({
        title: 'Drafts Cleaned',
        description: `Removed ${cleaned} expired draft(s).`,
      });
    }

    return cleaned;
  };

  const checkStorageWarning = () => {
    if (DraftCleanupService.isStorageNearLimit()) {
      const { totalKB } = DraftCleanupService.getDraftStorageSize();
      
      toast({
        title: 'Storage Warning',
        description: `Draft storage is using ${totalKB}KB. Consider submitting or clearing old drafts.`,
        variant: 'destructive',
      });
    }
  };

  const clearAllDrafts = () => {
    const cleared = DraftCleanupService.clearAllDrafts();
    
    toast({
      title: 'All Drafts Cleared',
      description: `Removed ${cleared} draft(s).`,
    });

    return cleared;
  };

  return {
    cleanupExpired,
    checkStorageWarning,
    clearAllDrafts,
    getAllDrafts: DraftCleanupService.getAllDrafts,
    getDraftStorageSize: DraftCleanupService.getDraftStorageSize,
  };
}
