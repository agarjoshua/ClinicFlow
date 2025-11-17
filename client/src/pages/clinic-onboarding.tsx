import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinic } from "@/contexts/ClinicContext";
import { useForm } from "react-hook-form";

interface OnboardingFormValues {
  clinicName: string;
  slug: string;
}

export default function ClinicOnboardingPage() {
  const [, navigate] = useLocation();
  const { clinic } = useClinic();
  const form = useForm<OnboardingFormValues>({
    defaultValues: {
      clinicName: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (clinic) {
      navigate("/dashboard");
    }
  }, [clinic, navigate]);

  const createClinic = useMutation({
    mutationFn: async (values: OnboardingFormValues) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("No user");

      // Get the user's database ID (not auth ID)
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      if (userError || !userRecord) {
        throw new Error("User profile not found. Please try logging out and back in.");
      }

      const { data: clinicRow, error: clinicError } = await supabase
        .from("clinics")
        .insert({
          name: values.clinicName,
          slug: values.slug,
          owner_id: userRecord.id, // Use database ID, not auth ID
          subscription_tier: "starter",
          subscription_status: "trialing",
        })
        .select("id")
        .single();

      if (clinicError) {
        console.error("Clinic creation error:", clinicError);
        throw new Error(
          clinicError.code === "23505" 
            ? "This clinic handle is already taken. Please choose another." 
            : clinicError.message || "Failed to create clinic"
        );
      }
      
      if (!clinicRow) throw new Error("No clinic created");

      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ clinic_id: clinicRow.id })
        .eq("user_id", authData.user.id);

      if (userUpdateError) throw userUpdateError;
      
      return clinicRow;
    },
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      console.error("Failed to create clinic:", error);
      alert(error.message);
    },
  });

  const onSubmit = (values: OnboardingFormValues) => {
    createClinic.mutate(values);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Set up your clinic</CardTitle>
        </CardHeader>
        <CardContent>
          {createClinic.error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {createClinic.error.message}
            </div>
          )}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic name</Label>
              <Input
                id="clinicName"
                {...form.register("clinicName", { required: true })}
                placeholder="Eg. Sunrise Medical Centre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Clinic handle</Label>
              <Input
                id="slug"
                {...form.register("slug", { required: true })}
                placeholder="sunrise-medical"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createClinic.isPending}
            >
              {createClinic.isPending ? "Creating clinic..." : "Create clinic"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
