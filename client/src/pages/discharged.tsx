import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle,
  Search,
  Eye,
  Download,
  Calendar,
  Heart,
  TrendingUp,
  User,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";

export default function Discharged() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDischarge, setSelectedDischarge] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch all discharged patients
  const { data: dischargedPatients = [], isLoading } = useQuery({
    queryKey: ["dischargedPatients"],
    queryFn: async () => {
      const { data } = await supabase
        .from("discharges")
        .select(`
          id,
          procedure_id,
          patient_id,
          discharge_date,
          total_hospital_days,
          discharge_status,
          final_gcs,
          final_motor_ur,
          final_motor_ul,
          final_motor_lr,
          final_motor_ll,
          discharge_medications,
          follow_up_instructions,
          activity_restrictions,
          wound_care_instructions,
          warning_signs,
          follow_up_date,
          discharge_summary,
          discharged_by,
          procedure:procedures(
            id,
            procedure_type,
            actual_date,
            patient:patients(
              id,
              patient_number,
              first_name,
              last_name,
              age,
              gender,
              phone,
              email
            ),
            hospital:hospitals(id, name, code, color)
          ),
          discharged_by_user:users!discharged_by(id, name)
        `)
        .order("discharge_date", { ascending: false });

      return data || [];
    },
  });

  // Filter based on search
  const filteredDischarges = dischargedPatients.filter(discharge => {
    const patient = discharge.procedure?.patient;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient?.first_name.toLowerCase().includes(searchLower) ||
      patient?.last_name.toLowerCase().includes(searchLower) ||
      patient?.patient_number.includes(searchLower) ||
      patient?.phone?.includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "bg-green-100 text-green-800";
      case "improved":
        return "bg-blue-100 text-blue-800";
      case "against_medical_advice":
        return "bg-yellow-100 text-yellow-800";
      case "referred":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            Discharged Patients
          </h1>
          <p className="text-gray-600 mt-1">View all discharged patient records</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{dischargedPatients.length}</p>
              <p className="text-sm text-gray-500">Total Discharged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">
                {dischargedPatients.filter(d => d.discharge_status === "improved").length}
              </p>
              <p className="text-sm text-gray-500">Improved Status</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">
                {dischargedPatients.reduce((sum, d) => sum + (d.total_hospital_days || 0), 0) / Math.max(dischargedPatients.length, 1) | 0}
              </p>
              <p className="text-sm text-gray-500">Avg Days Hospitalized</p>
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
              placeholder="Search by name, ID, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discharged Patients List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Loading discharged records...</p>
            </CardContent>
          </Card>
        ) : filteredDischarges.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No discharged patients found</p>
              {searchTerm && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
            </CardContent>
          </Card>
        ) : (
          filteredDischarges.map((discharge: any) => {
            const patient = discharge.procedure?.patient;
            const hospital = discharge.procedure?.hospital;

            return (
              <Card key={discharge.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Patient Info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {patient?.first_name} {patient?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            #{patient?.patient_number} • {patient?.age}y • {patient?.gender}
                          </p>
                          <p className="text-xs text-gray-400">
                            {patient?.phone} • {patient?.email}
                          </p>
                        </div>
                      </div>

                      {/* Key Information */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Procedure</p>
                          <p className="text-sm font-medium">{discharge.procedure?.procedure_type}</p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Discharge Status</p>
                          <Badge className={`mt-1 text-xs ${getStatusColor(discharge.discharge_status)}`}>
                            {discharge.discharge_status?.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Final GCS</p>
                          <p className="text-sm font-medium">{discharge.final_gcs || "N/A"}/15</p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Hospital Days</p>
                          <p className="text-sm font-medium">{discharge.total_hospital_days || "N/A"}</p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Discharged Date</p>
                          <p className="text-sm font-medium">
                            {format(parseISO(discharge.discharge_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {/* Clinical Summary */}
                      {discharge.discharge_summary && (
                        <div className="bg-blue-50 p-3 rounded mb-3">
                          <p className="text-xs font-medium text-blue-900 mb-1">Discharge Summary</p>
                          <p className="text-sm text-blue-800 line-clamp-2">{discharge.discharge_summary}</p>
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {discharge.wound_care_instructions && (
                          <div className="bg-amber-50 p-2 rounded">
                            <p className="font-medium text-amber-900 mb-1">Wound Care</p>
                            <p className="text-amber-800 line-clamp-1">{discharge.wound_care_instructions}</p>
                          </div>
                        )}
                        {discharge.activity_restrictions && (
                          <div className="bg-purple-50 p-2 rounded">
                            <p className="font-medium text-purple-900 mb-1">Activity Restrictions</p>
                            <p className="text-purple-800 line-clamp-1">{discharge.activity_restrictions}</p>
                          </div>
                        )}
                      </div>

                      {/* Follow-up */}
                      {discharge.follow_up_date && (
                        <div className="mt-3 bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-xs font-medium text-green-900 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Follow-up Scheduled: {format(parseISO(discharge.follow_up_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      )}

                      {/* Hospital and discharged by */}
                      <div className="flex gap-2 items-center text-xs text-gray-500 mt-3">
                        <span style={{ color: hospital?.color || "#3b82f6" }} className="font-medium">
                          {hospital?.name}
                        </span>
                        <span>•</span>
                        <span>By: {discharge.discharged_by_user?.name}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDischarge(discharge);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Details</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Print</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDischarge && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Discharge Details - {selectedDischarge.procedure?.patient?.first_name} {selectedDischarge.procedure?.patient?.last_name}
                </DialogTitle>
                <DialogDescription>
                  Procedure: {selectedDischarge.procedure?.procedure_type}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Discharge Summary */}
                <div>
                  <h4 className="font-semibold mb-2">Discharge Summary</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedDischarge.discharge_summary || "No summary provided"}
                  </p>
                </div>

                {/* Final Assessments */}
                <div>
                  <h4 className="font-semibold mb-2">Final Assessments</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Final GCS Score</p>
                      <p className="text-lg font-bold">{selectedDischarge.final_gcs || "N/A"}/15</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-gray-600">Discharge Status</p>
                      <Badge className={`mt-1 text-xs ${getStatusColor(selectedDischarge.discharge_status)}`}>
                        {selectedDischarge.discharge_status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Medications */}
                {selectedDischarge.discharge_medications && (
                  <div>
                    <h4 className="font-semibold mb-2">Discharge Medications</h4>
                    <p className="text-sm bg-blue-50 p-3 rounded whitespace-pre-wrap">
                      {selectedDischarge.discharge_medications}
                    </p>
                  </div>
                )}

                {/* Wound Care */}
                {selectedDischarge.wound_care_instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">Wound Care Instructions</h4>
                    <p className="text-sm bg-amber-50 p-3 rounded whitespace-pre-wrap">
                      {selectedDischarge.wound_care_instructions}
                    </p>
                  </div>
                )}

                {/* Activity Restrictions */}
                {selectedDischarge.activity_restrictions && (
                  <div>
                    <h4 className="font-semibold mb-2">Activity Restrictions</h4>
                    <p className="text-sm bg-purple-50 p-3 rounded whitespace-pre-wrap">
                      {selectedDischarge.activity_restrictions}
                    </p>
                  </div>
                )}

                {/* Follow-up Instructions */}
                {selectedDischarge.follow_up_instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">Follow-up Instructions</h4>
                    <p className="text-sm bg-green-50 p-3 rounded whitespace-pre-wrap">
                      {selectedDischarge.follow_up_instructions}
                    </p>
                  </div>
                )}

                {/* Warning Signs */}
                {selectedDischarge.warning_signs && (
                  <div>
                    <h4 className="font-semibold mb-2">Warning Signs to Watch For</h4>
                    <p className="text-sm bg-red-50 p-3 rounded whitespace-pre-wrap">
                      {selectedDischarge.warning_signs}
                    </p>
                  </div>
                )}

                {/* Follow-up Appointment */}
                {selectedDischarge.follow_up_date && (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-900">
                      Scheduled Follow-up: {format(parseISO(selectedDischarge.follow_up_date), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
