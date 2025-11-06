import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft, 
  Calendar,
  Clock,
  Hospital,
  Users,
  AlertCircle,
  Eye,
  MapPin,
  Phone,
  Edit,
  Trash2,
  FileText,
  Stethoscope
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function ClinicSessionDetail() {
  const [match, params] = useRoute("/clinic-sessions/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const sessionId = match ? params?.id : undefined;

  // Fetch clinic session - OPTIMIZED WITH SINGLE QUERY
  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ["clinic-session-detail", sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("No session ID provided");
      }

      // Single query with all joins - MUCH faster!
      const { data, error: queryError } = await supabase
        .from("clinic_sessions")
        .select(`
          *,
          hospital:hospitals(*),
          consultant:users!clinic_sessions_consultant_id_fkey(id, name, email, phone),
          appointments(
            *,
            patient:patients(id, first_name, last_name, email, phone, date_of_birth)
          )
        `)
        .eq("id", sessionId)
        .single();

      if (queryError || !data) {
        throw queryError || new Error("Session not found");
      }

      return data;
    },
    enabled: !!sessionId,
    retry: 1,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clinic_sessions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-sessions"] });
      toast({
        title: "Success",
        description: "Clinic session deleted successfully.",
      });
      setLocation("/calendar");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete session.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    window.history.back();
  };

  const handleEdit = () => {
    setLocation(`/schedule-clinic?edit=${sessionId}`);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (sessionId) {
      deleteMutation.mutate(sessionId);
      setDeleteDialogOpen(false);
    }
  };

  // All conditional renders AFTER all hooks
  if (!match) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/calendar")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Calendar
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Clinic Session</h2>
            <p className="text-muted-foreground mb-6">
              The requested clinic session URL is invalid. Please select a session from the calendar.
            </p>
            <Button onClick={() => setLocation("/calendar")}>
              Return to Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading clinic session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Calendar
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Clinic Session Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error?.message || "The clinic session you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => setLocation("/calendar")}>
              Return to Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = sessionData;
  const appointmentCount = session.appointments?.length || 0;

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-6xl space-y-4 sm:space-y-6">
      {/* Header with Back and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
        <Button variant="ghost" onClick={handleBack} className="-ml-2 sm:ml-0 w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Back to Calendar</span>
          <span className="sm:hidden">Back</span>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Badge variant={session.status === "scheduled" ? "default" : "secondary"} className="w-fit">
            {session.status}
          </Badge>
          <Button variant="outline" onClick={handleEdit} size="sm">
            <Edit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          <Button variant="destructive" onClick={handleDelete} size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">Delete</span>
          </Button>
        </div>
      </div>

      {/* Session Overview Card */}
      <Card 
        className="border-l-4" 
        style={{ borderLeftColor: session.hospital?.color || "#3b82f6" }}
      >
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Hospital Icon */}
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg"
              style={{ backgroundColor: session.hospital?.color || "#3b82f6" }}
            >
              {session.hospital?.code || "H"}
            </div>
            
            {/* Session Info */}
            <div className="flex-1 w-full">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">{session.hospital?.name || "Hospital"}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                  <span className="font-medium">
                    {session.session_date 
                      ? format(new Date(session.session_date), "MMM d, yyyy")
                      : "No date set"
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Clock className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                  <span className="font-medium">
                    {session.start_time} - {session.end_time}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                  <span className="font-medium truncate">
                    Dr. {session.consultant?.name || "Not assigned"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Hospital className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                  <span className="font-medium">
                    {appointmentCount} {appointmentCount === 1 ? "patient" : "patients"}
                  </span>
                </div>
              </div>

              {session.hospital?.address && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{session.hospital.address}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      {session.notes && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Session Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-muted-foreground">{session.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Consultant Details */}
      {session.consultant && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Consultant Details</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Avatar className="w-12 sm:w-16 h-12 sm:h-16 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-xl">
                  {session.consultant.name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold">Dr. {session.consultant.name}</h3>
                {session.consultant.email && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.consultant.email}</p>
                )}
                {session.consultant.phone && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span>{session.consultant.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Appointments ({appointmentCount})</span>
            <Button onClick={() => setLocation("/appointments/new")} size="sm" className="w-full sm:w-auto">
              Book Appointment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {appointmentCount === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">No appointments booked yet</p>
              <Button onClick={() => setLocation("/appointments/new")} size="sm">
                Book First Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {session.appointments?.map((appointment: any, index: number) => {
                console.log(`Rendering appointment ${index}:`, appointment);
                return (
                <Card 
                  key={appointment.id || index}
                  className="border-l-4 hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: appointment.is_priority ? "#ef4444" : "#3b82f6" }}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      {/* Patient Info */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <Avatar className="w-10 sm:w-14 h-10 sm:h-14 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm sm:text-lg">
                            {appointment.patient?.first_name?.[0] || "?"}{appointment.patient?.last_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          {/* Patient Name & Status */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm sm:text-lg">
                              {appointment.patient?.first_name || "Unknown"} {appointment.patient?.last_name || "Patient"}
                            </h3>
                            <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                              {appointment.status || "unknown"}
                            </Badge>
                            {appointment.is_priority && (
                              <Badge variant="destructive" className="gap-1 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Priority</span>
                              </Badge>
                            )}
                          </div>

                          {/* Appointment Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                              <span className="font-mono text-xs">#{appointment.booking_number || "No #"}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                              <span className="text-xs">{session.start_time}</span>
                            </div>

                            {appointment.chief_complaint && (
                              <div className="col-span-1 sm:col-span-2 flex items-start gap-2 text-muted-foreground mt-1">
                                <Stethoscope className="w-3 sm:w-4 h-3 sm:h-4 mt-0.5 flex-shrink-0" />
                                <span className="text-xs flex-1">{appointment.chief_complaint}</span>
                              </div>
                            )}

                            {/* Vitals if available */}
                            {(appointment.temperature || appointment.blood_pressure || appointment.heart_rate || appointment.oxygen_saturation) && (
                              <div className="col-span-1 sm:col-span-2 mt-2 p-2 sm:p-3 bg-blue-50 rounded-md">
                                <p className="text-xs font-medium text-blue-900 mb-1">Vitals:</p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                  {appointment.temperature && <div>Temp: {appointment.temperature}</div>}
                                  {appointment.blood_pressure && <div>BP: {appointment.blood_pressure}</div>}
                                  {appointment.heart_rate && <div>HR: {appointment.heart_rate}</div>}
                                  {appointment.oxygen_saturation && <div>SpO2: {appointment.oxygen_saturation}%</div>}
                                </div>
                              </div>
                            )}

                            {appointment.triage_notes && (
                              <div className="col-span-1 sm:col-span-2 mt-2 p-2 sm:p-3 bg-muted/50 rounded-md">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Triage:</p>
                                <p className="text-xs">{appointment.triage_notes}</p>
                              </div>
                            )}

                            {appointment.priority_reason && (
                              <div className="col-span-1 sm:col-span-2 mt-2 p-2 sm:p-3 bg-red-50 rounded-md">
                                <p className="text-xs font-medium text-red-900 mb-1">Priority:</p>
                                <p className="text-xs text-red-800">{appointment.priority_reason}</p>
                              </div>
                            )}

                            {/* Debug info */}
                            <div className="col-span-1 sm:col-span-2 mt-2 text-xs text-muted-foreground border-t pt-2">
                              <div>ID: {appointment.id}</div>
                              <div>Patient ID: {appointment.patient_id}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Stacked on mobile, inline on sm */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/patients/${appointment.patient?.id}`)}
                          className="gap-2 text-xs"
                        >
                          <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="hidden sm:inline">View</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLocation(`/diagnoses?patient=${appointment.patient?.id}&appointment=${appointment.id}`);
                          }}
                          className="gap-2 text-xs"
                        >
                          <Stethoscope className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="hidden sm:inline">Clinical Case</span>
                          <span className="sm:hidden">Case</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLocation(`/appointments/${appointment.id}/edit`);
                          }}
                          className="gap-2 text-xs"
                        >
                          <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinic Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this clinic session?
              
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold text-foreground">
                  {session.hospital?.name}
                </p>
                <p className="text-sm">
                  {session.session_date && format(new Date(session.session_date), "MMMM d, yyyy")} at {session.start_time}
                </p>
                <p className="text-sm">
                  Dr. {session.consultant?.name}
                </p>
              </div>
              
              {appointmentCount > 0 && (
                <p className="mt-4 text-destructive font-medium">
                  ⚠️ Warning: This will also delete {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''}.
                </p>
              )}
              
              <p className="mt-3 text-sm">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
