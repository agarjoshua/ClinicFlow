import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientAvatar } from "@/components/patient-avatar";
import { Clock, Hospital, Users, AlertCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface DayDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  sessions: any[];
}

export function DayDetailsDialog({ open, onOpenChange, date, sessions }: DayDetailsDialogProps) {
  const [, setLocation] = useLocation();

  if (!date) return null;

  const getTotalAppointments = (session: any) => session.appointments?.length || 0;
  const getPriorityCount = (session: any) => 
    session.appointments?.filter((apt: any) => apt.is_priority).length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No clinic sessions scheduled for this day</p>
            </div>
          ) : (
            sessions.map((session) => {
              const appointmentCount = getTotalAppointments(session);
              const priorityCount = getPriorityCount(session);

              return (
                <Card key={session.id} className="border-l-4" style={{ borderLeftColor: session.hospital?.color || "#3b82f6" }}>
                  <CardContent className="p-4">
                    {/* Session Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Hospital className="w-5 h-5" style={{ color: session.hospital?.color }} />
                          <h3 className="text-lg font-semibold">{session.hospital?.name}</h3>
                          <Badge variant={session.status === "scheduled" ? "default" : "secondary"}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{session.start_time} - {session.end_time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{appointmentCount}/{session.max_patients} patients</span>
                          </div>
                          {priorityCount > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {priorityCount} Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          setLocation(`/clinic-sessions/${session.id}`);
                        }}
                      >
                        View Session
                      </Button>
                    </div>

                    {/* Appointments List */}
                    {session.appointments && session.appointments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Appointments</h4>
                        {session.appointments.map((appointment: any) => (
                          <div
                            key={appointment.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <PatientAvatar
                              firstName={appointment.patient?.first_name}
                              lastName={appointment.patient?.last_name}
                              dateOfBirth={appointment.patient?.date_of_birth}
                              age={appointment.patient?.age}
                              gender={appointment.patient?.gender}
                              size="md"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">
                                  {appointment.patient?.first_name} {appointment.patient?.last_name}
                                </p>
                                {appointment.is_priority && (
                                  <Badge variant="destructive" className="text-xs">
                                    Priority
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <span className="font-mono">{appointment.booking_number}</span>
                                <Badge variant="outline" className="text-xs">
                                  {appointment.status}
                                </Badge>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onOpenChange(false);
                                setLocation(`/patients/${appointment.patient_id}`);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Patient
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {session.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {session.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
