import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Users, Clock, Hospital, Bell } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { useLocation } from "wouter";
import { DayDetailsDialog } from "@/components/day-details-dialog";

export default function ConsultantCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { clinic } = useClinic();

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

  // Fetch reminders for this month
  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders", format(monthStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("status", "active")
        .gte("reminder_date", format(calendarStart, "yyyy-MM-dd"))
        .lte("reminder_date", format(calendarEnd, "yyyy-MM-dd"))
        .order("reminder_date", { ascending: true });

      if (error) {
        console.error("Error fetching reminders:", error);
        return [];
      }

      console.log("Consultant calendar - Fetched reminders:", data);
      return data || [];
    },
  });

  // Fetch ALL clinic sessions for this clinic (filtered by hospital_id)
  const { data: clinicSessions = [], isLoading } = useQuery({
    queryKey: ["clinicSessions", format(monthStart, "yyyy-MM-dd"), clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
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
          *,
          hospital:hospitals(*),
          appointments(
            id,
            booking_number,
            is_priority,
            status,
            chief_complaint,
            consultant_id,
            patient:patients(first_name, last_name, patient_number)
          )
        `)
        .in("hospital_id", hospitalIds)
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
    enabled: !!clinic?.id && !!currentUser?.id,
  });

  // Fetch hospitals for quick access
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

  const getSessionsForDay = (day: Date) => {
    return clinicSessions.filter(session => 
      isSameDay(parseISO(session.session_date), day)
    );
  };

  const getRemindersForDay = (day: Date) => {
    const filtered = reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminder_date);
      return reminderDate.toDateString() === day.toDateString();
    });
    if (filtered.length > 0) {
      console.log(`Reminders for ${day.toDateString()}:`, filtered);
    }
    return filtered;
  };

  const getTotalAppointments = (session: any) => {
    return session.appointments?.length || 0;
  };

  const getPriorityCount = (session: any) => {
    return session.appointments?.filter((apt: any) => apt.is_priority).length || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Clinic Calendar
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Manage your clinic sessions
            </p>
          </div>
          <Button 
            onClick={() => setLocation("/schedule-clinic")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Schedule New Clinic</span>
            <span className="sm:hidden">New Clinic</span>
          </Button>
        </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[140px] sm:min-w-[200px]">
                <p className="text-lg sm:text-xl font-bold">
                  {format(currentMonth, "MMM yyyy")}
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
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="w-full sm:w-auto"
            >
              Today
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Hospital Legend */}
      <Card className="hidden sm:block">
        <CardHeader>
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
            Hospital Color Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {hospitals.map((hospital) => (
              <div key={hospital.id} className="flex items-center gap-2">
                <div
                  className="w-3 sm:w-4 h-3 sm:h-4 rounded"
                  style={{ backgroundColor: hospital.color }}
                />
                <span className="text-xs sm:text-sm font-medium">{hospital.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders - Next 7 Days */}
      {reminders.filter(r => {
        const reminderDate = new Date(r.reminder_date);
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return reminderDate >= today && reminderDate <= sevenDaysFromNow;
      }).length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Upcoming Reminders (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminders.filter(r => {
                const reminderDate = new Date(r.reminder_date);
                const today = new Date();
                const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return reminderDate >= today && reminderDate <= sevenDaysFromNow;
              }).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg border border-amber-100"
                >
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: reminder.color_code }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {reminder.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(reminder.reminder_date), 'MMM dd, yyyy')}
                      {reminder.description && ` • ${reminder.description}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {reminder.reminder_type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <CalendarIcon className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Clinic Sessions This Month</h3>
            <p className="text-sm text-gray-500 mb-6">You haven't scheduled any clinic sessions for this month yet.</p>
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
          <CardContent className="p-2 sm:p-4">
            {/* Day Headers - Hidden on mobile */}
            <div className="hidden sm:grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-xs sm:text-sm text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days - Grid on desktop, List on mobile */}
            <div className="hidden sm:grid grid-cols-7 gap-2">
              {daysInCalendar.map((day) => {
                const sessions = getSessionsForDay(day);
                const dayReminders = getRemindersForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={day.toString()}
                    className={`min-h-[100px] sm:min-h-[120px] p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
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
                    <div className={`text-right mb-1 text-xs sm:text-sm ${
                      isToday 
                        ? "text-blue-600 font-bold" 
                        : isCurrentMonth 
                        ? "text-gray-900" 
                        : "text-gray-400"
                    }`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-1">
                      {/* Reminders */}
                      {dayReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="p-1.5 rounded text-xs flex items-center gap-1"
                          style={{ backgroundColor: `${reminder.color_code}15`, borderLeft: `3px solid ${reminder.color_code}` }}
                        >
                          <Bell className="w-3 h-3" style={{ color: reminder.color_code }} />
                          <span className="truncate font-medium" style={{ color: reminder.color_code }}>
                            {reminder.title}
                          </span>
                        </div>
                      ))}

                      {/* Sessions */}
                      {sessions.length === 0 && dayReminders.length === 0 ? (
                        <div className="text-xs text-gray-300 text-center py-2 sm:py-4">
                          {/* Empty day */}
                        </div>
                      ) : (
                        sessions.map((session) => {
                          const appointmentCount = getTotalAppointments(session);
                          const priorityCount = getPriorityCount(session);

                          return (
                            <div
                              key={session.id}
                              className="p-1.5 sm:p-2 rounded border-l-4 bg-white hover:shadow-md transition-all text-xs"
                              style={{ borderLeftColor: session.hospital?.color || "#3b82f6" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/clinic-sessions/${session.id}`);
                              }}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Hospital className="w-3 h-3 flex-shrink-0" />
                                <span className="font-semibold truncate text-xs">
                                  {session.hospital?.code || "Hospital"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-gray-600 mb-1">
                                <Clock className="w-2 h-2 flex-shrink-0" />
                                <span className="text-[9px] sm:text-[10px]">{session.start_time}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  <span className="font-medium text-[9px] sm:text-[10px]">
                                    {appointmentCount}/{session.max_patients}
                                  </span>
                                </div>
                                {priorityCount > 0 && (
                                  <Badge variant="destructive" className="text-[8px] sm:text-[9px] h-4 px-1 flex-shrink-0">
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

            {/* Mobile List View */}
            <div className="sm:hidden space-y-2">
              {daysInCalendar.map((day) => {
                const sessions = getSessionsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);

                if (!isCurrentMonth || sessions.length === 0) return null;

                return (
                  <div key={day.toString()} className="space-y-2">
                    <div className={`text-sm font-semibold px-2 py-1 rounded ${isToday ? "bg-blue-100 text-blue-900" : "bg-gray-100"}`}>
                      {format(day, "EEE, MMM d")}
                    </div>
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-lg border-l-4 bg-white border border-gray-200 cursor-pointer active:shadow-md"
                        style={{ borderLeftColor: session.hospital?.color || "#3b82f6" }}
                        onClick={() => setLocation(`/clinic-sessions/${session.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-sm text-gray-900">{session.hospital?.name}</h3>
                            <p className="text-xs text-gray-600 mt-0.5">{session.start_time}</p>
                          </div>
                          {getPriorityCount(session) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {getPriorityCount(session)}!
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {getTotalAppointments(session)}/{session.max_patients}
                          </span>
                        </div>
                      </div>
                    ))}
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
        reminders={reminders}
      />
      </div>
    </div>
  );
}
