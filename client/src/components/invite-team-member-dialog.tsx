import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { UserPlus, AlertTriangle } from "lucide-react";

interface InviteFormValues {
  email: string;
  role: "consultant" | "assistant";
}

export function InviteTeamMemberDialog() {
  const { clinic } = useClinic();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<InviteFormValues>({
    defaultValues: {
      email: "",
      role: "assistant",
    },
  });

  // Fetch current user counts and limits
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return null;

      const [clinicData, consultantCount, assistantCount] = await Promise.all([
        supabase
          .from("clinics")
          .select("max_consultants, max_assistants")
          .eq("id", clinic.id)
          .single()
          .then((res) => res.data),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", clinic.id)
          .eq("role", "consultant")
          .then((res) => res.count || 0),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("clinic_id", clinic.id)
          .eq("role", "assistant")
          .then((res) => res.count || 0),
      ]);

      return {
        maxConsultants: clinicData?.max_consultants || 1,
        maxAssistants: clinicData?.max_assistants || 2,
        currentConsultants: consultantCount,
        currentAssistants: assistantCount,
      };
    },
    enabled: !!clinic?.id && open,
  });

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      if (!clinic?.id) throw new Error("No clinic selected");

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Not authenticated");

      // Get clinic details with limits
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("max_consultants, max_assistants")
        .eq("id", clinic.id)
        .single();

      if (clinicError) throw new Error("Failed to fetch clinic limits");

      // Count current users by role
      const { count: consultantCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id)
        .eq("role", "consultant");

      const { count: assistantCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id)
        .eq("role", "assistant");

      // Check if adding this user would exceed limits
      if (values.role === "consultant") {
        if ((consultantCount || 0) >= (clinicData.max_consultants || 1)) {
          throw new Error(
            `Consultant limit reached (${clinicData.max_consultants}). Upgrade your plan to add more consultants.`
          );
        }
      } else if (values.role === "assistant") {
        if ((assistantCount || 0) >= (clinicData.max_assistants || 2)) {
          throw new Error(
            `Assistant limit reached (${clinicData.max_assistants}). Upgrade your plan to add more assistants.`
          );
        }
      }

      // Get the inviter's database ID
      const { data: inviterRecord } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      if (!inviterRecord) throw new Error("Inviter not found");

      // Generate a unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase.from("invitations").insert({
        clinic_id: clinic.id,
        email: values.email,
        role: values.role,
        invited_by: inviterRecord.id,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("An invitation has already been sent to this email");
        }
        throw error;
      }

      // TODO: Send email with invitation link
      // For now, we'll just create the invitation in the database
      console.log("Invitation created. Token:", token);
      console.log("Invitation link:", `${window.location.origin}/accept-invitation?token=${token}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setOpen(false);
      form.reset();
      alert("Invitation sent successfully! (Email integration pending)");
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite team member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your clinic. They'll receive an email with a link to accept.
          </DialogDescription>
        </DialogHeader>

        {/* User Limits Display */}
        {userStats && (
          <div className="space-y-3 py-3 px-4 bg-slate-50 rounded-lg border">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Consultants</span>
                <span className={userStats.currentConsultants >= userStats.maxConsultants ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                  {userStats.currentConsultants} / {userStats.maxConsultants}
                </span>
              </div>
              <Progress 
                value={(userStats.currentConsultants / userStats.maxConsultants) * 100} 
                className={userStats.currentConsultants >= userStats.maxConsultants ? "bg-red-100" : ""}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Assistants</span>
                <span className={userStats.currentAssistants >= userStats.maxAssistants ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                  {userStats.currentAssistants} / {userStats.maxAssistants}
                </span>
              </div>
              <Progress 
                value={(userStats.currentAssistants / userStats.maxAssistants) * 100}
                className={userStats.currentAssistants >= userStats.maxAssistants ? "bg-red-100" : ""}
              />
            </div>
            {(userStats.currentConsultants >= userStats.maxConsultants || 
              userStats.currentAssistants >= userStats.maxAssistants) && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  User limit reached. Upgrade your subscription to add more team members.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit((values) => inviteMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              {...form.register("email", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) => form.setValue("role", value as "consultant" | "assistant")}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="assistant">Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Sending..." : "Send invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
