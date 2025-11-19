import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  Hospital,
  Search,
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Appointments() {
  const [, setLocation] = useLocation();
  const { clinic } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const { toast } = useToast();

  // Confirm appointment mutation
  const confirmMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      if (!clinic?.id) throw new Error("No clinic selected");
      
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointmentId)
        .eq("clinic_id", clinic.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", clinic?.id] });
      toast({
        title: "Success",
        description: "Appointment confirmed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm appointment",
        variant: "destructive",
      });
    },
  });

  // Fetch all appointments with related data
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
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
            email
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
          ),
          created_by_user:users!appointments_created_by_fkey (
            name
          )
        `)
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data
      return (data || []).map((apt: any) => ({
        id: apt.id,
        bookingNumber: apt.booking_number,
        chiefComplaint: apt.chief_complaint,
        isPriority: apt.is_priority,
        priorityReason: apt.priority_reason,
        triageNotes: apt.triage_notes,
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
        } : null,
        clinicSession: apt.clinic_session ? {
          id: apt.clinic_session.id,
          sessionDate: apt.clinic_session.session_date,
          startTime: apt.clinic_session.start_time,
          endTime: apt.clinic_session.end_time,
          hospital: apt.clinic_session.hospital,
        } : null,
        createdBy: apt.created_by_user?.name || "Unknown",
      }));
    },
    enabled: !!clinic?.id,
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

  // Filter appointments
  const filteredAppointments = appointments.filter((appointment: any) => {
    const patientName = appointment.patient 
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`.toLowerCase()
      : "";
    const patientNumber = appointment.patient?.patientNumber?.toLowerCase() || "";
    const chiefComplaint = appointment.chiefComplaint?.toLowerCase() || "";
    
    const matchesSearch =
      patientName.includes(searchTerm.toLowerCase()) ||
      patientNumber.includes(searchTerm.toLowerCase()) ||
      chiefComplaint.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    const matchesHospital = hospitalFilter === "all" || 
      appointment.clinicSession?.hospital?.id === hospitalFilter;

    return matchesSearch && matchesStatus && matchesHospital;
  });

  // Group appointments by status
  const bookedAppointments = filteredAppointments.filter((a: any) => a.status === "booked");
  const confirmedAppointments = filteredAppointments.filter((a: any) => a.status === "confirmed");
  const seenAppointments = filteredAppointments.filter((a: any) => a.status === "seen");
  const cancelledAppointments = filteredAppointments.filter((a: any) => a.status === "cancelled");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-300";
      case "seen":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "booked":
        return <Calendar className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "seen":
        return <Eye className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: any }) => (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Color Bar */}
          <div 
            className="w-1 h-24 rounded-full"
            style={{ backgroundColor: appointment.clinicSession?.hospital?.color || "#3b82f6" }}
          />

          {/* Patient Avatar */}
          <div 
            className="cursor-pointer"
            onClick={() => setLocation(`/patients/${appointment.patient?.id}`)}
          >
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
              <div 
                className="cursor-pointer"
                onClick={() => setLocation(`/patients/${appointment.patient?.id}`)}
              >
                <h3 className="font-semibold text-lg hover:text-primary">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </h3>
                <p className="text-sm text-gray-600 font-mono">
                  {appointment.patient?.patientNumber}
                </p>
              </div>
              <div className="flex gap-2">
                {appointment.isPriority && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Priority
                  </Badge>
                )}
                <Badge className={getStatusColor(appointment.status)}>
                  {getStatusIcon(appointment.status)}
                  <span className="ml-1">{appointment.status}</span>
                </Badge>
              </div>
            </div>

            {/* Hospital & Date */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Hospital className="w-4 h-4" style={{ color: appointment.clinicSession?.hospital?.color }} />
                <span>{appointment.clinicSession?.hospital?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {appointment.clinicSession?.sessionDate 
                    ? format(parseISO(appointment.clinicSession.sessionDate), "MMM dd, yyyy")
                    : "N/A"
                  }
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{appointment.clinicSession?.startTime || "N/A"}</span>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="bg-gray-50 p-2 rounded-lg mb-2">
              <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
              <p className="text-sm text-gray-600">{appointment.chiefComplaint}</p>
            </div>

            {/* Booking Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Queue: #{appointment.bookingNumber}</span>
                <span>•</span>
                <span>Booked by: {appointment.createdBy}</span>
                <span>•</span>
                <span>
                  {appointment.createdAt 
                    ? format(parseISO(appointment.createdAt), "MMM dd, yyyy HH:mm")
                    : "N/A"
                  }
                </span>
              </div>

              {/* Action Buttons */}
              {appointment.status === "booked" && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmMutation.mutate(appointment.id);
                  }}
                  disabled={confirmMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {confirmMutation.isPending ? "Confirming..." : "Confirm"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">View and manage all appointments</p>
        </div>
        <Button onClick={() => setLocation("/appointments/new")}>
          <UserPlus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Booked</p>
                <p className="text-2xl font-bold text-blue-600">{bookedAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{confirmedAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Seen</p>
                <p className="text-2xl font-bold text-purple-600">{seenAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{cancelledAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="seen">Seen</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

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

      {/* Appointments Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="booked">
            Booked ({bookedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({confirmedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="seen">
            Seen ({seenAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No appointments found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="booked" className="space-y-3">
          {bookedAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No booked appointments</p>
              </CardContent>
            </Card>
          ) : (
            bookedAppointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-3">
          {confirmedAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No confirmed appointments</p>
              </CardContent>
            </Card>
          ) : (
            confirmedAppointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="seen" className="space-y-3">
          {seenAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No seen appointments</p>
              </CardContent>
            </Card>
          ) : (
            seenAppointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-3">
          {cancelledAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No cancelled appointments</p>
              </CardContent>
            </Card>
          ) : (
            cancelledAppointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
