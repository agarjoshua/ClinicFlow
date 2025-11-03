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
import { Search, UserCheck, Eye, Download, Calendar, Hospital } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";

export default function Discharged() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDischarge, setSelectedDischarge] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch discharged patients
  const { data: discharges = [], isLoading } = useQuery({
    queryKey: ["dischargedPatients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discharges")
        .select(`
          id,
          procedure_id,
          patient_id,
          discharge_date,
          total_hospital_days,
          discharge_status,
          discharge_summary,
          follow_up_date,
          discharged_by,
          patient:patients(
            id,
            first_name,
            last_name,
            patient_number,
            age,
            gender,
            blood_type,
            phone,
            emergency_contact
          ),
          procedure:procedures(
            id,
            procedure_type,
            actual_date,
            hospital:hospitals(id, name, code, color)
          ),
          discharged_by_user:users!discharged_by(id, name)
        `)
        .order("discharge_date", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(discharge => ({
        id: discharge.id,
        procedureId: discharge.procedure_id,
        patientId: discharge.patient_id,
        dischargeDate: discharge.discharge_date,
        totalHospitalDays: discharge.total_hospital_days,
        dischargeStatus: discharge.discharge_status,
        dischargeSummary: discharge.discharge_summary,
        followUpDate: discharge.follow_up_date,
        dischargedBy: discharge.discharged_by_user,
        patient: discharge.patient,
        procedure: discharge.procedure,
      }));
    },
  });

  const filteredDischarges = discharges.filter((discharge: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      discharge.patient?.first_name.toLowerCase().includes(searchLower) ||
      discharge.patient?.last_name.toLowerCase().includes(searchLower) ||
      discharge.patient?.patient_number.includes(searchTerm) ||
      discharge.procedure?.procedure_type.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = [
      "Patient ID",
      "Name",
      "Age",
      "Gender",
      "Procedure Type",
      "Discharge Date",
      "Hospital Days",
      "Status",
      "Follow-up Date",
    ];

    const rows = filteredDischarges.map(d => [
      d.patient?.patient_number || "",
      `${d.patient?.first_name} ${d.patient?.last_name}`,
      d.patient?.age || "",
      d.patient?.gender || "",
      d.procedure?.procedure_type || "",
      format(parseISO(d.dischargeDate), "yyyy-MM-dd"),
      d.totalHospitalDays || "",
      d.dischargeStatus || "",
      d.followUpDate ? format(parseISO(d.followUpDate), "yyyy-MM-dd") : "N/A",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discharged-patients-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading discharged patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discharged Patients</h1>
          <p className="text-gray-600 mt-1">View all discharged patient records</p>
        </div>
        {filteredDischarges.length > 0 && (
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{discharges.length}</p>
              <p className="text-sm text-gray-500">Total Discharged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-2xl font-bold">
                {discharges.filter((d: any) => d.dischargeStatus === "stable").length}
              </span>
              <p className="text-sm text-gray-500">Stable</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-2xl font-bold">
                {discharges.filter((d: any) => d.dischargeStatus === "improved").length}
              </span>
              <p className="text-sm text-gray-500">Improved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-2xl font-bold">
                {discharges.filter((d: any) => d.followUpDate).length}
              </span>
              <p className="text-sm text-gray-500">Follow-up Scheduled</p>
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
              placeholder="Search by name, ID, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discharged Patients List */}
      {filteredDischarges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No discharged patients found</p>
            <p className="text-sm text-gray-400 mt-2">Discharged patients will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDischarges.map((discharge: any) => (
            <Card key={discharge.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-lg">
                          {discharge.patient?.first_name} {discharge.patient?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          #{discharge.patient?.patient_number}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">
                      {discharge.procedure?.procedure_type}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {format(parseISO(discharge.dischargeDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Hospital className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {discharge.totalHospitalDays} days
                        </span>
                      </div>
                      <div>
                        <Badge className={getStatusColor(discharge.dischargeStatus || "")}>
                          {discharge.dischargeStatus?.replace("_", " ")}
                        </Badge>
                      </div>
                      {discharge.followUpDate && (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">
                            Follow-up: {format(parseISO(discharge.followUpDate), "MMM d")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDischarge(discharge);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Discharge Record - {selectedDischarge?.patient?.first_name}{" "}
              {selectedDischarge?.patient?.last_name}
            </DialogTitle>
            <DialogDescription>
              Procedure: {selectedDischarge?.procedure?.procedure_type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">Patient ID:</span> {selectedDischarge?.patient?.patient_number}
                  </div>
                  <div>
                    <span className="font-semibold">Age:</span> {selectedDischarge?.patient?.age}
                  </div>
                  <div>
                    <span className="font-semibold">Gender:</span> {selectedDischarge?.patient?.gender}
                  </div>
                  <div>
                    <span className="font-semibold">Blood Type:</span> {selectedDischarge?.patient?.blood_type}
                  </div>
                  <div>
                    <span className="font-semibold">Phone:</span> {selectedDischarge?.patient?.phone}
                  </div>
                  <div>
                    <span className="font-semibold">Emergency Contact:</span> {selectedDischarge?.patient?.emergency_contact}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discharge Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discharge Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">Discharge Date:</span>{" "}
                    {format(parseISO(selectedDischarge?.dischargeDate), "MMM d, yyyy")}
                  </div>
                  <div>
                    <span className="font-semibold">Hospital Days:</span> {selectedDischarge?.totalHospitalDays}
                  </div>
                  <div>
                    <span className="font-semibold">Discharge Status:</span>
                    <br />
                    <Badge className={getStatusColor(selectedDischarge?.dischargeStatus || "")}>
                      {selectedDischarge?.dischargeStatus?.replace("_", " ")}
                    </Badge>
                  </div>
                  {selectedDischarge?.followUpDate && (
                    <div>
                      <span className="font-semibold">Follow-up Date:</span>{" "}
                      {format(parseISO(selectedDischarge?.followUpDate), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
                {selectedDischarge?.dischargeSummary && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="font-semibold">Summary:</span>
                    <p className="mt-1 text-gray-700">{selectedDischarge?.dischargeSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Discharged() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLocation("/auth");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setLocation("/auth");
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select()
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const dischargedPatients = patients.filter(p => p.status === "discharged");

  const filteredPatients = dischargedPatients.filter((patient) => {
    const name = patient.name ?? "";
    const patientId = patient.patientId ?? "";
    const contact = patient.contact ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.includes(searchTerm);
    return matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ["Patient ID", "Name", "Age", "Gender", "Admission Date", "Discharge Date"];
    const rows = filteredPatients.map(p => [
      p.patientId,
      p.name,
      p.age,
      p.gender,
      format(new Date(p.admissionDate), 'yyyy-MM-dd'),
      p.dischargeDate ? format(new Date(p.dischargeDate), 'yyyy-MM-dd') : 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discharged-patients-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading discharged patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Discharged Patients</h1>
          <p className="text-sm text-muted-foreground">View all discharged patient records</p>
        </div>
        {filteredPatients.length > 0 && (
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-discharged"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserCheck className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No discharged patients found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Discharged patients will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/patients/${patient.id}`)}
                  data-testid={`card-discharged-patient-${patient.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                          {(() => {
                            const name = patient.name ?? "";
                            return name
                              ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                              : "?";
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" data-testid={`text-patient-name-${patient.id}`}>{patient.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{patient.patientId}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Age</p>
                          <p className="font-medium">{patient.age}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gender</p>
                          <p className="font-medium">{patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Admitted</p>
                          <p className="font-medium">
                            {(() => {
                              const date = patient.admissionDate ? new Date(patient.admissionDate) : null;
                              return date && !isNaN(date.getTime())
                                ? format(date, 'MMM dd, yyyy')
                                : "N/A";
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Discharged</p>
                          <p className="font-medium">
                            {patient.dischargeDate
                              ? format(new Date(patient.dischargeDate), 'MMM dd, yyyy')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/patients/${patient.id}`);
                        }}
                        data-testid={`button-view-patient-${patient.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
