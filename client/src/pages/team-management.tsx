import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InviteTeamMemberDialog } from "@/components/invite-team-member-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { Trash2, MoreVertical, Mail, X, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function TeamManagementPage() {
  const { clinic } = useClinic();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null);

  const { data: members, isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["team-members", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return [];

      const { data, error } = await supabase
        .from("users")
        .select("user_id, name, email, role, clinic_id")
        .eq("clinic_id", clinic.id);

      if (error || !data) {
        console.error("Error fetching team members", error);
        return [];
      }

      return data.map((row) => ({
        id: row.user_id,
        fullName: row.name,
        email: row.email,
        role: row.role,
      }));
    },
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ["invitations", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return [];

      const { data, error } = await supabase
        .from("invitations")
        .select("id, email, role, status, created_at, expires_at")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Error fetching invitations", error);
        return [];
      }

      return data.map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      }));
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("user_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully.",
      });
      setMemberToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ 
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast({
        title: "Invitation resent",
        description: "The invitation has been resent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to resend invitation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled.",
      });
      setInvitationToCancel(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel invitation: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">
            Manage consultants, assistants and other staff in your clinic.
          </p>
        </div>
        <InviteTeamMemberDialog />
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">
            Members {members && `(${members.length})`}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations {invitations && `(${invitations.filter(i => i.status === 'pending').length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading && <p className="text-sm text-muted-foreground">Loading team...</p>}
              {!membersLoading && (!members || members.length === 0) && (
                <p className="text-sm text-muted-foreground">No team members found yet.</p>
              )}
              {!membersLoading && members && members.length > 0 && (
                <div className="space-y-3">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{m.fullName ?? m.email}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {m.role.toLowerCase()}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setMemberToDelete(m)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitationsLoading && <p className="text-sm text-muted-foreground">Loading invitations...</p>}
              {!invitationsLoading && (!invitations || invitations.length === 0) && (
                <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
              )}
              {!invitationsLoading && invitations && invitations.length > 0 && (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{inv.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Sent {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {inv.role}
                        </Badge>
                        <Badge
                          variant={inv.status === "pending" ? "secondary" : inv.status === "accepted" ? "default" : "destructive"}
                          className="text-xs capitalize"
                        >
                          {inv.status}
                        </Badge>
                        {inv.status === "pending" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => resendInvitationMutation.mutate(inv.id)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setInvitationToCancel(inv)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Member Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.fullName || memberToDelete?.email} from your team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => memberToDelete && deleteMemberMutation.mutate(memberToDelete.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation Dialog */}
      <AlertDialog open={!!invitationToCancel} onOpenChange={() => setInvitationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to {invitationToCancel?.email}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => invitationToCancel && cancelInvitationMutation.mutate(invitationToCancel.id)}
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
