import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useEffect } from "react";
import { Search, UserCheck, Eye, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Patient } from "@shared/schema";

export default function Discharged() {
  const [, setLocation] = useLocation();
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
  const [searchTerm, setSearchTerm] = useState("");

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

  const dischargedPatients = patients.filter(p => p.status === "discharged");

  const filteredPatients = dischargedPatients.filter((patient) => {
    const name = patient.name ?? "";
    const patientId = patient.patientId ?? "";
    const contact = patient.contact ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.includes(searchTerm);
    return matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ["Patient ID", "Name", "Age", "Gender", "Admission Date", "Discharge Date"];
    const rows = filteredPatients.map(p => [
      p.patientId,
      p.name,
      p.age,
      p.gender,
      format(new Date(p.admissionDate), 'yyyy-MM-dd'),
      p.dischargeDate ? format(new Date(p.dischargeDate), 'yyyy-MM-dd') : 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discharged-patients-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading discharged patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Discharged Patients</h1>
          <p className="text-sm text-muted-foreground">View all discharged patient records</p>
        </div>
        {filteredPatients.length > 0 && (
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-discharged"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserCheck className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No discharged patients found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Discharged patients will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/patients/${patient.id}`)}
                  data-testid={`card-discharged-patient-${patient.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                          {(() => {
                            const name = patient.name ?? "";
                            return name
                              ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                              : "?";
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" data-testid={`text-patient-name-${patient.id}`}>{patient.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{patient.patientId}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Age</p>
                          <p className="font-medium">{patient.age}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gender</p>
                          <p className="font-medium">{patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Admitted</p>
                          <p className="font-medium">
                            {(() => {
                              const date = patient.admissionDate ? new Date(patient.admissionDate) : null;
                              return date && !isNaN(date.getTime())
                                ? format(date, 'MMM dd, yyyy')
                                : "N/A";
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Discharged</p>
                          <p className="font-medium">
                            {patient.dischargeDate
                              ? format(new Date(patient.dischargeDate), 'MMM dd, yyyy')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/patients/${patient.id}`);
                        }}
                        data-testid={`button-view-patient-${patient.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
