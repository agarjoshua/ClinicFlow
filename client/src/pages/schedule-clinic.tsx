import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ScheduleClinic() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clinic } = useClinic();
  const [date, setDate] = useState<Date>();
  const [hospitalId, setHospitalId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [maxPatients, setMaxPatients] = useState("15");
  const [notes, setNotes] = useState("");

  // Fetch hospitals
  const { data: hospitals } = useQuery({
    queryKey: ["hospitals", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Create clinic session mutation
  const createSession = useMutation({
    mutationFn: async () => {
      if (!date || !hospitalId || !currentUser) {
        throw new Error("Missing required fields");
      }

      const { data, error } = await supabase
        .from("clinic_sessions")
        .insert([
          {
            hospital_id: hospitalId,
            consultant_id: currentUser.id,
            session_date: format(date, "yyyy-MM-dd"),
            start_time: startTime,
            end_time: endTime,
            max_patients: parseInt(maxPatients),
            notes: notes || null,
            status: "scheduled",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Clinic Session Scheduled",
        description: "Your clinic session has been successfully scheduled.",
      });
      window.history.back();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule clinic session",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSession.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calendar
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Clinic Session</h1>
        <p className="text-gray-600 mt-1">Create a new clinic session at one of your hospitals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hospital Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital *
              </label>
              <Select value={hospitalId} onValueChange={setHospitalId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals?.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hospital.color }}
                        />
                        {hospital.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Date *
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !date && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Max Patients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Patients (1-15) *
              </label>
              <Input
                type="number"
                min="1"
                max="15"
                value={maxPatients}
                onChange={(e) => setMaxPatients(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of patients that can be booked for this session
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes about this clinic session..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createSession.isPending || !date || !hospitalId}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createSession.isPending ? "Scheduling..." : "Schedule Clinic Session"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
