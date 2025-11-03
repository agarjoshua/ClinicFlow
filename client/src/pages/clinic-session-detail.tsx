import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  Hospital,
  Users,
  AlertCircle,
  Eye,
  MapPin,
  Phone
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";

export default function ClinicSessionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/clinic-sessions/:id");
  const sessionId = params?.id;

  // Smart back navigation
  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to calendar if no history
      setLocation("/");
    }
  };

  const { data: session, isLoading } = useQuery({
    queryKey: ["clinicSession", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_sessions")
        .select(`
          *,
          hospital:hospitals(*),
          consultant:users!clinic_sessions_consultant_id_fkey(id, name, email, phone),
          appointments(
            *,
            patient:patients(*)
          )
        `)
        .eq("id", sessionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading clinic session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Clinic session not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const appointmentCount = session.appointments?.length || 0;
  const priorityCount = session.appointments?.filter((apt: any) => apt.is_priority).length || 0;
  const bookedCount = session.appointments?.filter((apt: any) => apt.status === "booked").length || 0;
  const confirmedCount = session.appointments?.filter((apt: any) => apt.status === "confirmed").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Badge 
          variant={session.status === "scheduled" ? "default" : "secondary"}
          className="text-sm"
        >
          {session.status}
        </Badge>
      </div>

      {/* Session Overview */}
      <Card className="border-l-4" style={{ borderLeftColor: session.hospital?.color || "#3b82f6" }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: session.hospital?.color || "#3b82f6" }}
            >
              {session.hospital?.code || "H"}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{session.hospital?.name}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {session.session_date 
                      ? format(new Date(session.session_date), "EEEE, MMMM d, yyyy")
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{session.start_time} - {session.end_time}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="font-medium">{appointmentCount}/{session.max_patients}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {bookedCount} Booked
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {confirmedCount} Confirmed
                  </Badge>
                </div>
                {priorityCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {priorityCount} Priority
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="w-5 h-5" />
              Hospital Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-600">Address</p>
              </div>
              <p className="text-base">{session.hospital?.address || "N/A"}</p>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-600">Contact</p>
              </div>
              <p className="text-base">{session.hospital?.contact_number || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Consultant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Consultant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                  {session.consultant?.name?.[0]?.toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{session.consultant?.name || "Unknown"}</p>
                <p className="text-sm text-gray-500">{session.consultant?.email || "N/A"}</p>
              </div>
            </div>
            {session.consultant?.phone && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                  </div>
                  <p className="text-base">{session.consultant.phone}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Notes */}
      {session.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Session Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Appointments ({appointmentCount})</span>
            <Button onClick={() => setLocation("/appointments/new")}>
              Book Appointment
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentCount === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No appointments booked yet</p>
              <Button onClick={() => setLocation("/appointments/new")}>
                Book First Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {session.appointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                      {appointment.patient?.firstName && appointment.patient?.lastName
                        ? `${appointment.patient.firstName[0]}${appointment.patient.lastName[0]}`.toUpperCase()
                        : "??"
                      }
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </p>
                      {appointment.is_priority && (
                        <Badge variant="destructive" className="text-xs">
                          Priority
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {appointment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-mono">{appointment.booking_number}</span>
                      {appointment.chief_complaint && (
                        <span className="truncate">{appointment.chief_complaint}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(`/patients/${appointment.patient_id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Patient
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
