# Page Reload Fix - Form Navigation Issue

## Problem
Pages with forms were reloading every time users navigated back to them (e.g., opening a new tab and coming back). This was causing a poor user experience and loss of context.

## Root Cause
1. **Always-active beforeunload listener**: The `useFormNavigationGuard` hook was registering a `beforeunload` event listener regardless of whether there were actual unsaved changes. This prevented the browser's Back/Forward Cache (BFCache) from working, forcing a full page reload on back navigation.

2. **False positive unsaved changes**: The `useFormPersistence` hook was reporting `hasUnsavedChanges` based on "any non-empty field" rather than tracking actual user modifications. This meant even fresh forms or forms with prefilled data were considered "dirty", keeping the `beforeunload` listener active.

## Solution

### 1. Conditional beforeunload Registration
**File**: `client/src/hooks/useFormNavigationGuard.ts`

Changed the hook to only register the `beforeunload` listener when there are actual unsaved changes:

```typescript
useEffect(() => {
  if (!hasUnsavedChanges) {
    return; // Early return - no listener registered
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

### 2. Track Real Form Modifications
**File**: `client/src/hooks/useFormPersistence.ts`

Updated the persistence hook to track actual user edits by:
- Capturing the initial form state on mount
- Comparing current state against initial state to detect real changes
- Only reporting `hasUnsavedChanges: true` when the form is truly dirty (modified from initial state)

Key changes:
```typescript
const initialFormStateRef = useRef<T | null>(null);
const [isFormDirty, setIsFormDirty] = useState(false);

// Capture initial state
initialFormStateRef.current = JSON.parse(JSON.stringify(formState));

// Detect real changes
const formHasChanged = JSON.stringify(getFilteredFormState(formState)) !== 
                       JSON.stringify(getFilteredFormState(initialFormStateRef.current));

setIsFormDirty(formHasChanged);

// Return dirty state instead of "any data" state
return {
  ...
  hasUnsavedChanges: isFormDirty,
};
```

## Benefits
- ✅ BFCache is now enabled for clean form pages
- ✅ No more unnecessary page reloads when navigating back
- ✅ User-typed data is still preserved via localStorage draft system
- ✅ `beforeunload` warning still works when there are real unsaved changes
- ✅ Better user experience and faster navigation

## Testing
Test the fix by:
1. Navigate to a form page (e.g., Triage, Post-op Updates)
2. Don't type anything (or just view an existing record)
3. Open a new tab or navigate away
4. Come back - the page should NOT reload
5. Now type something in the form
6. Navigate away - you should see the unsaved changes warning
7. Come back - the page will reload but your draft is preserved

