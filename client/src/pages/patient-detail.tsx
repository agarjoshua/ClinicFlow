import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PatientAvatarWithInitials } from "@/components/patient-avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Heart,
  AlertCircle,
  Pill,
  Droplet,
  UserCircle,
  FileText,
  Clock,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format, differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PatientDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id;
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<any>(null);

  // Smart back navigation
  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to patients list if no history
      setLocation("/patients");
    }
  };

  // Query for patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      
      console.log("Raw patient data from DB:", data);
      
      // Transform snake_case to camelCase
      if (data) {
        const transformed = {
          id: data.id,
          patientNumber: data.patient_number,
          firstName: data.first_name,
          lastName: data.last_name,
          dateOfBirth: data.date_of_birth,
          age: data.age,
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          address: data.address,
          emergencyContact: data.emergency_contact,
          emergencyContactPhone: data.emergency_contact_phone,
          medicalHistory: data.medical_history,
          allergies: data.allergies,
          currentMedications: data.current_medications,
          bloodType: data.blood_type,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        console.log("Transformed patient data:", transformed);
        return transformed;
      }
      return data;
    },
    enabled: !!patientId,
  });

  // Query for appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clinic_session:clinic_sessions (
            id,
            session_date,
            start_time,
            hospital:hospitals (
              id,
              name,
              color
            )
          )
        `)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from("patients")
        .update({
          first_name: updatedData.firstName,
          last_name: updatedData.lastName,
          date_of_birth: updatedData.dateOfBirth,
          gender: updatedData.gender,
          blood_type: updatedData.bloodType,
          phone: updatedData.phone,
          email: updatedData.email,
          address: updatedData.address,
          emergency_contact: updatedData.emergencyContact,
          emergency_contact_phone: updatedData.emergencyContactPhone,
          medical_history: updatedData.medicalHistory,
          allergies: updatedData.allergies,
          current_medications: updatedData.currentMedications,
        })
        .eq("id", patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Patient information updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      setLocation("/patients");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete patient",
        variant: "destructive",
      });
    },
  });

  // Initialize edited patient when data loads
  if (patient && !editedPatient && !isEditing) {
    setEditedPatient(patient);
  }

  const handleEdit = () => {
    setEditedPatient(patient);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedPatient(patient);
    setIsEditing(false);
  };

  const handleSave = () => {
    updateMutation.mutate(editedPatient);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedPatient((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (patientLoading || appointmentsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Patient not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const displayPatient = isEditing ? editedPatient : patient;
  const initials = displayPatient.firstName && displayPatient.lastName 
    ? `${displayPatient.firstName[0]}${displayPatient.lastName[0]}`.toUpperCase()
    : "??";
  
  // Calculate age from DOB or use stored age
  let calculatedAge = "N/A";
  if (displayPatient.dateOfBirth) {
    try {
      calculatedAge = differenceInYears(new Date(), new Date(displayPatient.dateOfBirth)).toString();
    } catch (e) {
      console.error("Error calculating age from DOB:", e);
      calculatedAge = displayPatient.age?.toString() || "N/A";
    }
  } else if (displayPatient.age) {
    calculatedAge = displayPatient.age.toString();
  }

  // Format DOB for display
  const formatDOB = (dob: string | null | undefined) => {
    if (!dob) return "N/A";
    try {
      return format(new Date(dob), "MMM dd, yyyy");
    } catch (e) {
      console.error("Error formatting DOB:", dob, e);
      return "Invalid Date";
    }
  };

  // Format any date for display
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Patient
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Patient
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {fullName}? This action cannot be undone.
                      {appointments.length > 0 && (
                        <p className="mt-2 font-medium text-yellow-600">
                          Warning: This patient has {appointments.length} appointment(s) on record.
                        </p>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete Patient"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Patient Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <PatientAvatarWithInitials
              firstName={displayPatient.firstName}
              lastName={displayPatient.lastName}
              dateOfBirth={displayPatient.dateOfBirth}
              age={displayPatient.age}
              gender={displayPatient.gender}
              size="xl"
              showInitials={false}
            />
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={editedPatient.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={editedPatient.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
                  )}
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {patient.patientNumber}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Registered {formatDate(patient.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="font-medium">{calculatedAge} years</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    {isEditing ? (
                      <Select
                        value={editedPatient.gender}
                        onValueChange={(value) => handleInputChange("gender", value)}
                      >
                        <SelectTrigger className="h-7 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{displayPatient.gender || "N/A"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Blood Type</p>
                    {isEditing ? (
                      <Select
                        value={editedPatient.bloodType}
                        onValueChange={(value) => handleInputChange("bloodType", value)}
                      >
                        <SelectTrigger className="h-7 text-sm">
                          <SelectValue />
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
                    ) : (
                      <p className="font-medium">{displayPatient.bloodType || "N/A"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">DOB</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        className="h-7 text-sm"
                        value={editedPatient.dateOfBirth || ""}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">
                        {formatDOB(displayPatient.dateOfBirth)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-600">Phone</p>
              </div>
              {isEditing ? (
                <Input
                  value={editedPatient.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Phone number"
                />
              ) : (
                <p className="text-base">{displayPatient.phone || "N/A"}</p>
              )}
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-600">Email</p>
              </div>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedPatient.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Email address"
                />
              ) : (
                <p className="text-base">{displayPatient.email || "N/A"}</p>
              )}
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-600">Address</p>
              </div>
              {isEditing ? (
                <Textarea
                  value={editedPatient.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full address"
                  rows={3}
                />
              ) : (
                <p className="text-base">{displayPatient.address || "N/A"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-600">Name</p>
              </div>
              {isEditing ? (
                <Input
                  value={editedPatient.emergencyContact || ""}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  placeholder="Emergency contact name"
                />
              ) : (
                <p className="text-base">{displayPatient.emergencyContact || "N/A"}</p>
              )}
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-600">Phone</p>
              </div>
              {isEditing ? (
                <Input
                  value={editedPatient.emergencyContactPhone || ""}
                  onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                  placeholder="Emergency contact phone"
                />
              ) : (
                <p className="text-base">{displayPatient.emergencyContactPhone || "N/A"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-600">Medical History</p>
            </div>
            {isEditing ? (
              <Textarea
                value={editedPatient.medicalHistory || ""}
                onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                placeholder="Enter medical history"
                rows={4}
              />
            ) : (
              <p className="text-base whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                {displayPatient.medicalHistory || "No medical history recorded"}
              </p>
            )}
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-600">Allergies</p>
            </div>
            {isEditing ? (
              <Textarea
                value={editedPatient.allergies || ""}
                onChange={(e) => handleInputChange("allergies", e.target.value)}
                placeholder="Enter allergies"
                rows={3}
              />
            ) : (
              <p className="text-base whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                {displayPatient.allergies || "No known allergies"}
              </p>
            )}
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-600">Current Medications</p>
            </div>
            {isEditing ? (
              <Textarea
                value={editedPatient.currentMedications || ""}
                onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                placeholder="Enter current medications"
                rows={3}
              />
            ) : (
              <p className="text-base whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                {displayPatient.currentMedications || "No current medications"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Appointment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No appointments yet</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment: any) => (
                <div key={appointment.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div 
                    className="w-1 h-16 rounded-full" 
                    style={{ backgroundColor: appointment.clinic_session?.hospital?.color || "#3b82f6" }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {appointment.clinic_session?.hospital?.name || "Unknown Hospital"}
                      </p>
                      <Badge variant="outline">{appointment.status}</Badge>
                      {appointment.is_priority && (
                        <Badge variant="destructive">Priority</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-mono">{appointment.booking_number}</span>
                      {appointment.clinic_session && (
                        <>
                          <span>
                            {appointment.clinic_session.session_date 
                              ? format(new Date(appointment.clinic_session.session_date), "MMM dd, yyyy")
                              : "N/A"
                            }
                          </span>
                          <span>{appointment.clinic_session.start_time}</span>
                        </>
                      )}
                    </div>
                    {appointment.chief_complaint && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Chief Complaint:</span> {appointment.chief_complaint}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
