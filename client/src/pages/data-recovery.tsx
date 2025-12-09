import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search, RefreshCw, History, Database, Code, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: any;
  new_data: any;
  user_id: string;
  created_at: string;
  users?: { email: string };
}

interface OrphanedRecord {
  id: string;
  patient_id: string;
  patient_name?: string;
  type: string;
  details: any;
}

interface MissingPatient {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  issue: string;
  suggestion: string;
  raw_data: any;
}

interface SQLQuery {
  title: string;
  description: string;
  query: string;
  category: "diagnostic" | "fix";
}

export default function DataRecovery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [orphanedRecords, setOrphanedRecords] = useState<OrphanedRecord[]>([]);
  const [missingPatients, setMissingPatients] = useState<MissingPatient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [currentClinicId, setCurrentClinicId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current clinic ID on mount
  useEffect(() => {
    async function fetchClinicId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("clinic_id")
          .eq("user_id", user.id)
          .single();
        
        if (userData?.clinic_id) {
          setCurrentClinicId(userData.clinic_id);
        }
      }
    }
    fetchClinicId();
  }, []);

  async function searchAuditLogs() {
    if (!searchTerm.trim()) {
      toast({
        title: "Enter Search Term",
        description: "Please enter a patient name or ID to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Search audit logs for patient-related changes
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          users!audit_logs_user_id_fkey (email)
        `)
        .eq("table_name", "patients")
        .or(`old_data->>name.ilike.%${searchTerm}%,new_data->>name.ilike.%${searchTerm}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setAuditLogs(logs || []);

      if (!logs || logs.length === 0) {
        toast({
          title: "No Results",
          description: "No audit logs found for this search term",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${logs.length} audit log entries`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function findOrphanedRecords() {
    setLoading(true);
    try {
      const orphaned: OrphanedRecord[] = [];

      // Check appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          id,
          patient_id,
          appointment_date,
          chief_complaint,
          hospitals (name)
        `);

      for (const apt of appointments || []) {
        const { data: patient } = await supabase
          .from("patients")
          .select("id, name")
          .eq("id", apt.patient_id)
          .single();

        if (!patient) {
          orphaned.push({
            id: apt.id,
            patient_id: apt.patient_id,
            type: "appointment",
            details: apt,
          });
        }
      }

      // Check procedures
      const { data: procedures } = await supabase
        .from("procedures")
        .select(`
          id,
          patient_id,
          procedure_type,
          scheduled_date
        `);

      for (const proc of procedures || []) {
        const { data: patient } = await supabase
          .from("patients")
          .select("id, name")
          .eq("id", proc.patient_id)
          .single();

        if (!patient) {
          orphaned.push({
            id: proc.id,
            patient_id: proc.patient_id,
            type: "procedure",
            details: proc,
          });
        }
      }

      // Check clinical cases
      const { data: cases } = await supabase
        .from("clinical_cases")
        .select(`
          id,
          patient_id,
          diagnosis,
          created_at
        `);

      for (const clinicalCase of cases || []) {
        const { data: patient } = await supabase
          .from("patients")
          .select("id, name")
          .eq("id", clinicalCase.patient_id)
          .single();

        if (!patient) {
          orphaned.push({
            id: clinicalCase.id,
            patient_id: clinicalCase.patient_id,
            type: "clinical_case",
            details: clinicalCase,
          });
        }
      }

      setOrphanedRecords(orphaned);

      toast({
        title: "Scan Complete",
        description: `Found ${orphaned.length} orphaned records`,
        variant: orphaned.length > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function restoreFromAuditLog(log: AuditLog) {
    if (log.action !== "UPDATE" && log.action !== "DELETE") {
      toast({
        title: "Cannot Restore",
        description: "Only UPDATE and DELETE operations can be restored",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Restore this data? This will overwrite current values.`)) return;

    try {
      const dataToRestore = log.old_data;

      if (log.action === "DELETE") {
        // Re-insert deleted patient
        const { error } = await supabase
          .from("patients")
          .insert({
            ...dataToRestore,
            deleted_at: null,
          });

        if (error) throw error;
      } else if (log.action === "UPDATE") {
        // Restore old values
        const { error } = await supabase
          .from("patients")
          .update(dataToRestore)
          .eq("id", log.record_id);

        if (error) throw error;
      }

      toast({
        title: "Data Restored",
        description: `Successfully restored ${dataToRestore.name || "patient data"}`,
      });

      // Refresh search
      searchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  function viewDiff(log: AuditLog) {
    setSelectedLog(log);
    setShowDiff(true);
  }

  function getChangedFields(oldData: any, newData: any) {
    if (!oldData || !newData) return [];

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue: oldValue === null ? "(empty)" : String(oldValue),
          newValue: newValue === null ? "(empty)" : String(newValue),
        });
      }
    });

    return changes;
  }

  async function findMissingPatients() {
    setLoading(true);
    try {
      const missing: MissingPatient[] = [];

      // Get current user's clinic_id for RLS context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this feature",
          variant: "destructive",
        });
        return;
      }

      // Query to bypass RLS and see ALL patients (requires service role key or direct SQL)
      // Since we can't bypass RLS from client, we'll search for specific patients
      const searchQuery = patientSearchTerm.trim();
      
      if (searchQuery) {
        // Search for specific patient by name
        const { data: patients, error } = await supabase
          .from("patients")
          .select("*")
          .ilike("name", `%${searchQuery}%`);

        if (error) throw error;

        if (!patients || patients.length === 0) {
          // Patient not found - check if they have appointments
          const { data: appointments } = await supabase
            .from("appointments")
            .select("patient_id, chief_complaint, appointment_date")
            .or(`chief_complaint.ilike.%${searchQuery}%`);

          if (appointments && appointments.length > 0) {
            // Found appointments but no patient record
            for (const apt of appointments) {
              const { data: patientCheck } = await supabase
                .from("patients")
                .select("*")
                .eq("id", apt.patient_id)
                .single();

              if (!patientCheck) {
                missing.push({
                  id: apt.patient_id,
                  name: searchQuery,
                  phone: "Unknown",
                  created_at: apt.appointment_date,
                  issue: "Patient record exists (referenced by appointments) but not visible",
                  suggestion: "Check RLS policies or soft-delete status",
                  raw_data: apt,
                });
              }
            }
          } else {
            toast({
              title: "No Matches Found",
              description: `No patient or appointment records found for "${searchQuery}"`,
            });
          }
        } else {
          // Found patients - check for data quality issues
          for (const patient of patients) {
            const issues: string[] = [];
            const suggestions: string[] = [];

            // Check for soft-deleted
            if (patient.deleted_at) {
              issues.push("Soft deleted");
              suggestions.push("Use restore function to undelete");
            }

            // Check for missing critical data
            if (!patient.name || patient.name.trim() === "") {
              issues.push("Missing name");
              suggestions.push("Update patient record with valid name");
            }

            if (!patient.phone || patient.phone.trim() === "") {
              issues.push("Missing phone number");
              suggestions.push("Add contact information");
            }

            // Check for orphaned clinic_id (RLS issue)
            if (patient.clinic_id) {
              const { data: clinic } = await supabase
                .from("clinics")
                .select("id")
                .eq("id", patient.clinic_id)
                .single();

              if (!clinic) {
                issues.push("Invalid clinic_id reference");
                suggestions.push("Patient belongs to non-existent clinic (RLS blocking access)");
              }
            } else {
              issues.push("No clinic_id assigned");
              suggestions.push("Assign patient to correct clinic");
            }

            if (issues.length > 0) {
              missing.push({
                id: patient.id,
                name: patient.name || "Unnamed Patient",
                phone: patient.phone || "No phone",
                created_at: patient.created_at,
                issue: issues.join(", "),
                suggestion: suggestions.join("; "),
                raw_data: patient,
              });
            }
          }

          if (missing.length === 0) {
            toast({
              title: "No Issues Found",
              description: `Found ${patients.length} patient(s) with no data quality issues`,
            });
          }
        }
      } else {
        // General scan for common issues
        const { data: allPatients, error } = await supabase
          .from("patients")
          .select("*")
          .limit(100);

        if (error) throw error;

        for (const patient of allPatients || []) {
          const issues: string[] = [];
          const suggestions: string[] = [];

          if (patient.deleted_at) {
            issues.push("Soft deleted");
            suggestions.push("Use restore function");
          }

          if (!patient.name?.trim()) {
            issues.push("Missing name");
            suggestions.push("Update with valid name");
          }

          if (issues.length > 0) {
            missing.push({
              id: patient.id,
              name: patient.name || "Unnamed",
              phone: patient.phone || "No phone",
              created_at: patient.created_at,
              issue: issues.join(", "),
              suggestion: suggestions.join("; "),
              raw_data: patient,
            });
          }
        }
      }

      setMissingPatients(missing);

      toast({
        title: "Scan Complete",
        description: missing.length > 0 
          ? `Found ${missing.length} patient(s) with issues`
          : "No missing patients detected",
        variant: missing.length > 0 ? "default" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fixPatientIssue(patient: MissingPatient) {
    try {
      if (patient.issue.includes("Soft deleted")) {
        // Restore soft-deleted patient
        const { error } = await supabase
          .from("patients")
          .update({ deleted_at: null })
          .eq("id", patient.id);

        if (error) throw error;

        toast({
          title: "Patient Restored",
          description: `${patient.name} has been restored`,
        });

        // Refresh the list
        findMissingPatients();
      } else if (patient.issue.includes("Invalid clinic_id")) {
        toast({
          title: "Manual Intervention Required",
          description: "This patient needs to be reassigned to a valid clinic via SQL",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Manual Fix Required",
          description: "Please edit the patient record directly to fix this issue",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fix Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  // SQL Helper queries for debugging
  const sqlQueries: SQLQuery[] = [
    {
      title: "Find patients with wrong clinic_id",
      description: `Shows all patients NOT in your clinic (${currentClinicId?.substring(0, 8)}...)`,
      category: "diagnostic",
      query: `-- Find patients with wrong clinic_id
SELECT id, first_name, last_name, phone, clinic_id, created_at
FROM patients
WHERE clinic_id != '${currentClinicId}'
  OR clinic_id IS NULL
ORDER BY created_at DESC
LIMIT 50;`
    },
    {
      title: "Search for specific patient (Peter, John)",
      description: "Find patients by name regardless of clinic_id (bypasses RLS in SQL editor)",
      category: "diagnostic",
      query: `-- Search for Peter or John
SELECT id, first_name, last_name, phone, clinic_id, created_at
FROM patients
WHERE first_name ILIKE '%peter%' 
   OR last_name ILIKE '%peter%'
   OR first_name ILIKE '%john%'
   OR last_name ILIKE '%john%'
   OR last_name ILIKE '%ouma%'
   OR last_name ILIKE '%owuor%'
ORDER BY created_at DESC;`
    },
    {
      title: "Recover deleted medical history (check audit logs)",
      description: "Find previous versions of medical_history field for a patient",
      category: "diagnostic",
      query: `-- REPLACE 'patient-id-here' with actual patient ID
-- This shows the history of medical_history changes
SELECT 
  id,
  action,
  old_data->>'first_name' as patient_name,
  old_data->>'medical_history' as old_medical_history,
  new_data->>'medical_history' as new_medical_history,
  created_at,
  users.email as changed_by
FROM audit_logs
LEFT JOIN users ON audit_logs.user_id = users.user_id
WHERE table_name = 'patients'
  AND record_id = 'patient-id-here'
  AND (old_data->>'medical_history' IS NOT NULL 
       OR new_data->>'medical_history' IS NOT NULL)
ORDER BY created_at DESC;`
    },
    {
      title: "Fix: Assign patients to your clinic",
      description: `Moves found patients to your clinic (${currentClinicId?.substring(0, 8)}...)`,
      category: "fix",
      query: `-- REPLACE 'patient-id-here' with actual patient IDs from diagnostic queries
UPDATE patients
SET clinic_id = '${currentClinicId}'
WHERE id IN (
  'patient-id-here',
  'another-patient-id-here'
);

-- Verify the update
SELECT id, first_name, last_name, clinic_id
FROM patients
WHERE id IN ('patient-id-here', 'another-patient-id-here');`
    },
    {
      title: "Find patients with appointments but wrong clinic",
      description: "Shows patients who have appointments but are in wrong clinic",
      category: "diagnostic",
      query: `-- Find patients with appointments but wrong clinic
SELECT DISTINCT 
  p.id, 
  p.first_name, 
  p.last_name, 
  p.clinic_id as patient_clinic,
  '${currentClinicId}' as your_clinic,
  COUNT(a.id) as appointment_count
FROM patients p
INNER JOIN appointments a ON a.patient_id = p.id
WHERE p.clinic_id != '${currentClinicId}'
   OR p.clinic_id IS NULL
GROUP BY p.id, p.first_name, p.last_name, p.clinic_id
ORDER BY appointment_count DESC;`
    },
    {
      title: "Check all clinics in database",
      description: "Shows all clinics to identify which one patients belong to",
      category: "diagnostic",
      query: `-- Show all clinics
SELECT id, name, created_at
FROM clinics
ORDER BY created_at DESC;`
    },
    {
      title: "Fix: Restore medical history from audit log",
      description: "Copy the old medical_history value from diagnostic query and paste here",
      category: "fix",
      query: `-- STEP 1: Run the diagnostic query above to find the old medical_history
-- STEP 2: Copy the medical_history text from the results
-- STEP 3: Replace 'patient-id-here' and 'paste-medical-history-here' below

UPDATE patients
SET medical_history = 'paste-medical-history-here'
WHERE id = 'patient-id-here';

-- Verify the update
SELECT id, first_name, last_name, medical_history
FROM patients
WHERE id = 'patient-id-here';`
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "SQL query copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <CardTitle>Data Recovery & Audit</CardTitle>
          </div>
          <CardDescription>
            Search audit logs and recover lost or modified data
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="sql" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sql">SQL Helper</TabsTrigger>
          <TabsTrigger value="missing">Missing Patients</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="orphaned">Orphaned Records</TabsTrigger>
        </TabsList>

        <TabsContent value="sql" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">SQL Diagnostic Queries</CardTitle>
              </div>
              <CardDescription>
                Copy these queries and run them in Supabase SQL Editor to find and fix missing patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">Why patients don't show up:</div>
                    <ul className="text-blue-800 space-y-1 list-disc list-inside">
                      <li>RLS Policy: Patients are filtered by <code className="bg-blue-100 px-1 rounded">clinic_id</code></li>
                      <li>If Peter/John have wrong <code className="bg-blue-100 px-1 rounded">clinic_id</code>, they're hidden</li>
                      <li>Your clinic ID: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">{currentClinicId || "Loading..."}</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-medium text-sm text-muted-foreground">Diagnostic Queries (READ ONLY)</div>
                {sqlQueries.filter(q => q.category === "diagnostic").map((query, idx) => (
                  <Card key={idx} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium mb-1">{query.title}</div>
                          <div className="text-sm text-muted-foreground">{query.description}</div>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(query.query)}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View SQL
                        </summary>
                        <pre className="mt-2 bg-muted p-3 rounded overflow-auto border">
                          {query.query}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}

                <div className="font-medium text-sm text-muted-foreground mt-6">Fix Queries (MODIFY DATA)</div>
                {sqlQueries.filter(q => q.category === "fix").map((query, idx) => (
                  <Card key={idx} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{query.title}</div>
                            <Badge variant="default" className="bg-green-600">FIX</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{query.description}</div>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(query.query)}
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Fix
                        </Button>
                      </div>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View SQL
                        </summary>
                        <pre className="mt-2 bg-muted p-3 rounded overflow-auto border">
                          {query.query}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-900">
                      <div className="font-medium mb-1">How to use:</div>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to Supabase Dashboard → SQL Editor</li>
                        <li>Copy and run diagnostic queries to find Peter/John</li>
                        <li>Note their patient IDs from results</li>
                        <li>Copy the fix query and replace 'patient-id-here' with actual IDs</li>
                        <li>Run the fix query to assign them to your clinic</li>
                        <li>Refresh the Patients page - they should now appear!</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Audit Logs</CardTitle>
              <CardDescription>
                Find changes to patient data (names, medical history, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter patient name (e.g., John Doe)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchAuditLogs()}
                  className="flex-1"
                />
                <Button
                  onClick={searchAuditLogs}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={
                                log.action === "DELETE"
                                  ? "destructive"
                                  : log.action === "UPDATE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {log.action}
                            </Badge>
                            <span className="font-medium">
                              {log.old_data?.name || log.new_data?.name || "Unknown Patient"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            By: {log.users?.email || "Unknown"} • {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => viewDiff(log)}
                            size="sm"
                            variant="outline"
                          >
                            <History className="w-4 h-4 mr-2" />
                            View Changes
                          </Button>
                          {(log.action === "UPDATE" || log.action === "DELETE") && (
                            <Button
                              onClick={() => restoreFromAuditLog(log)}
                              size="sm"
                              variant="default"
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {auditLogs.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    Enter a patient name and click Search to view audit logs
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Missing Patients Diagnostics</CardTitle>
              <CardDescription>
                Find patients who exist in the database but don't show up in the UI (RLS issues, soft-deleted, data quality problems)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter patient name (e.g., Jane Doe) or leave blank for general scan"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && findMissingPatients()}
                  className="flex-1"
                />
                <Button
                  onClick={findMissingPatients}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Diagnose
                </Button>
              </div>

              <div className="space-y-3">
                {missingPatients.map((patient) => (
                  <Card key={patient.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">{patient.name}</span>
                            <Badge variant="outline">{patient.phone}</Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-red-600">Issue:</div>
                                <div className="text-muted-foreground">{patient.issue}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <Database className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-blue-600">Suggestion:</div>
                                <div className="text-muted-foreground">{patient.suggestion}</div>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground pt-1">
                              Created: {new Date(patient.created_at).toLocaleString()} • ID: <code className="bg-muted px-1 rounded">{patient.id}</code>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => fixPatientIssue(patient)}
                            size="sm"
                            variant="default"
                            disabled={!patient.issue.includes("Soft deleted")}
                          >
                            {patient.issue.includes("Soft deleted") ? "Restore" : "View Details"}
                          </Button>
                          <Button
                            onClick={() => {
                              // Copy patient ID to clipboard for SQL queries
                              navigator.clipboard.writeText(patient.id);
                              toast({
                                title: "ID Copied",
                                description: "Patient ID copied to clipboard",
                              });
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Copy ID
                          </Button>
                        </div>
                      </div>
                      
                      {/* Show raw data in expandable section */}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Raw Data
                        </summary>
                        <pre className="mt-2 bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(patient.raw_data, null, 2)}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}

                {missingPatients.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mb-2">Enter a patient name or click "Diagnose" to scan for issues</div>
                    <div className="text-xs">This will check for: soft-deleted patients, RLS policy issues, missing clinic_id, data quality problems</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orphaned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Orphaned Records Scanner</CardTitle>
              <CardDescription>
                Find appointments, procedures, and cases with missing patient references
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={findOrphanedRecords} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Scan Database
              </Button>

              <div className="space-y-3">
                {orphanedRecords.map((record) => (
                  <Card key={record.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline">{record.type}</Badge>
                          <div className="mt-2 text-sm">
                            <div>Patient ID: <code className="bg-muted px-1 py-0.5 rounded">{record.patient_id}</code></div>
                            {record.type === "appointment" && (
                              <div>Date: {new Date(record.details.appointment_date).toLocaleDateString()}</div>
                            )}
                            {record.type === "procedure" && (
                              <div>Type: {record.details.procedure_type}</div>
                            )}
                          </div>
                        </div>
                        <Badge variant="destructive">Missing Patient</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {orphanedRecords.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    Click "Scan Database" to check for orphaned records
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diff Dialog */}
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.action} operation on {new Date(selectedLog?.created_at || "").toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedLog?.action === "UPDATE" && selectedLog.old_data && selectedLog.new_data && (
                <div className="space-y-3">
                  {getChangedFields(selectedLog.old_data, selectedLog.new_data).map((change, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="font-medium mb-2">{change.field}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-red-600 font-medium mb-1">Before:</div>
                            <div className="bg-red-50 p-2 rounded border border-red-200 break-words">
                              {change.oldValue}
                            </div>
                          </div>
                          <div>
                            <div className="text-green-600 font-medium mb-1">After:</div>
                            <div className="bg-green-50 p-2 rounded border border-green-200 break-words">
                              {change.newValue}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedLog?.action === "DELETE" && selectedLog.old_data && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-red-600 font-medium mb-2">Deleted Data:</div>
                    <pre className="bg-red-50 p-4 rounded border border-red-200 overflow-auto text-xs">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
