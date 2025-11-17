import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface InvitationDetails {
  id: string;
  clinicName: string;
  role: string;
  email: string;
  status: string;
  expiresAt: string;
}

export default function AcceptInvitationPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invToken = params.get("token");
    
    if (!invToken) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    setToken(invToken);
    
    // Fetch invitation details
    supabase
      .from("invitations")
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        clinic:clinics(name)
      `)
      .eq("token", invToken)
      .single()
      .then(({ data, error: invError }) => {
        if (invError || !data) {
          setError("Invitation not found");
          setLoading(false);
          return;
        }

        const clinic = Array.isArray(data.clinic) ? data.clinic[0] : data.clinic;

        if (data.status !== "pending") {
          setError("This invitation has already been used");
          setLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError("This invitation has expired");
          setLoading(false);
          return;
        }

        setInvitation({
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          expiresAt: data.expires_at,
          clinicName: clinic?.name || "Unknown Clinic",
        });
        setLoading(false);
      });
  }, []);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!invitation || !token) throw new Error("Invalid invitation");

      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Failed to create user");

      // 2. Get clinic_id from invitation
      const { data: invData } = await supabase
        .from("invitations")
        .select("clinic_id")
        .eq("token", token)
        .single();

      if (!invData) throw new Error("Invitation not found");

      // 3. Create user profile with clinic_id
      const { error: profileError } = await supabase.from("users").insert({
        user_id: authData.user.id,
        email: invitation.email,
        name,
        role: invitation.role,
        clinic_id: invData.clinic_id,
      });

      if (profileError) throw profileError;

      // 4. Mark invitation as accepted
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("token", token);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setTimeout(() => navigate("/"), 2000);
    },
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 text-sm text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button className="mt-4 w-full" onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Welcome to {invitation.clinicName}!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account has been created. Redirecting you to the dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invitation.clinicName}</CardTitle>
          <CardDescription>
            You've been invited to join as a {invitation.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Email:</strong> {invitation.email}
            </AlertDescription>
          </Alert>

          {acceptMutation.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{acceptMutation.error.message}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              acceptMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Choose a secure password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? "Creating account..." : "Accept & Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
