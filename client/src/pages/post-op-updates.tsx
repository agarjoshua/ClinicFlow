import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  Search,
  Plus,
  Calendar,
  Heart,
  Eye,
  CheckCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PostOpUpdates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Form state for new update
  const [dayPostOp, setDayPostOp] = useState("");
  const [gcsScore, setGcsScore] = useState("");
  const [motorUR, setMotorUR] = useState("");
  const [motorUL, setMotorUL] = useState("");
  const [motorLR, setMotorLR] = useState("");
  const [motorLL, setMotorLL] = useState("");
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

  // Fetch active post-op procedures
  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ["activePostOpProcedures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedures")
        .select(`
          id,
          patient_id,
          procedure_type,
          actual_date,
          status,
          patient:patients(id, first_name, last_name, patient_number),
          post_op_updates(
            id,
            update_date,
            day_post_op,
            gcs_score
          )
        `)
        .eq("status", "done")
        .order("actual_date", { ascending: false });

      if (error) throw error;

      // Filter out discharged patients
      if (!data) return [];

      const { data: dischargedIds } = await supabase
        .from("discharges")
        .select("procedure_id");

      const dischargedSet = new Set(dischargedIds?.map(d => d.procedure_id) || []);
      
      return (data || [])
        .filter(p => !dischargedSet.has(p.id))
        .map(proc => ({
          id: proc.id,
          procedureType: proc.procedure_type,
          actualDate: proc.actual_date,
          status: proc.status,
          patient: proc.patient ? {
            id: proc.patient.id,
            firstName: proc.patient.first_name,
            lastName: proc.patient.last_name,
            patientNumber: proc.patient.patient_number,
          } : null,
          postOpUpdates: proc.post_op_updates || [],
        }));
    },
  });

  // Create post-op update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const user = await supabase.auth.getUser();
      const { error } = await supabase
        .from("post_op_updates")
        .insert({
          procedure_id: updateData.procedureId,
          update_date: new Date().toISOString().split('T')[0],
          day_post_op: parseInt(updateData.dayPostOp),
          gcs_score: parseInt(updateData.gcsScore),
          motor_ur: parseInt(updateData.motorUR) || 0,
          motor_ul: parseInt(updateData.motorUL) || 0,
          motor_lr: parseInt(updateData.motorLR) || 0,
          motor_ll: parseInt(updateData.motorLL) || 0,
          blood_pressure: updateData.bloodPressure || null,
          pulse: updateData.pulse ? parseInt(updateData.pulse) : null,
          temperature: updateData.temperature ? parseFloat(updateData.temperature) : null,
          respiratory_rate: updateData.respiratoryRate ? parseInt(updateData.respiratoryRate) : null,
          spo2: updateData.spo2 ? parseInt(updateData.spo2) : null,
          current_medications: updateData.currentMedications || null,
          improvement_notes: updateData.improvementNotes || null,
          new_complaints: updateData.newComplaints || null,
          neurological_exam: updateData.neurologicalExam || null,
          wound_status: updateData.woundStatus || null,
          updated_by: user.data.user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activePostOpProcedures"] });
      toast({
        title: "Success",
        description: "Post-op update recorded successfully",
      });
      setUpdateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record post-op update",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  const resetForm = () => {
    setDayPostOp("");
    setGcsScore("");
    setMotorUR("");
    setMotorUL("");
    setMotorLR("");
    setMotorLL("");
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
    setSelectedProcedure(null);
  };

  const handleAddUpdate = () => {
    if (!selectedProcedure || !dayPostOp || !gcsScore) {
      toast({
        title: "Error",
        description: "Please fill in required fields (Day, GCS Score)",
        variant: "destructive",
      });
      return;
    }

    createUpdateMutation.mutate({
      procedureId: selectedProcedure.id,
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
  };

  const filteredProcedures = procedures.filter((proc: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      proc.patient?.firstName.toLowerCase().includes(searchLower) ||
      proc.patient?.lastName.toLowerCase().includes(searchLower) ||
      proc.patient?.patientNumber.includes(searchTerm) ||
      proc.procedureType.toLowerCase().includes(searchLower)
    );
  });

  const getLatestUpdate = (postOpUpdates: any[]) => {
    if (!postOpUpdates || postOpUpdates.length === 0) return null;
    return postOpUpdates[0];
  };

  const getDaysSinceProcedure = (actualDate: string) => {
    const procedureDate = new Date(actualDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - procedureDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading post-op patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Post-Op Updates</h1>
          <p className="text-gray-600 mt-1">Daily post-operative patient monitoring</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{procedures.length}</p>
              <p className="text-sm text-gray-500">Active Post-Op Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold">
                {procedures.filter((p: any) => getLatestUpdate(p.postOpUpdates)?.day_post_op === 1).length}
              </p>
              <p className="text-sm text-gray-500">Post-Op Day 1</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">
                {procedures.filter((p: any) => getDaysSinceProcedure(p.actualDate) > 7).length}
              </p>
              <p className="text-sm text-gray-500">Post-Op Day 7+</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Search className="w-5 h-5 text-gray-400 mt-2.5" />
            <Input
              placeholder="Search by name, ID, or procedure..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Procedures List */}
      {filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No active post-op patients found</p>
            <p className="text-sm text-gray-400 mt-2">Check back when procedures are marked as complete</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProcedures.map((procedure: any) => {
            const latestUpdate = getLatestUpdate(procedure.postOpUpdates);
            const daysSince = getDaysSinceProcedure(procedure.actualDate);

            return (
              <Card key={procedure.id} className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-lg">
                            {procedure.patient?.firstName} {procedure.patient?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{procedure.patient?.patientNumber}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{procedure.procedureType}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            {format(parseISO(procedure.actualDate), "MMM d")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Heart className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">Day {daysSince}</span>
                        </div>
                        {latestUpdate && (
                          <>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-gray-600">GCS: {latestUpdate.gcs_score}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">
                                {format(parseISO(latestUpdate.update_date), "MMM d")}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {!latestUpdate && (
                        <Badge variant="outline" className="bg-yellow-50">
                          No updates yet
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProcedure(procedure);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProcedure(procedure);
                          setUpdateDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add Post-Op Update for {selectedProcedure?.patient?.firstName}{" "}
              {selectedProcedure?.patient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Record daily monitoring data for {selectedProcedure?.procedureType}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Day Post-Op */}
            <div>
              <Label htmlFor="dayPostOp">Day Post-Op *</Label>
              <Input
                id="dayPostOp"
                type="number"
                min="0"
                value={dayPostOp}
                onChange={(e) => setDayPostOp(e.target.value)}
                placeholder="1"
              />
            </div>

            {/* Glasgow Coma Scale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gcsScore">Glasgow Coma Scale (3-15) *</Label>
                <Input
                  id="gcsScore"
                  type="number"
                  min="3"
                  max="15"
                  value={gcsScore}
                  onChange={(e) => setGcsScore(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>

            {/* Motor Function */}
            <div>
              <Label className="mb-2 block">Motor Function (0-5)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="motorUR" className="text-xs">Upper Right</Label>
                  <Input
                    id="motorUR"
                    type="number"
                    min="0"
                    max="5"
                    value={motorUR}
                    onChange={(e) => setMotorUR(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="motorUL" className="text-xs">Upper Left</Label>
                  <Input
                    id="motorUL"
                    type="number"
                    min="0"
                    max="5"
                    value={motorUL}
                    onChange={(e) => setMotorUL(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="motorLR" className="text-xs">Lower Right</Label>
                  <Input
                    id="motorLR"
                    type="number"
                    min="0"
                    max="5"
                    value={motorLR}
                    onChange={(e) => setMotorLR(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="motorLL" className="text-xs">Lower Left</Label>
                  <Input
                    id="motorLL"
                    type="number"
                    min="0"
                    max="5"
                    value={motorLL}
                    onChange={(e) => setMotorLL(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div>
              <Label className="mb-2 block">Vital Signs</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="bloodPressure" className="text-xs">Blood Pressure</Label>
                  <Input
                    id="bloodPressure"
                    placeholder="120/80"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pulse" className="text-xs">Pulse (bpm)</Label>
                  <Input
                    id="pulse"
                    type="number"
                    min="0"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label htmlFor="temperature" className="text-xs">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="35"
                    max="42"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="37"
                  />
                </div>
                <div>
                  <Label htmlFor="respiratoryRate" className="text-xs">Respiratory Rate</Label>
                  <Input
                    id="respiratoryRate"
                    type="number"
                    min="0"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(e.target.value)}
                    placeholder="16"
                  />
                </div>
                <div>
                  <Label htmlFor="spo2" className="text-xs">SpO2 (%)</Label>
                  <Input
                    id="spo2"
                    type="number"
                    min="0"
                    max="100"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="98"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            <div>
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                placeholder="Current medications being given..."
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="neurologicalExam">Neurological Exam</Label>
              <Textarea
                id="neurologicalExam"
                placeholder="Neurological examination findings..."
                value={neurologicalExam}
                onChange={(e) => setNeurologicalExam(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="woundStatus">Wound Status</Label>
              <Textarea
                id="woundStatus"
                placeholder="Wound appearance, any drainage, etc..."
                value={woundStatus}
                onChange={(e) => setWoundStatus(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="improvementNotes">Improvement Notes</Label>
              <Textarea
                id="improvementNotes"
                placeholder="Patient progress and improvements..."
                value={improvementNotes}
                onChange={(e) => setImprovementNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="newComplaints">New Complaints</Label>
              <Textarea
                id="newComplaints"
                placeholder="Any new complaints or concerns..."
                value={newComplaints}
                onChange={(e) => setNewComplaints(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUpdateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUpdate}
              disabled={createUpdateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createUpdateMutation.isPending ? "Saving..." : "Save Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Post-Op History - {selectedProcedure?.patient?.firstName}{" "}
              {selectedProcedure?.patient?.lastName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedProcedure?.postOpUpdates && selectedProcedure.postOpUpdates.length > 0 ? (
              selectedProcedure.postOpUpdates.map((update: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Day {update.day_post_op} - {format(parseISO(update.update_date), "MMM d, yyyy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">GCS Score:</span> {update.gcs_score}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center">No updates recorded yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
