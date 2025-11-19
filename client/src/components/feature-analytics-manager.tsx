import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Area,
  AreaChart,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  FileText,
  Stethoscope,
  Activity,
  Download,
  RefreshCw
} from "lucide-react";

interface FeatureAnalyticsManagerProps {
  selectedPeriod: string;
  selectedClinic: string;
  clinics: any[];
}

interface FeatureUsage {
  feature: string;
  count: number;
  lastUsed: string;
  trend?: number;
  icon?: any;
}

export function FeatureAnalyticsManager({ 
  selectedPeriod, 
  selectedClinic, 
  clinics 
}: FeatureAnalyticsManagerProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table" | "trends">("chart");
  
  // Fetch feature usage analytics
  const { data: featureUsage = [], isLoading, refetch } = useQuery<FeatureUsage[]>({
    queryKey: ["superadmin-feature-usage", selectedClinic, selectedPeriod],
    queryFn: async () => {
      const daysAgo = parseInt(selectedPeriod);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      const dateString = format(dateThreshold, "yyyy-MM-dd");

      let clinicFilter = selectedClinic !== "all" ? selectedClinic : null;

      // Helper function to build queries
      const buildQuery = (table: string, clinicIdColumn = "clinic_id") => {
        const query = supabase
          .from(table)
          .select("created_at", { count: "exact", head: false })
          .gte("created_at", dateString);
        if (clinicFilter) query.eq(clinicIdColumn, clinicFilter);
        return query;
      };

      // Get all feature counts
      const [appointments, diagnoses, procedures, patients, admissions] = await Promise.all([
        buildQuery("appointments"),
        buildQuery("clinical_cases"),
        buildQuery("procedures"),
        buildQuery("patients"),
        buildQuery("patient_admissions"),
      ]);

      // Clinic sessions (special handling)
      let sessionsData: any[] = [];
      if (clinicFilter) {
        const { data: hospitalData } = await supabase
          .from("hospitals")
          .select("id")
          .eq("clinic_id", clinicFilter);
        const hospitalIds = hospitalData?.map(h => h.id) || [];
        if (hospitalIds.length > 0) {
          const { data } = await supabase
            .from("clinic_sessions")
            .select("created_at")
            .gte("created_at", dateString)
            .in("hospital_id", hospitalIds);
          sessionsData = data || [];
        }
      } else {
        const { data } = await supabase
          .from("clinic_sessions")
          .select("created_at")
          .gte("created_at", dateString);
        sessionsData = data || [];
      }

      const getLastUsed = (data: any[] | null): string => {
        if (!data || data.length === 0) return "Never";
        const sorted = [...data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return sorted[0].created_at;
      };

      // Calculate trends (compare with previous period)
      const calculateTrend = async (table: string, currentCount: number) => {
        const prevDateThreshold = new Date(dateThreshold);
        prevDateThreshold.setDate(prevDateThreshold.getDate() - daysAgo);
        const prevDateString = format(prevDateThreshold, "yyyy-MM-dd");

        const query = supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .gte("created_at", prevDateString)
          .lt("created_at", dateString);
        
        if (clinicFilter) query.eq("clinic_id", clinicFilter);
        
        const { count: prevCount } = await query;
        if (!prevCount || prevCount === 0) return 100;
        return Math.round(((currentCount - prevCount) / prevCount) * 100);
      };

      const features = [
        {
          feature: "Patient Appointments",
          count: appointments.count || 0,
          lastUsed: getLastUsed(appointments.data),
          icon: Calendar,
          trend: await calculateTrend("appointments", appointments.count || 0),
        },
        {
          feature: "Clinical Diagnoses",
          count: diagnoses.count || 0,
          lastUsed: getLastUsed(diagnoses.data),
          icon: Stethoscope,
          trend: await calculateTrend("clinical_cases", diagnoses.count || 0),
        },
        {
          feature: "Procedures Scheduled",
          count: procedures.count || 0,
          lastUsed: getLastUsed(procedures.data),
          icon: Activity,
          trend: await calculateTrend("procedures", procedures.count || 0),
        },
        {
          feature: "Patient Registrations",
          count: patients.count || 0,
          lastUsed: getLastUsed(patients.data),
          icon: Users,
          trend: await calculateTrend("patients", patients.count || 0),
        },
        {
          feature: "Clinic Sessions",
          count: sessionsData.length,
          lastUsed: getLastUsed(sessionsData),
          icon: Calendar,
          trend: 0, // Sessions need special handling for trend
        },
        {
          feature: "Patient Admissions",
          count: admissions.count || 0,
          lastUsed: getLastUsed(admissions.data),
          icon: FileText,
          trend: await calculateTrend("patient_admissions", admissions.count || 0),
        },
      ];

      return features.sort((a, b) => b.count - a.count);
    },
    enabled: clinics.length > 0,
  });

  const totalUsage = featureUsage.reduce((sum, f) => sum + f.count, 0);

  const exportToCSV = () => {
    const headers = ["Feature", "Usage Count", "Last Used", "Trend %", "% of Total"];
    const rows = featureUsage.map((f) => [
      f.feature,
      f.count,
      f.lastUsed === "Never" ? "Never" : format(new Date(f.lastUsed), "yyyy-MM-dd HH:mm"),
      f.trend ? `${f.trend > 0 ? "+" : ""}${f.trend}%` : "N/A",
      totalUsage > 0 ? `${((f.count / totalUsage) * 100).toFixed(1)}%` : "0%",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feature-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "chart" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("chart")}
          >
            Chart View
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            Table View
          </Button>
          <Button
            variant={viewMode === "trends" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("trends")}
          >
            Trend Analysis
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all features
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Used Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featureUsage[0]?.feature || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {featureUsage[0]?.count || 0} uses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {featureUsage.filter(f => f.count > 0).length} / {featureUsage.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Features being used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart View */}
      {viewMode === "chart" && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage Distribution</CardTitle>
            <CardDescription>
              Usage count for each feature over the last {selectedPeriod} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={featureUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="feature" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Feature Usage</CardTitle>
            <CardDescription>
              Complete breakdown of feature usage and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-right">Usage Count</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureUsage.map((feature, index) => {
                  const percentage = totalUsage > 0 ? (feature.count / totalUsage * 100).toFixed(1) : "0";
                  const Icon = feature.icon || Activity;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{feature.feature}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{feature.count}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {feature.lastUsed === "Never" 
                          ? "Never" 
                          : format(new Date(feature.lastUsed), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        {feature.trend !== undefined && feature.trend !== 0 ? (
                          <Badge variant={feature.trend > 0 ? "default" : "destructive"}>
                            {feature.trend > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(feature.trend)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{percentage}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Trends View */}
      {viewMode === "trends" && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Trend Analysis</CardTitle>
            <CardDescription>
              Comparison with previous period ({selectedPeriod} days ago)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureUsage.map((feature, idx) => {
                const Icon = feature.icon || Activity;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{feature.feature}</div>
                        <div className="text-sm text-muted-foreground">
                          {feature.count} uses in last {selectedPeriod} days
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {feature.trend !== undefined && feature.trend !== 0 ? (
                        <div className="flex items-center gap-2">
                          {feature.trend > 0 ? (
                            <>
                              <TrendingUp className="h-5 w-5 text-green-500" />
                              <span className="text-green-600 font-bold">+{feature.trend}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-5 w-5 text-red-500" />
                              <span className="text-red-600 font-bold">{feature.trend}%</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <Badge variant="secondary">No change</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
