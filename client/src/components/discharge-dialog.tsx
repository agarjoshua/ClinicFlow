import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { insertDischargeSchema, type InsertDischarge, type Patient } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

interface DischargeDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DischargeDialog({ patient, open, onOpenChange }: DischargeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertDischarge>({
    resolver: zodResolver(insertDischargeSchema),
    defaultValues: {
      patientId: patient.id,
      discharge_date: "",
      dischargeTime: "",
      dischargeType: "regular",
      condition_on_discharge: "",
      dischargeSummary: "",
      followUpInstructions: "",
      medications: "",
      diet_instructions: "",
      activity_restrictions: "",
      followUpAppointment: "",
      dischargedBy: "",
      finalDiagnosis: "",
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: async (data: InsertDischarge) => {
      const { error } = await supabase
        .from("discharges")
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", patient.id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["discharges", patient.id] });
      toast({
        title: "Success",
        description: "Patient discharged successfully",
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

  const onSubmit = (data: InsertDischarge) => {
    dischargeMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discharge Patient: {patient.name}</DialogTitle>
          <DialogDescription>
            Complete the discharge summary, prescribed medications, and follow-up instructions. All required fields must be filled to discharge the patient.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Discharge Date, Time, and Type visually grouped */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-primary/5 rounded-lg p-4 mb-2 border border-primary/20">
              <FormField
                control={form.control}
                name="discharge_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-primary">Discharge Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} className="border-primary/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dischargeTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-primary">Discharge Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value ?? ""} className="border-primary/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dischargeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-primary">Discharge Type *</FormLabel>
                    <FormControl>
                      <div className="w-full">
                        <select
                          {...field}
                          value={field.value ?? "regular"}
                          className="input border-primary/40 rounded-md px-2 py-1 w-full max-w-xs md:max-w-full"
                          style={{ minWidth: 0 }}
                        >
                          <option value="regular">Regular</option>
                          <option value="against_medical_advice">Against Medical Advice</option>
                          <option value="transfer">Transfer</option>
                          <option value="deceased">Deceased</option>
                        </select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="condition_on_discharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition on Discharge *</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Patient's condition at discharge..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="followUpInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Instructions *</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Follow-up appointments, care instructions, etc..." />
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
                    <Textarea {...field} value={field.value ?? ""} placeholder="Medications prescribed..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diet_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diet Instructions</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Diet instructions..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activity_restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Restrictions</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Activity restrictions..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="followUpAppointment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Appointment</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dischargedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discharged By</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Doctor or staff name..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finalDiagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Final Diagnosis</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Final diagnosis..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dischargeSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discharge Summary</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Summary of treatment, progress, and care..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={dischargeMutation.isPending} data-testid="button-submit">
                {dischargeMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Discharge Patient
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
