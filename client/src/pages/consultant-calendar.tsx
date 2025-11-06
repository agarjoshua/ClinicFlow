import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Users, Clock, Hospital } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { useLocation } from "wouter";
import { DayDetailsDialog } from "@/components/day-details-dialog";

export default function ConsultantCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get the start of the week containing the first day of the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  // Get the end of the week containing the last day of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

  // Fetch clinic sessions for this month with ALL appointments assigned to this consultant
  const { data: clinicSessions = [], isLoading } = useQuery({
    queryKey: ["clinicSessions", format(monthStart, "yyyy-MM-dd"), currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      // Get all clinic sessions that have appointments for this consultant
      const { data, error } = await supabase
        .from("clinic_sessions")
        .select(`
          *,
          hospital:hospitals(*),
          appointments!inner(
            id,
            booking_number,
            is_priority,
            status,
            chief_complaint,
            consultant_id,
            patient:patients(first_name, last_name, patient_number)
          )
        `)
        .eq("appointments.consultant_id", currentUser.id)
        .gte("session_date", format(calendarStart, "yyyy-MM-dd"))
        .lte("session_date", format(calendarEnd, "yyyy-MM-dd"))
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching clinic sessions:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // Fetch hospitals for quick access
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hospitals")
        .select("*")
        .order("name");
      return data || [];
    },
  });

  const getSessionsForDay = (day: Date) => {
    return clinicSessions.filter(session => 
      isSameDay(parseISO(session.session_date), day)
    );
  };

  const getTotalAppointments = (session: any) => {
    return session.appointments?.length || 0;
  };

  const getPriorityCount = (session: any) => {
    return session.appointments?.filter((apt: any) => apt.is_priority).length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Clinic Calendar
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your clinic sessions across all hospitals
          </p>
        </div>
        <Button 
          onClick={() => setLocation("/schedule-clinic")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule New Clinic
        </Button>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center min-w-[200px]">
              <p className="text-xl font-bold">
                {format(currentMonth, "MMMM yyyy")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </CardHeader>
      </Card>

      {/* Hospital Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Hospital Color Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {hospitals.map((hospital) => (
              <div key={hospital.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: hospital.color }}
                />
                <span className="text-sm font-medium">{hospital.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Calendar Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading your schedule...</p>
        </div>
      ) : !currentUser ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Loading user information...</p>
          </CardContent>
        </Card>
      ) : clinicSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Clinic Sessions This Month</h3>
            <p className="text-gray-500 mb-6">You haven't scheduled any clinic sessions for this month yet.</p>
            <Button 
              onClick={() => setLocation("/schedule-clinic")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Clinic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {daysInCalendar.map((day) => {
                const sessions = getSessionsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={day.toString()}
                    className={`min-h-[120px] p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                      isToday 
                        ? "border-blue-500 bg-blue-50" 
                        : isCurrentMonth 
                        ? "border-gray-200 bg-white" 
                        : "border-gray-100 bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedDate(day);
                      setDialogOpen(true);
                    }}
                  >
                    <div className={`text-right mb-1 ${
                      isToday 
                        ? "text-blue-600 font-bold" 
                        : isCurrentMonth 
                        ? "text-gray-900" 
                        : "text-gray-400"
                    }`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-1">
                      {sessions.length === 0 ? (
                        <div className="text-xs text-gray-300 text-center py-4">
                          {/* Empty day */}
                        </div>
                      ) : (
                        sessions.map((session) => {
                          const appointmentCount = getTotalAppointments(session);
                          const priorityCount = getPriorityCount(session);

                          return (
                            <div
                              key={session.id}
                              className="p-2 rounded border-l-4 bg-white hover:shadow-md transition-all text-xs"
                              style={{ borderLeftColor: session.hospital?.color || "#3b82f6" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/clinic-sessions/${session.id}`);
                              }}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Hospital className="w-3 h-3" />
                                <span className="font-semibold truncate">
                                  {session.hospital?.code || "Hospital"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-gray-600 mb-1">
                                <Clock className="w-2 h-2" />
                                <span className="text-[10px]">{session.start_time}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium text-[10px]">
                                    {appointmentCount}/{session.max_patients}
                                  </span>
                                </div>
                                {priorityCount > 0 && (
                                  <Badge variant="destructive" className="text-[9px] h-4 px-1">
                                    {priorityCount}!
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{clinicSessions.length}</p>
              <p className="text-sm text-gray-500">Clinics This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">
                {clinicSessions.reduce((sum, s) => sum + getTotalAppointments(s), 0)}
              </p>
              <p className="text-sm text-gray-500">Total Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Hospital className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">
                {new Set(clinicSessions.map(s => s.hospital_id)).size}
              </p>
              <p className="text-sm text-gray-500">Hospitals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge className="w-8 h-8 mx-auto mb-2 flex items-center justify-center bg-red-600">!</Badge>
              <p className="text-2xl font-bold">
                {clinicSessions.reduce((sum, s) => sum + getPriorityCount(s), 0)}
              </p>
              <p className="text-sm text-gray-500">Priority Cases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day Details Dialog */}
      <DayDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        sessions={selectedDate ? getSessionsForDay(selectedDate) : []}
      />
    </div>
  );
}
