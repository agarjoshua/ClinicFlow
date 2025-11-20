import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lock, CreditCard, Mail, LogOut } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";

interface SubscriptionOverlayProps {
  customMessage?: string;
}

export function SubscriptionOverlay({ customMessage }: SubscriptionOverlayProps) {
  const { clinic } = useClinic();
  const [showOverlay, setShowOverlay] = useState(false);

  // Check subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["subscription-status", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return null;

      const { data, error } = await supabase
        .from("clinics")
        .select("subscription_status, subscription_tier, subscription_end_date, settings")
        .eq("id", clinic.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });  useEffect(() => {
    if (subscriptionStatus) {
      const isBlocked = 
        subscriptionStatus.subscription_status === "suspended" ||
        subscriptionStatus.subscription_status === "cancelled" ||
        subscriptionStatus.subscription_status === "expired";
      
      setShowOverlay(isBlocked);
    }
  }, [subscriptionStatus]);

  if (!showOverlay) return null;

  const getMessage = () => {
    // Check for custom message from SuperAdmin in settings
    const customSettingsMessage = subscriptionStatus?.settings?.suspension_message;
    if (customSettingsMessage) return customSettingsMessage;
    
    // Use prop if provided
    if (customMessage) return customMessage;
    
    switch (subscriptionStatus?.subscription_status) {
      case "suspended":
        return "Your subscription has been suspended. Please contact support or update your payment method.";
      case "cancelled":
        return "Your subscription has been cancelled. Renew your subscription to continue using ZahaniFlow.";
      case "expired":
        return "Your subscription has expired. Please renew to regain access.";
      default:
        return "Subscription access required. Please contact your administrator.";
    }
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:tech@zahaniflow.com?subject=Subscription Issue - " + clinic?.name;
  };

  const handleRenewSubscription = () => {
    window.location.href = "/settings/subscription";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Striped overlay background */}
      <div 
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.4),
            rgba(0, 0, 0, 0.4) 20px,
            rgba(0, 0, 0, 0.6) 20px,
            rgba(0, 0, 0, 0.6) 40px
          )`
        }}
      />
      
      {/* Content card */}
      <Card className="relative z-10 w-full max-w-lg mx-4 shadow-2xl border-2 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-red-900">Access Restricted</CardTitle>
              <CardDescription className="text-red-700">
                Subscription {subscriptionStatus?.subscription_status || "inactive"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-900">
              {getMessage()}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Clinic:</span>
              <span>{clinic?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Current Plan:</span>
              <span className="capitalize">{subscriptionStatus?.subscription_tier || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Status:</span>
              <span className="capitalize font-semibold text-red-600">
                {subscriptionStatus?.subscription_status || "Inactive"}
              </span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleRenewSubscription}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Renew Subscription
            </Button>
            
            <Button
              onClick={handleContactSupport}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Support
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              size="lg"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500 pt-4 border-t">
            Need help? Email us at{" "}
            <a href="mailto:tech@zahaniflow.com" className="text-blue-600 hover:underline">
              tech@zahaniflow.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
