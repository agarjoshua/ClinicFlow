import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PatientAvatar } from "@/components/patient-avatar";
import { Separator } from "@/components/ui/separator";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  Pill,
  Droplet,
  CalendarPlus,
  Hospital,
  Bed,
  Activity,
  Clock,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useLocation } from "wouter";
import { format, differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function ConsultantPatients() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clinic } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "inpatient" | "outpatient">("all");
  const [sortBy, setSortBy] = useState<"recent" | "overdue" | "upcoming">("recent");
  
  // Patient CRUD state
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<any>(null);
  
  // Booking dialog state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<any>(null);
  
  // Care management dialog state
  const [careDialogOpen, setCareDialogOpen] = useState(false);
  const [selectedPatientForCare, setSelectedPatientForCare] = useState<any>(null);
  
  // Patient form state
  const [patientForm, setPatientForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
    bloodType: "",
  });
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    clinicSessionId: "",
    chiefComplaint: "",
    isPriority: false,
    priorityReason: "",
    triageNotes: "",
  });

  // Fetch current user
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

  // Fetch all patients with care tracking data
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["consultant-patients", clinic?.id, currentUser?.id],
    queryFn: async () => {
      if (!clinic?.id || !currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          appointments(
            id,
            clinic_session_id,
            status,
            created_at,
            clinic_sessions(session_date)
          ),
          clinical_cases(
            id,
            case_date,
            consultant_id
          ),
          discharges(
            id,
            discharge_date,
            follow_up_date,
            follow_up_instructions
          )
        `)
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Process care tracking data
      return (data || []).map((patient: any) => {
        // Filter for this consultant's cases
        const myCases = patient.clinical_cases?.filter((c: any) => c.consultant_id === currentUser.id) || [];
        const myAppointments = patient.appointments?.filter((a: any) => {
          const session = a.clinic_sessions;
          return session && new Date(session.session_date) <= new Date();
        }) || [];
        
        // Last seen date (most recent past appointment or clinical case)
        const lastSeenDates = [
          ...myAppointments.map((a: any) => a.clinic_sessions?.session_date),
          ...myCases.map((c: any) => c.case_date),
        ].filter(Boolean);
        
        const lastSeen = lastSeenDates.length > 0 
          ? lastSeenDates.sort().reverse()[0]
          : null;
        
        // Next scheduled appointment
        const upcomingAppointments = patient.appointments?.filter((a: any) => {
          const session = a.clinic_sessions;
          return session && new Date(session.session_date) > new Date();
        }) || [];
        
        const nextAppointment = upcomingAppointments.length > 0
          ? upcomingAppointments.sort((a: any, b: any) => 
              new Date(a.clinic_sessions.session_date).getTime() - 
              new Date(b.clinic_sessions.session_date).getTime()
            )[0]
          : null;
        
        // Follow-up information from discharge
        const latestDischarge = patient.discharges?.length > 0
          ? patient.discharges.sort((a: any, b: any) => 
              new Date(b.discharge_date).getTime() - new Date(a.discharge_date).getTime()
            )[0]
          : null;
        
        return {
          ...patient,
          care_tracking: {
            last_seen: lastSeen,
            next_appointment: nextAppointment?.clinic_sessions?.session_date,
            follow_up_date: latestDischarge?.follow_up_date,
            follow_up_instructions: latestDischarge?.follow_up_instructions,
            total_visits: myAppointments.length + myCases.length,
            days_since_last_seen: lastSeen 
              ? Math.floor((new Date().getTime() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24))
              : null,
          }
        };
      });
    },
    enabled: !!clinic?.id && !!currentUser?.id,
  });

  // Fetch inpatient data (patients currently admitted - procedures done but not discharged)
  const { data: inpatients = [] } = useQuery({
    queryKey: ["inpatients", clinic?.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !clinic?.id) return [];
      
      // First, get all procedures that are done
      const { data: proceduresData, error: procError } = await supabase
        .from("procedures")
        .select(`
          *,
          patient:patients(*),
          hospital:hospitals(*),
          clinical_case:clinical_cases(*)
        `)
        .eq("clinic_id", clinic.id)
        .eq("consultant_id", currentUser.id)
        .eq("status", "done")
        .order("actual_date", { ascending: false });
      
      if (procError) {
        console.error("Error fetching procedures:", procError);
        return [];
      }
      
      if (!proceduresData || proceduresData.length === 0) return [];
      
      // Get all procedure IDs
      const procedureIds = proceduresData.map(p => p.id);
      
      // Check which procedures have been discharged
      const { data: dischargesData, error: dischError } = await supabase
        .from("discharges")
        .select("procedure_id")
        .in("procedure_id", procedureIds);
      
      if (dischError) {
        console.error("Error fetching discharges:", dischError);
        return proceduresData; // Return all if error checking discharges
      }
      
      // Get set of discharged procedure IDs
      const dischargedProcedureIds = new Set(
        (dischargesData || []).map(d => d.procedure_id)
      );
      
      // Filter to only include procedures that haven't been discharged
      return proceduresData.filter(proc => !dischargedProcedureIds.has(proc.id));
    },
    enabled: !!clinic?.id && !!currentUser?.id,
  });

  // Fetch upcoming clinic sessions for booking
  const { data: upcomingClinics = [] } = useQuery({
    queryKey: ["upcoming-clinics", currentUser?.id, clinic?.id],
    queryFn: async () => {
      if (!currentUser?.id || !clinic?.id) return [];
      
      // First get clinic's hospital IDs
      const { data: hospitalData } = await supabase
        .from("hospitals")
        .select("id")
        .eq("clinic_id", clinic.id);
      
      if (!hospitalData || hospitalData.length === 0) return [];
      const hospitalIds = hospitalData.map(h => h.id);
      
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("clinic_sessions")
        .select(`
          *,
          hospital:hospitals(*)
        `)
        .in("hospital_id", hospitalIds)
        .eq("consultant_id", currentUser.id)
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id && !!clinic?.id,
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!clinic?.id) {
        throw new Error("No clinic selected. Please complete onboarding first.");
      }
      
      // Generate patient number
      const { count } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id);
      
      const patientNumber = `P${String((count || 0) + 1).padStart(6, "0")}`;
      
      const { data, error } = await supabase
        .from("patients")
        .insert({
          clinic_id: clinic.id,
          patient_number: patientNumber,
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          emergency_contact: formData.emergencyContact || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          medical_history: formData.medicalHistory || null,
          allergies: formData.allergies || null,
          current_medications: formData.currentMedications || null,
          blood_type: formData.bloodType || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-patients"] });
      toast({
        title: "Patient created",
        description: "Patient has been successfully registered.",
      });
      setPatientDialogOpen(false);
      resetPatientForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create patient",
        variant: "destructive",
      });
    },
  });

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, formData }: any) => {
      if (!clinic?.id) {
        throw new Error("No clinic selected.");
      }
      
      const { data, error } = await supabase
        .from("patients")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          emergency_contact: formData.emergencyContact || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          medical_history: formData.medicalHistory || null,
          allergies: formData.allergies || null,
          current_medications: formData.currentMedications || null,
          blood_type: formData.bloodType || null,
        })
        .eq("id", id)
        .eq("clinic_id", clinic.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-patients"] });
      toast({
        title: "Patient updated",
        description: "Patient information has been successfully updated.",
      });
      setPatientDialogOpen(false);
      setEditingPatient(null);
      resetPatientForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient",
        variant: "destructive",
      });
    },
  });

  // Soft delete patient mutation (archives, doesn't permanently delete)
  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!clinic?.id) {
        throw new Error("No clinic selected.");
      }
      
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from("patients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", patientId)
        .eq("clinic_id", clinic.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-patients"] });
      toast({
        title: "Patient Archived",
        description: "Patient has been archived. All data is preserved and recoverable.",
      });
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive patient",
        variant: "destructive",
      });
    },
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async ({ patientId, formData }: any) => {
      if (!currentUser?.id) throw new Error("User not authenticated");
      
      // Get current booking count for this session
      if (!clinic?.id) throw new Error("No clinic selected");
      
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id)
        .eq("clinic_session_id", formData.clinicSessionId);
      
      const bookingNumber = (count || 0) + 1;
      
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinic.id,
          clinic_session_id: formData.clinicSessionId,
          patient_id: patientId,
          consultant_id: currentUser.id,
          booking_number: bookingNumber,
          chief_complaint: formData.chiefComplaint,
          is_priority: formData.isPriority,
          priority_reason: formData.priorityReason || null,
          triage_notes: formData.triageNotes || null,
          status: "booked",
          created_by: currentUser.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-clinics"] });
      toast({
        title: "Appointment booked",
        description: "Patient appointment has been successfully scheduled.",
      });
      setBookingDialogOpen(false);
      setSelectedPatientForBooking(null);
      resetBookingForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  const resetPatientForm = () => {
    setPatientForm({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      emergencyContact: "",
      emergencyContactPhone: "",
      medicalHistory: "",
      allergies: "",
      currentMedications: "",
      bloodType: "",
    });
  };

  const resetBookingForm = () => {
    setBookingForm({
      clinicSessionId: "",
      chiefComplaint: "",
      isPriority: false,
      priorityReason: "",
      triageNotes: "",
    });
  };

  const handleOpenCreatePatient = () => {
    resetPatientForm();
    setEditingPatient(null);
    setPatientDialogOpen(true);
  };

  const handleOpenEditPatient = (patient: any) => {
    setPatientForm({
      firstName: patient.first_name || "",
      lastName: patient.last_name || "",
      dateOfBirth: patient.date_of_birth || "",
      age: patient.age?.toString() || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergencyContact: patient.emergency_contact || "",
      emergencyContactPhone: patient.emergency_contact_phone || "",
      medicalHistory: patient.medical_history || "",
      allergies: patient.allergies || "",
      currentMedications: patient.current_medications || "",
      bloodType: patient.blood_type || "",
    });
    setEditingPatient(patient);
    setPatientDialogOpen(true);
  };

  const handleOpenDeletePatient = (patient: any) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleOpenBooking = (patient: any) => {
    setSelectedPatientForBooking(patient);
    resetBookingForm();
    setBookingDialogOpen(true);
  };

  const handleSavePatient = () => {
    if (!patientForm.firstName || !patientForm.lastName) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    if (editingPatient) {
      updatePatientMutation.mutate({ id: editingPatient.id, formData: patientForm });
    } else {
      createPatientMutation.mutate(patientForm);
    }
  };

  const handleBookAppointment = () => {
    if (!bookingForm.clinicSessionId || !bookingForm.chiefComplaint) {
      toast({
        title: "Validation Error",
        description: "Please select a clinic session and enter chief complaint.",
        variant: "destructive",
      });
      return;
    }

    bookAppointmentMutation.mutate({
      patientId: selectedPatientForBooking.id,
      formData: bookingForm,
    });
  };

  const filteredPatients = patients.filter((patient: any) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const patientNumber = (patient.patient_number || "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      patientNumber.includes(searchTerm.toLowerCase());

    // Filter by view mode
    if (viewMode === "inpatient") {
      const isInpatient = inpatients.some((ip: any) => ip.patient?.id === patient.id);
      return matchesSearch && isInpatient;
    }
    
    if (viewMode === "outpatient") {
      const isInpatient = inpatients.some((ip: any) => ip.patient?.id === patient.id);
      return matchesSearch && !isInpatient;
    }

    return matchesSearch;
  }).sort((a: any, b: any) => {
    // Sort based on selected criteria
    if (sortBy === "recent") {
      // Most recently seen first
      const dateA = a.care_tracking?.last_seen ? new Date(a.care_tracking.last_seen).getTime() : 0;
      const dateB = b.care_tracking?.last_seen ? new Date(b.care_tracking.last_seen).getTime() : 0;
      return dateB - dateA;
    } else if (sortBy === "overdue") {
      // Patients overdue for follow-up first (past follow_up_date without next appointment)
      const aOverdue = a.care_tracking?.follow_up_date && 
        new Date(a.care_tracking.follow_up_date) < new Date() && 
        !a.care_tracking.next_appointment;
      const bOverdue = b.care_tracking?.follow_up_date && 
        new Date(b.care_tracking.follow_up_date) < new Date() && 
        !b.care_tracking.next_appointment;
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by days since last seen
      const daysA = a.care_tracking?.days_since_last_seen || 0;
      const daysB = b.care_tracking?.days_since_last_seen || 0;
      return daysB - daysA;
    } else if (sortBy === "upcoming") {
      // Patients with upcoming appointments first
      const dateA = a.care_tracking?.next_appointment ? new Date(a.care_tracking.next_appointment).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.care_tracking?.next_appointment ? new Date(b.care_tracking.next_appointment).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    }
    return 0;
  });

  const exportToCSV = () => {
    const headers = ["Patient Number", "Name", "Age", "Gender", "Phone", "Email"];
    const rows = filteredPatients.map((p: any) => [
      p.patient_number,
      `${p.first_name} ${p.last_name}`,
      p.age || "N/A",
      p.gender || "N/A",
      p.phone || "N/A",
      p.email || "N/A",
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patients-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Patient Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage patients, inpatients, and book appointments</p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <Button variant="outline" onClick={exportToCSV} className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" />
            <span className="sm:inline">Export CSV</span>
          </Button>
          <Button onClick={handleOpenCreatePatient} className="flex-1 sm:flex-none">
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="sm:inline">Add Patient</span>
          </Button>
        </div>
      </div>

      {/* Tabs for All/Inpatient/Outpatient */}
      <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
        <div className="mb-6 pb-4 border-b sm:border-0 sm:pb-0 sm:mb-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="all" className="text-[10px] sm:text-sm px-1 py-2 sm:px-4 sm:py-2.5 flex-col sm:flex-row gap-0.5 sm:gap-2 h-auto">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">All</span>
              <span className="hidden sm:inline">All Patients</span>
              <span className="text-[8px] sm:text-xs">({patients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="inpatient" className="text-[10px] sm:text-sm px-1 py-2 sm:px-4 sm:py-2.5 flex-col sm:flex-row gap-0.5 sm:gap-2 h-auto">
              <Bed className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">In</span>
              <span className="hidden sm:inline">Inpatients</span>
              <span className="text-[8px] sm:text-xs">({inpatients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="outpatient" className="text-[10px] sm:text-sm px-1 py-2 sm:px-4 sm:py-2.5 flex-col sm:flex-row gap-0.5 sm:gap-2 h-auto">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sm:hidden">Out</span>
              <span className="hidden sm:inline">Outpatients</span>
              <span className="text-[8px] sm:text-xs">({patients.length - inpatients.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={viewMode} className="space-y-4">
          {/* Search and Sort */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or patient number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-full sm:w-[200px] h-10">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="overdue">Overdue Follow-up</SelectItem>
                    <SelectItem value="upcoming">Upcoming Appointments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Patient List */}
          {viewMode === "inpatient" ? (
            // Inpatient view with hospital info
            <div className="grid gap-4">
              {filteredPatients.filter((patient: any) => 
                inpatients.some((ip: any) => ip.patient?.id === patient.id)
              ).map((patient: any) => {
                const inpatientData = inpatients.find((ip: any) => ip.patient?.id === patient.id);
                return (
                  <Card key={patient.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row items-start gap-4">
                        <PatientAvatar
                          firstName={patient.first_name}
                          lastName={patient.last_name}
                          size="lg"
                        />
                        <div className="flex-1 space-y-3 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {patient.first_name} {patient.last_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">{patient.patient_number}</p>
                            </div>
                            <Badge variant="secondary" className="w-fit">
                              <Bed className="w-3 h-3 mr-1" />
                              Inpatient
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Hospital className="w-4 h-4 text-muted-foreground" />
                              <span>{inpatientData?.hospital?.name || "Unknown Hospital"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>Admitted: {inpatientData?.actual_date ? format(new Date(inpatientData.actual_date), "MMM dd, yyyy") : "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{patient.age} years • {patient.gender}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{patient.phone || "No phone"}</span>
                            </div>
                          </div>

                          {inpatientData?.procedure_type && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium">Procedure:</span> {inpatientData.procedure_type}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/patients/${patient.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/post-op-updates?procedure=${inpatientData?.id}`)}
                            >
                              <Activity className="w-4 h-4 mr-2" />
                              Post-Op Updates
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredPatients.filter((patient: any) => 
                inpatients.some((ip: any) => ip.patient?.id === patient.id)
              ).length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No inpatients</h3>
                    <p className="text-sm text-muted-foreground">
                      There are currently no patients admitted.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // All patients / Outpatient view
            <div className="grid gap-4">
              {filteredPatients.map((patient: any) => {
                const isInpatient = inpatients.some((ip: any) => ip.patient?.id === patient.id);
                const isOverdue = patient.care_tracking?.follow_up_date && 
                  new Date(patient.care_tracking.follow_up_date) < new Date() && 
                  !patient.care_tracking.next_appointment;
                
                return (
                  <Card key={patient.id} className={isOverdue ? "border-l-4 border-l-orange-500" : ""}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row items-start gap-4">
                        <PatientAvatar
                          firstName={patient.first_name}
                          lastName={patient.last_name}
                          size="lg"
                        />
                        <div className="flex-1 space-y-3 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {patient.first_name} {patient.last_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">{patient.patient_number}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {isInpatient && (
                                <Badge variant="secondary">
                                  <Bed className="w-3 h-3 mr-1" />
                                  Inpatient
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Overdue Follow-up
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{patient.age} years • {patient.gender}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{patient.phone || "No phone"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{patient.email || "No email"}</span>
                            </div>
                            {patient.allergies && (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-600">{patient.allergies}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Continued Care Tracking */}
                          {patient.care_tracking && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                {patient.care_tracking.last_seen && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Last Seen</p>
                                      <p className="font-medium">
                                        {format(new Date(patient.care_tracking.last_seen), "MMM dd, yyyy")}
                                        <span className="text-xs text-muted-foreground ml-1">
                                          ({patient.care_tracking.days_since_last_seen}d ago)
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {patient.care_tracking.next_appointment && (
                                  <div className="flex items-center gap-2">
                                    <CalendarPlus className="w-4 h-4 text-green-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Next Appointment</p>
                                      <p className="font-medium">
                                        {format(new Date(patient.care_tracking.next_appointment), "MMM dd, yyyy")}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {patient.care_tracking.total_visits > 0 && (
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Total Visits</p>
                                      <p className="font-medium">{patient.care_tracking.total_visits}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {patient.care_tracking.follow_up_date && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-orange-600 mt-0.5" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Recommended Follow-up</p>
                                      <p className="font-medium text-orange-700">
                                        {format(new Date(patient.care_tracking.follow_up_date), "MMMM dd, yyyy")}
                                      </p>
                                      {patient.care_tracking.follow_up_instructions && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {patient.care_tracking.follow_up_instructions}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/patients/${patient.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPatientForCare(patient);
                                setCareDialogOpen(true);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Care History
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditPatient(patient)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenBooking(patient)}
                            >
                              <CalendarPlus className="w-4 h-4 mr-2" />
                              Book
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDeletePatient(patient)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredPatients.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No patients found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm ? "Try adjusting your search" : "Get started by adding a new patient"}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleOpenCreatePatient}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Patient
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Patient Dialog */}
      <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatient ? "Edit Patient" : "Add New Patient"}</DialogTitle>
            <DialogDescription>
              {editingPatient ? "Update patient information" : "Enter patient information to create a new record"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={patientForm.firstName}
                  onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={patientForm.lastName}
                  onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={patientForm.dateOfBirth}
                  onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  placeholder="35"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={patientForm.gender}
                  onValueChange={(value) => setPatientForm({ ...patientForm, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Information */}
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={patientForm.address}
                onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                placeholder="Street address, city, state, ZIP"
                rows={2}
              />
            </div>

            {/* Emergency Contact */}
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={patientForm.emergencyContact}
                  onChange={(e) => setPatientForm({ ...patientForm, emergencyContact: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={patientForm.emergencyContactPhone}
                  onChange={(e) => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Medical Information */}
            <Separator />
            <div>
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                value={patientForm.medicalHistory}
                onChange={(e) => setPatientForm({ ...patientForm, medicalHistory: e.target.value })}
                placeholder="Previous conditions, surgeries, etc."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={patientForm.allergies}
                  onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                  placeholder="Drug allergies, food allergies, etc."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="currentMedications">Current Medications</Label>
                <Textarea
                  id="currentMedications"
                  value={patientForm.currentMedications}
                  onChange={(e) => setPatientForm({ ...patientForm, currentMedications: e.target.value })}
                  placeholder="List current medications"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select
                value={patientForm.bloodType}
                onValueChange={(value) => setPatientForm({ ...patientForm, bloodType: value })}
              >
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPatientDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePatient}
              disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
            >
              {editingPatient ? "Update Patient" : "Create Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Patient Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Patient</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Are you sure you want to archive {patientToDelete?.first_name} {patientToDelete?.last_name}?</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
                  <p className="font-medium mb-1">✓ Data is SAFE:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>All medical records are preserved</li>
                    <li>Patient will be hidden from active list</li>
                    <li>Can be restored from Data Recovery page</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => patientToDelete && deletePatientMutation.mutate(patientToDelete.id)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Book Appointment Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment for {selectedPatientForBooking?.first_name} {selectedPatientForBooking?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="clinicSession">Clinic Session *</Label>
              <Select
                value={bookingForm.clinicSessionId}
                onValueChange={(value) => setBookingForm({ ...bookingForm, clinicSessionId: value })}
              >
                <SelectTrigger id="clinicSession">
                  <SelectValue placeholder="Select clinic session" />
                </SelectTrigger>
                <SelectContent>
                  {upcomingClinics.map((clinic: any) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.hospital?.name} - {format(new Date(clinic.session_date), "MMM dd, yyyy")} ({clinic.start_time} - {clinic.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
              <Textarea
                id="chiefComplaint"
                value={bookingForm.chiefComplaint}
                onChange={(e) => setBookingForm({ ...bookingForm, chiefComplaint: e.target.value })}
                placeholder="Reason for consultation..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPriority"
                checked={bookingForm.isPriority}
                onChange={(e) => setBookingForm({ ...bookingForm, isPriority: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPriority" className="cursor-pointer">
                Mark as Priority
              </Label>
            </div>

            {bookingForm.isPriority && (
              <div>
                <Label htmlFor="priorityReason">Priority Reason</Label>
                <Textarea
                  id="priorityReason"
                  value={bookingForm.priorityReason}
                  onChange={(e) => setBookingForm({ ...bookingForm, priorityReason: e.target.value })}
                  placeholder="Reason for priority..."
                  rows={2}
                />
              </div>
            )}

            <div>
              <Label htmlFor="triageNotes">Triage Notes</Label>
              <Textarea
                id="triageNotes"
                value={bookingForm.triageNotes}
                onChange={(e) => setBookingForm({ ...bookingForm, triageNotes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookAppointment}
              disabled={bookAppointmentMutation.isPending}
            >
              {bookAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Care History Dialog */}
      <Dialog open={careDialogOpen} onOpenChange={setCareDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Care History & Management</DialogTitle>
            <DialogDescription>
              Continued care tracking for {selectedPatientForCare?.first_name} {selectedPatientForCare?.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedPatientForCare && (
            <div className="space-y-6">
              {/* Care Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Care Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedPatientForCare.care_tracking?.total_visits > 0 && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <p className="text-sm font-medium text-purple-900">Total Visits</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {selectedPatientForCare.care_tracking.total_visits}
                        </p>
                      </div>
                    )}
                    
                    {selectedPatientForCare.care_tracking?.last_seen && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">Last Seen</p>
                        </div>
                        <p className="text-sm font-semibold text-blue-700">
                          {format(new Date(selectedPatientForCare.care_tracking.last_seen), "MMM dd, yyyy")}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedPatientForCare.care_tracking.days_since_last_seen} days ago
                        </p>
                      </div>
                    )}
                    
                    {selectedPatientForCare.care_tracking?.next_appointment && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarPlus className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium text-green-900">Next Appointment</p>
                        </div>
                        <p className="text-sm font-semibold text-green-700">
                          {format(new Date(selectedPatientForCare.care_tracking.next_appointment), "MMM dd, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Follow-up Recommendations */}
                  {selectedPatientForCare.care_tracking?.follow_up_date && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-900 mb-1">Recommended Follow-up</p>
                          <p className="text-sm text-orange-700">
                            {format(new Date(selectedPatientForCare.care_tracking.follow_up_date), "MMMM dd, yyyy")}
                          </p>
                          {selectedPatientForCare.care_tracking.follow_up_instructions && (
                            <p className="text-sm text-orange-600 mt-2">
                              {selectedPatientForCare.care_tracking.follow_up_instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointment History */}
              {selectedPatientForCare.appointments && selectedPatientForCare.appointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Appointment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPatientForCare.appointments
                        .sort((a: any, b: any) => {
                          const dateA = new Date(a.clinic_sessions?.session_date || a.created_at);
                          const dateB = new Date(b.clinic_sessions?.session_date || b.created_at);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .slice(0, 5)
                        .map((appointment: any) => (
                          <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {appointment.clinic_sessions?.session_date 
                                    ? format(new Date(appointment.clinic_sessions.session_date), "MMM dd, yyyy")
                                    : "Date TBD"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {appointment.chief_complaint || "No complaint recorded"}
                                </p>
                              </div>
                            </div>
                            <Badge variant={appointment.status === "seen" ? "default" : "secondary"}>
                              {appointment.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clinical Cases History */}
              {selectedPatientForCare.clinical_cases && selectedPatientForCare.clinical_cases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Clinical Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPatientForCare.clinical_cases
                        .filter((c: any) => c.consultant_id === currentUser?.id)
                        .sort((a: any, b: any) => {
                          const dateA = new Date(a.case_date);
                          const dateB = new Date(b.case_date);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .slice(0, 5)
                        .map((clinicalCase: any) => (
                          <div key={clinicalCase.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium">
                                    {format(new Date(clinicalCase.case_date), "MMM dd, yyyy")}
                                  </p>
                                  <Badge variant="outline">{clinicalCase.status}</Badge>
                                </div>
                                {clinicalCase.diagnosis && (
                                  <p className="text-sm text-muted-foreground">
                                    {clinicalCase.diagnosis}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    setCareDialogOpen(false);
                    handleOpenBooking(selectedPatientForCare);
                  }}
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Schedule Follow-up
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCareDialogOpen(false);
                    setLocation(`/patients/${selectedPatientForCare.id}`);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Details
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
