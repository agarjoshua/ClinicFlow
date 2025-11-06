import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PatientAvatar } from "@/components/patient-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  Hospital,
  Search,
  AlertCircle,
  Eye,
  Activity,
  Thermometer,
  Heart,
  Wind,
  Brain,
  Pill,
  FileText,
  Stethoscope,
  Upload,
  Image,
  Video,
  Link,
  X,
  Download,
} from "lucide-react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Diagnoses() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [diagnosisDialogOpen, setDiagnosisDialogOpen] = useState(false);
  
  // Diagnosis form state
  const [symptoms, setSymptoms] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [neurologicalExam, setNeurologicalExam] = useState("");
  const [imagingFindings, setImagingFindings] = useState("");
  const [medications, setMedications] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  
  // Media state
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [mediaType, setMediaType] = useState<"image" | "video" | "link">("image");
  const [mediaLink, setMediaLink] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [selectedMediaToView, setSelectedMediaToView] = useState<any>(null);
  const [mediaViewDialogOpen, setMediaViewDialogOpen] = useState(false);
  
  // Re-measured vital signs
  const [temperature, setTemperature] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  
  const { toast } = useToast();

  // Fetch confirmed appointments (ready for diagnosis)
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["diagnosis-appointments", hospitalFilter],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients (
            id,
            patient_number,
            first_name,
            last_name,
            date_of_birth,
            age,
            gender,
            phone,
            email,
            allergies,
            current_medications
          ),
          clinic_session:clinic_sessions (
            id,
            session_date,
            start_time,
            end_time,
            hospital:hospitals (
              id,
              name,
              color
            )
          )
        `)
        .eq("status", "confirmed")
        .order("clinic_session(session_date)", { ascending: true })
        .order("booking_number", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Transform the data
      const transformed = (data || []).map((apt: any) => ({
        id: apt.id,
        bookingNumber: apt.booking_number,
        chiefComplaint: apt.chief_complaint,
        isPriority: apt.is_priority,
        priorityReason: apt.priority_reason,
        triageNotes: apt.triage_notes,
        temperature: apt.temperature,
        bloodPressure: apt.blood_pressure,
        heartRate: apt.heart_rate,
        oxygenSaturation: apt.oxygen_saturation,
        status: apt.status,
        createdAt: apt.created_at,
        patient: apt.patient ? {
          id: apt.patient.id,
          patientNumber: apt.patient.patient_number,
          firstName: apt.patient.first_name,
          lastName: apt.patient.last_name,
          dateOfBirth: apt.patient.date_of_birth,
          age: apt.patient.age,
          gender: apt.patient.gender,
          phone: apt.patient.phone,
          email: apt.patient.email,
          allergies: apt.patient.allergies,
          currentMedications: apt.patient.current_medications,
        } : null,
        clinicSession: apt.clinic_session ? {
          id: apt.clinic_session.id,
          sessionDate: apt.clinic_session.session_date,
          startTime: apt.clinic_session.start_time,
          endTime: apt.clinic_session.end_time,
          hospital: apt.clinic_session.hospital,
        } : null,
      }));

      // Filter by hospital if selected
      if (hospitalFilter !== "all") {
        return transformed.filter((apt: any) => 
          apt.clinicSession?.hospital?.id === hospitalFilter
        );
      }

      return transformed;
    },
  });

  // Fetch hospitals for filtering
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Create diagnosis mutation
  const diagnosisMutation = useMutation({
    mutationFn: async ({
      appointmentId,
      patientId,
      diagnosis,
    }: {
      appointmentId: string;
      patientId: string;
      diagnosis: any;
    }) => {
      // Get current user to set as consultant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Get user's consultant record
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!userData) throw new Error("User record not found");

      // Create clinical case
      const { data: clinicalCase, error: caseError } = await supabase
        .from("clinical_cases")
        .insert({
          patient_id: patientId,
          appointment_id: appointmentId,
          consultant_id: userData.id,
          symptoms: diagnosis.symptoms,
          diagnosis_notes: diagnosis.diagnosisNotes,
          neurological_exam: diagnosis.neurologicalExam,
          imaging_findings: diagnosis.imagingFindings,
          medications: diagnosis.medications,
          treatment_plan: diagnosis.treatmentPlan,
          temperature: diagnosis.temperature || null,
          blood_pressure: diagnosis.bloodPressure || null,
          heart_rate: diagnosis.heartRate ? parseInt(diagnosis.heartRate) : null,
          oxygen_saturation: diagnosis.oxygenSaturation ? parseInt(diagnosis.oxygenSaturation) : null,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Upload media files if any
      if (diagnosis.mediaItems && diagnosis.mediaItems.length > 0) {
        for (const media of diagnosis.mediaItems) {
          let fileUrl = media.link; // For links, use the URL directly
          
          if (media.file) {
            try {
              // Upload file to Supabase storage - use flat path without subdirectories
              const sanitizedFileName = media.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
              const fileName = `${Date.now()}-${clinicalCase.id}-${sanitizedFileName}`;
              
              console.log(`Uploading file: ${fileName}, Size: ${media.file.size}, Type: ${media.file.type}`);
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("medical-media")
                .upload(fileName, media.file, {
                  cacheControl: '3600',
                  contentType: media.file.type || 'application/octet-stream'
                });
              
              if (uploadError) {
                if (uploadError.message.includes("Bucket not found")) {
                  throw new Error(
                    "Storage bucket not found. Please create the 'medical-media' storage bucket in Supabase. " +
                    "Go to Storage → Create Bucket → Name: 'medical-media' → Toggle Public → Create"
                  );
                }
                console.error("Storage upload error:", uploadError);
                throw new Error(`Storage upload failed: ${uploadError.message}`);
              }
              
              const { data: publicUrl } = supabase.storage
                .from("medical-media")
                .getPublicUrl(fileName);
              
              fileUrl = publicUrl.publicUrl;
              console.log("File uploaded successfully:", fileUrl);
            } catch (fileError) {
              console.error("File upload error:", fileError);
              throw fileError;
            }
          }

          // Create medical image record
          try {
            await supabase.from("medical_images").insert({
              clinical_case_id: clinicalCase.id,
              file_type: media.type,
              image_type: "Photo", // Valid DB constraint value (MRI, CT, X-Ray, Ultrasound, Photo)
              image_url: fileUrl, // Changed from file_url to image_url (actual DB column name)
              file_name: media.file?.name || "Link",
              file_size: media.file?.size || null,
              description: media.description, // User's description goes here
              uploaded_by: userData.id,
            });
          } catch (dbError) {
            console.error("Database insert error for medical_images:", dbError);
            throw new Error(`Failed to save media metadata: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
          }
        }
      }

      // Update appointment status to "seen"
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "seen" })
        .eq("id", appointmentId);

      if (updateError) throw updateError;

      return clinicalCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnosis-appointments"] });
      toast({
        title: "Success",
        description: "Diagnosis recorded successfully with media",
      });
      setDiagnosisDialogOpen(false);
      resetDiagnosisForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record diagnosis",
        variant: "destructive",
      });
      console.error("Diagnosis error:", error);
    },
  });

  const openDiagnosisDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    // Pre-fill with triage vital signs
    setTemperature(appointment.temperature || "");
    setBloodPressure(appointment.bloodPressure || "");
    setHeartRate(appointment.heartRate?.toString() || "");
    setOxygenSaturation(appointment.oxygenSaturation?.toString() || "");
    setDiagnosisDialogOpen(true);
  };

  const resetDiagnosisForm = () => {
    setSelectedAppointment(null);
    setSymptoms("");
    setDiagnosisNotes("");
    setNeurologicalExam("");
    setImagingFindings("");
    setMedications("");
    setTreatmentPlan("");
    setTemperature("");
    setBloodPressure("");
    setHeartRate("");
    setOxygenSaturation("");
    setMediaItems([]);
    setMediaType("image");
    setMediaLink("");
    setMediaDescription("");
    setMediaFile(null);
  };

  const handleAddMedia = () => {
    if (mediaType === "link" && !mediaLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a link URL",
        variant: "destructive",
      });
      return;
    }
    
    if ((mediaType === "image" || mediaType === "video") && !mediaFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    const newMedia = {
      id: Date.now(),
      type: mediaType,
      file: mediaFile,
      link: mediaLink,
      description: mediaDescription,
    };

    setMediaItems([...mediaItems, newMedia]);
    setMediaFile(null);
    setMediaLink("");
    setMediaDescription("");
    toast({
      title: "Success",
      description: "Media added to diagnosis",
    });
  };

  const handleRemoveMedia = (id: number) => {
    setMediaItems(mediaItems.filter((m: any) => m.id !== id));
  };

  const handleViewMedia = (media: any) => {
    setSelectedMediaToView(media);
    setMediaViewDialogOpen(true);
  };

  const handleSaveDiagnosis = () => {
    if (!selectedAppointment) return;

    diagnosisMutation.mutate({
      appointmentId: selectedAppointment.id,
      patientId: selectedAppointment.patient.id,
      diagnosis: {
        symptoms,
        diagnosisNotes,
        neurologicalExam,
        imagingFindings,
        medications,
        treatmentPlan,
        temperature,
        bloodPressure,
        heartRate,
        oxygenSaturation,
        mediaItems,
      },
    });
  };

  // Filter appointments by search term
  const filteredAppointments = appointments.filter((apt: any) => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${apt.patient?.firstName} ${apt.patient?.lastName}`.toLowerCase();
    const patientNumber = apt.patient?.patientNumber?.toLowerCase() || "";
    const chiefComplaint = apt.chiefComplaint?.toLowerCase() || "";
    
    return (
      patientName.includes(searchLower) ||
      patientNumber.includes(searchLower) ||
      chiefComplaint.includes(searchLower)
    );
  });

  // Separate priority and regular appointments
  const priorityAppointments = filteredAppointments.filter((a: any) => a.isPriority);
  const regularAppointments = filteredAppointments.filter((a: any) => !a.isPriority);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Diagnosis</h1>
          <p className="text-gray-600 mt-1">Record diagnosis for confirmed appointments</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
          <Badge variant="outline" className="text-lg px-4 py-2 flex items-center gap-2 w-full justify-center sm:w-auto">
            <Brain className="w-5 h-5" />
            {filteredAppointments.length} Pending
          </Badge>
          {priorityAppointments.length > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2 flex items-center gap-2 w-full justify-center sm:w-auto">
              <AlertCircle className="w-5 h-5" />
              {priorityAppointments.length} Priority
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by patient name, number, or complaint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full">
              <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitals.map((hospital: any) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Appointments */}
      {priorityAppointments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-red-600">Priority Cases</h2>
          </div>
          {priorityAppointments.map((appointment: any) => (
            <AppointmentDiagnosisCard
              key={appointment.id}
              appointment={appointment}
              onDiagnose={() => openDiagnosisDialog(appointment)}
              onViewPatient={() => setLocation(`/patients/${appointment.patient?.id}`)}
            />
          ))}
        </div>
      )}

      {/* Regular Appointments */}
      <div className="space-y-3">
        {priorityAppointments.length > 0 && (
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Regular Queue</h2>
          </div>
        )}
        {regularAppointments.length === 0 && priorityAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No appointments ready for diagnosis</p>
            </CardContent>
          </Card>
        ) : regularAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No regular appointments in queue</p>
            </CardContent>
          </Card>
        ) : (
          regularAppointments.map((appointment: any) => (
            <AppointmentDiagnosisCard
              key={appointment.id}
              appointment={appointment}
              onDiagnose={() => openDiagnosisDialog(appointment)}
              onViewPatient={() => setLocation(`/patients/${appointment.patient?.id}`)}
            />
          ))
        )}
      </div>

      {/* Diagnosis Dialog */}
      <Dialog open={diagnosisDialogOpen} onOpenChange={setDiagnosisDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Record Diagnosis
            </DialogTitle>
            <DialogDescription>
              Patient: {selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName} 
              {" "}(#{selectedAppointment?.patient?.patientNumber})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Vital Signs (Re-measured)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      Temperature
                    </Label>
                    <Input
                      placeholder="98.6°F"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      Blood Pressure
                    </Label>
                    <Input
                      placeholder="120/80"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Heart Rate
                    </Label>
                    <Input
                      type="number"
                      placeholder="72"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      O2 Saturation
                    </Label>
                    <Input
                      type="number"
                      placeholder="98"
                      value={oxygenSaturation}
                      onChange={(e) => setOxygenSaturation(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient History */}
            {selectedAppointment?.patient && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Chief Complaint: </span>
                      {selectedAppointment.chiefComplaint}
                    </div>
                    {selectedAppointment.patient.allergies && (
                      <div>
                        <span className="font-medium text-red-600">⚠️ Allergies: </span>
                        {selectedAppointment.patient.allergies}
                      </div>
                    )}
                    {selectedAppointment.patient.currentMedications && (
                      <div>
                        <span className="font-medium">Current Medications: </span>
                        {selectedAppointment.patient.currentMedications}
                      </div>
                    )}
                    {selectedAppointment.triageNotes && (
                      <div>
                        <span className="font-medium">Triage Notes: </span>
                        {selectedAppointment.triageNotes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clinical Assessment */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Document presenting symptoms..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="neurologicalExam">Neurological Examination</Label>
                <Textarea
                  id="neurologicalExam"
                  placeholder="Consciousness level, motor function, sensory function, reflexes, cranial nerves..."
                  value={neurologicalExam}
                  onChange={(e) => setNeurologicalExam(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="imagingFindings">Imaging Findings</Label>
                <Textarea
                  id="imagingFindings"
                  placeholder="MRI/CT scan findings, lesion location, mass effect, edema..."
                  value={imagingFindings}
                  onChange={(e) => setImagingFindings(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="diagnosisNotes">Diagnosis Notes</Label>
                <Textarea
                  id="diagnosisNotes"
                  placeholder="Final diagnosis and clinical impression..."
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="medications">Medications</Label>
                <Textarea
                  id="medications"
                  placeholder="Prescribed medications, dosages, and frequency..."
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                <Textarea
                  id="treatmentPlan"
                  placeholder="Treatment plan, follow-up, and recommendations..."
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  rows={3}
                />
              </div>
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
                <Tabs value={mediaType} onValueChange={(v: any) => setMediaType(v)}>
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

                  <TabsContent value="image" className="space-y-3 mt-4">
                    <div>
                      <Label htmlFor="imageFile">Select Image</Label>
                      <Input
                        id="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Supported: JPG, PNG, GIF (max 10MB)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="space-y-3 mt-4">
                    <div>
                      <Label htmlFor="videoFile">Select Video</Label>
                      <Input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Supported: MP4, MOV, AVI (max 100MB)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="link" className="space-y-3 mt-4">
                    <div>
                      <Label htmlFor="mediaLink">Link URL</Label>
                      <Input
                        id="mediaLink"
                        placeholder="https://example.com/media"
                        value={mediaLink}
                        onChange={(e) => setMediaLink(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Paste a link to external media or document
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div>
                  <Label htmlFor="mediaDescription">Description (Optional)</Label>
                  <Input
                    id="mediaDescription"
                    placeholder="e.g., MRI scan, CT imaging, Video demonstration..."
                    value={mediaDescription}
                    onChange={(e) => setMediaDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleAddMedia}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Media to Diagnosis
                </Button>

                {/* Media Items List */}
                {mediaItems.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-medium">Added Media ({mediaItems.length})</h4>
                    {mediaItems.map((media: any) => (
                      <div 
                        key={media.id} 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {media.type === "image" && <Image className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                          {media.type === "video" && <Video className="w-4 h-4 text-red-600 flex-shrink-0" />}
                          {media.type === "link" && <Link className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {media.file?.name || media.link || "Media"}
                            </p>
                            {media.description && (
                              <p className="text-xs text-gray-600 truncate">{media.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewMedia(media)}
                            title="Preview media"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMedia(media.id)}
                            title="Remove media"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDiagnosisDialogOpen(false);
                resetDiagnosisForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDiagnosis}
              disabled={diagnosisMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {diagnosisMutation.isPending ? "Saving..." : "Save Diagnosis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media View Dialog */}
      <Dialog open={mediaViewDialogOpen} onOpenChange={setMediaViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
            {selectedMediaToView?.description && (
              <DialogDescription>{selectedMediaToView.description}</DialogDescription>
            )}
          </DialogHeader>

          {selectedMediaToView && (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-6">
              {selectedMediaToView.type === "image" && selectedMediaToView.file && (
                <img 
                  src={URL.createObjectURL(selectedMediaToView.file)} 
                  alt="Preview"
                  className="max-w-full max-h-[500px]"
                />
              )}
              {selectedMediaToView.type === "video" && selectedMediaToView.file && (
                <video 
                  controls 
                  className="max-w-full max-h-[500px]"
                >
                  <source src={URL.createObjectURL(selectedMediaToView.file)} type={selectedMediaToView.file.type} />
                  Your browser does not support the video tag.
                </video>
              )}
              {selectedMediaToView.type === "link" && (
                <div className="text-center space-y-4">
                  <Link className="w-16 h-16 mx-auto text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Link:</p>
                    <a 
                      href={selectedMediaToView.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all text-sm"
                    >
                      {selectedMediaToView.link}
                    </a>
                  </div>
                  <Button
                    asChild
                    className="mt-4"
                  >
                    <a 
                      href={selectedMediaToView.link} 
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Appointment Card Component
function AppointmentDiagnosisCard({
  appointment,
  onDiagnose,
  onViewPatient,
}: {
  appointment: any;
  onDiagnose: () => void;
  onViewPatient: () => void;
}) {
  return (
    <Card className={`hover-elevate ${appointment.isPriority ? "border-red-300 border-2" : ""}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center xl:items-start xl:gap-6">
            <div
              className="w-full h-1 rounded-full sm:w-1 sm:h-24"
              style={{
                backgroundColor: appointment.clinicSession?.hospital?.color || "#3b82f6",
              }}
            />

            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              <div className="flex flex-col items-center justify-center bg-purple-50 rounded-lg px-4 py-2 w-full sm:w-auto">
                <span className="text-xs text-gray-600">Queue</span>
                <span className="text-2xl font-bold text-purple-600">
                  #{appointment.bookingNumber}
                </span>
              </div>

              <button className="cursor-pointer" onClick={onViewPatient} type="button">
                <PatientAvatar
                  firstName={appointment.patient?.firstName}
                  lastName={appointment.patient?.lastName}
                  dateOfBirth={appointment.patient?.dateOfBirth}
                  age={appointment.patient?.age}
                  gender={appointment.patient?.gender}
                  size="md"
                />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <button className="text-left" onClick={onViewPatient} type="button">
                <h3 className="font-semibold text-lg hover:text-primary">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </h3>
                <p className="text-sm text-gray-600 font-mono">
                  {appointment.patient?.patientNumber}
                </p>
              </button>
              {appointment.isPriority && (
                <Badge variant="destructive" className="text-xs self-start">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Priority
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Hospital
                  className="w-4 h-4"
                  style={{ color: appointment.clinicSession?.hospital?.color }}
                />
                <span>{appointment.clinicSession?.hospital?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {appointment.clinicSession?.sessionDate
                    ? format(parseISO(appointment.clinicSession.sessionDate), "MMM dd, yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{appointment.clinicSession?.startTime || "N/A"}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-2 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
              <p className="text-sm text-gray-900 font-medium">{appointment.chiefComplaint}</p>
            </div>

            {(appointment.temperature || appointment.bloodPressure || appointment.heartRate || appointment.oxygenSaturation) && (
              <div className="bg-green-50 p-2 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-1">Triage Vital Signs:</p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {appointment.temperature && (
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-600" />
                      <span className="font-medium">{appointment.temperature}</span>
                    </div>
                  )}
                  {appointment.bloodPressure && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-600" />
                      <span className="font-medium">{appointment.bloodPressure}</span>
                    </div>
                  )}
                  {appointment.heartRate && (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-pink-600" />
                      <span className="font-medium">{appointment.heartRate} bpm</span>
                    </div>
                  )}
                  {appointment.oxygenSaturation && (
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-blue-600" />
                      <span className="font-medium">{appointment.oxygenSaturation}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span>Age: {appointment.patient?.age || "N/A"}</span>
              <span className="hidden sm:inline">•</span>
              <span>Gender: {appointment.patient?.gender || "N/A"}</span>
              {appointment.patient?.allergies && (
                <span className="text-red-600 font-medium">⚠️ Allergies</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-stretch xl:w-auto xl:flex-col">
            <Button
              onClick={onDiagnose}
              className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap w-full sm:w-auto xl:w-full"
            >
              <Brain className="w-4 h-4 mr-2" />
              Diagnose
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewPatient}
              className="w-full sm:w-auto xl:w-full"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Patient
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
