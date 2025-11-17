import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export type Clinic = {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: string;
  subscriptionStatus: string;
};

interface ClinicContextValue {
  clinic: Clinic | null;
  isLoading: boolean;
}

const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const { data: clinic, isLoading } = useQuery<Clinic | null>({
    queryKey: ["current-clinic", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    queryFn: async () => {
      if (!userId) return null;

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("user_id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user clinic_id", userError);
        return null;
      }

      if (!userRow?.clinic_id) {
        console.log("User has no clinic_id");
        return null;
      }

      const { data: clinicRow, error: clinicError } = await supabase
        .from("clinics")
        .select("id, name, slug, subscription_tier, subscription_status")
        .eq("id", userRow.clinic_id)
        .single();

      if (clinicError || !clinicRow) {
        console.error("Error fetching clinic", clinicError);
        return null;
      }

      console.log("Clinic loaded:", clinicRow.name);
      return {
        id: clinicRow.id,
        name: clinicRow.name,
        slug: clinicRow.slug,
        subscriptionTier: clinicRow.subscription_tier,
        subscriptionStatus: clinicRow.subscription_status,
      };
    },
  });

  return (
    <ClinicContext.Provider value={{ clinic: clinic ?? null, isLoading }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used within a ClinicProvider");
  return ctx;
}
