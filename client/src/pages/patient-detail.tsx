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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  X,
  Image,
  Video,
  Link,
  Eye,
  Download,
  Brain,
  Plus,
  Upload,
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
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  
  // Media management state
  const [addMediaDialogOpen, setAddMediaDialogOpen] = useState(false);
  const [selectedCaseForMedia, setSelectedCaseForMedia] = useState<any>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [newMediaType, setNewMediaType] = useState<"image" | "video" | "link">("image");
  const [newMediaLink, setNewMediaLink] = useState("");
  const [newMediaDescription, setNewMediaDescription] = useState("");
  
  // Clinical case creation state
  const [createCaseDialogOpen, setCreateCaseDialogOpen] = useState(false);
  const [caseSymptoms, setCaseSymptoms] = useState("");
  const [caseDiagnosisNotes, setCaseDiagnosisNotes] = useState("");
  const [caseNeurologicalExam, setCaseNeurologicalExam] = useState("");
  const [caseImagingFindings, setCaseImagingFindings] = useState("");
  const [caseMedications, setCaseMedications] = useState("");
  const [caseTreatmentPlan, setCaseTreatmentPlan] = useState("");
  const [caseMediaItems, setCaseMediaItems] = useState<any[]>([]);
  const [caseMediaType, setCaseMediaType] = useState<"image" | "video" | "link">("image");
  const [caseMediaLink, setCaseMediaLink] = useState("");
  const [caseMediaDescription, setCaseMediaDescription] = useState("");
  const [caseMediaFile, setCaseMediaFile] = useState<File | null>(null);

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

  // Query for clinical cases (diagnoses) with media
  const { data: clinicalCases = [] } = useQuery({
    queryKey: ["patient-clinical-cases", patientId],
    queryFn: async () => {
      const { data: casesData, error: casesError } = await supabase
        .from("clinical_cases")
        .select("*")
        .eq("patient_id", patientId)
        .order("case_date", { ascending: false });

      if (casesError) throw casesError;

      // Fetch medical images for each clinical case
      const casesWithImages = await Promise.all(
        (casesData || []).map(async (clinicalCase: any) => {
          const { data: imagesData, error: imagesError } = await supabase
            .from("medical_images")
            .select("*")
            .eq("clinical_case_id", clinicalCase.id);

          return {
            ...clinicalCase,
            medical_images: imagesError ? [] : (imagesData || []),
          };
        })
      );

      return casesWithImages;
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

  // Add media mutation
  const addMediaMutation = useMutation({
    mutationFn: async ({
      clinicalCaseId,
      file,
      type,
      link,
      description,
    }: {
      clinicalCaseId: string;
      file: File | null;
      type: "image" | "video" | "link";
      link: string;
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!userData) throw new Error("User record not found");

      let fileUrl = link;

      if (file) {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${clinicalCaseId}-${sanitizedFileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("medical-media")
          .upload(fileName, file, {
            cacheControl: '3600',
            contentType: file.type || 'application/octet-stream'
          });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("medical-media")
          .getPublicUrl(fileName);

        fileUrl = publicUrl.publicUrl;
      }

      const { error } = await supabase.from("medical_images").insert({
        clinical_case_id: clinicalCaseId,
        file_type: type,
        image_type: "Photo", // Valid DB constraint value (MRI, CT, X-Ray, Ultrasound, Photo)
        image_url: fileUrl, // Changed from file_url to image_url (actual DB column name)
        file_name: file?.name || "Link",
        file_size: file?.size || null,
        description: description, // User's description goes here
        uploaded_by: userData.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", patientId] });
      setAddMediaDialogOpen(false);
      setNewMediaFile(null);
      setNewMediaLink("");
      setNewMediaDescription("");
      toast({
        title: "Success",
        description: "Media added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add media",
        variant: "destructive",
      });
    },
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      // Get media details first to delete file from storage
      const { data: media } = await supabase
        .from("medical_images")
        .select("image_url, file_type")
        .eq("id", mediaId)
        .single();

      // Delete from storage if it's a file (not a link)
      if (media && media.file_type !== "link" && media.image_url) {
        const fileName = media.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from("medical-media")
            .remove([fileName]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("medical_images")
        .delete()
        .eq("id", mediaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", patientId] });
      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete media",
        variant: "destructive",
      });
    },
  });
  
  // Create clinical case mutation
  const createCaseMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!userData) throw new Error("User record not found");

      const { data, error } = await supabase
        .from("clinical_cases")
        .insert({
          patient_id: patientId,
          consultant_id: userData.id,
          symptoms: caseSymptoms,
          diagnosis_notes: caseDiagnosisNotes,
          neurological_exam: caseNeurologicalExam,
          imaging_findings: caseImagingFindings,
          medications: caseMedications,
          treatment_plan: caseTreatmentPlan,
          case_date: new Date().toISOString().split('T')[0],
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      
      // Upload media files if any
      if (caseMediaItems && caseMediaItems.length > 0) {
        for (const media of caseMediaItems) {
          let fileUrl = media.link;
          
          if (media.file) {
            const sanitizedFileName = media.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${Date.now()}-${data.id}-${sanitizedFileName}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("medical-media")
              .upload(fileName, media.file, {
                cacheControl: '3600',
                contentType: media.file.type || 'application/octet-stream'
              });

            if (uploadError) throw uploadError;

            const { data: publicUrl } = supabase.storage
              .from("medical-media")
              .getPublicUrl(fileName);

            fileUrl = publicUrl.publicUrl;
          }

          await supabase.from("medical_images").insert({
            clinical_case_id: data.id,
            file_type: media.type,
            image_type: "Photo",
            image_url: fileUrl,
            file_name: media.file?.name || "Link",
            file_size: media.file?.size || null,
            description: media.description,
            uploaded_by: userData.id,
          });
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", patientId] });
      toast({
        title: "Success",
        description: "Clinical case created successfully with media",
      });
      handleCloseCreateCaseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create clinical case",
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

  const handleAddMedia = (clinicalCase: any) => {
    setSelectedCaseForMedia(clinicalCase);
    setAddMediaDialogOpen(true);
  };
  
  const handleOpenCreateCaseDialog = () => {
    setCreateCaseDialogOpen(true);
  };
  
  const handleCloseCreateCaseDialog = () => {
    setCreateCaseDialogOpen(false);
    setCaseSymptoms("");
    setCaseDiagnosisNotes("");
    setCaseNeurologicalExam("");
    setCaseImagingFindings("");
    setCaseMedications("");
    setCaseTreatmentPlan("");
    setCaseMediaItems([]);
    setCaseMediaType("image");
    setCaseMediaLink("");
    setCaseMediaDescription("");
    setCaseMediaFile(null);
  };
  
  const handleAddCaseMedia = () => {
    if (caseMediaType === "link" && !caseMediaLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a link URL",
        variant: "destructive",
      });
      return;
    }
    
    if ((caseMediaType === "image" || caseMediaType === "video") && !caseMediaFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    const newMedia = {
      id: Date.now(),
      type: caseMediaType,
      file: caseMediaFile,
      link: caseMediaLink,
      description: caseMediaDescription,
    };

    setCaseMediaItems([...caseMediaItems, newMedia]);
    setCaseMediaFile(null);
    setCaseMediaLink("");
    setCaseMediaDescription("");
    toast({
      title: "Success",
      description: "Media added to clinical case",
    });
  };

  const handleRemoveCaseMedia = (id: number) => {
    setCaseMediaItems(caseMediaItems.filter((m: any) => m.id !== id));
  };

  const handleUploadMedia = () => {
    if (!selectedCaseForMedia) return;
    
    if (newMediaType === "link" && !newMediaLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a link URL",
        variant: "destructive",
      });
      return;
    }

    if ((newMediaType === "image" || newMediaType === "video") && !newMediaFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    addMediaMutation.mutate({
      clinicalCaseId: selectedCaseForMedia.id,
      file: newMediaFile,
      type: newMediaType,
      link: newMediaLink,
      description: newMediaDescription,
    });
  };

  const handleDeleteMedia = (mediaId: string) => {
    if (confirm("Are you sure you want to delete this media?")) {
      deleteMediaMutation.mutate(mediaId);
    }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex flex-wrap gap-2 w-full justify-center sm:w-auto sm:justify-end">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex-1 sm:flex-none"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Patient
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1 sm:flex-none">
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
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex justify-center sm:block">
              <PatientAvatarWithInitials
                firstName={displayPatient.firstName}
                lastName={displayPatient.lastName}
                dateOfBirth={displayPatient.dateOfBirth}
                age={displayPatient.age}
                gender={displayPatient.gender}
                size="xl"
                showInitials={false}
              />
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
                <div className="flex-1 text-center md:text-left">
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <Badge variant="outline" className="font-mono">
                      {patient.patientNumber}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Registered {formatDate(patient.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* Clinical Cases (Diagnoses) - Redesigned */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Brain className="w-6 h-6" />
                Clinical Cases & Medical Records
              </CardTitle>
              <p className="text-sm text-indigo-700 mt-1">
                {clinicalCases.length} {clinicalCases.length === 1 ? 'case' : 'cases'} recorded
              </p>
            </div>
            <Button
              onClick={handleOpenCreateCaseDialog}
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Clinical Case
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {clinicalCases.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No clinical cases recorded yet</p>
              <p className="text-gray-400 text-sm mt-2">Click "Add Clinical Case" to create your first diagnosis</p>
            </div>
          ) : (
            <div className="space-y-6">
              {clinicalCases.map((clinicalCase: any, index: number) => (
                <div key={clinicalCase.id} className="border-l-4 border-indigo-500 bg-white rounded-r-lg shadow-sm hover:shadow-md transition-shadow">
                  {/* Case Header with Media Preview */}
                  <div className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      {/* Media Preview Thumbnail - Prominent Position */}
                      {clinicalCase.medical_images && clinicalCase.medical_images.length > 0 && (
                        <div className="flex-shrink-0 self-center lg:self-start">
                          <button
                            onClick={() => {
                              setSelectedMedia(clinicalCase.medical_images[0]);
                              setMediaDialogOpen(true);
                            }}
                            className="relative group w-32 h-32 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
                          >
                            {clinicalCase.medical_images[0].file_type === "image" ? (
                              <img 
                                src={clinicalCase.medical_images[0].image_url} 
                                alt="Case preview"
                                className="w-full h-full object-cover"
                              />
                            ) : clinicalCase.medical_images[0].file_type === "video" ? (
                              <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                                <Video className="w-12 h-12 text-white" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <Link className="w-12 h-12 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {clinicalCase.medical_images.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full font-medium">
                                +{clinicalCase.medical_images.length - 1}
                              </div>
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* Case Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-3">
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                              {clinicalCase.diagnosis_notes || `Case #${index + 1}`}
                            </h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <UserCircle className="w-4 h-4" />
                                {clinicalCase.consultant?.name || "Unknown"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {clinicalCase.case_date
                                  ? format(new Date(clinicalCase.case_date), "MMM dd, yyyy")
                                  : "No date"}
                              </span>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              clinicalCase.status === "active" 
                                ? "bg-green-50 text-green-700 border-green-300" 
                                : "bg-gray-50 text-gray-700"
                            }
                          >
                            {clinicalCase.status || "active"}
                          </Badge>
                        </div>

                        {/* Condensed Clinical Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                          {clinicalCase.symptoms && (
                            <div className="bg-blue-50 border border-blue-200 p-2 rounded-md">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Symptoms</p>
                              <p className="text-xs text-blue-800 line-clamp-2">{clinicalCase.symptoms}</p>
                            </div>
                          )}
                          {clinicalCase.neurological_exam && (
                            <div className="bg-purple-50 border border-purple-200 p-2 rounded-md">
                              <p className="text-xs font-semibold text-purple-900 mb-1">Neuro Exam</p>
                              <p className="text-xs text-purple-800 line-clamp-2">{clinicalCase.neurological_exam}</p>
                            </div>
                          )}
                          {clinicalCase.imaging_findings && (
                            <div className="bg-orange-50 border border-orange-200 p-2 rounded-md">
                              <p className="text-xs font-semibold text-orange-900 mb-1">Imaging</p>
                              <p className="text-xs text-orange-800 line-clamp-2">{clinicalCase.imaging_findings}</p>
                            </div>
                          )}
                          {clinicalCase.medications && (
                            <div className="bg-green-50 border border-green-200 p-2 rounded-md">
                              <p className="text-xs font-semibold text-green-900 mb-1 flex items-center gap-1">
                                <Pill className="w-3 h-3" />
                                Medications
                              </p>
                              <p className="text-xs text-green-800 line-clamp-2">{clinicalCase.medications}</p>
                            </div>
                          )}
                        </div>

                        {/* Treatment Plan - Full Width */}
                        {clinicalCase.treatment_plan && (
                          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-md">
                            <p className="text-xs font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Treatment Plan
                            </p>
                            <p className="text-sm text-indigo-800">{clinicalCase.treatment_plan}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full Media Gallery - Below Case Info */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Attached Media ({clinicalCase.medical_images?.length || 0})
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddMedia(clinicalCase)}
                          className="flex items-center gap-1 w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Add Media
                        </Button>
                      </div>
                      
                      {clinicalCase.medical_images && clinicalCase.medical_images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {clinicalCase.medical_images.map((media: any) => (
                            <div key={media.id} className="relative group">
                              <button
                                onClick={() => {
                                  setSelectedMedia(media);
                                  setMediaDialogOpen(true);
                                }}
                                className="w-full aspect-square"
                              >
                                <div className="w-full h-full rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all bg-gray-100">
                                  {media.file_type === "image" ? (
                                    <img 
                                      src={media.image_url} 
                                      alt={media.description || "Medical image"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : media.file_type === "video" ? (
                                    <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                                      <Video className="w-6 h-6 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                      <Link className="w-6 h-6 text-white" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                                  </div>
                                </div>
                              </button>
                              
                              {/* Delete button - appears on hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMedia(media.id);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                title="Delete media"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              
                              <p className="text-xs text-gray-600 mt-1 text-center line-clamp-1">
                                {media.image_type || media.description || "Media"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No media attached yet</p>
                          <p className="text-gray-400 text-xs mt-1">Click "Add Media" to upload images, videos, or links</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div
                    className="w-full sm:w-1 h-1 sm:h-16 rounded-full"
                    style={{ backgroundColor: appointment.clinic_session?.hospital?.color || "#3b82f6" }}
                  />
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium">
                        {appointment.clinic_session?.hospital?.name || "Unknown Hospital"}
                      </p>
                      <Badge variant="outline">{appointment.status}</Badge>
                      {appointment.is_priority && (
                        <Badge variant="destructive">Priority</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
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

      {/* Add Media Dialog */}
      <Dialog open={addMediaDialogOpen} onOpenChange={setAddMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Media to Clinical Case</DialogTitle>
            <DialogDescription>
              Upload images, videos, or add links related to this diagnosis
            </DialogDescription>
          </DialogHeader>

          <Tabs value={newMediaType} onValueChange={(v) => setNewMediaType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="image">
                <Image className="w-4 h-4 mr-2" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="w-4 h-4 mr-2" />
                Video
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link className="w-4 h-4 mr-2" />
                Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
              <div>
                <Label>Select Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewMediaFile(e.target.files?.[0] || null)}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div>
                <Label>Select Video</Label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setNewMediaFile(e.target.files?.[0] || null)}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div>
                <Label>Link URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/medical-scan"
                  value={newMediaLink}
                  onChange={(e) => setNewMediaLink(e.target.value)}
                  className="mt-2"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>Description / Category</Label>
            <Input
              placeholder="e.g., MRI Scan, X-Ray, CT Scan, Pre-op Photo"
              value={newMediaDescription}
              onChange={(e) => setNewMediaDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddMediaDialogOpen(false);
                setNewMediaFile(null);
                setNewMediaLink("");
                setNewMediaDescription("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadMedia}
              disabled={addMediaMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {addMediaMutation.isPending ? "Uploading..." : "Upload Media"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media View Dialog */}
      <MediaViewDialog
        media={selectedMedia}
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
      />
      
      {/* Create Clinical Case Dialog */}
      <Dialog open={createCaseDialogOpen} onOpenChange={setCreateCaseDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Create Clinical Case
            </DialogTitle>
            <DialogDescription>
              Patient: {patient?.firstName} {patient?.lastName} (#{patient?.patientNumber})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="case-symptoms">Symptoms</Label>
              <Textarea
                id="case-symptoms"
                placeholder="Document presenting symptoms..."
                value={caseSymptoms}
                onChange={(e) => setCaseSymptoms(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="case-neuro-exam">Neurological Examination</Label>
              <Textarea
                id="case-neuro-exam"
                placeholder="Consciousness level, motor function, sensory function, reflexes, cranial nerves..."
                value={caseNeurologicalExam}
                onChange={(e) => setCaseNeurologicalExam(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="case-imaging">Imaging Findings</Label>
              <Textarea
                id="case-imaging"
                placeholder="MRI/CT scan findings, lesion location, mass effect, edema..."
                value={caseImagingFindings}
                onChange={(e) => setCaseImagingFindings(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="case-diagnosis">Diagnosis Notes</Label>
              <Textarea
                id="case-diagnosis"
                placeholder="Final diagnosis and clinical impression..."
                value={caseDiagnosisNotes}
                onChange={(e) => setCaseDiagnosisNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="case-medications">Medications</Label>
              <Textarea
                id="case-medications"
                placeholder="Prescribed medications, dosages, and frequency..."
                value={caseMedications}
                onChange={(e) => setCaseMedications(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="case-treatment">Treatment Plan</Label>
              <Textarea
                id="case-treatment"
                placeholder="Treatment plan, follow-up, and recommendations..."
                value={caseTreatmentPlan}
                onChange={(e) => setCaseTreatmentPlan(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Media Management */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Media (Images, Videos, Links)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={caseMediaType} onValueChange={(v: any) => setCaseMediaType(v)}>
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                    <TabsTrigger value="image" className="flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      Video
                    </TabsTrigger>
                    <TabsTrigger value="link" className="flex items-center gap-1">
                      <Link className="w-4 h-4" />
                      Link
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="image" className="space-y-4">
                    <div>
                      <Label>Upload Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCaseMediaFile(e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="space-y-4">
                    <div>
                      <Label>Upload Video</Label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setCaseMediaFile(e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="link" className="space-y-4">
                    <div>
                      <Label>Link URL</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com/medical-scan"
                        value={caseMediaLink}
                        onChange={(e) => setCaseMediaLink(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label>Description / Category</Label>
                  <Input
                    placeholder="e.g., MRI Scan, X-Ray, CT Scan, Pre-op Photo"
                    value={caseMediaDescription}
                    onChange={(e) => setCaseMediaDescription(e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCaseMedia}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Media
                </Button>

                {/* Media List */}
                {caseMediaItems.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Added Media ({caseMediaItems.length})</Label>
                    <div className="space-y-2">
                      {caseMediaItems.map((media: any) => (
                        <div
                          key={media.id}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            {media.type === "image" && <Image className="w-4 h-4 text-blue-600" />}
                            {media.type === "video" && <Video className="w-4 h-4 text-red-600" />}
                            {media.type === "link" && <Link className="w-4 h-4 text-green-600" />}
                            <div className="text-sm">
                              <p className="font-medium">{media.description || "No description"}</p>
                              <p className="text-xs text-gray-500">
                                {media.file?.name || media.link || "Link"}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCaseMedia(media.id)}
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateCaseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={() => createCaseMutation.mutate()}
              disabled={createCaseMutation.isPending}
            >
              {createCaseMutation.isPending ? "Creating..." : "Create Clinical Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Media View Dialog Component
function MediaViewDialog({
  media,
  open,
  onOpenChange,
}: {
  media: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media Preview</DialogTitle>
          {media.description && (
            <DialogDescription>{media.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-6 min-h-[400px]">
          {media.file_type === "image" && (
            <img 
              src={media.image_url} 
              alt="Medical image"
              className="max-w-full max-h-[500px] rounded-lg"
            />
          )}
          {media.file_type === "video" && (
            <video 
              controls 
              className="max-w-full max-h-[500px] rounded-lg"
            >
              <source src={media.image_url} />
              Your browser does not support the video tag.
            </video>
          )}
          {media.file_type === "link" && (
            <div className="text-center space-y-4">
              <Link className="w-16 h-16 mx-auto text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 mb-2">External Link:</p>
                <a 
                  href={media.image_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-sm"
                >
                  {media.image_url}
                </a>
              </div>
              <Button
                asChild
                className="mt-4"
              >
                <a 
                  href={media.image_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Open Link
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Type:</strong> {media.file_type}</p>
          {media.image_type && <p><strong>Category:</strong> {media.image_type}</p>}
          {media.file_name && <p><strong>File:</strong> {media.file_name}</p>}
          {media.uploaded_at && (
            <p><strong>Uploaded:</strong> {format(new Date(media.uploaded_at), "MMM dd, yyyy HH:mm")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
