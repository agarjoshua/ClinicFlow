import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useEffect } from "react";
import { Search, UserPlus, Download, Eye, Trash2, Users, MapPin, Clock, BedDouble } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { PatientAvatar } from "@/components/patient-avatar";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PatientListItem = Patient & {
  currentHospital?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

export default function Patients() {
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
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: patients = [], isLoading } = useQuery<PatientListItem[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Not authenticated");
      
      const { data: userData } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("user_id", authData.user.id)
        .single();
      
      if (!userData?.clinic_id) return [];
      
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          currentHospital:hospitals(id, name, color)
        `)
        .eq("clinic_id", userData.clinic_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Transform snake_case to camelCase
      return (data ?? []).map((p: any) => {
        const currentHospitalRaw = p.currentHospital;
        const currentHospital = Array.isArray(currentHospitalRaw)
          ? currentHospitalRaw[0] || null
          : currentHospitalRaw || null;

        return {
        id: p.id,
        patientNumber: p.patient_number,
        firstName: p.first_name,
        lastName: p.last_name,
        dateOfBirth: p.date_of_birth,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        emergencyContact: p.emergency_contact,
        emergencyContactPhone: p.emergency_contact_phone,
        medicalHistory: p.medical_history,
        allergies: p.allergies,
        currentMedications: p.current_medications,
        bloodType: p.blood_type,
        isInpatient: p.is_inpatient,
        currentHospitalId: p.current_hospital_id,
        inpatientAdmittedAt: p.inpatient_admitted_at,
        inpatientNotes: p.inpatient_notes,
        currentHospital,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      } as PatientListItem;
      });
    },
  });

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const patientNumber = (patient.patientNumber ?? "").toLowerCase();
    const phone = patient.phone ?? "";
    const email = patient.email ?? "";
    
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      patientNumber.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ["Patient Number", "Name", "Age", "Gender", "Phone", "Email", "Registration Date"];
    const rows = filteredPatients.map(p => [
      p.patientNumber,
      `${p.firstName} ${p.lastName}`,
      p.age || "N/A",
      p.gender || "N/A",
      p.phone || "N/A",
      p.email || "N/A",
      p.createdAt ? format(new Date(p.createdAt), 'yyyy-MM-dd') : "N/A"
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patients-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">Patient Records</h1>
            <Badge variant="secondary" className="text-sm font-medium">
              Total: {filteredPatients.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Manage and view all patient information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setLocation("/patients/new")} data-testid="button-add-patient">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-patients"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No patients found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by registering your first patient"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setLocation("/patients/new")} data-testid="button-empty-add-patient">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient, index) => (
                <Card
                  key={patient.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/patients/${patient.id}`)}
                  data-testid={`card-patient-${patient.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{index + 1}</span>
                      </div>
                      <PatientAvatar
                        firstName={patient.firstName}
                        lastName={patient.lastName}
                        dateOfBirth={patient.dateOfBirth || undefined}
                        age={patient.age || undefined}
                        gender={patient.gender || undefined}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate" data-testid={`text-patient-name-${patient.id}`}>
                            {patient.firstName} {patient.lastName}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{patient.patientNumber}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Age</p>
                          <p className="font-medium">{patient.age || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gender</p>
                          <p className="font-medium">{patient.gender || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{patient.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Registered</p>
                          <p className="font-medium">
                            {patient.createdAt 
                              ? format(new Date(patient.createdAt), 'MMM dd, yyyy')
                              : "N/A"
                            }
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
                    {patient.isInpatient && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge className="bg-emerald-100 text-emerald-700 border-transparent flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" />
                            Inpatient
                          </Badge>
                          {patient.currentHospital && (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <MapPin className="h-4 w-4" />
                              {patient.currentHospital.name}
                            </span>
                          )}
                          {patient.inpatientAdmittedAt && (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <Clock className="h-4 w-4" />
                              Since {format(new Date(patient.inpatientAdmittedAt), "MMM dd, yyyy h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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
