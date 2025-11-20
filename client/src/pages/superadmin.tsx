import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Building2,
  Activity,
  DollarSign,
  CalendarDays,
  FileText,
  Stethoscope,
  Hospital,
  UserPlus,
  Crown,
  BarChart3,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ClinicCrudDialog } from "@/components/clinic-crud-dialog";
import { ClinicSignupWizard } from "@/components/clinic-signup-wizard";
import { SubscriptionCrudDialog } from "@/components/subscription-crud-dialog";
import { FeatureAnalyticsManager } from "@/components/feature-analytics-manager";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface FeatureUsage {
  feature: string;
  count: number;
  lastUsed: string;
}

interface ClinicStats {
  id: string;
  name: string;
  tier: string;
  status: string;
  userCount: number;
  patientCount: number;
  appointmentCount: number;
  createdAt: string;
}

export default function SuperAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedClinic, setSelectedClinic] = useState("all");
  
  // Dialog states
  const [clinicWizardOpen, setClinicWizardOpen] = useState(false);
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionMessage, setSuspensionMessage] = useState("");
  const [selectedClinicForEdit, setSelectedClinicForEdit] = useState<any>(null);
  const [clinicDialogMode, setClinicDialogMode] = useState<"create" | "edit">("create");

  // Fetch all clinics
  const { data: clinics = [], isLoading: clinicsLoading, error: clinicsError } = useQuery({
    queryKey: ["superadmin-clinics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching clinics:", error);
        throw error;
      }
      console.log("Fetched clinics:", data);
      return data || [];
    },
  });

  // Fetch clinic statistics
  const { data: clinicStats = [] } = useQuery<ClinicStats[]>({
    queryKey: ["superadmin-clinic-stats", selectedClinic],
    queryFn: async () => {
      let clinicsToQuery = clinics;
      if (selectedClinic !== "all") {
        clinicsToQuery = clinics.filter(c => c.id === selectedClinic);
      }

      const stats = await Promise.all(
        clinicsToQuery.map(async (clinic) => {
          // Get user count
          const { count: userCount } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("clinic_id", clinic.id);

          // Get patient count
          const { count: patientCount } = await supabase
            .from("patients")
            .select("*", { count: "exact", head: true })
            .eq("clinic_id", clinic.id);

          // Get appointment count
          const { count: appointmentCount } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("clinic_id", clinic.id);

          return {
            id: clinic.id,
            name: clinic.name,
            tier: clinic.subscription_tier || "starter",
            status: clinic.subscription_status || "active",
            userCount: userCount || 0,
            patientCount: patientCount || 0,
            appointmentCount: appointmentCount || 0,
            createdAt: clinic.created_at,
          };
        })
      );

      return stats;
    },
    enabled: clinics.length > 0,
  });

  // Delete clinic mutation
  const deleteClinicMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      const { error } = await supabase
        .from("clinics")
        .delete()
        .eq("id", clinicId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Clinic deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinic-stats"] });
      setDeleteDialogOpen(false);
      setSelectedClinicForEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleSuspensionMutation = useMutation({
    mutationFn: async ({ clinicId, suspend, message }: { clinicId: string; suspend: boolean; message?: string }) => {
      const updateData: any = {
        subscription_status: suspend ? "suspended" : "active",
      };

      // Store custom suspension message in settings jsonb field
      if (suspend && message) {
        const { data: clinic } = await supabase
          .from("clinics")
          .select("settings")
          .eq("id", clinicId)
          .single();

        updateData.settings = {
          ...(clinic?.settings || {}),
          suspension_message: message,
        };
      } else if (!suspend) {
        // Clear suspension message when reactivating
        const { data: clinic } = await supabase
          .from("clinics")
          .select("settings")
          .eq("id", clinicId)
          .single();

        const { suspension_message, ...restSettings } = clinic?.settings || {};
        updateData.settings = restSettings;
      }

      const { error } = await supabase
        .from("clinics")
        .update(updateData)
        .eq("id", clinicId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: `Clinic ${variables.suspend ? "suspended" : "activated"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinic-stats"] });
      setSuspendDialogOpen(false);
      setSuspensionMessage("");
      setSelectedClinicForEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch feature usage analytics
  const { data: featureUsage = [] } = useQuery<FeatureUsage[]>({
    queryKey: ["superadmin-feature-usage", selectedClinic, selectedPeriod],
    queryFn: async () => {
      const daysAgo = parseInt(selectedPeriod);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      const dateString = format(dateThreshold, "yyyy-MM-dd");

      let clinicFilter = selectedClinic !== "all" ? selectedClinic : null;

      // Get appointments count (Booking feature)
      const appointmentsQuery = supabase
        .from("appointments")
        .select("created_at", { count: "exact", head: false })
        .gte("created_at", dateString);
      if (clinicFilter) appointmentsQuery.eq("clinic_id", clinicFilter);
      const { data: appointments, count: appointmentCount } = await appointmentsQuery;

      // Get diagnoses count (Diagnosis feature)
      const diagnosesQuery = supabase
        .from("clinical_cases")
        .select("created_at", { count: "exact", head: false })
        .gte("created_at", dateString);
      if (clinicFilter) diagnosesQuery.eq("clinic_id", clinicFilter);
      const { data: diagnoses, count: diagnosesCount } = await diagnosesQuery;

      // Get procedures count
      const proceduresQuery = supabase
        .from("procedures")
        .select("created_at", { count: "exact", head: false })
        .gte("created_at", dateString);
      if (clinicFilter) proceduresQuery.eq("clinic_id", clinicFilter);
      const { data: procedures, count: proceduresCount } = await proceduresQuery;

      // Get patient registrations
      const patientsQuery = supabase
        .from("patients")
        .select("created_at", { count: "exact", head: false })
        .gte("created_at", dateString);
      if (clinicFilter) patientsQuery.eq("clinic_id", clinicFilter);
      const { data: patients, count: patientsCount } = await patientsQuery;

      // Get clinic sessions scheduled
      const sessionsQuery = supabase
        .from("clinic_sessions")
        .select("created_at, hospital_id")
        .gte("created_at", dateString);
      
      let sessionsData: any[] = [];
      if (clinicFilter) {
        // Get hospital IDs for the clinic
        const { data: hospitalData } = await supabase
          .from("hospitals")
          .select("id")
          .eq("clinic_id", clinicFilter);
        const hospitalIds = hospitalData?.map(h => h.id) || [];
        if (hospitalIds.length > 0) {
          const { data } = await sessionsQuery.in("hospital_id", hospitalIds);
          sessionsData = data || [];
        }
      } else {
        const { data } = await sessionsQuery;
        sessionsData = data || [];
      }

      // Get admissions
      const admissionsQuery = supabase
        .from("patient_admissions")
        .select("created_at", { count: "exact", head: false })
        .gte("created_at", dateString);
      if (clinicFilter) admissionsQuery.eq("clinic_id", clinicFilter);
      const { data: admissions, count: admissionsCount } = await admissionsQuery;

      // Get most recent usage for each feature
      const getLastUsed = (data: any[] | null): string => {
        if (!data || data.length === 0) return "Never";
        const sorted = [...data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return sorted[0].created_at;
      };

      return [
        {
          feature: "Patient Appointments",
          count: appointmentCount || 0,
          lastUsed: getLastUsed(appointments),
        },
        {
          feature: "Clinical Diagnoses",
          count: diagnosesCount || 0,
          lastUsed: getLastUsed(diagnoses),
        },
        {
          feature: "Procedures Scheduled",
          count: proceduresCount || 0,
          lastUsed: getLastUsed(procedures),
        },
        {
          feature: "Patient Registrations",
          count: patientsCount || 0,
          lastUsed: getLastUsed(patients),
        },
        {
          feature: "Clinic Sessions",
          count: sessionsData.length,
          lastUsed: getLastUsed(sessionsData),
        },
        {
          feature: "Patient Admissions",
          count: admissionsCount || 0,
          lastUsed: getLastUsed(admissions),
        },
      ].sort((a, b) => b.count - a.count);
    },
    enabled: clinics.length > 0,
  });

  // Calculate totals
  const totalClinics = clinics.length;
  const activeClinics = clinics.filter(c => c.subscription_status === "active").length;
  const totalRevenue = clinics.reduce((sum, c) => {
    const tier = c.subscription_tier || "starter";
    if (tier === "professional") return sum + 15000;
    if (tier === "enterprise") return sum + 0; // Custom pricing
    if (tier === "starter") return sum + 5000;
    return sum;
  }, 0);
  const totalUsers = clinicStats.reduce((sum, c) => sum + c.userCount, 0);
  const totalPatients = clinicStats.reduce((sum, c) => sum + c.patientCount, 0);

  // Subscription tier distribution
  const tierDistribution = clinics.reduce((acc, clinic) => {
    const tier = clinic.subscription_tier || "starter";
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tierData = Object.entries(tierDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Error Display */}
      {clinicsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Clinics</h3>
          <p className="text-red-600 text-sm mt-1">
            {clinicsError instanceof Error ? clinicsError.message : "Failed to load clinic data"}
          </p>
          <p className="text-red-600 text-xs mt-2">
            Check browser console for details or verify you have superadmin access.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            SuperAdmin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage subscriptions and monitor platform analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Clinics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clinics</SelectItem>
              {clinics.map(clinic => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClinics}</div>
            <p className="text-xs text-muted-foreground">
              {activeClinics} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Consultants & assistants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Across all clinics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Feature Analytics
          </TabsTrigger>
          <TabsTrigger value="clinics">
            <Building2 className="w-4 h-4 mr-2" />
            Clinic Management
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <Crown className="w-4 h-4 mr-2" />
            Subscriptions
          </TabsTrigger>
        </TabsList>

        {/* Feature Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <FeatureAnalyticsManager
            selectedPeriod={selectedPeriod}
            selectedClinic={selectedClinic}
            clinics={clinics}
          />
        </TabsContent>

        {/* Clinic Management Tab */}
        <TabsContent value="clinics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Clinics</CardTitle>
                  <CardDescription>
                    Manage clinic accounts and view statistics
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setClinicWizardOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Clinic
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Patients</TableHead>
                    <TableHead className="text-right">Appointments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicStats.map((clinic) => {
                    const fullClinic = clinics.find(c => c.id === clinic.id);
                    return (
                      <TableRow key={clinic.id}>
                        <TableCell className="font-medium">{clinic.name}</TableCell>
                        <TableCell>
                          <Badge variant={clinic.status === "active" ? "default" : "secondary"}>
                            {clinic.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {clinic.tier.charAt(0).toUpperCase() + clinic.tier.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{clinic.userCount}</TableCell>
                        <TableCell className="text-right">{clinic.patientCount}</TableCell>
                        <TableCell className="text-right">{clinic.appointmentCount}</TableCell>
                        <TableCell>
                          {format(new Date(clinic.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setClinicDialogMode("edit");
                                  setSelectedClinicForEdit(fullClinic);
                                  setClinicDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClinicForEdit(fullClinic);
                                  setSubscriptionDialogOpen(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Manage Subscription
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {clinic.status === "active" ? (
                                <DropdownMenuItem
                                  className="text-orange-600"
                                  onClick={() => {
                                    setSelectedClinicForEdit(fullClinic);
                                    setSuspendDialogOpen(true);
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Suspend Access
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => {
                                    toggleSuspensionMutation.mutate({
                                      clinicId: fullClinic.id,
                                      suspend: false,
                                    });
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activate Clinic
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedClinicForEdit(fullClinic);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Clinic
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>KES 5,000/month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tierDistribution["starter"] || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  KES {((tierDistribution["starter"] || 0) * 5000).toLocaleString()}/mo revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <CardDescription>KES 15,000/month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tierDistribution["professional"] || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  KES {((tierDistribution["professional"] || 0) * 15000).toLocaleString()}/mo revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Custom pricing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tierDistribution["enterprise"] || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Contact <a href="mailto:tech@zahaniflow.com" className="text-blue-600 hover:underline">tech@zahaniflow.com</a>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Revenue breakdown by clinic
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clinicsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading subscriptions...</p>
                </div>
              ) : clinics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No clinics found. Create your first clinic to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clinic</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Monthly Revenue</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinics.map((clinic) => {
                      const tier = clinic.subscription_tier || "starter";
                      const revenue = tier === "professional" ? 15000 : tier === "enterprise" ? 0 : tier === "starter" ? 5000 : 0;
                      return (
                        <TableRow key={clinic.id}>
                          <TableCell className="font-medium">{clinic.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={clinic.subscription_status === "active" ? "default" : "secondary"}>
                              {clinic.subscription_status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {tier === "enterprise" ? "Custom" : `KES ${revenue.toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            {clinic.subscription_end_date 
                              ? format(new Date(clinic.subscription_end_date), "MMM d, yyyy")
                              : format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "MMM d, yyyy")
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClinicForEdit(clinic);
                                setSubscriptionDialogOpen(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ClinicSignupWizard
        open={clinicWizardOpen}
        onOpenChange={setClinicWizardOpen}
      />

      <ClinicCrudDialog
        open={clinicDialogOpen}
        onOpenChange={setClinicDialogOpen}
        clinic={selectedClinicForEdit}
        mode={clinicDialogMode}
      />

      <SubscriptionCrudDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
        clinic={selectedClinicForEdit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the clinic
              <span className="font-bold"> {selectedClinicForEdit?.name}</span> and remove all
              associated data including users, patients, and appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedClinicForEdit(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedClinicForEdit) {
                  deleteClinicMutation.mutate(selectedClinicForEdit.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Clinic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Clinic Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will block all users from accessing{" "}
              <span className="font-bold">{selectedClinicForEdit?.name}</span> until you
              reactivate it. Users will see a suspension message when they try to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspension-message">
                Custom Message (Optional)
              </Label>
              <Textarea
                id="suspension-message"
                placeholder="e.g., Payment overdue. Please contact tech@zahaniflow.com to restore access."
                value={suspensionMessage}
                onChange={(e) => setSuspensionMessage(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be displayed to users when they try to access the system.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedClinicForEdit(null);
                setSuspensionMessage("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedClinicForEdit) {
                  toggleSuspensionMutation.mutate({
                    clinicId: selectedClinicForEdit.id,
                    suspend: true,
                    message: suspensionMessage || undefined,
                  });
                }
              }}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Suspend Clinic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
