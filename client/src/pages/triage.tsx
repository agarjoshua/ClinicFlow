import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { useFormNavigationGuard } from "@/hooks/useFormNavigationGuard";
import { SaveIndicator } from "@/components/SaveIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PatientAvatar } from "@/components/patient-avatar";
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
  Calendar,
  Clock,
  Hospital,
  Search,
  AlertCircle,
  CheckCircle,
  UserCircle,
  Stethoscope,
  ClipboardList,
  ArrowUpCircle,
  Eye,
  Activity,
  Thermometer,
  Heart,
  Wind,
} from "lucide-react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Triage() {
  const { clinic } = useClinic();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [triageNotes, setTriageNotes] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [priorityReason, setPriorityReason] = useState("");
  
  // Vital signs state
  const [temperature, setTemperature] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  
  const { toast } = useToast();

  // Form state for persistence
  const triageFormState = {
    triageNotes,
    isPriority,
    priorityReason,
    temperature,
    bloodPressure,
    heartRate,
    oxygenSaturation,
  };

  // Form persistence
  const triagePersistence = useFormPersistence({
    storageKey: `draft-triage-${selectedAppointment?.id || 'none'}`,
    formState: triageFormState,
    enabled: triageDialogOpen,
    onRestore: (data) => {
      setTriageNotes(data.triageNotes || "");
      setIsPriority(data.isPriority || false);
      setPriorityReason(data.priorityReason || "");
      setTemperature(data.temperature || "");
      setBloodPressure(data.bloodPressure || "");
      setHeartRate(data.heartRate || "");
      setOxygenSaturation(data.oxygenSaturation || "");
    },
  });

  // Navigation guard
  useFormNavigationGuard(triagePersistence.hasUnsavedChanges && triageDialogOpen);

  // Fetch confirmed appointments (ready for triage)
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["triage-appointments", clinic?.id, hospitalFilter],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients (
            id,
            patient_number,
            first_name,
            last_name,
            date_of_birth,
            age,
            gender,
            phone,
            email,
            allergies,
            current_medications
          ),
          clinic_session:clinic_sessions (
            id,
            session_date,
            start_time,
            end_time,
            hospital:hospitals (
              id,
              name,
              color
            )
          )
        `)
        .eq("clinic_id", clinic.id)
        .eq("status", "confirmed")
        .order("clinic_session(session_date)", { ascending: true })
        .order("booking_number", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Transform the data
      const transformed = (data || []).map((apt: any) => ({
        id: apt.id,
        bookingNumber: apt.booking_number,
        chiefComplaint: apt.chief_complaint,
        isPriority: apt.is_priority,
        priorityReason: apt.priority_reason,
        triageNotes: apt.triage_notes,
        temperature: apt.temperature,
        bloodPressure: apt.blood_pressure,
        heartRate: apt.heart_rate,
        oxygenSaturation: apt.oxygen_saturation,
        status: apt.status,
        createdAt: apt.created_at,
        patient: apt.patient ? {
          id: apt.patient.id,
          patientNumber: apt.patient.patient_number,
          firstName: apt.patient.first_name,
          lastName: apt.patient.last_name,
          dateOfBirth: apt.patient.date_of_birth,
          age: apt.patient.age,
          gender: apt.patient.gender,
          phone: apt.patient.phone,
          email: apt.patient.email,
          allergies: apt.patient.allergies,
          currentMedications: apt.patient.current_medications,
        } : null,
        clinicSession: apt.clinic_session ? {
          id: apt.clinic_session.id,
          sessionDate: apt.clinic_session.session_date,
          startTime: apt.clinic_session.start_time,
          endTime: apt.clinic_session.end_time,
          hospital: apt.clinic_session.hospital,
        } : null,
      }));

      // Filter by hospital if selected
      if (hospitalFilter !== "all") {
        return transformed.filter((apt: any) => 
          apt.clinicSession?.hospital?.id === hospitalFilter
        );
      }

      return transformed;
    },
  });

    // Fetch hospitals for filtering
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

  // Update triage mutation
  const triageMutation = useMutation({
    mutationFn: async ({
      appointmentId,
      notes,
      priority,
      reason,
      confirmStatus,
      vitalSigns,
    }: {
      appointmentId: string;
      notes: string;
      priority: boolean;
      reason: string;
      confirmStatus: boolean;
      vitalSigns: {
        temperature: string;
        bloodPressure: string;
        heartRate: string;
        oxygenSaturation: string;
      };
    }) => {
      const updateData: any = {
        triage_notes: notes,
        is_priority: priority,
        priority_reason: reason,
        temperature: vitalSigns.temperature || null,
        blood_pressure: vitalSigns.bloodPressure || null,
        heart_rate: vitalSigns.heartRate ? parseInt(vitalSigns.heartRate) : null,
        oxygen_saturation: vitalSigns.oxygenSaturation ? parseInt(vitalSigns.oxygenSaturation) : null,
      };

      if (confirmStatus) {
        updateData.status = "confirmed";
      }

      if (!clinic?.id) throw new Error("No clinic selected");
      
      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId)
        .eq("clinic_id", clinic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triage-appointments", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["appointments", clinic?.id] });
      toast({
        title: "Success",
        description: "Triage completed successfully",
      });
      triagePersistence.clearDraft();
      setTriageDialogOpen(false);
      resetTriageForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete triage",
        variant: "destructive",
      });
    },
  });

  const openTriageDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setTriageNotes(appointment.triageNotes || "");
    setIsPriority(appointment.isPriority || false);
    setPriorityReason(appointment.priorityReason || "");
    setTemperature(appointment.temperature || "");
    setBloodPressure(appointment.bloodPressure || "");
    setHeartRate(appointment.heartRate?.toString() || "");
    setOxygenSaturation(appointment.oxygenSaturation?.toString() || "");
    setTriageDialogOpen(true);
  };

  const resetTriageForm = () => {
    setSelectedAppointment(null);
    setTriageNotes("");
    setIsPriority(false);
    setPriorityReason("");
    setTemperature("");
    setBloodPressure("");
    setHeartRate("");
    setOxygenSaturation("");
  };

  const handleSaveTriage = (confirmStatus: boolean) => {
    if (!selectedAppointment) return;

    triageMutation.mutate({
      appointmentId: selectedAppointment.id,
      notes: triageNotes,
      priority: isPriority,
      reason: priorityReason,
      confirmStatus,
      vitalSigns: {
        temperature,
        bloodPressure,
        heartRate,
        oxygenSaturation,
      },
    });
  };

  // Filter appointments by search
  const filteredAppointments = appointments.filter((appointment: any) => {
    const patientName = appointment.patient
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`.toLowerCase()
      : "";
    const patientNumber = appointment.patient?.patientNumber?.toLowerCase() || "";
    const chiefComplaint = appointment.chiefComplaint?.toLowerCase() || "";

    return (
      patientName.includes(searchTerm.toLowerCase()) ||
      patientNumber.includes(searchTerm.toLowerCase()) ||
      chiefComplaint.includes(searchTerm.toLowerCase())
    );
  });

  // Group by priority
  const priorityAppointments = filteredAppointments.filter((a: any) => a.isPriority);
  const regularAppointments = filteredAppointments.filter((a: any) => !a.isPriority);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading triage queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Triage</h1>
          <p className="text-gray-600 mt-1">Process and prioritize appointments</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Stethoscope className="w-5 h-5 mr-2" />
            {filteredAppointments.length} Pending
          </Badge>
          {priorityAppointments.length > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <AlertCircle className="w-5 h-5 mr-2" />
              {priorityAppointments.length} Priority
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by patient name, number, or complaint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hospitals</SelectItem>
                {hospitals.map((hospital: any) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Priority Appointments */}
      {priorityAppointments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-red-600">Priority Cases</h2>
            <Badge variant="destructive" className="text-sm font-medium">
              Total: {priorityAppointments.length}
            </Badge>
          </div>
          {priorityAppointments.map((appointment: any, index: number) => (
            <AppointmentTriageCard
              key={appointment.id}
              appointment={appointment}
              onTriage={() => openTriageDialog(appointment)}
              onViewPatient={() => setLocation(`/patients/${appointment.patient?.id}`)}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Regular Appointments */}
      <div className="space-y-3">
        {priorityAppointments.length > 0 && (
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Regular Queue</h2>
            <Badge variant="secondary" className="text-sm font-medium">
              Total: {regularAppointments.length}
            </Badge>
          </div>
        )}
        {regularAppointments.length === 0 && priorityAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No appointments pending triage</p>
            </CardContent>
          </Card>
        ) : regularAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No regular appointments in queue</p>
            </CardContent>
          </Card>
        ) : (
          regularAppointments.map((appointment: any, index: number) => (
            <AppointmentTriageCard
              key={appointment.id}
              appointment={appointment}
              onTriage={() => openTriageDialog(appointment)}
              onViewPatient={() => setLocation(`/patients/${appointment.patient?.id}`)}
              index={index}
            />
          ))
        )}
      </div>

      {/* Triage Dialog */}
      <Dialog open={triageDialogOpen} onOpenChange={setTriageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Triage Assessment</DialogTitle>
                <DialogDescription>
                  Complete triage for{" "}
                  {selectedAppointment?.patient?.firstName}{" "}
                  {selectedAppointment?.patient?.lastName}
                </DialogDescription>
              </div>
              <SaveIndicator
                isSaving={triagePersistence.isSaving}
                lastSavedAt={triagePersistence.lastSavedAt}
                className="text-xs"
              />
            </div>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Patient Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <PatientAvatar
                      firstName={selectedAppointment.patient?.firstName}
                      lastName={selectedAppointment.patient?.lastName}
                      dateOfBirth={selectedAppointment.patient?.dateOfBirth}
                      age={selectedAppointment.patient?.age}
                      gender={selectedAppointment.patient?.gender}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {selectedAppointment.patient?.firstName}{" "}
                        {selectedAppointment.patient?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 font-mono">
                        {selectedAppointment.patient?.patientNumber}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Age: {selectedAppointment.patient?.age || "N/A"}</span>
                        <span>•</span>
                        <span>Gender: {selectedAppointment.patient?.gender || "N/A"}</span>
                        <span>•</span>
                        <span>Queue: #{selectedAppointment.bookingNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedAppointment.chiefComplaint}
                    </p>
                  </div>

                  {/* Allergies & Medications */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {selectedAppointment.patient?.allergies && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-red-700">⚠️ Allergies:</p>
                        <p className="text-sm text-red-900">
                          {selectedAppointment.patient.allergies}
                        </p>
                      </div>
                    )}
                    {selectedAppointment.patient?.currentMedications && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-purple-700">💊 Current Medications:</p>
                        <p className="text-sm text-purple-900">
                          {selectedAppointment.patient.currentMedications}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Triage Form */}
              <div className="space-y-4">
                {/* Vital Signs Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Vital Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="temperature" className="flex items-center gap-2 text-xs">
                          <Thermometer className="w-3 h-3" />
                          Temperature
                        </Label>
                        <Input
                          id="temperature"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          placeholder="98.6°F"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bloodPressure" className="flex items-center gap-2 text-xs">
                          <Heart className="w-3 h-3" />
                          BP
                        </Label>
                        <Input
                          id="bloodPressure"
                          value={bloodPressure}
                          onChange={(e) => setBloodPressure(e.target.value)}
                          placeholder="120/80"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="heartRate" className="flex items-center gap-2 text-xs">
                          <Activity className="w-3 h-3" />
                          HR (bpm)
                        </Label>
                        <Input
                          id="heartRate"
                          type="number"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          placeholder="72"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="oxygenSaturation" className="flex items-center gap-2 text-xs">
                          <Wind className="w-3 h-3" />
                          O2 (%)
                        </Label>
                        <Input
                          id="oxygenSaturation"
                          type="number"
                          value={oxygenSaturation}
                          onChange={(e) => setOxygenSaturation(e.target.value)}
                          placeholder="98"
                          max="100"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className={`w-5 h-5 ${isPriority ? "text-red-600" : "text-gray-400"}`} />
                    <div>
                      <Label htmlFor="priority" className="font-medium">
                        Mark as Priority
                      </Label>
                      <p className="text-xs text-gray-600">
                        Urgent cases that need immediate attention
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="priority"
                    checked={isPriority}
                    onCheckedChange={setIsPriority}
                  />
                </div>

                {isPriority && (
                  <div>
                    <Label htmlFor="priority-reason">Priority Reason *</Label>
                    <Input
                      id="priority-reason"
                      value={priorityReason}
                      onChange={(e) => setPriorityReason(e.target.value)}
                      placeholder="e.g., Severe headache with vomiting, trauma case..."
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="triage-notes">Triage Notes</Label>
                  <Textarea
                    id="triage-notes"
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    placeholder="Initial assessment, vital signs, presenting symptoms, triage level..."
                    rows={6}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setTriageDialogOpen(false)}
              disabled={triageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSaveTriage(false)}
              disabled={triageMutation.isPending || (isPriority && !priorityReason)}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSaveTriage(true)}
              disabled={triageMutation.isPending || (isPriority && !priorityReason)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {triageMutation.isPending ? "Processing..." : "Confirm & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Appointment Card Component
function AppointmentTriageCard({
  appointment,
  onTriage,
  onViewPatient,
  index,
}: {
  appointment: any;
  onTriage: () => void;
  onViewPatient: () => void;
  index?: number;
}) {
  return (
    <Card className={`hover-elevate ${appointment.isPriority ? "border-red-300 border-2" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Row Number */}
          {index !== undefined && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-2">
              <span className="text-sm font-semibold text-primary">{index + 1}</span>
            </div>
          )}
          
          {/* Color Bar */}
          <div
            className="w-1 h-24 rounded-full"
            style={{
              backgroundColor: appointment.clinicSession?.hospital?.color || "#3b82f6",
            }}
          />

          {/* Queue Number */}
          <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-600">Queue</span>
            <span className="text-2xl font-bold text-blue-600">
              #{appointment.bookingNumber}
            </span>
          </div>

          {/* Patient Avatar */}
          <div className="cursor-pointer" onClick={onViewPatient}>
            <PatientAvatar
              firstName={appointment.patient?.firstName}
              lastName={appointment.patient?.lastName}
              dateOfBirth={appointment.patient?.dateOfBirth}
              age={appointment.patient?.age}
              gender={appointment.patient?.gender}
              size="md"
            />
          </div>

          {/* Appointment Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="cursor-pointer" onClick={onViewPatient}>
                <h3 className="font-semibold text-lg hover:text-primary">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </h3>
                <p className="text-sm text-gray-600 font-mono">
                  {appointment.patient?.patientNumber}
                </p>
              </div>
              {appointment.isPriority && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Priority
                </Badge>
              )}
            </div>

            {/* Hospital & Date */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Hospital
                  className="w-4 h-4"
                  style={{ color: appointment.clinicSession?.hospital?.color }}
                />
                <span>{appointment.clinicSession?.hospital?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {appointment.clinicSession?.sessionDate
                    ? format(parseISO(appointment.clinicSession.sessionDate), "MMM dd, yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{appointment.clinicSession?.startTime || "N/A"}</span>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="bg-blue-50 p-2 rounded-lg mb-2">
              <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
              <p className="text-sm text-gray-900 font-medium">{appointment.chiefComplaint}</p>
            </div>

            {/* Vital Signs (if recorded) */}
            {(appointment.temperature || appointment.bloodPressure || appointment.heartRate || appointment.oxygenSaturation) && (
              <div className="bg-green-50 p-2 rounded-lg mb-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Vital Signs:</p>
                <div className="flex items-center gap-3 text-xs">
                  {appointment.temperature && (
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-600" />
                      <span className="font-medium">{appointment.temperature}</span>
                    </div>
                  )}
                  {appointment.bloodPressure && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-600" />
                      <span className="font-medium">{appointment.bloodPressure}</span>
                    </div>
                  )}
                  {appointment.heartRate && (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-pink-600" />
                      <span className="font-medium">{appointment.heartRate} bpm</span>
                    </div>
                  )}
                  {appointment.oxygenSaturation && (
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-blue-600" />
                      <span className="font-medium">{appointment.oxygenSaturation}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Patient Info */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Age: {appointment.patient?.age || "N/A"}</span>
              <span>•</span>
              <span>Gender: {appointment.patient?.gender || "N/A"}</span>
              {appointment.patient?.allergies && (
                <>
                  <span>•</span>
                  <span className="text-red-600 font-medium">⚠️ Allergies</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={onTriage} className="bg-blue-600 hover:bg-blue-700">
              <Stethoscope className="w-4 h-4 mr-2" />
              Triage
            </Button>
            <Button variant="outline" size="sm" onClick={onViewPatient}>
              <Eye className="w-4 h-4 mr-1" />
              View Patient
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
