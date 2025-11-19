import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteTeamMemberDialog } from "@/components/invite-team-member-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

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
                      <div>
                        <div className="text-sm font-medium">{m.fullName ?? m.email}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {m.role.toLowerCase()}
                      </Badge>
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
                      <div>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
