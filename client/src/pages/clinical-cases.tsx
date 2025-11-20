import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PatientAvatar } from "@/components/patient-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Activity, Calendar, User, Search, Stethoscope } from "lucide-react";
import { Link } from "wouter";

interface ClinicalCase {
  id: string;
  patient_id: string;
  diagnosis: string | null;
  case_date: string;
  status: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    patient_number: string;
    age: number | null;
    gender: string | null;
  };
  users: {
    id: string;
    name: string;
  };
}

export default function ClinicalCases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { clinic } = useClinic();

  // Fetch clinical cases with patient and consultant info
  const { data: cases, isLoading } = useQuery({
    queryKey: ["clinical-cases", clinic?.id, statusFilter],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      let query = supabase
        .from("clinical_cases")
        .select(`
          *,
          patients (
            id,
            first_name,
            last_name,
            patient_number,
            age,
            gender
          ),
          users!clinical_cases_consultant_id_fkey (
            id,
            name
          )
        `)
        .eq("clinic_id", clinic.id)
        .order("case_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClinicalCase[];
    },
    enabled: !!clinic?.id,
  });

  // Filter cases by search term
  const filteredCases = cases?.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${c.patients.first_name} ${c.patients.last_name}`.toLowerCase();
    const patientNumber = c.patients.patient_number.toLowerCase();
    const diagnosis = (c.diagnosis || "").toLowerCase();

    return (
      patientName.includes(searchLower) ||
      patientNumber.includes(searchLower) ||
      diagnosis.includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clinical Case Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage patient clinical cases and treatment plans
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/diagnoses">
            <FileText className="w-4 h-4 mr-2" />
            New Diagnosis
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Clinical Cases
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search patients or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading cases...</div>
          ) : filteredCases && filteredCases.length > 0 ? (
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {caseItem.patients.first_name} {caseItem.patients.last_name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {caseItem.patients.patient_number}
                              {caseItem.patients.age && ` • ${caseItem.patients.age} years`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {caseItem.diagnosis ? (
                            <span className="line-clamp-2">{caseItem.diagnosis}</span>
                          ) : (
                            <span className="text-gray-400 italic">No diagnosis recorded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-gray-400" />
                            {caseItem.users.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(caseItem.case_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/patients/${caseItem.patient_id}`}>View Patient</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </TabsContent>

              <TabsContent value="grid">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {filteredCases.map((caseItem) => (
                    <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {caseItem.patients.first_name} {caseItem.patients.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {caseItem.patients.patient_number}
                            </p>
                          </div>
                          {getStatusBadge(caseItem.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {caseItem.diagnosis || "No diagnosis recorded"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {new Date(caseItem.case_date).toLocaleDateString()}
                          </span>
                          <span className="text-gray-500">{caseItem.users.name}</span>
                        </div>
                        <Button variant="outline" className="w-full" size="sm" asChild>
                          <Link href={`/patients/${caseItem.patient_id}`}>View Details</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No cases match your filters"
                  : "No clinical cases yet"}
              </p>
              <Button asChild>
                <Link href="/diagnoses">Record First Diagnosis</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
