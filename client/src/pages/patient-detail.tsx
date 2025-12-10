import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PatientAvatarWithInitials } from "@/components/patient-avatar";
import { Separator } from "@/components/ui/separator";
import APOCDocumentationWizard from "@/components/APOCDocumentationWizard";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
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
  Hospital,
  CheckCircle,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format, differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type AdmissionFormState = {
  hospitalId: string;
  admissionDate: string;
  admissionReason: string;
  diagnosisSummary: string;
  notes: string;
};

type DischargeFormState = {
  dischargeDate: string;
  dischargeSummary: string;
  notes: string;
};

export default function PatientDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id;
  const { toast } = useToast();
  const { clinic } = useClinic();

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
  const [documentationMode, setDocumentationMode] = useState<'legacy' | 'apoc'>('legacy');
  const [selectedCaseForAPOC, setSelectedCaseForAPOC] = useState<any>(null);
  const [apocWizardOpen, setApocWizardOpen] = useState(false);
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
  const [admitDialogOpen, setAdmitDialogOpen] = useState(false);
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [admissionForm, setAdmissionForm] = useState<AdmissionFormState>({
    hospitalId: "",
    admissionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    admissionReason: "",
    diagnosisSummary: "",
    notes: "",
  });
  const [dischargeForm, setDischargeForm] = useState<DischargeFormState>({
    dischargeDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    dischargeSummary: "",
    notes: "",
  });

  // Local storage key for auto-save
  const storageKey = `draft-case-${patientId}`;

  // Load draft from local storage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setCaseSymptoms(draft.symptoms || "");
        setCaseDiagnosisNotes(draft.diagnosisNotes || "");
        setCaseNeurologicalExam(draft.neurologicalExam || "");
        setCaseImagingFindings(draft.imagingFindings || "");
        setCaseMedications(draft.medications || "");
        setCaseTreatmentPlan(draft.treatmentPlan || "");
        
        toast({
          title: "Draft Restored",
          description: "Your previous work has been recovered",
        });
      } catch (e) {
        console.error("Failed to restore draft:", e);
      }
    }
  }, [patientId]);

  // Auto-save to local storage whenever form data changes
  useEffect(() => {
    if (caseSymptoms || caseDiagnosisNotes || caseNeurologicalExam || 
        caseImagingFindings || caseMedications || caseTreatmentPlan) {
      const draft = {
        symptoms: caseSymptoms,
        diagnosisNotes: caseDiagnosisNotes,
        neurologicalExam: caseNeurologicalExam,
        imagingFindings: caseImagingFindings,
        medications: caseMedications,
        treatmentPlan: caseTreatmentPlan,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }
  }, [caseSymptoms, caseDiagnosisNotes, caseNeurologicalExam, 
      caseImagingFindings, caseMedications, caseTreatmentPlan, storageKey]);

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
    queryKey: ["patient", patientId, clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return null;
      
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .eq("clinic_id", clinic.id)
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
          isInpatient: data.is_inpatient,
          currentHospitalId: data.current_hospital_id,
          inpatientAdmittedAt: data.inpatient_admitted_at,
          inpatientNotes: data.inpatient_notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        console.log("Transformed patient data:", transformed);
        return transformed;
      }
      return data;
    },
    enabled: !!clinic?.id && !!patientId,
  });

  // Query for appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["patient-appointments", clinic?.id, patientId],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
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
        .eq("clinic_id", clinic.id)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id && !!patientId,
  });

  // Query for clinical cases (diagnoses) with media
  const { data: clinicalCases = [] } = useQuery({
    queryKey: ["patient-clinical-cases", clinic?.id, patientId],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data: casesData, error: casesError } = await supabase
        .from("clinical_cases")
        .select("*")
        .eq("clinic_id", clinic.id)
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
    enabled: !!clinic?.id && !!patientId,
  });

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ["hospitals", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("hospitals")
        .select("id, name, color")
        .eq("clinic_id", clinic.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinic?.id,
  });

  const { data: admissions = [], isLoading: admissionsLoading } = useQuery({
    queryKey: ["patient-admissions", clinic?.id, patientId],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("patient_admissions")
        .select(`
          *,
          hospital:hospitals (id, name, color)
        `)
        .eq("clinic_id", clinic.id)
        .eq("patient_id", patientId)
        .order("admission_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((admission: any) => ({
        id: admission.id,
        hospitalId: admission.hospital_id,
        hospital: admission.hospital,
        admissionDate: admission.admission_date,
        dischargeDate: admission.discharge_date,
        status: admission.status,
        admissionReason: admission.admission_reason,
        diagnosisSummary: admission.diagnosis_summary,
        dischargeSummary: admission.discharge_summary,
      }));
    },
    enabled: !!clinic?.id && !!patientId,
  });

  const activeAdmission = admissions.find((admission: any) => admission.status === "admitted");

  useEffect(() => {
    if (!admitDialogOpen) return;

    setAdmissionForm({
      hospitalId: patient?.currentHospitalId ?? "",
      admissionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      admissionReason: "",
      diagnosisSummary:
        (clinicalCases?.[0]?.diagnosis as string | undefined) ||
        (clinicalCases?.[0]?.diagnosis_impression as string | undefined) ||
        "",
      notes: patient?.inpatientNotes ?? "",
    });
  }, [admitDialogOpen, patient, clinicalCases]);

  useEffect(() => {
    if (!dischargeDialogOpen) return;

    setDischargeForm({
      dischargeDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      dischargeSummary: activeAdmission?.dischargeSummary ?? "",
      notes: patient?.inpatientNotes ?? "",
    });
  }, [dischargeDialogOpen, activeAdmission, patient]);

  const isInpatient = Boolean(patient?.isInpatient);
  const currentHospital = hospitals.find((hospital: any) => hospital.id === patient?.currentHospitalId);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      if (!clinic?.id) {
        throw new Error("No clinic selected.");
      }
      
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
        .eq("id", patientId)
        .eq("clinic_id", clinic.id);

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

  // Soft delete mutation (marks as deleted, doesn't actually remove data)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!clinic?.id) {
        throw new Error("No clinic selected.");
      }
      
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from("patients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", patientId)
        .eq("clinic_id", clinic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({
        title: "Patient Archived",
        description: "Patient has been archived. Data is preserved and can be recovered from Data Recovery page.",
      });
      setLocation("/patients");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive patient",
        variant: "destructive",
      });
    },
  });

  const admitMutation = useMutation({
    mutationFn: async (payload: AdmissionFormState) => {
      if (!patientId) throw new Error("Missing patient id");
      if (!payload.hospitalId) throw new Error("Select a hospital before admitting");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("You must be signed in to admit a patient");

      const { data: userRecord, error: userLookupError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (userLookupError) throw userLookupError;
      if (!userRecord) throw new Error("Unable to resolve current user record");

  if (!payload.admissionDate) throw new Error("Provide an admission date");

  const admissionDateObj = new Date(payload.admissionDate);
  if (Number.isNaN(admissionDateObj.getTime())) throw new Error("Invalid admission date");

  const admissionDateIso = admissionDateObj.toISOString();

      const { error: admissionError } = await supabase
        .from("patient_admissions")
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          hospital_id: payload.hospitalId,
          consultant_id: userRecord.id,
          admission_reason: payload.admissionReason,
          diagnosis_summary: payload.diagnosisSummary,
          admission_date: admissionDateIso,
          status: "admitted",
          created_by: userRecord.id,
        });

      if (admissionError) throw admissionError;

      const { error: patientUpdateError } = await supabase
        .from("patients")
        .update({
          is_inpatient: true,
          current_hospital_id: payload.hospitalId,
          inpatient_admitted_at: admissionDateIso,
          inpatient_notes: payload.notes,
        })
        .eq("id", patientId)
        .eq("clinic_id", clinic.id);

      if (patientUpdateError) throw patientUpdateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-admissions", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setAdmitDialogOpen(false);
      setAdmissionForm({
        hospitalId: "",
        admissionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        admissionReason: "",
        diagnosisSummary: "",
        notes: "",
      });
      toast({
        title: "Patient admitted",
        description: "Inpatient status updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Admission failed",
        description: error.message || "Unable to admit patient",
        variant: "destructive",
      });
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: async (payload: DischargeFormState) => {
      if (!patientId) throw new Error("Missing patient id");
      if (!activeAdmission) throw new Error("No active admission found for this patient");

  if (!payload.dischargeDate) throw new Error("Provide a discharge date");

  const dischargeDateObj = new Date(payload.dischargeDate);
  if (Number.isNaN(dischargeDateObj.getTime())) throw new Error("Invalid discharge date");

  const dischargeDateIso = dischargeDateObj.toISOString();

      const { error: admissionUpdateError } = await supabase
        .from("patient_admissions")
        .update({
          status: "discharged",
          discharge_date: dischargeDateIso,
          discharge_summary: payload.dischargeSummary,
        })
        .eq("clinic_id", clinic.id)
        .eq("id", activeAdmission.id);

      if (admissionUpdateError) throw admissionUpdateError;

      const { error: patientUpdateError } = await supabase
        .from("patients")
        .update({
          is_inpatient: false,
          current_hospital_id: null,
          inpatient_admitted_at: null,
          inpatient_notes: payload.notes,
        })
        .eq("id", patientId)
        .eq("clinic_id", clinic.id);

      if (patientUpdateError) throw patientUpdateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-admissions", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setDischargeDialogOpen(false);
      setDischargeForm({
        dischargeDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        dischargeSummary: "",
        notes: "",
      });
      toast({
        title: "Patient discharged",
        description: "The patient has been marked as discharged.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Discharge failed",
        description: error.message || "Unable to discharge patient",
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
      queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", clinic?.id, patientId] });
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
      queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", clinic?.id, patientId] });
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

      // For APOC mode, create minimal case
      if (documentationMode === 'apoc') {
        const { data, error } = await supabase
          .from("clinical_cases")
          .insert({
            clinic_id: clinic.id,
            patient_id: patientId,
            consultant_id: userData.id,
            documentation_mode: 'apoc',
            case_date: new Date().toISOString().split('T')[0],
            status: "active",
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Legacy mode - full data entry
      const { data, error } = await supabase
        .from("clinical_cases")
        .insert({
          clinic_id: clinic.id,
          patient_id: patientId,
          consultant_id: userData.id,
          documentation_mode: 'legacy',
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
      
      // Upload media files if any (legacy mode only)
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", clinic?.id, patientId] });
      
      if (documentationMode === 'apoc') {
        // Close create dialog and open APOC wizard
        setCreateCaseDialogOpen(false);
        setSelectedCaseForAPOC(data);
        setApocWizardOpen(true);
        toast({
          title: "Clinical case created",
          description: "Opening APOC documentation wizard...",
        });
      } else {
        toast({
          title: "Success",
          description: "Clinical case created successfully with media",
        });
        handleCloseCreateCaseDialog();
      }
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
    // Clear the auto-saved draft
    localStorage.removeItem(storageKey);
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

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy p");
    } catch (e) {
      console.error("Error formatting date time:", date, e);
      return "Invalid Date";
    }
  };

  const updateAdmissionForm = (field: keyof AdmissionFormState, value: string) => {
    setAdmissionForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDischargeForm = (field: keyof DischargeFormState, value: string) => {
    setDischargeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleInpatientToggle = (nextValue: boolean) => {
    if (nextValue === isInpatient) return;

    if (nextValue) {
      setAdmitDialogOpen(true);
    } else {
      if (!activeAdmission) {
        toast({
          title: "No active admission",
          description: "This patient does not have an active admission to discharge.",
        });
        return;
      }
      setDischargeDialogOpen(true);
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
                    Archive Patient
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive Patient Record</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-2">
                        <p>Are you sure you want to archive {fullName}?</p>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
                          <p className="font-medium mb-1">✓ Data is SAFE:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>All medical records are preserved</li>
                            <li>Appointments, diagnoses, and procedures remain intact</li>
                            <li>Patient will be hidden from active list</li>
                            <li>Can be restored anytime from Data Recovery page</li>
                          </ul>
                        </div>
                        {appointments.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            This patient has {appointments.length} appointment(s) and {clinicalCases.length} clinical case(s) on record. All will be archived but recoverable.
                          </p>
                        )}
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Archiving..." : "Archive Patient"}
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

        {/* Inpatient Management */}
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hospital className="w-5 h-5" />
              Inpatient Management
            </CardTitle>
            <div className="flex items-center gap-3">
              <Switch
                id="inpatient-status-toggle"
                checked={isInpatient}
                onCheckedChange={handleInpatientToggle}
                disabled={admitMutation.isPending || dischargeMutation.isPending || admissionsLoading}
              />
              <Label htmlFor="inpatient-status-toggle" className="text-sm text-muted-foreground">
                {isInpatient ? "Currently admitted" : "Outpatient"}
              </Label>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Badge className={isInpatient ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                  {isInpatient ? "Inpatient" : "Outpatient"}
                </Badge>
                {currentHospital && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {currentHospital.name}
                  </span>
                )}
                {patient?.inpatientAdmittedAt && (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Since {formatDateTime(patient.inpatientAdmittedAt)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                {!isInpatient ? (
                  <Button
                    onClick={() => setAdmitDialogOpen(true)}
                    disabled={admitMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Admit Patient
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => setDischargeDialogOpen(true)}
                    disabled={dischargeMutation.isPending || !activeAdmission}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Discharge Patient
                  </Button>
                )}
              </div>
            </div>

            {isInpatient ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Active admission</AlertTitle>
                <AlertDescription className="space-y-1 text-sm">
                  {activeAdmission?.admissionReason && (
                    <p><span className="font-medium">Reason:</span> {activeAdmission.admissionReason}</p>
                  )}
                  {activeAdmission?.diagnosisSummary && (
                    <p><span className="font-medium">Diagnosis:</span> {activeAdmission.diagnosisSummary}</p>
                  )}
                  {patient?.inpatientNotes && (
                    <p><span className="font-medium">Notes:</span> {patient.inpatientNotes}</p>
                  )}
                  {!activeAdmission && (
                    <p>No admission record linked. Update admission history to keep details in sync.</p>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No active admission</AlertTitle>
                <AlertDescription className="text-sm">
                  Use “Admit Patient” when the patient is admitted to a hospital ward.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Admission History
                </h3>
              </div>
              {admissionsLoading ? (
                <p className="text-sm text-muted-foreground">Loading admissions...</p>
              ) : admissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admissions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {admissions.map((admission: any) => {
                    const statusClass =
                      admission.status === "admitted"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : admission.status === "discharged"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-amber-100 text-amber-700 border-amber-200";

                    return (
                      <div key={admission.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-800">
                              {admission.hospital?.name || "Unknown Hospital"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Admitted {formatDateTime(admission.admissionDate)}
                            </p>
                            {admission.dischargeDate && (
                              <p className="text-xs text-muted-foreground">
                                Discharged {formatDateTime(admission.dischargeDate)}
                              </p>
                            )}
                          </div>
                          <Badge className={statusClass}>
                            {admission.status.charAt(0).toUpperCase() + admission.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          {admission.admissionReason && (
                            <p><span className="font-medium">Reason:</span> {admission.admissionReason}</p>
                          )}
                          {admission.diagnosisSummary && (
                            <p><span className="font-medium">Diagnosis:</span> {admission.diagnosisSummary}</p>
                          )}
                          {admission.dischargeSummary && (
                            <p><span className="font-medium">Discharge summary:</span> {admission.dischargeSummary}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* APOC Documentation System - Primary Entry Point */}
      <Card className="border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-6 h-6" />
                APOC Patient Documentation
              </CardTitle>
              <p className="text-indigo-100 text-sm mt-1">
                Comprehensive structured clinical documentation system
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  setDocumentationMode('apoc');
                  setCreateCaseDialogOpen(true);
                }}
                className="bg-white text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New APOC Documentation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* APOC Cases */}
            {clinicalCases.filter(c => c.documentation_mode === 'apoc').length === 0 ? (
              <div className="text-center py-8 bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200">
                <FileText className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                <p className="text-indigo-700 font-medium">No APOC documentation yet</p>
                <p className="text-indigo-600 text-sm mt-2">
                  Click "New APOC Documentation" to start comprehensive patient assessment
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clinicalCases
                  .filter(c => c.documentation_mode === 'apoc')
                  .map((clinicalCase: any) => (
                    <div key={clinicalCase.id} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-white rounded-r-lg shadow-sm hover:shadow-md transition-all p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-600">
                              {new Date(clinicalCase.case_date).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                              APOC Mode
                            </Badge>
                            {clinicalCase.is_complete && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                ✓ Finalized
                              </Badge>
                            )}
                          </div>
                          <p className="text-base text-gray-800 font-medium truncate">
                            {clinicalCase.chief_complaint || "Assessment in progress..."}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {clinicalCase.diagnosis_impression || clinicalCase.diagnosis_notes || "Diagnosis pending completion"}
                          </p>
                        </div>
                        <div className="flex gap-2 sm:flex-shrink-0">
                          <Button
                            onClick={() => {
                              setSelectedCaseForAPOC(clinicalCase);
                              setApocWizardOpen(true);
                            }}
                            variant="outline"
                            className="border-indigo-600 text-indigo-700 hover:bg-indigo-50 flex-1 sm:flex-none"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">{clinicalCase.is_complete ? 'View/Edit' : 'Continue Documentation'}</span>
                            <span className="sm:hidden">{clinicalCase.is_complete ? 'View' : 'Continue'}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Cases & Medical Records - Legacy Quick Entry */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Brain className="w-6 h-6" />
                Quick Entry Clinical Cases
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {clinicalCases.filter(c => c.documentation_mode !== 'apoc').length} quick entry {clinicalCases.filter(c => c.documentation_mode !== 'apoc').length === 1 ? 'case' : 'cases'}
              </p>
            </div>
            <Button
              onClick={() => {
                setDocumentationMode('legacy');
                setCreateCaseDialogOpen(true);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Entry Case
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {clinicalCases.filter(c => c.documentation_mode !== 'apoc').length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No quick entry cases</p>
              <p className="text-gray-400 text-sm mt-2">Use "Quick Entry Case" for simple documentation or "New APOC Documentation" for comprehensive assessments</p>
            </div>
          ) : (
            <div className="space-y-6">
              {clinicalCases
                .filter(c => c.documentation_mode !== 'apoc')
                .map((clinicalCase: any, index: number) => (
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
                          className="flex items-center gap-1"
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointment History
            </CardTitle>
            <Button
              onClick={() => setLocation(`/appointments/new?patientId=${patientId}`)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>
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

      {/* Admit Patient Dialog */}
      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hospital className="w-5 h-5" />
              Admit Patient
            </DialogTitle>
            <DialogDescription>
              Record the admission details for {patient.firstName} {patient.lastName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="admission-hospital">Hospital</Label>
              <Select
                value={admissionForm.hospitalId}
                onValueChange={(value) => updateAdmissionForm("hospitalId", value)}
                disabled={hospitalsLoading}
              >
                <SelectTrigger id="admission-hospital" className="mt-2">
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitalsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading hospitals...
                    </SelectItem>
                  ) : hospitals.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No hospitals available
                    </SelectItem>
                  ) : (
                    hospitals.map((hospital: any) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="admission-date">Admission Date &amp; Time</Label>
                <Input
                  id="admission-date"
                  type="datetime-local"
                  className="mt-2"
                  value={admissionForm.admissionDate}
                  onChange={(e) => updateAdmissionForm("admissionDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admission-reason">Reason for Admission</Label>
              <Textarea
                id="admission-reason"
                className="mt-2"
                rows={3}
                placeholder="Briefly describe why the patient is being admitted."
                value={admissionForm.admissionReason}
                onChange={(e) => updateAdmissionForm("admissionReason", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="admission-diagnosis">Diagnosis Summary</Label>
              <Textarea
                id="admission-diagnosis"
                className="mt-2"
                rows={3}
                placeholder="Provide a concise diagnosis or working impression."
                value={admissionForm.diagnosisSummary}
                onChange={(e) => updateAdmissionForm("diagnosisSummary", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="admission-notes">Inpatient Notes</Label>
              <Textarea
                id="admission-notes"
                className="mt-2"
                rows={3}
                placeholder="Optional notes for ward staff or follow-up."
                value={admissionForm.notes}
                onChange={(e) => updateAdmissionForm("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => admitMutation.mutate(admissionForm)}
              disabled={admitMutation.isPending || !admissionForm.hospitalId || hospitalsLoading}
            >
              {admitMutation.isPending ? "Admitting..." : "Confirm Admission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discharge Patient Dialog */}
      <Dialog open={dischargeDialogOpen} onOpenChange={setDischargeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Discharge Patient
            </DialogTitle>
            <DialogDescription>
              Finalize the admission and discharge {patient.firstName} {patient.lastName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="discharge-date">Discharge Date &amp; Time</Label>
              <Input
                id="discharge-date"
                type="datetime-local"
                className="mt-2"
                value={dischargeForm.dischargeDate}
                onChange={(e) => updateDischargeForm("dischargeDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="discharge-summary">Discharge Summary</Label>
              <Textarea
                id="discharge-summary"
                className="mt-2"
                rows={3}
                placeholder="Summarize the inpatient stay and discharge plan."
                value={dischargeForm.dischargeSummary}
                onChange={(e) => updateDischargeForm("dischargeSummary", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="discharge-notes">Notes</Label>
              <Textarea
                id="discharge-notes"
                className="mt-2"
                rows={3}
                placeholder="Optional notes or follow-up instructions to keep on the patient record."
                value={dischargeForm.notes}
                onChange={(e) => updateDischargeForm("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDischargeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => dischargeMutation.mutate(dischargeForm)}
              disabled={dischargeMutation.isPending}
            >
              {dischargeMutation.isPending ? "Discharging..." : "Confirm Discharge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {documentationMode === 'apoc' ? (
                  <>
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Create APOC Documentation
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Quick Entry Clinical Case
                  </>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Auto-saving
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Patient: {patient?.firstName} {patient?.lastName} (#{patient?.patientNumber})
              {documentationMode === 'apoc' && (
                <span className="block mt-1 text-indigo-600 font-medium">
                  Comprehensive 12-section structured documentation
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {documentationMode === 'legacy' ? (
              <>
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
              </>
            ) : (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-indigo-900 mb-2">APOC Structured Documentation</h3>
                <p className="text-sm text-indigo-700 mb-4">
                  The case will be created and you'll be guided through a comprehensive 12-section documentation workflow.
                </p>
                <ul className="text-xs text-left text-indigo-600 space-y-1 max-w-md mx-auto">
                  <li>✓ Chief Complaint & History of Presenting Illness</li>
                  <li>✓ Review of Systems & Medical History</li>
                  <li>✓ Vital Signs & Physical Examination</li>
                  <li>✓ Diagnosis, Investigations & Treatment Plan</li>
                  <li>✓ Auto-save every 30 seconds</li>
                  <li>✓ Progress tracking & section completion</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateCaseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={() => createCaseMutation.mutate()}
              disabled={createCaseMutation.isPending}
            >
              {createCaseMutation.isPending ? "Creating..." : documentationMode === 'apoc' ? "Create & Open APOC" : "Create Clinical Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* APOC Documentation Wizard Dialog */}
      {apocWizardOpen && selectedCaseForAPOC && patient && (
        <Dialog open={apocWizardOpen} onOpenChange={setApocWizardOpen}>
          <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0">
            <APOCDocumentationWizard
              clinicalCaseId={selectedCaseForAPOC.id}
              patientId={patientId!}
              patient={{
                firstName: patient.firstName,
                lastName: patient.lastName,
                gender: patient.gender,
                age: patient.age,
              }}
              onComplete={() => {
                setApocWizardOpen(false);
                queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", clinic?.id, patientId] });
              }}
              onCancel={() => {
                setApocWizardOpen(false);
                queryClient.invalidateQueries({ queryKey: ["patient-clinical-cases", clinic?.id, patientId] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
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
