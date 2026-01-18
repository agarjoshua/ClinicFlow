import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveIndicatorProps {
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  className?: string;
}

export function SaveIndicator({ isSaving, lastSavedAt, className }: SaveIndicatorProps) {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span>Saved {getTimeAgo(lastSavedAt)}</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Clock className="h-4 w-4" />
      <span>Not saved</span>
    </div>
  );
}
