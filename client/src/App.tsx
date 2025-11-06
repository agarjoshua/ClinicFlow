import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import AssistantDashboard from "@/pages/assistant-dashboard";
import AssistantCalendar from "@/pages/assistant-calendar";
import AuthPage from "@/pages/auth";
import Patients from "@/pages/patients";
import PatientForm from "@/pages/patient-form";
import PatientDetail from "@/pages/patient-detail";
import Discharged from "@/pages/discharged";
import ConsultantCalendar from "@/pages/consultant-calendar";
import Appointments from "@/pages/appointments";
import AppointmentForm from "@/pages/appointment-form";
import Triage from "@/pages/triage";
import Diagnoses from "@/pages/diagnoses";
import ClinicalCases from "@/pages/clinical-cases";
import Procedures from "@/pages/procedures";
import Hospitals from "@/pages/hospitals";
import PostOpUpdates from "@/pages/post-op-updates";
import ScheduleClinic from "@/pages/schedule-clinic";
import ClinicSessionDetail from "@/pages/clinic-session-detail";
import NotFound from "@/pages/not-found";

function Router({ userRole }: { userRole: "consultant" | "assistant" | null }) {
  return (
    <Switch>
      <Route path="/">
        {userRole === "consultant" ? <ConsultantCalendar /> : <AssistantDashboard />}
      </Route>
      <Route path="/calendar" component={AssistantCalendar} />
      <Route path="/schedule-clinic" component={ScheduleClinic} />
      <Route path="/clinic-sessions/:id" component={ClinicSessionDetail} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/appointments/new" component={AppointmentForm} />
      <Route path="/triage" component={Triage} />
      <Route path="/diagnoses" component={Diagnoses} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/new" component={PatientForm} />
      <Route path="/patients/:id" component={PatientDetail} />
      <Route path="/post-op-updates" component={PostOpUpdates} />
      <Route path="/discharged" component={Discharged} />
      <Route path="/clinical-cases" component={ClinicalCases} />
      <Route path="/procedures" component={Procedures} />
      <Route path="/hospitals" component={Hospitals} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<"consultant" | "assistant" | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        // Fetch user profile from users table
        supabase
          .from("users")
          .select()
          .eq("user_id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data) {
              setUserRole(data.role);
              setUserData(data);
            } else if (error) {
              console.error("Error fetching user profile:", error);
              // Profile doesn't exist yet - this can happen right after signup
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoading(true);
      setSession(session);
      if (session?.user?.id) {
        supabase
          .from("users")
          .select()
          .eq("user_id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data) {
              setUserRole(data.role);
              setUserData(data);
            } else if (error) {
              console.error("Error fetching user profile:", error);
            }
            setIsLoading(false);
          });
      } else {
        setUserRole(null);
        setUserData(null);
        setIsLoading(false);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const isAuthRoute = window.location.pathname === "/auth";
  
  // If user is logged in but has no profile, redirect to auth
  const hasSessionButNoProfile = !!session && !userData && !isLoading;
  
  const showSidebar = !!session && !isAuthRoute && !!userData && !!userRole;

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">ClinicFlow</h2>
            <p className="text-sm text-gray-600">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated but has no profile, show message to sign out and complete registration
  if (hasSessionButNoProfile) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-white">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">Profile Not Found</h2>
              <p className="text-gray-600">
                Your account exists but your profile hasn't been created yet. 
                This usually happens if you just signed up and haven't confirmed your email.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Please check your email and click the confirmation link, then try logging in again.
              </p>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/auth";
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Out & Return to Login
              </button>
            </div>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {showSidebar ? (
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar userRole={userRole} userData={userData} />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{userData?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                    </div>
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <div className="max-w-7xl mx-auto">
                    <Router userRole={userRole} />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        ) : (
          <Router userRole={userRole} />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
