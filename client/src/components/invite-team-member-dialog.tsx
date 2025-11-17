import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";

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

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      if (!clinic?.id) throw new Error("No clinic selected");

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Not authenticated");

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
