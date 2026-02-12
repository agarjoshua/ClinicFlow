import { useEffect } from 'react';
import { useLocation } from 'wouter';

console.log('🔴🔴🔴 useFormNavigationGuard.ts MODULE LOADED - CODE IS UPDATED 🔴🔴🔴');

export function useFormNavigationGuard(hasUnsavedChanges: boolean, message?: string) {
  const defaultMessage = 'You have unsaved changes. Are you sure you want to leave?';
  const confirmMessage = message || defaultMessage;

  // TEMPORARILY DISABLED - Testing if this is causing reloads
  // Prevent browser/tab close when there are unsaved changes
  useEffect(() => {
    console.log('[Navigation Guard] DISABLED - Not registering beforeunload');
    return; // Early return - completely disabled
    
    // if (!hasUnsavedChanges) {
    //   console.log('[Navigation Guard] No unsaved changes - NOT registering beforeunload');
    //   return;
    // }

    // console.log('[Navigation Guard] Unsaved changes detected - registering beforeunload');
    // const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    //   e.preventDefault();
    //   // Modern browsers ignore custom messages and show their own
    //   e.returnValue = '';
    // };

    // window.addEventListener('beforeunload', handleBeforeUnload);
    // return () => {
    //   console.log('[Navigation Guard] Cleanup - removing beforeunload listener');
    //   window.removeEventListener('beforeunload', handleBeforeUnload);
    // };
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
