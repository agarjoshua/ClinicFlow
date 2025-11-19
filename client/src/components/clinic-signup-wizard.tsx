import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Building2, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Sparkles
} from "lucide-react";

interface ClinicSignupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "clinic" | "user" | "review";

const subscriptionTiers = [
  {
    value: "trial",
    label: "Trial",
    price: 0,
    features: ["1 Consultant", "2 Assistants", "Basic Features", "7-day Trial"],
    popular: false,
  },
  {
    value: "premium",
    label: "Premium",
    price: 99,
    features: ["5 Consultants", "10 Assistants", "Advanced Features", "Priority Support"],
    popular: true,
  },
  {
    value: "enterprise",
    label: "Enterprise",
    price: 299,
    features: ["Unlimited Users", "All Features", "24/7 Support", "Custom Integration"],
    popular: false,
  },
];

export function ClinicSignupWizard({ open, onOpenChange }: ClinicSignupWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>("clinic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clinicData, setClinicData] = useState({
    name: "",
    slug: "",
    subscription_tier: "trial",
    subscription_status: "active",
    max_consultants: 1,
    max_assistants: 2,
    address: "",
    phone: "",
  });

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "consultant" as "consultant" | "assistant",
    password: "",
  });

  // Auto-generate slug from clinic name
  const handleClinicNameChange = (name: string) => {
    setClinicData({
      ...clinicData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    });
  };

  // Update limits based on tier
  const handleTierChange = (tier: string) => {
    const limits = {
      trial: { consultants: 1, assistants: 2 },
      premium: { consultants: 5, assistants: 10 },
      enterprise: { consultants: 999, assistants: 999 },
    };
    
    const limit = limits[tier as keyof typeof limits];
    setClinicData({
      ...clinicData,
      subscription_tier: tier,
      max_consultants: limit.consultants,
      max_assistants: limit.assistants,
    });
  };

  const createClinicAndUserMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);

      // Step 1: Create clinic
      const { data: clinicResult, error: clinicError } = await supabase
        .from("clinics")
        .insert([{
          name: clinicData.name,
          slug: clinicData.slug,
          subscription_tier: clinicData.subscription_tier,
          subscription_status: clinicData.subscription_status,
          max_consultants: clinicData.max_consultants,
          max_assistants: clinicData.max_assistants,
          settings: {
            address: clinicData.address || null,
            phone: clinicData.phone || null,
          },
        }])
        .select()
        .single();

      if (clinicError) throw new Error(`Clinic creation failed: ${clinicError.message}`);

      // Step 2: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (authError) {
        // Rollback: delete clinic if user creation fails
        await supabase.from("clinics").delete().eq("id", clinicResult.id);
        throw new Error(`User creation failed: ${authError.message}`);
      }

      // Step 3: Create user profile
      const { error: userError } = await supabase
        .from("users")
        .insert([{
          user_id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          role: userData.role,
          clinic_id: clinicResult.id,
        }]);

      if (userError) {
        // Rollback: delete clinic and auth user
        await supabase.from("clinics").delete().eq("id", clinicResult.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`User profile creation failed: ${userError.message}`);
      }

      return { clinic: clinicResult, user: authData.user };
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Success!",
        description: `Clinic "${data.clinic.name}" and user "${userData.name}" created successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinic-stats"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const resetForm = () => {
    setCurrentStep("clinic");
    setClinicData({
      name: "",
      slug: "",
      subscription_tier: "trial",
      subscription_status: "active",
      max_consultants: 1,
      max_assistants: 2,
      address: "",
      phone: "",
    });
    setUserData({
      name: "",
      email: "",
      phone: "",
      role: "consultant",
      password: "",
    });
  };

  const validateClinicStep = () => {
    if (!clinicData.name.trim()) {
      toast({ title: "Error", description: "Clinic name is required", variant: "destructive" });
      return false;
    }
    if (!clinicData.slug.trim()) {
      toast({ title: "Error", description: "Clinic slug is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateUserStep = () => {
    if (!userData.name.trim()) {
      toast({ title: "Error", description: "User name is required", variant: "destructive" });
      return false;
    }
    if (!userData.email.trim() || !userData.email.includes("@")) {
      toast({ title: "Error", description: "Valid email is required", variant: "destructive" });
      return false;
    }
    if (!userData.password || userData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === "clinic") {
      if (validateClinicStep()) {
        setCurrentStep("user");
      }
    } else if (currentStep === "user") {
      if (validateUserStep()) {
        setCurrentStep("review");
      }
    }
  };

  const handleBack = () => {
    if (currentStep === "user") {
      setCurrentStep("clinic");
    } else if (currentStep === "review") {
      setCurrentStep("user");
    }
  };

  const handleSubmit = () => {
    if (validateClinicStep() && validateUserStep()) {
      createClinicAndUserMutation.mutate();
    }
  };

  const selectedTier = subscriptionTiers.find(t => t.value === clinicData.subscription_tier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Create New Clinic & Admin User
          </DialogTitle>
          <DialogDescription>
            Set up a new clinic and create the first admin user in a few simple steps
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-4 flex-shrink-0">
          <div className={`flex items-center gap-2 ${currentStep === "clinic" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              currentStep === "clinic" ? "border-primary bg-primary text-primary-foreground" : 
              currentStep === "user" || currentStep === "review" ? "border-primary bg-primary text-primary-foreground" : 
              "border-muted-foreground"
            }`}>
              {currentStep === "user" || currentStep === "review" ? <CheckCircle2 className="h-5 w-5" /> : "1"}
            </div>
            <span className="text-sm font-medium">Clinic</span>
          </div>
          <Separator className="w-12" />
          <div className={`flex items-center gap-2 ${currentStep === "user" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              currentStep === "user" ? "border-primary bg-primary text-primary-foreground" : 
              currentStep === "review" ? "border-primary bg-primary text-primary-foreground" : 
              "border-muted-foreground"
            }`}>
              {currentStep === "review" ? <CheckCircle2 className="h-5 w-5" /> : "2"}
            </div>
            <span className="text-sm font-medium">Admin User</span>
          </div>
          <Separator className="w-12" />
          <div className={`flex items-center gap-2 ${currentStep === "review" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              currentStep === "review" ? "border-primary bg-primary text-primary-foreground" : 
              "border-muted-foreground"
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Review</span>
          </div>
        </div>

        <Separator className="flex-shrink-0" />

        {/* Content Area with Animation */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {/* Step 1: Clinic Information */}
          {currentStep === "clinic" && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Clinic Details
                  </CardTitle>
                  <CardDescription>Basic information about the clinic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clinic-name">Clinic Name *</Label>
                    <Input
                      id="clinic-name"
                      value={clinicData.name}
                      onChange={(e) => handleClinicNameChange(e.target.value)}
                      placeholder="Central Neurology Clinic"
                      className="text-lg"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">clinicflow.com/</span>
                      <Input
                        id="slug"
                        value={clinicData.slug}
                        onChange={(e) =>
                          setClinicData({ ...clinicData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                        }
                        placeholder="central-neuro-clinic"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="address" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={clinicData.address}
                        onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                        placeholder="123 Main St, City"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="clinic-phone" className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </Label>
                      <Input
                        id="clinic-phone"
                        value={clinicData.phone}
                        onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Choose Subscription Plan
                  </CardTitle>
                  <CardDescription>Select the best plan for this clinic</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {subscriptionTiers.map((tier) => (
                      <Card
                        key={tier.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          clinicData.subscription_tier === tier.value
                            ? "ring-2 ring-primary shadow-lg"
                            : "opacity-75 hover:opacity-100"
                        }`}
                        onClick={() => handleTierChange(tier.value)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{tier.label}</CardTitle>
                            {tier.popular && (
                              <Badge variant="default" className="text-xs">Popular</Badge>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">${tier.price}</span>
                            <span className="text-sm text-muted-foreground">/month</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {tier.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: User Information */}
          {currentStep === "user" && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Admin User Details
                  </CardTitle>
                  <CardDescription>
                    Create the first user account that will manage this clinic
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user-name">Full Name *</Label>
                    <Input
                      id="user-name"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      placeholder="Dr. John Smith"
                      className="text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="user-email" className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email Address *
                      </Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        placeholder="dr.smith@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="user-phone" className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone Number
                      </Label>
                      <Input
                        id="user-phone"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userData.password}
                      onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                    <p className="text-xs text-muted-foreground">
                      User will be able to change this password after first login
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={userData.role}
                      onValueChange={(value: "consultant" | "assistant") =>
                        setUserData({ ...userData, role: value })
                      }
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultant">Consultant (Full Access)</SelectItem>
                        <SelectItem value="assistant">Assistant (Limited Access)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === "review" && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Review & Confirm
                  </CardTitle>
                  <CardDescription>
                    Please review all information before creating the clinic
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Clinic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{clinicData.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">URL Slug</p>
                        <p className="font-medium">{clinicData.slug}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Subscription</p>
                        <Badge variant="secondary" className="mt-1">
                          {selectedTier?.label} (${selectedTier?.price}/mo)
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">User Limits</p>
                        <p className="font-medium">
                          {clinicData.max_consultants} Consultants, {clinicData.max_assistants} Assistants
                        </p>
                      </div>
                      {clinicData.address && (
                        <div>
                          <p className="text-muted-foreground">Address</p>
                          <p className="font-medium">{clinicData.address}</p>
                        </div>
                      )}
                      {clinicData.phone && (
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{clinicData.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Admin User Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{userData.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{userData.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Role</p>
                        <Badge variant="outline" className="mt-1">
                          {userData.role === "consultant" ? "Consultant (Full Access)" : "Assistant (Limited)"}
                        </Badge>
                      </div>
                      {userData.phone && (
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{userData.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <Separator className="flex-shrink-0" />
        <div className="flex items-center justify-between pt-4 pb-2 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === "clinic" ? () => onOpenChange(false) : handleBack}
            disabled={isSubmitting}
          >
            {currentStep === "clinic" ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </>
            )}
          </Button>

          <div className="flex gap-2">
            {currentStep !== "review" ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create Clinic & User
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
