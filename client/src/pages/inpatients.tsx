import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientAvatar } from "@/components/patient-avatar";
import { BedDouble, MapPin, Clock, AlertTriangle, StickyNote } from "lucide-react";

type RawHospital = {
  id: string;
  name: string;
  color: string | null;
};

type RawAdmission = {
  id: string;
  admission_date: string | null;
  discharge_date: string | null;
  status: string;
  admission_reason: string | null;
  diagnosis_summary: string | null;
  discharge_summary: string | null;
  hospital?: RawHospital | RawHospital[] | null;
};

type RawInpatient = {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  age: number | null;
  phone: string | null;
  inpatient_admitted_at: string | null;
  inpatient_notes: string | null;
  currentHospital?: RawHospital | RawHospital[] | null;
  admissions?: RawAdmission[];
};

type InpatientRecord = {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string | null;
  age: number | null;
  phone: string | null;
  hospital: { id: string; name: string; color: string | null } | null;
  admissionId: string | null;
  admittedAt: string | null;
  admissionReason: string | null;
  diagnosisSummary: string | null;
  inpatientNotes: string | null;
};

type QueryResponse = RawInpatient[];

type SupabaseError = {
  message: string;
};

export default function Inpatients() {
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<QueryResponse, SupabaseError>({
    queryKey: ["inpatients"],
    queryFn: async () => {
      const { data: result, error: queryError } = await supabase
        .from("patients")
        .select(`
          id,
          patient_number,
          first_name,
          last_name,
          gender,
          date_of_birth,
          age,
          phone,
          inpatient_admitted_at,
          inpatient_notes,
          currentHospital:hospitals(id, name, color),
          admissions:patient_admissions(
            id,
            admission_date,
            discharge_date,
            status,
            admission_reason,
            diagnosis_summary,
            discharge_summary,
            hospital:hospitals(id, name, color)
          )
        `)
        .eq("is_inpatient", true)
        .order("inpatient_admitted_at", { ascending: false });

  if (queryError) throw queryError;
  return (result as unknown as RawInpatient[]) || [];
    },
  });

  const inpatients: InpatientRecord[] = useMemo(() => {
    if (!data) return [];

    // Normalize Supabase payload so rendering logic can stay focused on UI concerns.
    return data.map((row: RawInpatient) => {
      const admissions: RawAdmission[] = row.admissions || [];

      const activeAdmission = admissions
        .filter((admission) => admission.status === "admitted")
        .sort((a, b) => {
          const aDate = a.admission_date ? new Date(a.admission_date).getTime() : 0;
          const bDate = b.admission_date ? new Date(b.admission_date).getTime() : 0;
          return bDate - aDate;
        })[0];

      const primaryHospital = Array.isArray(row.currentHospital)
        ? row.currentHospital[0] || null
        : row.currentHospital || null;

      const admissionHospitalRaw = activeAdmission?.hospital;
      const admissionHospital = Array.isArray(admissionHospitalRaw)
        ? admissionHospitalRaw[0] || null
        : admissionHospitalRaw || null;

      const hospital = primaryHospital || admissionHospital || null;

      return {
        id: row.id,
        patientNumber: row.patient_number,
        firstName: row.first_name,
        lastName: row.last_name,
        gender: row.gender,
        dateOfBirth: row.date_of_birth,
        age: row.age,
        phone: row.phone,
        hospital,
        admissionId: activeAdmission?.id ?? null,
        admittedAt: activeAdmission?.admission_date || row.inpatient_admitted_at,
        admissionReason: activeAdmission?.admission_reason || null,
        diagnosisSummary: activeAdmission?.diagnosis_summary || null,
        inpatientNotes: row.inpatient_notes,
      };
    });
  }, [data]);

  const totalInpatients = inpatients.length;
  const activeHospitals = useMemo(() => {
    const ids = inpatients
      .map((record) => record.hospital?.id)
      .filter((value): value is string => Boolean(value));
    return new Set(ids).size;
  }, [inpatients]);

  const withoutActiveAdmission = inpatients.filter((record) => !record.admissionId).length;

  const renderLoading = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );

  if (isLoading) {
    return renderLoading();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Inpatients</h1>
        <p className="text-sm text-muted-foreground">
          Monitor patients currently admitted across partner hospitals and jump into their charts.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load inpatients</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Active admissions</p>
              <p className="text-2xl font-semibold">{totalInpatients}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <BedDouble className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Hospitals involved</p>
              <p className="text-2xl font-semibold">{activeHospitals}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <MapPin className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Missing admission records</p>
              <p className="text-2xl font-semibold">{withoutActiveAdmission}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {totalInpatients === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BedDouble className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">No active inpatients</p>
              <p className="text-sm text-muted-foreground">
                Admissions will appear here once patients are marked as inpatient from their chart.
              </p>
            </div>
            <Button onClick={() => setLocation("/patients")}>View patients</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inpatients.map((patient) => {
            const admittedDate = patient.admittedAt ? new Date(patient.admittedAt) : null;
            const admissionRange = admittedDate
              ? `${format(admittedDate, "MMM dd, yyyy p")} • ${formatDistanceToNow(admittedDate, { addSuffix: true })}`
              : null;

            return (
              <Card key={patient.id} className="border-l-4 border-emerald-500">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 gap-4">
                      <PatientAvatar
                        firstName={patient.firstName}
                        lastName={patient.lastName}
                        dateOfBirth={patient.dateOfBirth || undefined}
                        age={patient.age || undefined}
                        gender={patient.gender || undefined}
                        size="lg"
                      />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold">
                            {patient.firstName} {patient.lastName}
                          </h2>
                          <Badge variant="outline" className="font-mono">
                            #{patient.patientNumber}
                          </Badge>
                          {patient.hospital && (
                            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: patient.hospital.color || "#10b981" }}
                              />
                              {patient.hospital.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {admissionRange && (
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {admissionRange}
                            </span>
                          )}
                          {patient.phone && (
                            <span>{patient.phone}</span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-slate-700">
                          {(patient.admissionReason || patient.diagnosisSummary) && (
                            <p>
                              <span className="font-medium">Reason:</span> {patient.admissionReason || patient.diagnosisSummary}
                            </p>
                          )}
                          {patient.inpatientNotes && (
                            <p className="flex items-start gap-2 text-slate-600">
                              <StickyNote className="mt-0.5 h-4 w-4" />
                              <span>{patient.inpatientNotes}</span>
                            </p>
                          )}
                          {!patient.admissionId && (
                            <p className="flex items-center gap-2 text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              No active admission record found. Open the patient profile to reconcile their status.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => setLocation(`/patients/${patient.id}`)}>
                        Open patient chart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
