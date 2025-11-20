import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useClinic, ClinicProvider } from "@/contexts/ClinicContext";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown } from "lucide-react";
import { SubscriptionOverlay } from "@/components/subscription-overlay";

// Header component with clinic details
function Header({ userData, userRole }: { userData: any; userRole: string | null }) {
  const { clinic } = useClinic();

  const getTierBadgeVariant = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'professional':
        return 'default';
      case 'enterprise':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        {clinic && (
          <div className="flex items-center gap-3 pl-3 border-l">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">{clinic.name}</h2>
                {clinic.subscriptionTier && (
                  <Badge variant={getTierBadgeVariant(clinic.subscriptionTier)} className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    {clinic.subscriptionTier}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {clinic.subscriptionStatus === 'active' ? (
                  <span className="text-green-600">● Active</span>
                ) : (
                  <span className="text-amber-600">● {clinic.subscriptionStatus}</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{userData?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
      </div>
    </header>
  );
}

import AssistantDashboard from "@/pages/assistant-dashboard";
import AssistantCalendar from "@/pages/assistant-calendar";
import AuthPage from "@/pages/auth";
import LandingPage from "@/pages/landing";
import Patients from "@/pages/patients";
import PatientForm from "@/pages/patient-form";
import PatientDetail from "@/pages/patient-detail";
import Discharged from "@/pages/discharged";
import ConsultantCalendar from "@/pages/consultant-calendar";
import ConsultantPatients from "@/pages/consultant-patients";
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
import Inpatients from "@/pages/inpatients";
import ClinicOnboardingPage from "@/pages/clinic-onboarding";
import TeamManagementPage from "@/pages/team-management";
import AcceptInvitationPage from "@/pages/accept-invitation";
import SubscriptionPage from "@/pages/subscription";
import BillingPage from "@/pages/billing";
import OrganizationProfilePage from "@/pages/organization-profile";
import RemindersPage from "@/pages/reminders";
import SuperAdmin from "@/pages/superadmin";
import SubscriptionSettings from "@/pages/subscription-settings";
import NotFound from "@/pages/not-found";

function Router({ userRole }: { userRole: "consultant" | "assistant" | "superadmin" | null }) {
  const [location] = useLocation();
  
  // Redirect authenticated users from landing to dashboard
  if (userRole && location === "/") {
    return <Redirect to="/dashboard" />;
  }
  
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        {userRole === "consultant" ? <ConsultantCalendar /> : <AssistantDashboard />}
      </Route>
      <Route path="/calendar" component={AssistantCalendar} />
      <Route path="/consultant-patients" component={ConsultantPatients} />
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
  <Route path="/inpatients" component={Inpatients} />
      <Route path="/clinical-cases" component={ClinicalCases} />
      <Route path="/procedures" component={Procedures} />
      <Route path="/hospitals" component={Hospitals} />
      <Route path="/onboarding" component={ClinicOnboardingPage} />
      <Route path="/team" component={TeamManagementPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route path="/settings/subscription" component={SubscriptionSettings} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/organization" component={OrganizationProfilePage} />
      <Route path="/reminders" component={RemindersPage} />
      <Route path="/superadmin" component={SuperAdmin} />
      <Route path="/accept-invitation" component={AcceptInvitationPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const [location, navigate] = useLocation();
  const { clinic, isLoading: isClinicLoading } = useClinic();
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<"consultant" | "assistant" | "superadmin" | null>(null);
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
          .then(async ({ data, error }) => {
            if (data) {
              setUserRole(data.role);
              setUserData(data);
              setIsLoading(false);
            } else if (error) {
              console.error("Error fetching user profile:", error);
              
              // Auto-create profile for existing auth users without profiles
              if (error.code === 'PGRST116') { // No rows returned
                console.log("No user profile found, creating one...");
                try {
                  const { data: newProfile, error: createError } = await supabase
                    .from("users")
                    .insert({
                      user_id: session.user.id,
                      email: session.user.email || '',
                      name: session.user.email?.split('@')[0] || 'User',
                      role: 'consultant', // Default to consultant
                    })
                    .select()
                    .single();
                  
                  if (createError) {
                    console.error("Failed to auto-create profile:", createError);
                  } else if (newProfile) {
                    setUserRole(newProfile.role);
                    setUserData(newProfile);
                  }
                } catch (err) {
                  console.error("Error auto-creating profile:", err);
                }
              }
              setIsLoading(false);
            }
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
          .then(async ({ data, error }) => {
            if (data) {
              setUserRole(data.role);
              setUserData(data);
              setIsLoading(false);
            } else if (error) {
              console.error("Error fetching user profile:", error);
              
              // Auto-create profile for existing auth users without profiles
              if (error.code === 'PGRST116') { // No rows returned
                console.log("No user profile found, creating one...");
                try {
                  const { data: newProfile, error: createError } = await supabase
                    .from("users")
                    .insert({
                      user_id: session.user.id,
                      email: session.user.email || '',
                      name: session.user.email?.split('@')[0] || 'User',
                      role: 'consultant', // Default to consultant
                    })
                    .select()
                    .single();
                  
                  if (createError) {
                    console.error("Failed to auto-create profile:", createError);
                  } else if (newProfile) {
                    setUserRole(newProfile.role);
                    setUserData(newProfile);
                  }
                } catch (err) {
                  console.error("Error auto-creating profile:", err);
                }
              }
              setIsLoading(false);
            }
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

  // Show loading screen while checking auth or clinic
  if (isLoading || isClinicLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">ZahaniFlow</h2>
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
      <ClinicProvider>
        <TooltipProvider>
          {showSidebar ? (
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar userRole={userRole} userData={userData} />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <Header userData={userData} userRole={userRole} />
                  <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto">
                      <Router userRole={userRole} />
                    </div>
                  </main>
                </div>
              </div>
              {userRole !== "superadmin" && <SubscriptionOverlay />}
            </SidebarProvider>
          ) : (
            <Router userRole={userRole} />
          )}
          <Toaster />
        </TooltipProvider>
      </ClinicProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClinicProvider>
        <AppContent />
      </ClinicProvider>
    </QueryClientProvider>
  );
}
