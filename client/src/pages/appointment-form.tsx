import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PatientAvatar } from "@/components/patient-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, Search, Calendar, Clock, Hospital, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

export default function AppointmentForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clinic } = useClinic();

  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedConsultant, setSelectedConsultant] = useState<string>(""); // NEW: Doctor selection
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [triageNotes, setTriageNotes] = useState("");

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
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

  // Fetch consultants (doctors)
  const { data: consultants = [] } = useQuery({
    queryKey: ["consultants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "consultant")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch clinic sessions for selected hospital (verified it belongs to clinic via hospitals query)
  const { data: clinicSessions = [] } = useQuery({
    queryKey: ["clinicSessions", selectedHospital, clinic?.id],
    queryFn: async () => {
      if (!selectedHospital || !clinic?.id) return [];
      
      // Verify the selected hospital belongs to this clinic
      const { data: hospitalCheck } = await supabase
        .from("hospitals")
        .select("id")
        .eq("id", selectedHospital)
        .eq("clinic_id", clinic.id)
        .single();
      
      if (!hospitalCheck) return [];
      
      const { data, error } = await supabase
        .from("clinic_sessions")
        .select(`
          *,
          hospital:hospitals(*),
          appointments(id)
        `)
        .eq("hospital_id", selectedHospital)
        .eq("status", "scheduled")
        .gte("session_date", format(new Date(), "yyyy-MM-dd"))
        .order("session_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedHospital && !!clinic?.id,
  });

  // Fetch all patients for search
  const { data: patients = [] } = useQuery({
    queryKey: ["patients", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Transform snake_case to camelCase
      return (data || []).map((p: any) => ({
        id: p.id,
        patientNumber: p.patient_number,
        firstName: p.first_name,
        lastName: p.last_name,
        dateOfBirth: p.date_of_birth,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        bloodType: p.blood_type,
      }));
    },
    enabled: !!clinic?.id,
  });

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: async (appointmentData: any) => {
      // Get current appointment count for this session to calculate booking number
      if (!appointmentData.clinicId) throw new Error("No clinic selected");
      
      const { data: existingAppointments } = await supabase
        .from("appointments")
        .select("id")
        .eq("clinic_id", appointmentData.clinicId)
        .eq("clinic_session_id", appointmentData.sessionId);
      
      const bookingNumber = (existingAppointments?.length || 0) + 1;
      
      const { data, error } = await supabase
        .from("appointments")
        .insert([
          {
            clinic_id: appointmentData.clinicId,
            clinic_session_id: appointmentData.sessionId,
            patient_id: appointmentData.patientId,
            consultant_id: appointmentData.consultantId, // NEW: Assign to doctor
            booking_number: bookingNumber,
            chief_complaint: appointmentData.chiefComplaint,
            is_priority: appointmentData.isPriority,
            status: "booked",
            triage_notes: appointmentData.triageNotes || null,
            created_by: currentUser?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Appointment booked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["clinicSessions"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setLocation("/appointments");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSession || !selectedPatient || !selectedConsultant || !chiefComplaint) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including selecting a doctor",
        variant: "destructive",
      });
      return;
    }

    createAppointment.mutate({
      clinicId: clinic?.id,
      sessionId: selectedSession,
      patientId: selectedPatient,
      consultantId: selectedConsultant,
      chiefComplaint,
      isPriority,
      triageNotes,
    });
  };

  const selectedSessionData = clinicSessions.find(s => s.id === selectedSession);
  const selectedPatientData = patients.find(p => p.id === selectedPatient);
  const availableSlots = selectedSessionData 
    ? selectedSessionData.max_patients - (selectedSessionData.appointments?.length || 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/appointments")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Appointments
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600 mt-1">Schedule a patient for a clinic session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Session Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Clinic Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hospital Selection */}
                <div>
                  <Label htmlFor="hospital">Hospital *</Label>
                  <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                    <SelectTrigger id="hospital">
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: hospital.color }}
                            />
                            {hospital.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clinic Session Selection */}
                <div>
                  <Label htmlFor="session">Clinic Session *</Label>
                  <Select 
                    value={selectedSession} 
                    onValueChange={setSelectedSession}
                    disabled={!selectedHospital}
                  >
                    <SelectTrigger id="session">
                      <SelectValue placeholder="Select clinic session" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicSessions.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No upcoming sessions available
                        </div>
                      ) : (
                        clinicSessions.map((session) => {
                          const bookedCount = session.appointments?.length || 0;
                          const isFull = bookedCount >= session.max_patients;
                          
                          return (
                            <SelectItem 
                              key={session.id} 
                              value={session.id}
                              disabled={isFull}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(session.session_date), "MMM d, yyyy")}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {session.start_time} - {session.end_time}
                                  </p>
                                </div>
                                <Badge variant={isFull ? "secondary" : "outline"}>
                                  {bookedCount}/{session.max_patients}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Session Details */}
                {selectedSessionData && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Hospital className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{selectedSessionData.hospital?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>
                        {selectedSessionData.start_time} - {selectedSessionData.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>
                        {availableSlots} slot{availableSlots !== 1 ? "s" : ""} available
                      </span>
                    </div>
                  </div>
                )}

                {/* Doctor/Consultant Selection */}
                <div>
                  <Label htmlFor="consultant">Assign to Doctor *</Label>
                  <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
                    <SelectTrigger id="consultant">
                      <SelectValue placeholder="Select doctor for this appointment" />
                    </SelectTrigger>
                    <SelectContent>
                      {consultants.map((consultant) => (
                        <SelectItem key={consultant.id} value={consultant.id}>
                          {consultant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    This appointment will appear in the selected doctor's calendar
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Patient Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Patient Search */}
                <div>
                  <Label>Patient *</Label>
                  <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedPatientData ? (
                          <div className="flex items-center gap-2">
                            <PatientAvatar
                              firstName={selectedPatientData.firstName}
                              lastName={selectedPatientData.lastName}
                              dateOfBirth={selectedPatientData.dateOfBirth || undefined}
                              age={selectedPatientData.age || undefined}
                              gender={selectedPatientData.gender || undefined}
                              size="sm"
                            />
                            <span>
                              {selectedPatientData.firstName} {selectedPatientData.lastName}
                            </span>
                          </div>
                        ) : (
                          "Search patient..."
                        )}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search by name or patient number..." />
                        <CommandEmpty>No patient found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              onSelect={() => {
                                setSelectedPatient(patient.id);
                                setPatientSearchOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <PatientAvatar
                                  firstName={patient.firstName}
                                  lastName={patient.lastName}
                                  dateOfBirth={patient.dateOfBirth || undefined}
                                  age={patient.age || undefined}
                                  gender={patient.gender || undefined}
                                  size="sm"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {patient.firstName} {patient.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500 font-mono">
                                    {patient.patientNumber}
                                  </p>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Selected Patient Details */}
                {selectedPatientData && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Patient Number</span>
                      <span className="font-mono text-sm">{selectedPatientData.patientNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Age</span>
                      <span className="text-sm">{selectedPatientData.age || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Gender</span>
                      <span className="text-sm">{selectedPatientData.gender || "N/A"}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-0 h-auto text-blue-600 hover:text-blue-700"
                      onClick={() => setLocation(`/patients/${selectedPatientData.id}`)}
                    >
                      View full profile →
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">No existing patient?</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/patients/new")}
                  >
                    Register New Patient
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="complaint">Chief Complaint *</Label>
              <Textarea
                id="complaint"
                placeholder="Patient's main concern or reason for visit..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="triage">Triage Notes (Optional)</Label>
              <Textarea
                id="triage"
                placeholder="Additional clinical notes or observations..."
                value={triageNotes}
                onChange={(e) => setTriageNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${isPriority ? "bg-red-100" : "bg-gray-200"}`}>
                  {isPriority ? "🚨" : "📋"}
                </div>
                <div>
                  <p className="font-medium">Priority Case</p>
                  <p className="text-sm text-gray-600">
                    Mark this appointment as urgent
                  </p>
                </div>
              </div>
              <Switch
                checked={isPriority}
                onCheckedChange={setIsPriority}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/appointments")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={createAppointment.isPending}
          >
            {createAppointment.isPending ? "Booking..." : "Book Appointment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
