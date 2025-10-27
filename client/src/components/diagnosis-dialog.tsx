import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertDiagnosisSchema, type InsertDiagnosis, type Patient } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

interface DiagnosisDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiagnosisDialog({ patient, open, onOpenChange }: DiagnosisDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertDiagnosis>({
    resolver: zodResolver(insertDiagnosisSchema),
    defaultValues: {
      patient_id: patient.id,
      symptoms: "",
      temperature: "",
      bloodPressure: "",
      heartRate: undefined,
      oxygenSaturation: undefined,
      diagnosisNotes: "",
      medications: "",
      treatmentPlan: "",
    },
  });

  const createDiagnosisMutation = useMutation({
    mutationFn: async (data: InsertDiagnosis) => {
      const { error } = await supabase
        .from("diagnoses")
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses", patient.id] });
      toast({
        title: "Success",
        description: "Diagnosis added successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDiagnosis) => {
    createDiagnosisMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Diagnosis</DialogTitle>
          <DialogDescription>
            Enter the patient's symptoms, vital signs, diagnosis notes, and treatment plan. All required fields must be completed for a valid diagnosis record.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input placeholder="98.6°F" {...field} data-testid="input-temperature" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodPressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Pressure</FormLabel>
                    <FormControl>
                      <Input placeholder="120/80" {...field} data-testid="input-blood-pressure" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heart Rate (bpm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="75"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-heart-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oxygenSaturation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O2 Sat (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="98"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-oxygen-saturation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptoms *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the patient's symptoms..."
                      className="min-h-20 resize-none"
                      {...field}
                      data-testid="textarea-symptoms"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnosisNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis Notes *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed diagnosis and observations..."
                      className="min-h-24 resize-none"
                      {...field}
                      data-testid="textarea-diagnosis-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medications</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Prescribed medications and dosages..."
                      className="min-h-20 resize-none"
                      {...field}
                      data-testid="textarea-medications"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatmentPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Plan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Recommended treatment and care plan..."
                      className="min-h-20 resize-none"
                      {...field}
                      data-testid="textarea-treatment-plan"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={createDiagnosisMutation.isPending} data-testid="button-submit">
                {createDiagnosisMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Diagnosis
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
