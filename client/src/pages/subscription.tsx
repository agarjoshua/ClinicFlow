import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Zap, Building2 } from "lucide-react";

const PLANS = {
  starter: {
    name: "Starter",
    price: "KES 5,000",
    features: ["1 consultant", "2 assistants", "Basic features", "Email support"],
    icon: Zap,
  },
  professional: {
    name: "Professional",
    price: "KES 15,000",
    features: ["5 consultants", "10 assistants", "Advanced features", "Priority support", "Analytics"],
    icon: Crown,
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    features: ["Unlimited users", "Custom features", "Dedicated support", "Advanced analytics", "API access"],
    icon: Building2,
  },
};

export default function SubscriptionPage() {
  const { clinic } = useClinic();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", clinic?.id],
    enabled: !!clinic?.id,
    queryFn: async () => {
      if (!clinic?.id) return null;

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return data;
    },
  });

  const currentTier = clinic?.subscriptionTier || "starter";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Manage your clinic's subscription plan
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold capitalize">{currentTier}</h3>
                <Badge variant={clinic?.subscriptionStatus === "active" ? "default" : "secondary"} className="capitalize">
                  {clinic?.subscriptionStatus || "unknown"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {PLANS[currentTier as keyof typeof PLANS]?.price}/month
              </p>
            </div>
            {currentTier !== "enterprise" && (
              <Button variant="outline">Upgrade Plan</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(PLANS).map(([key, plan]) => {
          const Icon = plan.icon;
          const isCurrentPlan = key === currentTier;

          return (
            <Card key={key} className={isCurrentPlan ? "border-blue-600 ring-2 ring-blue-600" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-blue-600" />
                  {isCurrentPlan && (
                    <Badge variant="default">Current</Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-sm">/month</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Current Plan" : key === "enterprise" ? "Contact Sales" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
