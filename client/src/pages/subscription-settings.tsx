import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useClinic } from "@/contexts/ClinicContext";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Info,
  ExternalLink,
  Shield,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 5000,
    currency: "KES",
    interval: "monthly",
    features: [
      "1 Consultant",
      "2 Assistants",
      "Basic Features",
      "Email Support"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    price: 15000,
    currency: "KES",
    interval: "monthly",
    features: [
      "5 Consultants",
      "10 Assistants",
      "Advanced Features",
      "Priority Support",
      "Analytics Dashboard"
    ],
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    currency: "KES",
    interval: "custom",
    features: [
      "Unlimited Users",
      "Custom Features",
      "Dedicated Support",
      "Advanced Analytics",
      "API Access"
    ],
    custom: true
  }
];

export default function SubscriptionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { clinic } = useClinic();
  const [loading, setLoading] = useState(false);

  // Fetch current subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return null;
      
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinic.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });

  // Initialize Paystack payment
  const initiatePayment = async (planId: string) => {
    setLoading(true);
    
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan || plan.custom || !plan.price) {
        toast({
          title: "Contact Sales",
          description: "Please contact tech@zahaniflow.com for Enterprise pricing",
        });
        return;
      }

      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call backend to initialize Paystack transaction
      const response = await fetch("/.netlify/functions/paystack-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: plan.price * 100, // Paystack uses kobo/cents
          plan: planId,
          clinic_id: clinic?.id,
          callback_url: `${window.location.origin}/.netlify/functions/paystack-callback`,
        }),
      });

      const data = await response.json();
      
      if (data.status && data.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error("Failed to initialize payment");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === subscription?.subscription_tier);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your clinic's subscription and billing
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        {/* Current Plan Tab */}
        <TabsContent value="current" className="space-y-6">
          {subscription?.subscription_status === "suspended" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription is currently suspended. Please update your payment method or contact support.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {currentPlan?.name || "No Plan"}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {currentPlan?.custom 
                      ? "Custom pricing" 
                      : `${currentPlan?.currency} ${currentPlan?.price?.toLocaleString()}/month`
                    }
                  </CardDescription>
                </div>
                <Badge 
                  variant={subscription?.subscription_status === "active" ? "default" : "destructive"}
                  className="text-sm"
                >
                  {subscription?.subscription_status || "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Next Billing Date</span>
                  </div>
                  <p className="font-medium">
                    {subscription?.subscription_end_date 
                      ? format(new Date(subscription.subscription_end_date), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>User Limits</span>
                  </div>
                  <p className="font-medium">
                    {subscription?.max_consultants} Consultants, {subscription?.max_assistants} Assistants
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Plan Features</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {currentPlan?.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {subscription?.subscription_tier !== "enterprise" && (
                <Button 
                  onClick={() => initiatePayment("professional")}
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Plans Tab */}
        <TabsContent value="plans">
          <div className="grid md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.custom ? "Custom" : `${plan.currency} ${plan.price?.toLocaleString()}`}
                    </span>
                    {!plan.custom && <span className="text-sm">/month</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.custom ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = "mailto:tech@zahaniflow.com?subject=Enterprise Plan Inquiry"}
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      onClick={() => initiatePayment(plan.id)}
                      disabled={loading || subscription?.subscription_tier === plan.id}
                      className="w-full"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {subscription?.subscription_tier === plan.id ? "Current Plan" : "Select Plan"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View your past transactions and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payment history yet</p>
                <p className="text-sm">Transactions will appear here after your first payment</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Support Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Need help with billing?
              </p>
              <p className="text-sm text-blue-800">
                Contact our support team at{" "}
                <a href="mailto:tech@zahaniflow.com" className="underline font-medium">
                  tech@zahaniflow.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
