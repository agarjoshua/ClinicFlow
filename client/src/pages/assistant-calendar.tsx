import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Hospital, 
  Clock, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Bell
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function AssistantCalendar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const { clinic } = useClinic();
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

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

      console.log("Assistant calendar - Fetched reminders:", data);
      return data || [];
    },
  });

  // Fetch ALL clinic sessions for this month (not filtered by consultant)
  const { data: clinicSessions = [], isLoading } = useQuery({
    queryKey: ["allClinicSessions", format(monthStart, "yyyy-MM-dd"), clinic?.id],
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
          consultant:users!consultant_id(id, name),
          appointments(
            id,
            booking_number,
            is_priority,
            status,
            chief_complaint,
            consultant_id,
            patient:patients(first_name, last_name, patient_number),
            assigned_consultant:users!consultant_id(id, name)
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
    enabled: !!clinic?.id,
  });

  // Fetch unique hospitals for color legend
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
    return clinicSessions.filter(
      (session) => session.session_date === format(day, "yyyy-MM-dd")
    );
  };

  const getTotalAppointments = (sessions: any[]) => {
    return sessions.reduce((total, session) => {
      return total + (session.appointments?.length || 0);
    }, 0);
  };

  const getPriorityCount = (sessions: any[]) => {
    return sessions.reduce((total, session) => {
      const priorityAppts = session.appointments?.filter((apt: any) => apt.is_priority) || [];
      return total + priorityAppts.length;
    }, 0);
  };

  const getRemindersForDay = (day: Date) => {
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminder_date);
      return reminderDate.toDateString() === day.toDateString();
    });
  };

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Delete clinic session mutation
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("clinic_sessions")
        .delete()
        .eq("id", sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Session Deleted",
        description: "Clinic session deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["allClinicSessions"] });
      setDeleteSessionId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete session",
        variant: "destructive",
      });
    },
  });

  const handleViewSession = (session: any) => {
    console.log("Navigating to session:", session.id);
    setLocation(`/clinic-sessions/${session.id}`);
  };

  const handleEditSession = (session: any) => {
    // Navigate to schedule clinic page with session data for editing
    setLocation(`/schedule-clinic?edit=${session.id}`);
  };

  const handleDeleteSession = (sessionId: string) => {
    setDeleteSessionId(sessionId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Calendar Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">View and manage clinic sessions</p>
            </div>
          </div>
          <Button onClick={() => setLocation("/schedule-clinic")} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Schedule Clinic Session</span>
            <span className="sm:hidden">New Session</span>
          </Button>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-xl sm:text-2xl text-center min-w-[140px] sm:min-w-[200px]">
                  {format(currentMonth, "MMM yyyy")}
                </CardTitle>
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

        {/* Hospital Color Legend */}
        <Card className="hidden sm:block">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
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

        {/* Calendar Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading calendar...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-3 sm:p-6">
              {/* Weekday Headers - Desktop */}
              <div className="hidden sm:grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid - Desktop */}
              <div className="hidden sm:grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const daySessions = getSessionsForDay(day);
                  const dayReminders = getRemindersForDay(day);
                  const totalAppointments = getTotalAppointments(daySessions);
                  const priorityCount = getPriorityCount(daySessions);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "min-h-[140px] p-2 border rounded-lg transition-all duration-200",
                        isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50/70",
                        isCurrentDay && "ring-2 ring-blue-500 shadow-lg"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            "text-sm font-bold px-2 py-0.5 rounded-full",
                            isCurrentMonth ? "text-gray-900" : "text-gray-400",
                            isCurrentDay && "bg-blue-600 text-white"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {totalAppointments > 0 && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-bold",
                              priorityCount > 0 && "bg-red-100 text-red-700"
                            )}
                          >
                            {totalAppointments}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
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
                        {daySessions.map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => handleViewSession(session)}
                            className="w-full text-left"
                          >
                            <div
                              className="p-2 rounded-lg text-white text-xs hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                              style={{ backgroundColor: session.hospital?.color }}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 opacity-90" />
                                    <span className="font-semibold">{session.start_time}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs px-1.5 py-0 bg-white/20 text-white border-0"
                                    >
                                      {session.appointments?.length || 0}
                                    </Badge>
                                    {session.appointments?.some((apt: any) => apt.is_priority) && (
                                      <Badge variant="destructive" className="text-xs px-1.5 py-0 animate-pulse">
                                        !
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 opacity-90">
                                  <Hospital className="w-3 h-3" />
                                  <span className="truncate text-xs font-medium">
                                    {session.hospital?.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 opacity-80">
                                  <Users className="w-3 h-3" />
                                  <span className="truncate text-xs">
                                    {session.consultant?.name || "Unassigned"}
                                  </span>
                                </div>

                                <div className="text-xs opacity-60 mt-1 flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>Click to view details</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar List - Mobile */}
              <div className="space-y-3 sm:hidden">
                {days.map((day) => {
                  const daySessions = getSessionsForDay(day);
                  const dayReminders = getRemindersForDay(day);
                  const totalAppointments = getTotalAppointments(daySessions);
                  const priorityCount = getPriorityCount(daySessions);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isCurrentDay = isToday(day);

                  if (!isCurrentMonth || (daySessions.length === 0 && dayReminders.length === 0)) {
                    return null;
                  }

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        "rounded-xl border p-3 space-y-3 bg-white",
                        isCurrentDay && "border-blue-500 ring-1 ring-blue-500",
                        priorityCount > 0 && "border-red-300 bg-red-50/60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(day, "MMM d")}
                          </p>
                          <p className="text-xs text-gray-500">{format(day, "EEEE")}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-medium",
                              priorityCount > 0 && "bg-red-100 text-red-700"
                            )}
                          >
                            {totalAppointments} patients
                          </Badge>
                          {priorityCount > 0 && (
                            <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
                              {priorityCount} priority
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Reminders */}
                        {dayReminders.map((reminder) => (
                          <div
                            key={reminder.id}
                            className="p-2 rounded-lg text-sm flex items-center gap-2"
                            style={{ backgroundColor: `${reminder.color_code}15`, borderLeft: `3px solid ${reminder.color_code}` }}
                          >
                            <Bell className="w-4 h-4" style={{ color: reminder.color_code }} />
                            <span className="font-medium" style={{ color: reminder.color_code }}>
                              {reminder.title}
                            </span>
                          </div>
                        ))}

                        {/* Sessions */}
                        {daySessions.map((session) => (
                          <div
                            key={session.id}
                            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                          >
                            <div
                              className="h-1"
                              style={{ backgroundColor: session.hospital?.color }}
                            />
                            <div className="p-3 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {session.hospital?.name}
                                  </p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {session.consultant?.name || "Unassigned"}
                                  </p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
                                    <Clock className="w-3 h-3" />
                                    {session.start_time}
                                  </div>
                                  <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                                    {session.appointments?.length || 0} patients
                                  </Badge>
                                </div>
                              </div>

                              {session.appointments?.some((apt: any) => apt.is_priority) && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                  <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
                                    Priority cases
                                  </Badge>
                                  <span>Requires attention</span>
                                </div>
                              )}

                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleViewSession(session)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditSession(session)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteSession(session.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Sessions</p>
                  <p className="text-3xl font-bold text-blue-600">{clinicSessions.length}</p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Appointments</p>
                  <p className="text-3xl font-bold text-green-600">
                    {getTotalAppointments(clinicSessions)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All patients</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Priority Cases</p>
                  <p className="text-3xl font-bold text-red-600">
                    {getPriorityCount(clinicSessions)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Urgent attention</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <Badge variant="destructive" className="text-lg px-3 py-1.5">
                    !
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinic Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this clinic session and all associated appointments.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSessionId && deleteSession.mutate(deleteSessionId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
