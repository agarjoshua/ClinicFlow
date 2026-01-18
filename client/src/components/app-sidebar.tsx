import { Home, Users, FileText, UserCheck, Activity, Calendar, ClipboardList, Stethoscope, Hospital, BedDouble, UsersRound, CreditCard, Crown, Bell, Building2, Sparkles, Database } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { DraftCleanupService } from "@/lib/draftCleanup";

const consultantMenuItems = [
  {
    title: "Calendar",
    url: "/dashboard",
    icon: Calendar,
  },
  {
    title: "Patients",
    url: "/consultant-patients",
    icon: Users,
  },
  {
    title: "Inpatients",
    url: "/inpatients",
    icon: BedDouble,
  },
  {
    title: "Clinical Cases",
    url: "/clinical-cases",
    icon: Stethoscope,
  },
  {
    title: "Procedures",
    url: "/procedures",
    icon: Activity,
  },
  {
    title: "Hospitals",
    url: "/hospitals",
    icon: Hospital,
  },
  {
    title: "Reminders",
    url: "/reminders",
    icon: Bell,
  },
];

const assistantMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
  },
  {
    title: "Triage",
    url: "/triage",
    icon: Stethoscope,
  },
  {
    title: "Diagnoses",
    url: "/diagnoses",
    icon: FileText,
  },
  {
    title: "Procedures",
    url: "/procedures",
    icon: Activity,
  },
  {
    title: "Patients",
    url: "/patients",
    icon: Users,
  },
  {
    title: "Inpatients",
    url: "/inpatients",
    icon: BedDouble,
  },
  {
    title: "Post-Op Updates",
    url: "/post-op-updates",
    icon: ClipboardList,
  },
  {
    title: "Discharged",
    url: "/discharged",
    icon: UserCheck,
  },
  {
    title: "Hospitals",
    url: "/hospitals",
    icon: Hospital,
  },
  {
    title: "Calendar Management",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Reminders",
    url: "/reminders",
    icon: Bell,
  },
];

const settingsMenuItems = [
  {
    title: "Team",
    url: "/team",
    icon: UsersRound,
  },
  {
    title: "Organization",
    url: "/organization",
    icon: Building2,
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: Crown,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
  },
  {
    title: "Data Recovery",
    url: "/data-recovery",
    icon: Database,
  },
];

const superadminMenuItems = [
  {
    title: "SuperAdmin Portal",
    url: "/superadmin",
    icon: Crown,
  },
];

const comingSoonItems = [
  {
    title: "SHIF Patient Integration",
    description: "Link patients with SHIF records",
  },
  {
    title: "Payment Integration",
    description: "Accept M-Pesa(Mobile money) & card payments",
  },
  {
    title: "CHV Referral Module",
    description: "Community Health Volunteer referrals",
  },
  {
    title: "MOH/KHIS Reporting",
    description: "Auto-generate & upload reports",
  },
];

interface AppSidebarProps {
  userRole?: "consultant" | "assistant" | "superadmin" | null;
  userData?: any;
}

export function AppSidebar({ userRole = null, userData }: AppSidebarProps) {
  const [location] = useLocation();

  const menuItems = userRole === "consultant" ? consultantMenuItems : assistantMenuItems;
  const displayRole = userRole === "consultant" ? "Consultant" : "Assistant";

  const handleLogout = async () => {
    // Clear all user drafts on logout for security
    if (userData?.id) {
      DraftCleanupService.clearUserDrafts(userData.id);
    }
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  // Get initials from name
  const getInitials = (name: string = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img 
            src="/zahaniflow.png" 
            alt="ZahaniFlow" 
            className="w-10 h-10 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">
              ZahaniFlow
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {userRole === "consultant" ? "Neurosurgery Portal" : "Staff Portal"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {userRole === "superadmin" ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-yellow-600">SuperAdmin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superadminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    >
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>
                {userRole === "consultant" ? "Clinical Management" : "Patient Management"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Coming Soon</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              {comingSoonItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-md bg-muted/30 p-3 border border-muted"
                >
                  <div className="text-sm font-medium text-foreground mb-1">
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center gap-3 p-2">
          <Avatar>
            <AvatarFallback className={
              userRole === "consultant" 
                ? "bg-blue-600 text-white" 
                : "bg-indigo-600 text-white"
            }>
              {userData?.name ? getInitials(userData.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold truncate">
              {userData?.name || "User"}
            </span>
            <span className="text-xs text-muted-foreground">
              {displayRole}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full"
        >
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
