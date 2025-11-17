import { useClinic } from "@/contexts/ClinicContext";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Hook to automatically scope Supabase queries to the current clinic
 * 
 * Usage:
 * const scopeToClinic = useClinicScope();
 * const query = supabase.from('patients').select('*');
 * const { data } = await scopeToClinic(query);
 */
export function useClinicScope() {
  const { clinic } = useClinic();

  return function scopeQuery<T>(
    query: PostgrestFilterBuilder<any, any, T>
  ): PostgrestFilterBuilder<any, any, T> {
    if (!clinic?.id) {
      console.warn("No clinic context - query may return empty results");
      // Return a query that will never match
      return query.eq("clinic_id", "00000000-0000-0000-0000-000000000000");
    }
    return query.eq("clinic_id", clinic.id);
  };
}

/**
 * Get the current clinic ID or throw an error
 * Use this when you need the clinic ID directly for INSERT operations
 * Note: This will throw if clinic context is not yet loaded
 */
export function useRequiredClinicId(): string | null {
  const { clinic, isLoading } = useClinic();
  
  // Return null while loading to prevent premature errors
  if (isLoading) {
    return null;
  }
  
  if (!clinic?.id) {
    console.warn("No clinic context available - user may need to complete onboarding");
    return null;
  }
  
  return clinic.id;
}
