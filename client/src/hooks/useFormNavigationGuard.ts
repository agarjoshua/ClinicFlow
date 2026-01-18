import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useFormNavigationGuard(hasUnsavedChanges: boolean, message?: string) {
  const defaultMessage = 'You have unsaved changes. Are you sure you want to leave?';
  const confirmMessage = message || defaultMessage;

  // Prevent browser/tab close when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show their own
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Create a navigation interceptor for use with Wouter
  const createNavigationInterceptor = () => {
    return (path: string, setLocation: (path: string) => void) => {
      if (hasUnsavedChanges) {
        if (window.confirm(confirmMessage)) {
          setLocation(path);
        }
        return false;
      }
      setLocation(path);
      return true;
    };
  };

  return {
    confirmNavigation: (callback: () => void) => {
      if (hasUnsavedChanges) {
        if (window.confirm(confirmMessage)) {
          callback();
        }
        return false;
      }
      callback();
      return true;
    },
    createNavigationInterceptor,
  };
}
