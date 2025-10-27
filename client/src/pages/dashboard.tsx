import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Users, UserPlus, Activity, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Patient } from "@shared/schema";

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLocation("/auth");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setLocation("/auth");
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation("/auth");
  };
  const [, setLocation] = useLocation();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select()
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: recentPatients = [] } = useQuery<Patient[]>({
    queryKey: ["patients-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select()
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const activePatients = patients.filter(p => p.status === "active");
  const dischargedPatients = patients.filter(p => p.status === "discharged");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newToday = patients.filter(p => {
    const admissionDate = new Date(p.admissionDate);
    admissionDate.setHours(0, 0, 0, 0);
    return admissionDate.getTime() === today.getTime();
  });

  const stats = [
    {
      title: "Total Patients",
      value: patients.length,
      icon: Users,
      description: "All registered patients",
      color: "text-primary",
    },
    {
      title: "Active Today",
      value: activePatients.length,
      icon: Activity,
      description: "Currently admitted",
      color: "text-chart-2",
    },
    {
      title: "New Admissions",
      value: newToday.length,
      icon: UserPlus,
      description: "Admitted today",
      color: "text-chart-3",
    },
    {
      title: "Discharged",
      value: dischargedPatients.length,
      icon: UserCheck,
      description: "Total discharged",
      color: "text-muted-foreground",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end mb-2">
        {session && (
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">Logout</Button>
        )}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome to MediCare Hospital Management System</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/patients/new")} data-testid="button-new-patient">
            <UserPlus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No recent admissions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.slice(0, 5).map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                    onClick={() => setLocation(`/patients/${patient.id}`)}
                    data-testid={`card-recent-patient-${patient.id}`}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                          {(() => {
                            const name = patient.name ?? "";
                            return name
                              ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                              : "?";
                          })()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{patient.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{patient.patientId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const date = patient.admissionDate ? new Date(patient.admissionDate) : null;
                          return date && !isNaN(date.getTime())
                            ? format(date, 'MMM dd, yyyy')
                            : "N/A";
                        })()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => setLocation("/patients/new")}
              data-testid="button-quick-new-patient"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Register New Patient
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => setLocation("/patients")}
              data-testid="button-quick-view-patients"
            >
              <Users className="w-5 h-5 mr-3" />
              View All Patients
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => setLocation("/diagnoses")}
              data-testid="button-quick-view-diagnoses"
            >
              <Activity className="w-5 h-5 mr-3" />
              View Diagnoses
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
