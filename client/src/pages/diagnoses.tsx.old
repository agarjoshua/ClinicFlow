import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { useEffect } from "react";
import { Search, FileText, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Diagnosis, Patient } from "@shared/schema";

export default function Diagnoses() {
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

  const { data: allDiagnoses = [], isLoading: diagnosesLoading } = useQuery<Diagnosis[]>({
    queryKey: ["diagnoses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnoses")
        .select()
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
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

  const isLoading = diagnosesLoading || patientsLoading;

  const diagnosesWithPatients = allDiagnoses.map(diagnosis => {
    const patient = patients.find(p => p.id === diagnosis.patient_id);
    return { diagnosis, patient };
  }).filter(item => item.patient);

  const filteredDiagnoses = diagnosesWithPatients.filter(({ diagnosis, patient }) => {
    if (!patient) return false;
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagnosis.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagnosis.diagnosisNotes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading diagnoses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Diagnosis Records</h1>
          <p className="text-sm text-muted-foreground">View all patient diagnosis records</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, ID, symptoms, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-diagnoses"
              />
            </div>
          </div>

          {filteredDiagnoses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No diagnosis records found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Diagnosis records will appear here when created"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDiagnoses.map(({ diagnosis, patient }) => (
                <Card
                  key={diagnosis.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/patients/${patient!.id}`)}
                  data-testid={`card-diagnosis-${diagnosis.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {patient!.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium" data-testid={`text-patient-name-${diagnosis.id}`}>{patient!.name}</h3>
                          <span className="text-xs text-muted-foreground font-mono">{patient!.patientId}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {diagnosis.diagnosisDate && typeof diagnosis.diagnosisDate === 'string' && !isNaN(Date.parse(diagnosis.diagnosisDate))
                            ? format(new Date(diagnosis.diagnosisDate), 'MMMM dd, yyyy - hh:mm a')
                            : 'Invalid date'}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Symptoms</p>
                            <p className="text-sm line-clamp-2">{diagnosis.symptoms}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Diagnosis</p>
                            <p className="text-sm line-clamp-2">{diagnosis.diagnosisNotes}</p>
                          </div>
                          {(diagnosis.temperature || diagnosis.bloodPressure || diagnosis.heartRate || diagnosis.oxygenSaturation) && (
                            <div className="flex gap-4 text-xs mt-2">
                              {diagnosis.temperature && (
                                <div>
                                  <span className="text-muted-foreground">Temp: </span>
                                  <span className="font-medium">{diagnosis.temperature}</span>
                                </div>
                              )}
                              {diagnosis.bloodPressure && (
                                <div>
                                  <span className="text-muted-foreground">BP: </span>
                                  <span className="font-medium">{diagnosis.bloodPressure}</span>
                                </div>
                              )}
                              {diagnosis.heartRate && (
                                <div>
                                  <span className="text-muted-foreground">HR: </span>
                                  <span className="font-medium">{diagnosis.heartRate} bpm</span>
                                </div>
                              )}
                              {diagnosis.oxygenSaturation && (
                                <div>
                                  <span className="text-muted-foreground">O2: </span>
                                  <span className="font-medium">{diagnosis.oxygenSaturation}%</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/patients/${patient!.id}`);
                        }}
                        data-testid={`button-view-patient-${diagnosis.id}`}
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
