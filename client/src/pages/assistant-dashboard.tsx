import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  UserPlus, 
  ClipboardList, 
  Activity, 
  AlertCircle,
  Hospital,
  Users,
  Clock,
  Scissors,
  User
} from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function AssistantDashboard() {
  const [, setLocation] = useLocation();
  const { clinic } = useClinic();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLocation("/auth");
        return;
      }
      setIsAuthed(true);
      setIsCheckingAuth(false);
    });
  }, [setLocation]);

  // Fetch today's clinic sessions
  const { data: todayClinics = [] } = useQuery({
    queryKey: ["todayClinics", clinic?.id],
    enabled: isAuthed && !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const today = format(new Date(), "yyyy-MM-dd");
      console.log("Fetching clinics for:", today);
      
      // First get clinic's hospital IDs
      const { data: hospitalData } = await supabase
        .from("hospitals")
        .select("id")
        .eq("clinic_id", clinic.id);
      
      if (!hospitalData || hospitalData.length === 0) return [];
      const hospitalIds = hospitalData.map(h => h.id);
      
      // Then filter sessions by those hospitals
      const { data, error } = await supabase
        .from("clinic_sessions")
        .select(`
          id,
          hospital_id,
          consultant_id,
          session_date,
          start_time,
          end_time,
          max_patients,
          status,
          notes,
          hospital:hospitals(id, name, code, color),
          consultant:users!consultant_id(id, name),
          appointments(id, booking_number, status, is_priority)
        `)
        .in("hospital_id", hospitalIds)
        .eq("session_date", today)
        .eq("status", "scheduled")
        .order("start_time");
      
      if (error) console.error("Clinic sessions error:", error);
      console.log("Clinics data:", data);
      return data || [];
    },
  });

  // Fetch pending triage appointments
  const { data: pendingTriage = [] } = useQuery({
    queryKey: ["pendingTriage", clinic?.id],
    enabled: isAuthed && !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      console.log("Fetching pending triage appointments");
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          clinic_session_id,
          patient_id,
          booking_number,
          chief_complaint,
          is_priority,
          priority_reason,
          triage_notes,
          status,
          patient:patients(id, first_name, last_name, patient_number),
          clinic_session:clinic_sessions(id, session_date, start_time, hospital:hospitals(id, name, code, color))
        `)
        .eq("clinic_id", clinic.id)
        .eq("status", "booked")
        .is("triage_notes", null)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) console.error("Pending triage error:", error);
      console.log("Pending triage data:", data);
      return data || [];
    },
  });

  // Fetch active post-op patients
  const { data: activePostOp = [] } = useQuery({
    queryKey: ["activePostOp", clinic?.id],
    enabled: isAuthed && !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      console.log("Fetching active post-op patients");
      // First get all procedures marked as done
      const { data: procedures, error: procError } = await supabase
        .from("procedures")
        .select(`
          id,
          clinical_case_id,
          patient_id,
          hospital_id,
          consultant_id,
          procedure_type,
          scheduled_date,
          scheduled_time,
          actual_date,
          actual_time,
          status,
          patient:patients(id, first_name, last_name, patient_number),
          hospital:hospitals(id, name, code, color),
          post_op_updates(id, update_date, day_post_op, gcs_score)
        `)
        .eq("clinic_id", clinic.id)
        .eq("status", "done")
        .order("actual_date", { ascending: false });

      if (procError) console.error("Procedures fetch error:", procError);
      console.log("All done procedures:", procedures);

      // Filter out those that have been discharged
      if (!procedures) return [];
      
      const { data: dischargedIds, error: discError } = await supabase
        .from("discharges")
        .select("procedure_id");
      
      if (discError) console.error("Discharges fetch error:", discError);
      console.log("Discharged procedure IDs:", dischargedIds);
      
      const dischargedProcedureIds = new Set(dischargedIds?.map(d => d.procedure_id) || []);
      const activePostOpProcedures = procedures.filter(p => !dischargedProcedureIds.has(p.id)).slice(0, 10);
      console.log("Active post-op procedures:", activePostOpProcedures);
      
      return activePostOpProcedures;
    },
  });

  // Fetch upcoming procedures
  const { data: upcomingProcedures = [] } = useQuery({
    queryKey: ["upcomingProcedures", clinic?.id],
    enabled: isAuthed && !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const today = format(new Date(), "yyyy-MM-dd");
      console.log("Fetching upcoming procedures for:", today);
      const { data, error } = await supabase
        .from("procedures")
        .select(`
          id,
          clinical_case_id,
          patient_id,
          hospital_id,
          consultant_id,
          procedure_type,
          scheduled_date,
          scheduled_time,
          status,
          patient:patients(id, first_name, last_name, patient_number),
          hospital:hospitals(id, name, code, color),
          consultant:users!consultant_id(id, name)
        `)
        .eq("clinic_id", clinic.id)
        .eq("status", "scheduled")
        .gte("scheduled_date", today)
        .order("scheduled_date")
        .order("scheduled_time")
        .limit(5);
      
      if (error) console.error("Upcoming procedures error:", error);
      console.log("Upcoming procedures data:", data);
      return data || [];
    },
  });

  const getLatestPostOpDay = (procedure: any) => {
    if (!procedure.post_op_updates || procedure.post_op_updates.length === 0) {
      return 0;
    }
    return Math.max(...procedure.post_op_updates.map((u: any) => u.day_post_op));
  };

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (redirecting)
  if (!isAuthed) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Assistant Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Today's tasks and patient management
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setLocation("/appointments/new")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{todayClinics.length}</p>
              <p className="text-sm text-gray-500">Clinics Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{pendingTriage.length}</p>
              <p className="text-sm text-gray-500">Pending Triage</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{activePostOp.length}</p>
              <p className="text-sm text-gray-500">Active Post-Op</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{upcomingProcedures.length}</p>
              <p className="text-sm text-gray-500">Upcoming Procedures</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Clinics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Clinics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClinics.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No clinics scheduled for today
              </p>
            ) : (
              todayClinics.map((clinic: any) => (
                <div
                  key={clinic.id}
                  className="p-4 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  style={{ borderLeftColor: clinic.hospital?.color || "#3b82f6" }}
                  onClick={() => setLocation(`/clinic-sessions/${clinic.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <Hospital className="w-4 h-4" />
                        {clinic.hospital?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr. {clinic.consultant?.name}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {clinic.appointments?.length || 0}/{clinic.max_patients}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {clinic.start_time} - {clinic.end_time}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Triage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Pending Triage
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/triage")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTriage.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No pending triage
              </p>
            ) : (
              pendingTriage.slice(0, 5).map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/triage`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {appointment.patient?.first_name} {appointment.patient?.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        #{appointment.patient?.patient_number}
                      </p>
                    </div>
                    {appointment.is_priority && (
                      <Badge variant="destructive" className="text-xs">
                        Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {appointment.chief_complaint}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium" style={{ color: appointment.clinic_session?.hospital?.color }}>
                      {appointment.clinic_session?.hospital?.name}
                    </span>
                    <span>•</span>
                    <span>{format(parseISO(appointment.clinic_session?.session_date), "MMM d")}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Post-Op Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-600" />
              Active Post-Op Patients
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/post-op-updates")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePostOp.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No active post-op patients
              </p>
            ) : (
              activePostOp.slice(0, 5).map((procedure: any) => {
                const dayPostOp = getLatestPostOpDay(procedure);
                const needsUpdate = dayPostOp === 0 || 
                  (procedure.post_op_updates?.[0]?.update_date && 
                   !isToday(parseISO(procedure.post_op_updates[0].update_date)));

                return (
                  <div
                    key={procedure.id}
                    className={`p-4 rounded-lg border ${
                      needsUpdate ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
                    } hover:bg-gray-100 cursor-pointer transition-colors`}
                    onClick={() => setLocation(`/procedures/${procedure.id}/post-op`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {procedure.patient?.first_name} {procedure.patient?.last_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          #{procedure.patient?.patient_number}
                        </p>
                      </div>
                      <Badge variant={needsUpdate ? "destructive" : "secondary"}>
                        Day {dayPostOp}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {procedure.procedure_type}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{procedure.hospital?.name}</span>
                      <span>•</span>
                      <span>{format(parseISO(procedure.actual_date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming Procedures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Upcoming Procedures
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/procedures")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingProcedures.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No upcoming procedures
              </p>
            ) : (
              upcomingProcedures.map((procedure: any) => (
                <div
                  key={procedure.id}
                  className="p-4 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  style={{ borderLeftColor: procedure.hospital?.color || "#8b5cf6" }}
                  onClick={() => {
                    setSelectedProcedure(procedure);
                    setProcedureDialogOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {procedure.patient?.first_name} {procedure.patient?.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        #{procedure.patient?.patient_number}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {format(parseISO(procedure.scheduled_date), "MMM d")}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {procedure.procedure_type}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Hospital className="w-3 h-3" />
                    <span>{procedure.hospital?.name}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{procedure.scheduled_time || "TBD"}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Procedure Details Dialog */}
      <Dialog open={procedureDialogOpen} onOpenChange={setProcedureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-purple-600" />
              Procedure Details
            </DialogTitle>
            <DialogDescription>
              View complete procedure information
            </DialogDescription>
          </DialogHeader>
          {selectedProcedure && (
            <div className="space-y-4">
              {/* Patient Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold">Patient Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">
                        {selectedProcedure.patient?.first_name} {selectedProcedure.patient?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient #:</span>
                      <span className="font-mono">{selectedProcedure.patient?.patient_number}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Procedure Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Scissors className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Procedure Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedProcedure.procedure_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge>{selectedProcedure.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled Date:</span>
                      <span className="font-medium">
                        {format(parseISO(selectedProcedure.scheduled_date), "MMM dd, yyyy")}
                      </span>
                    </div>
                    {selectedProcedure.scheduled_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scheduled Time:</span>
                        <span className="font-medium">{selectedProcedure.scheduled_time}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hospital:</span>
                      <span className="font-medium" style={{ color: selectedProcedure.hospital?.color }}>
                        {selectedProcedure.hospital?.name}
                      </span>
                    </div>
                    {selectedProcedure.consultant && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Consultant:</span>
                        <span className="font-medium">{selectedProcedure.consultant.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setProcedureDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setProcedureDialogOpen(false);
                  setLocation(`/patients/${selectedProcedure.patient?.id}`);
                }}>
                  View Patient
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
