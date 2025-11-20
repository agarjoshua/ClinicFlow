import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ClipboardList,
  Search,
  Plus,
  Edit,
  Eye,
  TrendingUp,
  Activity,
  Zap,
  Thermometer,
} from "lucide-react";
import { useLocation } from "wouter";
import { format, parseISO, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PostOpUpdates() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state for post-op update
  const [dayPostOp, setDayPostOp] = useState(1);
  const [gcsScore, setGcsScore] = useState(15);
  const [motorUR, setMotorUR] = useState(5);
  const [motorUL, setMotorUL] = useState(5);
  const [motorLR, setMotorLR] = useState(5);
  const [motorLL, setMotorLL] = useState(5);
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [improvementNotes, setImprovementNotes] = useState("");
  const [newComplaints, setNewComplaints] = useState("");
  const [neurologicalExam, setNeurologicalExam] = useState("");
  const [woundStatus, setWoundStatus] = useState("");

  const { toast } = useToast();
  const { clinic } = useClinic();

  // Fetch active post-op procedures (done but not discharged)
  const { data: allPostOpUpdates = [], isLoading } = useQuery({
    queryKey: ["allPostOpUpdates", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      // Get all procedures marked as done
      const { data: procedures, error: procError } = await supabase
        .from("procedures")
        .select(`
          id,
          procedure_type,
          actual_date,
          actual_time,
          status,
          patient:patients(
            id,
            patient_number,
            first_name,
            last_name,
            age,
            gender
          ),
          hospital:hospitals(id, name, code, color),
          post_op_updates(
            id,
            update_date,
            day_post_op,
            gcs_score,
            motor_ur,
            motor_ul,
            motor_lr,
            motor_ll,
            blood_pressure,
            pulse,
            temperature,
            wound_status,
            improvement_notes,
            new_complaints
          )
        `)
        .eq("clinic_id", clinic.id)
        .eq("status", "done")
        .order("actual_date", { ascending: false });

      if (procError) throw procError;
      if (!procedures) return [];
      
      // Filter out discharged procedures
      const { data: dischargedIds } = await supabase
        .from("discharges")
        .select("procedure_id");
      
      const dischargedProcedureIds = new Set(dischargedIds?.map(d => d.procedure_id) || []);
      const activePostOp = procedures.filter(p => !dischargedProcedureIds.has(p.id));
      
      return activePostOp;
    },
    enabled: !!clinic?.id,
  });

  // Filter procedures based on search
  const filteredUpdates = allPostOpUpdates.filter(procedure => {
    const patient = procedure?.patient;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient?.first_name?.toLowerCase().includes(searchLower) ||
      patient?.last_name?.toLowerCase().includes(searchLower) ||
      patient?.patient_number?.includes(searchLower)
    );
  });
  
  // Helper function to get latest post-op day
  const getLatestPostOpDay = (procedure: any) => {
    if (!procedure.post_op_updates || procedure.post_op_updates.length === 0) {
      return procedure.actual_date 
        ? differenceInDays(new Date(), new Date(procedure.actual_date))
        : 0;
    }
    const sortedUpdates = [...procedure.post_op_updates].sort((a, b) => 
      new Date(b.update_date).getTime() - new Date(a.update_date).getTime()
    );
    return sortedUpdates[0].day_post_op || 0;
  };

  // Create or update post-op update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const user = await supabase.auth.getUser();
      const updateData = {
        clinic_id: clinic.id,
        procedure_id: data.procedureId,
        update_date: new Date().toISOString().split('T')[0],
        day_post_op: parseInt(data.dayPostOp),
        gcs_score: parseInt(data.gcsScore),
        motor_ur: parseInt(data.motorUR),
        motor_ul: parseInt(data.motorUL),
        motor_lr: parseInt(data.motorLR),
        motor_ll: parseInt(data.motorLL),
        blood_pressure: data.bloodPressure,
        pulse: data.pulse ? parseInt(data.pulse) : null,
        temperature: data.temperature ? parseFloat(data.temperature) : null,
        respiratory_rate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
        spo2: data.spo2 ? parseInt(data.spo2) : null,
        current_medications: data.currentMedications,
        improvement_notes: data.improvementNotes,
        new_complaints: data.newComplaints,
        neurological_exam: data.neurologicalExam,
        wound_status: data.woundStatus,
        updated_by: user.data.user?.id,
      };

      if (editMode && selectedUpdate?.id) {
        const { error } = await supabase
          .from("post_op_updates")
          .update(updateData)
          .eq("clinic_id", clinic.id)
          .eq("id", selectedUpdate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_op_updates")
          .insert([updateData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPostOpUpdates"] });
      toast({
        title: "Success",
        description: editMode ? "Post-op update saved" : "Post-op update recorded",
      });
      setUpdateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save post-op update",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const resetForm = () => {
    setSelectedUpdate(null);
    setEditMode(false);
    setDayPostOp(1);
    setGcsScore(15);
    setMotorUR(5);
    setMotorUL(5);
    setMotorLR(5);
    setMotorLL(5);
    setBloodPressure("");
    setPulse("");
    setTemperature("");
    setRespiratoryRate("");
    setSpo2("");
    setCurrentMedications("");
    setImprovementNotes("");
    setNewComplaints("");
    setNeurologicalExam("");
    setWoundStatus("");
  };

  const openNewUpdateDialog = () => {
    setEditMode(false);
    setSelectedUpdate(null);
    resetForm();
    setUpdateDialogOpen(true);
  };

  const openEditDialog = (update: any) => {
    setEditMode(true);
    setSelectedUpdate(update);
    setDayPostOp(update.day_post_op || 1);
    setGcsScore(update.gcs_score || 15);
    setMotorUR(update.motor_ur || 5);
    setMotorUL(update.motor_ul || 5);
    setMotorLR(update.motor_lr || 5);
    setMotorLL(update.motor_ll || 5);
    setBloodPressure(update.blood_pressure || "");
    setPulse(update.pulse || "");
    setTemperature(update.temperature || "");
    setRespiratoryRate(update.respiratory_rate || "");
    setSpo2(update.spo2 || "");
    setCurrentMedications(update.current_medications || "");
    setImprovementNotes(update.improvement_notes || "");
    setNewComplaints(update.new_complaints || "");
    setNeurologicalExam(update.neurological_exam || "");
    setWoundStatus(update.wound_status || "");
    setUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-green-600" />
              Post-Op Monitoring
            </h1>
            <Badge variant="secondary" className="text-sm font-medium">
              Total: {filteredUpdates.length}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Daily post-operative patient tracking and vitals</p>
        </div>
        <Button 
          onClick={openNewUpdateDialog}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Update
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{allPostOpUpdates.length}</p>
              <p className="text-sm text-gray-500">Active Post-Op</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">
                {allPostOpUpdates.filter(p => p.post_op_updates && p.post_op_updates.length > 0).length}
              </p>
              <p className="text-sm text-gray-500">With Updates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Thermometer className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm text-gray-500 mt-8">Monitoring Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Search className="w-5 h-5 text-gray-400 mt-2.5" />
            <Input
              placeholder="Search by patient name, ID, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Post-Op Updates List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Loading post-op records...</p>
            </CardContent>
          </Card>
        ) : filteredUpdates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No post-op updates found</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
            </CardContent>
          </Card>
        ) : (
          filteredUpdates.map((procedure: any, index: number) => {
            const patient = procedure?.patient;
            const hospital = procedure?.hospital;
            const procedureDate = procedure?.actual_date;
            const daysPostOp = getLatestPostOpDay(procedure);
            
            // Get latest update if exists
            const latestUpdate = procedure.post_op_updates && procedure.post_op_updates.length > 0
              ? [...procedure.post_op_updates].sort((a, b) => 
                  new Date(b.update_date).getTime() - new Date(a.update_date).getTime()
                )[0]
              : null;

            const gcsScore = latestUpdate?.gcs_score || null;
            const gcsStatus = gcsScore ? (gcsScore >= 13 ? "good" : gcsScore >= 9 ? "fair" : "poor") : null;
            const gcsColor = gcsStatus === "good" ? "text-green-600" : gcsStatus === "fair" ? "text-yellow-600" : "text-red-600";

            return (
              <Card 
                key={procedure.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/procedures/${procedure.id}/post-op`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {patient?.first_name} {patient?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            #{patient?.patient_number} • {patient?.age}y • {patient?.gender}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {procedure.procedure_type}
                          </p>
                        </div>
                        <Badge variant={daysPostOp === 0 || !latestUpdate ? "destructive" : "secondary"}>
                          Day {daysPostOp}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {/* GCS Score */}
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">GCS Score</p>
                          <p className={`text-lg font-bold ${gcsScore ? gcsColor : 'text-gray-400'}`}>
                            {gcsScore ? `${gcsScore}/15` : "N/A"}
                          </p>
                        </div>

                        {/* Motor Function */}
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Motor Function</p>
                          <p className="text-xs font-mono mt-1">
                            <span className="block">UR: {latestUpdate?.motor_ur || "-"}</span>
                            <span className="block">UL: {latestUpdate?.motor_ul || "-"}</span>
                          </p>
                        </div>

                        {/* Vital Signs */}
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Vital Signs</p>
                          <p className="text-xs font-mono mt-1">
                            <span className="block">BP: {latestUpdate?.blood_pressure || "-"}</span>
                            <span className="block">HR: {latestUpdate?.pulse || "-"}</span>
                          </p>
                        </div>

                        {/* Wound Status */}
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Wound</p>
                          <Badge variant={latestUpdate?.wound_status === "healthy" ? "default" : "secondary"} className="mt-1 text-xs">
                            {latestUpdate?.wound_status || "N/A"}
                          </Badge>
                        </div>
                      </div>

                      {/* Notes */}
                      {latestUpdate && (latestUpdate.improvement_notes || latestUpdate.new_complaints) && (
                        <div className="mt-3 space-y-2">
                          {latestUpdate.improvement_notes && (
                            <div className="bg-green-50 p-2 rounded text-sm">
                              <p className="font-medium text-green-800">Improvement:</p>
                              <p className="text-green-700">{latestUpdate.improvement_notes}</p>
                            </div>
                          )}
                          {latestUpdate.new_complaints && (
                            <div className="bg-yellow-50 p-2 rounded text-sm">
                              <p className="font-medium text-yellow-800">Concerns:</p>
                              <p className="text-yellow-700">{latestUpdate.new_complaints}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 items-center text-xs text-gray-500 mt-3">
                        <span style={{ color: hospital?.color || "#3b82f6" }} className="font-medium">
                          {hospital?.name}
                        </span>
                        <span>•</span>
                        <span>Procedure: {format(parseISO(procedureDate), "MMM d, yyyy")}</span>
                        {latestUpdate && (
                          <>
                            <span>•</span>
                            <span>Last Update: {format(parseISO(latestUpdate.update_date), "MMM d")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/procedures`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/patients/${patient?.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Patient
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Post-Op Update" : "Record Post-Op Update"}</DialogTitle>
            <DialogDescription>
              Document patient's post-operative progress and vital signs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Glasgow Coma Scale */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Glasgow Coma Scale (GCS)
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="gcs">Total Score</Label>
                  <Input
                    id="gcs"
                    type="number"
                    min="3"
                    max="15"
                    value={gcsScore}
                    onChange={(e) => setGcsScore(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Motor Function */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3">Motor Function (0-5)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="motorUR">Upper Right</Label>
                  <Input
                    id="motorUR"
                    type="number"
                    min="0"
                    max="5"
                    value={motorUR}
                    onChange={(e) => setMotorUR(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="motorUL">Upper Left</Label>
                  <Input
                    id="motorUL"
                    type="number"
                    min="0"
                    max="5"
                    value={motorUL}
                    onChange={(e) => setMotorUL(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="motorLR">Lower Right</Label>
                  <Input
                    id="motorLR"
                    type="number"
                    min="0"
                    max="5"
                    value={motorLR}
                    onChange={(e) => setMotorLR(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="motorLL">Lower Left</Label>
                  <Input
                    id="motorLL"
                    type="number"
                    min="0"
                    max="5"
                    value={motorLL}
                    onChange={(e) => setMotorLL(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-3">Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div>
                  <Label htmlFor="bp">Blood Pressure</Label>
                  <Input
                    id="bp"
                    placeholder="120/80"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pulse">Pulse (bpm)</Label>
                  <Input
                    id="pulse"
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="temp">Temperature (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rr">Respiratory Rate</Label>
                  <Input
                    id="rr"
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spo2">SpO2 (%)</Label>
                  <Input
                    id="spo2"
                    type="number"
                    min="0"
                    max="100"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Clinical Observations */}
            <div className="space-y-2">
              <div>
                <Label htmlFor="wound">Wound Status</Label>
                <Select value={woundStatus} onValueChange={setWoundStatus}>
                  <SelectTrigger id="wound">
                    <SelectValue placeholder="Select wound status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="draining">Draining</SelectItem>
                    <SelectItem value="infected">Signs of Infection</SelectItem>
                    <SelectItem value="swollen">Swollen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="neuro">Neurological Exam</Label>
                <Textarea
                  id="neuro"
                  placeholder="Detailed neurological findings..."
                  value={neurologicalExam}
                  onChange={(e) => setNeurologicalExam(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="improvement">Improvement Notes</Label>
                <Textarea
                  id="improvement"
                  placeholder="Positive progress and improvements..."
                  value={improvementNotes}
                  onChange={(e) => setImprovementNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="complaints">New Complaints or Concerns</Label>
                <Textarea
                  id="complaints"
                  placeholder="Any new symptoms or concerns to monitor..."
                  value={newComplaints}
                  onChange={(e) => setNewComplaints(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="meds">Current Medications</Label>
                <Textarea
                  id="meds"
                  placeholder="List current medications and dosages..."
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUpdateDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUpdate?.procedure_id) {
                  createUpdateMutation.mutate({
                    procedureId: selectedUpdate.procedure_id,
                    dayPostOp,
                    gcsScore,
                    motorUR,
                    motorUL,
                    motorLR,
                    motorLL,
                    bloodPressure,
                    pulse,
                    temperature,
                    respiratoryRate,
                    spo2,
                    currentMedications,
                    improvementNotes,
                    newComplaints,
                    neurologicalExam,
                    woundStatus,
                  });
                } else {
                  toast({
                    title: "Error",
                    description: "Please select a procedure first",
                    variant: "destructive",
                  });
                }
              }}
              disabled={createUpdateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createUpdateMutation.isPending ? "Saving..." : "Save Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
