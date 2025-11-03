import { PatientAvatar } from "@/components/patient-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Thermometer,
  Heart,
  Wind,
  ClipboardList,
  Pill,
  Upload,
  Plus,
  X,
  Download,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  File,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface DiagnosisDialogContentProps {
  viewMode: "create" | "view";
  selectedAppointment?: any;
  selectedDiagnosis?: any;
  formData: any;
  setFormData: (data: any) => void;
  files: any[];
  newFile: any;
  setNewFile: (file: any) => void;
  addFile: () => void;
  removeFile: (index: number) => void;
  getFileIcon: (type: string) => JSX.Element;
}

export function DiagnosisDialogContent({
  viewMode,
  selectedAppointment,
  selectedDiagnosis,
  formData,
  setFormData,
  files,
  newFile,
  setNewFile,
  addFile,
  removeFile,
  getFileIcon,
}: DiagnosisDialogContentProps) {
  if (viewMode === "create" && selectedAppointment) {
    return (
      <div className="space-y-6">
        {/* Patient Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <PatientAvatar
                firstName={selectedAppointment.patient?.firstName}
                lastName={selectedAppointment.patient?.lastName}
                dateOfBirth={selectedAppointment.patient?.dateOfBirth}
                age={selectedAppointment.patient?.age}
                gender={selectedAppointment.patient?.gender}
                size="lg"
              />
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  Age: {selectedAppointment.patient?.age || "N/A"} • Gender: {selectedAppointment.patient?.gender || "N/A"}
                </p>
                <p className="text-sm text-gray-600 font-mono">{selectedAppointment.patient?.patientNumber}</p>
              </div>
            </div>
            <div className="mt-3 bg-blue-50 p-2 rounded-lg">
              <p className="text-xs font-medium text-gray-700">Chief Complaint:</p>
              <p className="text-sm text-gray-900">{selectedAppointment.chiefComplaint}</p>
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="temperature" className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature
                </Label>
                <Input
                  id="temperature"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="98.6°F"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bloodPressure" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Blood Pressure
                </Label>
                <Input
                  id="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                  placeholder="120/80"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="heartRate" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Heart Rate (bpm)
                </Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                  placeholder="72"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="oxygenSaturation" className="flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  O2 Saturation (%)
                </Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  value={formData.oxygenSaturation}
                  onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                  placeholder="98"
                  max="100"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Clinical Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="symptoms">Symptoms *</Label>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="Patient presenting symptoms..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="diagnosis">Diagnosis *</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="e.g., Chronic Subdural Hematoma"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="diagnosisNotes">Diagnosis Notes</Label>
              <Textarea
                id="diagnosisNotes"
                value={formData.diagnosisNotes}
                onChange={(e) => setFormData({ ...formData, diagnosisNotes: e.target.value })}
                placeholder="Detailed diagnosis notes and findings..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="neurologicalExam">Neurological Examination</Label>
              <Textarea
                id="neurologicalExam"
                value={formData.neurologicalExam}
                onChange={(e) => setFormData({ ...formData, neurologicalExam: e.target.value })}
                placeholder="GCS, motor function, cranial nerves..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="imagingFindings">Imaging Findings</Label>
              <Textarea
                id="imagingFindings"
                value={formData.imagingFindings}
                onChange={(e) => setFormData({ ...formData, imagingFindings: e.target.value })}
                placeholder="CT/MRI findings..."
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Treatment Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Treatment Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medications">Medications</Label>
              <Textarea
                id="medications"
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                placeholder="Prescribed medications and dosages..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="treatmentPlan">Treatment Plan</Label>
              <Textarea
                id="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                placeholder="Overall treatment approach, follow-up plan..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="clinicalNotes">Clinical Notes</Label>
              <Textarea
                id="clinicalNotes"
                value={formData.clinicalNotes}
                onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                placeholder="Additional clinical notes..."
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Files Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Medical Files (Brain Scans, Images, Videos, Documents)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fileType">File Type</Label>
                <Select value={newFile.type} onValueChange={(val) => setNewFile({ ...newFile, type: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Image (MRI, CT, X-Ray)
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video
                      </div>
                    </SelectItem>
                    <SelectItem value="document">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4" />
                        Document
                      </div>
                    </SelectItem>
                    <SelectItem value="link">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        External Link
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  value={newFile.name}
                  onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                  placeholder="Brain_MRI_2025.jpg"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fileUrl">File URL or Link *</Label>
              <Input
                id="fileUrl"
                value={newFile.url}
                onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                placeholder="https://example.com/scans/brain-mri.jpg"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste URL from cloud storage (Dropbox, Google Drive) or PACS system
              </p>
            </div>

            <div>
              <Label htmlFor="fileDescription">Description</Label>
              <Input
                id="fileDescription"
                value={newFile.description}
                onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                placeholder="e.g., Axial T1 MRI showing subdural collection"
                className="mt-1"
              />
            </div>

            <Button type="button" onClick={addFile} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add File
            </Button>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files ({files.length})</Label>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name || file.url}</p>
                      {file.description && <p className="text-xs text-muted-foreground truncate">{file.description}</p>}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
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

  if (viewMode === "view" && selectedDiagnosis) {
    return (
      <div className="space-y-6">
        {/* Patient Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <PatientAvatar
                firstName={selectedDiagnosis.patient?.firstName}
                lastName={selectedDiagnosis.patient?.lastName}
                dateOfBirth={selectedDiagnosis.patient?.dateOfBirth}
                age={selectedDiagnosis.patient?.age}
                gender={selectedDiagnosis.patient?.gender}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedDiagnosis.patient?.firstName} {selectedDiagnosis.patient?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Age: {selectedDiagnosis.patient?.age || "N/A"} • Gender: {selectedDiagnosis.patient?.gender || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 font-mono">{selectedDiagnosis.patient?.patientNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={selectedDiagnosis.status === "active" ? "default" : "secondary"}>
                      {selectedDiagnosis.status}
                    </Badge>
                    {selectedDiagnosis.caseDate && (
                      <Badge variant="outline">{format(parseISO(selectedDiagnosis.caseDate), "MMM dd, yyyy")}</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                  <p className="text-base font-semibold text-gray-900">{selectedDiagnosis.diagnosis}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        {(selectedDiagnosis.temperature ||
          selectedDiagnosis.bloodPressure ||
          selectedDiagnosis.heartRate ||
          selectedDiagnosis.oxygenSaturation) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedDiagnosis.temperature && (
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="font-medium">{selectedDiagnosis.temperature}</p>
                  </div>
                )}
                {selectedDiagnosis.bloodPressure && (
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Pressure</p>
                    <p className="font-medium">{selectedDiagnosis.bloodPressure}</p>
                  </div>
                )}
                {selectedDiagnosis.heartRate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="font-medium">{selectedDiagnosis.heartRate} bpm</p>
                  </div>
                )}
                {selectedDiagnosis.oxygenSaturation && (
                  <div>
                    <p className="text-sm text-muted-foreground">O2 Saturation</p>
                    <p className="font-medium">{selectedDiagnosis.oxygenSaturation}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clinical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clinical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Symptoms</p>
              <p className="text-sm">{selectedDiagnosis.symptoms}</p>
            </div>
            {selectedDiagnosis.diagnosisNotes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Diagnosis Notes</p>
                <p className="text-sm">{selectedDiagnosis.diagnosisNotes}</p>
              </div>
            )}
            {selectedDiagnosis.neurologicalExam && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Neurological Examination</p>
                <p className="text-sm">{selectedDiagnosis.neurologicalExam}</p>
              </div>
            )}
            {selectedDiagnosis.imagingFindings && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Imaging Findings</p>
                <p className="text-sm">{selectedDiagnosis.imagingFindings}</p>
              </div>
            )}
            {selectedDiagnosis.medications && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Medications</p>
                <p className="text-sm">{selectedDiagnosis.medications}</p>
              </div>
            )}
            {selectedDiagnosis.treatmentPlan && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Treatment Plan</p>
                <p className="text-sm">{selectedDiagnosis.treatmentPlan}</p>
              </div>
            )}
            {selectedDiagnosis.clinicalNotes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Clinical Notes</p>
                <p className="text-sm">{selectedDiagnosis.clinicalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Files */}
        {selectedDiagnosis.medicalImages?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Medical Files ({selectedDiagnosis.medicalImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDiagnosis.medicalImages.map((file: any) => (
                  <a
                    key={file.id}
                    href={file.file_url || file.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {getFileIcon(file.file_type || "image")}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name || file.description || "Medical File"}</p>
                      {file.description && <p className="text-xs text-muted-foreground truncate">{file.description}</p>}
                      {file.image_type && <p className="text-xs text-muted-foreground">{file.image_type}</p>}
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
