import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Activity, FileText, UserX, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { Patient, Diagnosis, Discharge } from "@shared/schema";
import { useState } from "react";
import { useEffect } from "react";
import { DischargeDialog } from "@/components/discharge-dialog";
import { DiagnosisDialog } from "@/components/diagnosis-dialog";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
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

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const patientId = params?.id;

  const [showDischargeDialog, setShowDischargeDialog] = useState(false);
  const [showDiagnosisDialog, setShowDiagnosisDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["patient", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select()
        .eq("id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: diagnoses = [] } = useQuery<Diagnosis[]>({
    queryKey: ["diagnoses", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnoses")
        .select()
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: discharges = [] } = useQuery<Discharge[]>({
    queryKey: ["discharges", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discharge_records")
        .select()
        .eq("patient_id", patientId)
        .order("discharge_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      setLocation("/patients");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading patient details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/patients")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Patient Details</h1>
          <p className="text-sm text-muted-foreground">View and manage patient information</p>
        </div>
        <div className="flex gap-2">
          {patient.status === "active" && (
            <>
              <Button variant="outline" onClick={() => setShowDiagnosisDialog(true)} data-testid="button-add-diagnosis">
                <Plus className="w-4 h-4 mr-2" />
                Add Diagnosis
              </Button>
              <Button onClick={() => setShowDischargeDialog(true)} data-testid="button-discharge-patient">
                <UserX className="w-4 h-4 mr-2" />
                Discharge
              </Button>
            </>
          )}
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} data-testid="button-delete-patient">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                {(() => {
                  const name = patient.name ?? "";
                  return name
                    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : "?";
                })()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-semibold" data-testid="text-patient-name">{patient.name}</h2>
                  <p className="text-sm text-muted-foreground font-mono" data-testid="text-patient-id">{patient.patientId}</p>
                </div>
                <Badge variant={patient.status === "active" ? "default" : "secondary"} data-testid="badge-patient-status">
                  {patient.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{patient.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admitted</p>
                  <p className="font-medium">
                    {(() => {
                      const date = patient.admissionDate ? new Date(patient.admissionDate) : null;
                      return date && !isNaN(date.getTime())
                        ? format(date, 'MMM dd, yyyy')
                        : "N/A";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="diagnoses" data-testid="tab-diagnoses">
            Diagnoses ({diagnoses.length})
          </TabsTrigger>
          <TabsTrigger value="discharge" data-testid="tab-discharge">
            Discharge Records ({discharges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium">{patient.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{patient.emergencyContact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{patient.address}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Medical Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Medical History</p>
                  <p className="text-sm">{patient.medicalHistory || "No medical history recorded"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Allergies</p>
                  <p className="text-sm">{patient.allergies || "No known allergies"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Medications</p>
                  <p className="text-sm">{patient.currentMedications || "No current medications"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnoses" className="mt-6">
          {diagnoses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No diagnosis records</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding a diagnosis for this patient
                </p>
                {patient.status === "active" && (
                  <Button onClick={() => setShowDiagnosisDialog(true)} data-testid="button-empty-add-diagnosis">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Diagnosis
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {diagnoses.map((diagnosis) => (
                <Card key={diagnosis.id} data-testid={`card-diagnosis-${diagnosis.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Diagnosis Record</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(() => {
                            const date = diagnosis.diagnosisDate ? new Date(diagnosis.diagnosisDate) : null;
                            return date && !isNaN(date.getTime())
                              ? format(date, 'MMMM dd, yyyy - hh:mm a')
                              : "N/A";
                          })()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {diagnosis.temperature && (
                        <div>
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="font-medium">{diagnosis.temperature}</p>
                        </div>
                      )}
                      {diagnosis.bloodPressure && (
                        <div>
                          <p className="text-sm text-muted-foreground">Blood Pressure</p>
                          <p className="font-medium">{diagnosis.bloodPressure}</p>
                        </div>
                      )}
                      {diagnosis.heartRate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Heart Rate</p>
                          <p className="font-medium">{diagnosis.heartRate} bpm</p>
                        </div>
                      )}
                      {diagnosis.oxygenSaturation && (
                        <div>
                          <p className="text-sm text-muted-foreground">O2 Saturation</p>
                          <p className="font-medium">{diagnosis.oxygenSaturation}%</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Symptoms</p>
                      <p className="text-sm">{diagnosis.symptoms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Diagnosis Notes</p>
                      <p className="text-sm">{diagnosis.diagnosisNotes}</p>
                    </div>
                    {diagnosis.medications && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Medications</p>
                        <p className="text-sm">{diagnosis.medications}</p>
                      </div>
                    )}
                    {diagnosis.treatmentPlan && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Treatment Plan</p>
                        <p className="text-sm">{diagnosis.treatmentPlan}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discharge" className="mt-6">
          {discharges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <UserX className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No discharge records</h3>
                <p className="text-sm text-muted-foreground">
                  {patient.status === "active"
                    ? "This patient has not been discharged yet"
                    : "No discharge records available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {discharges.map((discharge) => (
                <Card key={discharge.id} data-testid={`card-discharge-${discharge.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Discharge Summary</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {discharge.dischargeDate && format(new Date(discharge.dischargeDate), 'MMMM dd, yyyy - hh:mm a')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {discharge.conditionOnDischarge && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Condition on Discharge</p>
                        <p className="text-sm">{discharge.conditionOnDischarge}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm">{discharge.dischargeSummary}</p>
                    </div>
                    {discharge.medications && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Medications</p>
                        <p className="text-sm">{discharge.medications}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Follow-up Instructions</p>
                      <p className="text-sm">{discharge.followUpInstructions}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showDischargeDialog && (
        <DischargeDialog
          patient={patient}
          open={showDischargeDialog}
          onOpenChange={setShowDischargeDialog}
        />
      )}

      {showDiagnosisDialog && (
        <DiagnosisDialog
          patient={patient}
          open={showDiagnosisDialog}
          onOpenChange={setShowDiagnosisDialog}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patient.name}'s record and all associated diagnoses and discharge records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePatientMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
