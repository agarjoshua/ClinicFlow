import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PatientAvatar } from "@/components/patient-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  Calendar,
  Clock,
  Search,
  Scissors,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type ProcedureStatus = "planned" | "scheduled" | "done" | "postponed" | "cancelled";

export default function Procedures() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProcedureStatus>("scheduled");
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<any>(null);
  const [diagnosisSearchOpen, setDiagnosisSearchOpen] = useState(false);
  const [diagnosisSearchTerm, setDiagnosisSearchTerm] = useState("");
  
  // Procedure form state
  const [procedureType, setProcedureType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  
  const { toast } = useToast();
  const { clinic } = useClinic();

  // Fetch procedures by status
  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ["procedures", clinic?.id, activeTab],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("procedures")
        .select(`
          *,
          patient:patients (
            id,
            patient_number,
            first_name,
            last_name,
            age,
            gender
          ),
          clinical_case:clinical_cases (
            id,
            diagnosis_notes,
            symptoms
          ),
          hospital:hospitals (
            id,
            name,
            code,
            color
          ),
          consultant:users!procedures_consultant_id_fkey (
            id,
            name,
            role
          )
        `)
        .eq("clinic_id", clinic.id)
        .eq("status", activeTab)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((proc: any) => ({
        id: proc.id,
        procedureType: proc.procedure_type,
        scheduledDate: proc.scheduled_date,
        scheduledTime: proc.scheduled_time,
        actualDate: proc.actual_date,
        actualTime: proc.actual_time,
        specialInstructions: proc.special_instructions,
        status: proc.status,
        patient: proc.patient ? {
          id: proc.patient.id,
          patientNumber: proc.patient.patient_number,
          firstName: proc.patient.first_name,
          lastName: proc.patient.last_name,
          age: proc.patient.age,
          gender: proc.patient.gender,
        } : null,
        clinicalCase: proc.clinical_case,
        hospital: proc.hospital,
        consultant: proc.consultant,
      }));
    },
    enabled: !!clinic?.id,
  });

  // Fetch clinical cases (diagnosed patients) for scheduling
  const { data: clinicalCases = [] } = useQuery({
    queryKey: ["clinical-cases-for-procedures", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("clinical_cases")
        .select(`
          *,
          patient:patients (
            id,
            patient_number,
            first_name,
            last_name,
            age,
            gender
          )
        `)
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((cc: any) => ({
        id: cc.id,
        diagnosisNotes: cc.diagnosis_notes,
        symptoms: cc.symptoms,
        medications: cc.medications,
        treatmentPlan: cc.treatment_plan,
        patient: cc.patient ? {
          id: cc.patient.id,
          patientNumber: cc.patient.patient_number,
          firstName: cc.patient.first_name,
          lastName: cc.patient.last_name,
          age: cc.patient.age,
          gender: cc.patient.gender,
        } : null,
      }));
    },
    enabled: !!clinic?.id,
  });

  // Fetch hospitals
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinic?.id,
  });

  // Fetch doctors/consultants (scoped to clinic)
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role")
        .eq("clinic_id", clinic.id)
        .in("role", ["doctor", "consultant"])
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinic?.id,
  });

  // Schedule procedure mutation
  const scheduleProcedureMutation = useMutation({
    mutationFn: async (procedureData: any) => {
      // Create the procedure
      const { data, error} = await supabase
        .from("procedures")
        .insert({
          clinic_id: procedureData.clinicId,
          clinical_case_id: procedureData.clinicalCaseId,
          patient_id: procedureData.patientId,
          hospital_id: procedureData.hospitalId,
          consultant_id: procedureData.consultantId,
          procedure_type: procedureData.procedureType,
          scheduled_date: procedureData.scheduledDate,
          scheduled_time: procedureData.scheduledTime,
          special_instructions: procedureData.notes,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-cases-for-procedures"] });
      setActiveTab("scheduled"); // Switch to scheduled tab to show new procedure
      toast({
        title: "Success",
        description: "Procedure scheduled successfully",
      });
      setScheduleDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule procedure",
        variant: "destructive",
      });
      console.error("Schedule error:", error);
    },
  });

  // Update procedure status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, actualDate, actualTime }: any) => {
      const updateData: any = { status };
      
      // When starting procedure, record actual date/time
      if (status === "done" && actualDate) {
        updateData.actual_date = actualDate;
        updateData.actual_time = actualTime;
      }

      const { error } = await supabase
        .from("procedures")
        .update(updateData)
        .eq("clinic_id", clinic.id)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast({
        title: "Success",
        description: "Procedure status updated",
      });
      setProcedureDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update procedure",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  // Update procedure mutation (full edit)
  const updateProcedureMutation = useMutation({
    mutationFn: async (procedureData: any) => {
      const { error } = await supabase
        .from("procedures")
        .update({
          procedure_type: procedureData.procedureType,
          scheduled_date: procedureData.scheduledDate,
          scheduled_time: procedureData.scheduledTime,
          special_instructions: procedureData.notes,
          consultant_id: procedureData.consultantId,
        })
        .eq("clinic_id", clinic.id)
        .eq("id", procedureData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast({
        title: "Success",
        description: "Procedure updated successfully",
      });
      setScheduleDialogOpen(false);
      setEditMode(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update procedure",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  // Delete procedure mutation
  const deleteProcedureMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("procedures")
        .delete()
        .eq("clinic_id", clinic.id)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-cases-for-procedures"] });
      toast({
        title: "Success",
        description: "Procedure deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setProcedureToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete procedure",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    },
  });

  const openScheduleDialog = (clinicalCase: any) => {
    setSelectedCase(clinicalCase);
    setEditMode(false);
    setScheduleDialogOpen(true);
  };

  const openEditDialog = (procedure: any) => {
    setEditMode(true);
    setSelectedCase(null);
    setProcedureType(procedure.procedureType || "");
    setScheduledDate(procedure.scheduledDate || "");
    setScheduledTime(procedure.scheduledTime || "");
    setNotes(procedure.specialInstructions || "");
    setSelectedDoctorId(procedure.consultant?.id || "");
    setSelectedProcedure(procedure);
    setScheduleDialogOpen(true);
  };

  const openDeleteConfirm = (procedure: any) => {
    setProcedureToDelete(procedure);
    setDeleteConfirmOpen(true);
  };

  const resetForm = () => {
    setSelectedCase(null);
    setSelectedProcedure(null);
    setProcedureType("");
    setScheduledDate("");
    setScheduledTime("");
    setNotes("");
    setSelectedDoctorId("");
    setEditMode(false);
  };

  const handleSchedule = () => {
    if (!selectedDoctorId) {
      toast({
        title: "Error",
        description: "Please select a doctor/consultant",
        variant: "destructive",
      });
      return;
    }

    if (editMode && selectedProcedure) {
      // Update existing procedure
      updateProcedureMutation.mutate({
        id: selectedProcedure.id,
        procedureType,
        scheduledDate,
        scheduledTime,
        notes,
        consultantId: selectedDoctorId,
      });
    } else if (!editMode && selectedCase) {
      // Create new procedure
      scheduleProcedureMutation.mutate({
        clinicId: clinic?.id,
        clinicalCaseId: selectedCase.id,
        patientId: selectedCase.patient.id,
        hospitalId: hospitals[0]?.id,
        procedureType,
        scheduledDate,
        scheduledTime,
        notes,
        consultantId: selectedDoctorId,
      });
    }
  };

  const handleDelete = () => {
    if (procedureToDelete) {
      deleteProcedureMutation.mutate(procedureToDelete.id);
    }
  };

  const filteredProcedures = procedures.filter((proc: any) => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${proc.patient?.firstName} ${proc.patient?.lastName}`.toLowerCase();
    const patientNumber = proc.patient?.patientNumber?.toLowerCase() || "";
    const procedureType = proc.procedureType?.toLowerCase() || "";
    
    return (
      patientName.includes(searchLower) ||
      patientNumber.includes(searchLower) ||
      procedureType.includes(searchLower)
    );
  });

  const filteredCases = clinicalCases.filter((cc: any) => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${cc.patient?.firstName} ${cc.patient?.lastName}`.toLowerCase();
    const patientNumber = cc.patient?.patientNumber?.toLowerCase() || "";
    
    return patientName.includes(searchLower) || patientNumber.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Procedures</h1>
          <p className="text-gray-600 mt-1">Schedule and manage surgical procedures</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2 flex items-center gap-2 justify-center w-full sm:w-auto">
          <Scissors className="w-5 h-5" />
          {filteredProcedures.length} {activeTab}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by patient name, number, or procedure type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProcedureStatus)}>
        <div className="mb-6 pb-4 border-b sm:border-0 sm:pb-0 sm:mb-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="scheduled" className="text-[10px] sm:text-sm px-1 py-2 sm:px-4 sm:py-2.5 flex-col sm:flex-row gap-0.5 sm:gap-2 h-auto">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">Sched</span>
              <span className="hidden sm:inline">Scheduled</span>
            </TabsTrigger>
            <TabsTrigger value="done" className="text-[10px] sm:text-sm px-1 py-2 sm:px-4 sm:py-2.5 flex-col sm:flex-row gap-0.5 sm:gap-2 h-auto">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">Done</span>
              <span className="hidden sm:inline">Completed</span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-[10px] sm:text-sm px-1 py-2 sm:px-4 sm:py-2.5 flex-col sm:flex-row gap-0.5 sm:gap-2 h-auto">
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">Cancel</span>
              <span className="hidden sm:inline">Cancelled</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="text-[10px] sm:text-sm px-1 py-2 sm:px-4 sm:py-2.5 flex-col sm:flex-row gap-0.5 sm:gap-2 h-auto">
              <Scissors className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">Schedule New</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Procedure Lists */}
        {(["scheduled", "done", "cancelled"] as ProcedureStatus[]).map((status) => (
          <TabsContent key={status} value={status} className="space-y-3 mt-0">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-500 text-center">Loading...</p>
                </CardContent>
              </Card>
            ) : filteredProcedures.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Scissors className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No {status} procedures</p>
                </CardContent>
              </Card>
            ) : (
              filteredProcedures.map((procedure: any, index: number) => (
                <ProcedureCard
                  key={procedure.id}
                  procedure={procedure}
                  onView={() => {
                    setSelectedProcedure(procedure);
                    setProcedureDialogOpen(true);
                  }}
                  onEdit={() => openEditDialog(procedure)}
                  onDelete={() => openDeleteConfirm(procedure)}
                  onUpdateStatus={(newStatus) => {
                    updateStatusMutation.mutate({
                      id: procedure.id,
                      status: newStatus,
                    });
                  }}
                  onViewPatient={() => setLocation(`/patients/${procedure.patient?.id}`)}
                  index={index}
                />
              ))
            )}
          </TabsContent>
        ))}

        {/* Schedule New Tab */}
        <TabsContent value="new" className="space-y-3">
          {/* Add Diagnosis Button with Searchable Dropdown */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredCases.length} diagnosed patient{filteredCases.length !== 1 ? 's' : ''} awaiting procedure
            </p>
            <Popover open={diagnosisSearchOpen} onOpenChange={setDiagnosisSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[300px] justify-between">
                  {selectedCase 
                    ? `${selectedCase.patient?.firstName} ${selectedCase.patient?.lastName}`
                    : "Search diagnosis to schedule..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search by patient name or diagnosis..." 
                    value={diagnosisSearchTerm}
                    onValueChange={setDiagnosisSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>No diagnosis found.</CommandEmpty>
                    <CommandGroup>
                      {clinicalCases
                        .filter((cc: any) => {
                          const searchLower = diagnosisSearchTerm.toLowerCase();
                          const patientName = `${cc.patient?.firstName} ${cc.patient?.lastName}`.toLowerCase();
                          const diagnosis = cc.diagnosisNotes?.toLowerCase() || "";
                          return patientName.includes(searchLower) || diagnosis.includes(searchLower);
                        })
                        .map((clinicalCase: any) => (
                          <CommandItem
                            key={clinicalCase.id}
                            value={`${clinicalCase.patient?.firstName} ${clinicalCase.patient?.lastName}`}
                            onSelect={() => {
                              openScheduleDialog(clinicalCase);
                              setDiagnosisSearchOpen(false);
                              setDiagnosisSearchTerm("");
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <PatientAvatar
                                firstName={clinicalCase.patient?.firstName}
                                lastName={clinicalCase.patient?.lastName}
                                age={clinicalCase.patient?.age}
                                gender={clinicalCase.patient?.gender}
                                size="sm"
                              />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {clinicalCase.patient?.firstName} {clinicalCase.patient?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {clinicalCase.patient?.patientNumber}
                                </p>
                                {clinicalCase.diagnosisNotes && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                    {clinicalCase.diagnosisNotes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Check
                              className={
                                selectedCase?.id === clinicalCase.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {filteredCases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No diagnosed patients awaiting procedure</p>
              </CardContent>
            </Card>
          ) : (
            filteredCases.map((clinicalCase: any) => (
              <ClinicalCaseCard
                key={clinicalCase.id}
                clinicalCase={clinicalCase}
                onSchedule={() => openScheduleDialog(clinicalCase)}
                onViewPatient={() => setLocation(`/patients/${clinicalCase.patient?.id}`)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={(open) => {
        setScheduleDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              {editMode ? "Edit Procedure" : "Schedule Procedure"}
            </DialogTitle>
            {selectedCase && (
              <DialogDescription>
                Patient: {selectedCase.patient?.firstName} {selectedCase.patient?.lastName}
                {" "}(#{selectedCase.patient?.patientNumber})
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Info */}
            {selectedCase?.diagnosisNotes && (
              <Card className="bg-blue-50">
                <CardContent className="p-4 text-sm">
                  <p><span className="font-medium">Diagnosis:</span> {selectedCase.diagnosisNotes}</p>
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="procedureType">Procedure Type *</Label>
              <Input
                id="procedureType"
                placeholder="e.g., Craniotomy, Tumor Resection, Spinal Fusion..."
                value={procedureType}
                onChange={(e) => setProcedureType(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="doctor">Assigned Doctor/Consultant *</Label>
              <Popover open={doctorSearchOpen} onOpenChange={setDoctorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={doctorSearchOpen}
                    className="w-full justify-between mt-1"
                  >
                    {selectedDoctorId
                      ? doctors.find((doc: any) => doc.id === selectedDoctorId)?.name || "Select doctor..."
                      : "Select doctor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search doctors..." />
                    <CommandList>
                      <CommandEmpty>No doctors found.</CommandEmpty>
                      <CommandGroup>
                        {doctors.map((doctor: any) => (
                          <CommandItem
                            key={doctor.id}
                            value={doctor.name}
                            onSelect={() => {
                              setSelectedDoctorId(doctor.id);
                              setDoctorSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedDoctorId === doctor.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {doctor.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="scheduledTime">Scheduled Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Procedure Notes</Label>
              <Textarea
                id="notes"
                placeholder="Pre-operative notes, special considerations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Notes field can be shown for both create and edit */}
            <div>
              <Label htmlFor="notes">Special Instructions</Label>
              <Textarea
                id="notes"
                placeholder="Any special pre-operative or post-operative instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setScheduleDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!procedureType || !scheduledDate || !scheduledTime || (editMode ? updateProcedureMutation.isPending : scheduleProcedureMutation.isPending)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {editMode 
                ? (updateProcedureMutation.isPending ? "Updating..." : "Update Procedure")
                : (scheduleProcedureMutation.isPending ? "Scheduling..." : "Schedule Procedure")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Procedure Details Dialog */}
      <Dialog open={procedureDialogOpen} onOpenChange={setProcedureDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procedure Details</DialogTitle>
          </DialogHeader>

          {selectedProcedure && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">Patient</p>
                      <p>{selectedProcedure.patient?.firstName} {selectedProcedure.patient?.lastName}</p>
                      <p className="text-xs text-gray-500">{selectedProcedure.patient?.patientNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Procedure Type</p>
                      <p>{selectedProcedure.procedureType}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Scheduled</p>
                      <p>{format(parseISO(selectedProcedure.scheduledDate), "MMM dd, yyyy")} at {selectedProcedure.scheduledTime}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Special Instructions</p>
                      <p>{selectedProcedure.specialInstructions || "—"}</p>
                    </div>
                    {selectedProcedure.actualDate && (
                      <div>
                        <p className="font-medium text-gray-600">Actual Date/Time</p>
                        <p>{format(parseISO(selectedProcedure.actualDate), "MMM dd, yyyy")} at {selectedProcedure.actualTime}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-600">Status</p>
                      <Badge>{selectedProcedure.status}</Badge>
                    </div>
                  </div>
                  {selectedProcedure.specialInstructions && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-600 mb-1">Special Instructions</p>
                      <p className="text-sm">{selectedProcedure.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {selectedProcedure.status === "scheduled" && (
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id: selectedProcedure.id,
                        status: "done",
                        actualDate: new Date().toISOString().split('T')[0],
                        actualTime: new Date().toTimeString().slice(0, 5),
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                {selectedProcedure.status === "done" && (
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id: selectedProcedure.id,
                        status: "scheduled",
                      });
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Revert to Scheduled
                  </Button>
                )}
                {selectedProcedure.status !== "cancelled" && (
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id: selectedProcedure.id,
                        status: "cancelled",
                      });
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Procedure
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Procedure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this procedure for {procedureToDelete?.patient?.firstName} {procedureToDelete?.patient?.lastName}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteConfirmOpen(false);
              setProcedureToDelete(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProcedureMutation.isPending}
            >
              {deleteProcedureMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Procedure Card Component
function ProcedureCard({
  procedure,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus,
  onViewPatient,
  index,
}: {
  procedure: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: ProcedureStatus) => void;
  onViewPatient: () => void;
  index?: number;
}) {
  const statusColors: Record<string, string> = {
    planned: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    done: "bg-green-100 text-green-800",
    postponed: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          {/* Row Number */}
          {index !== undefined && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-2">
              <span className="text-sm font-semibold text-primary">{index + 1}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center xl:items-start xl:gap-6">
            <div
              className="w-full h-1 rounded-full sm:w-1 sm:h-20"
              style={{ backgroundColor: procedure.hospital?.color || "#f97316" }}
            />

            <button className="cursor-pointer" onClick={onViewPatient} type="button">
              <PatientAvatar
                firstName={procedure.patient?.firstName}
                lastName={procedure.patient?.lastName}
                age={procedure.patient?.age}
                gender={procedure.patient?.gender}
                size="md"
              />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {procedure.patient?.firstName} {procedure.patient?.lastName}
                </h3>
                <p className="text-sm text-gray-600 font-mono">
                  {procedure.patient?.patientNumber}
                </p>
              </div>
              <Badge className={`${statusColors[procedure.status as ProcedureStatus]} w-fit self-start`}>
                {procedure.status}
              </Badge>
            </div>

            <div className="bg-orange-50 p-2 rounded-lg">
              <p className="text-sm font-medium">{procedure.procedureType}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(parseISO(procedure.scheduledDate), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{procedure.scheduledTime}</span>
              </div>
              {procedure.consultant && (
                <div className="flex items-center gap-1 sm:col-span-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{procedure.consultant.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-stretch xl:w-auto xl:flex-col">
            <Button size="sm" onClick={onView} className="w-full sm:w-auto xl:w-full">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            {procedure.status === "scheduled" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                  className="w-full sm:w-auto xl:w-full"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onDelete}
                  className="w-full sm:w-auto xl:w-full"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Clinical Case Card Component
function ClinicalCaseCard({
  clinicalCase,
  onSchedule,
  onViewPatient,
}: {
  clinicalCase: any;
  onSchedule: () => void;
  onViewPatient: () => void;
}) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <button className="cursor-pointer self-center lg:self-start" onClick={onViewPatient} type="button">
            <PatientAvatar
              firstName={clinicalCase.patient?.firstName}
              lastName={clinicalCase.patient?.lastName}
              age={clinicalCase.patient?.age}
              gender={clinicalCase.patient?.gender}
              size="md"
            />
          </button>

          <div className="flex-1 space-y-3">
            <div className="text-center lg:text-left">
              <h3 className="font-semibold text-lg">
                {clinicalCase.patient?.firstName} {clinicalCase.patient?.lastName}
              </h3>
              <p className="text-sm text-gray-600 font-mono">
                {clinicalCase.patient?.patientNumber}
              </p>
            </div>

            {clinicalCase.diagnosisNotes && (
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                <p className="text-sm text-gray-900">{clinicalCase.diagnosisNotes}</p>
              </div>
            )}

            {clinicalCase.treatmentPlan && (
              <div className="bg-green-50 p-2 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Treatment Plan:</p>
                <p className="text-sm text-gray-900">{clinicalCase.treatmentPlan}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-stretch lg:w-auto lg:flex-col">
            <Button
              onClick={onSchedule}
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto lg:w-full"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewPatient}
              className="w-full sm:w-auto lg:w-full"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Patient
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
