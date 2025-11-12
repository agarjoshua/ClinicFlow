import { Home, Users, FileText, UserCheck, Activity, Calendar, ClipboardList, Stethoscope, Hospital, BedDouble } from "lucide-react";
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

const consultantMenuItems = [
  {
    title: "Calendar",
    url: "/calendar",
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
  
];

const assistantMenuItems = [
  {
    title: "Dashboard",
    url: "/",
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
];

interface AppSidebarProps {
  userRole?: "consultant" | "assistant" | null;
  userData?: any;
}

export function AppSidebar({ userRole = null, userData }: AppSidebarProps) {
  const [location] = useLocation();

  const menuItems = userRole === "consultant" ? consultantMenuItems : assistantMenuItems;
  const displayRole = userRole === "consultant" ? "Consultant" : "Assistant";

  const handleLogout = async () => {
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
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">
              ClinicFlow
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {userRole === "consultant" ? "Neurosurgery Portal" : "Staff Portal"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
