import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Calendar, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, addMonths } from "date-fns";

interface SubscriptionCrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic: any;
}

export function SubscriptionCrudDialog({ open, onOpenChange, clinic }: SubscriptionCrudDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    subscription_tier: clinic?.subscription_tier || "trial",
    subscription_status: clinic?.subscription_status || "active",
    max_consultants: clinic?.max_consultants || 1,
    max_assistants: clinic?.max_assistants || 2,
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        subscription_tier: clinic.subscription_tier || "trial",
        subscription_status: clinic.subscription_status || "active",
        max_consultants: clinic.max_consultants || 1,
        max_assistants: clinic.max_assistants || 2,
      });
    }
  }, [clinic]);

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("clinics")
        .update(data)
        .eq("id", clinic.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinic-stats"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSubscriptionMutation.mutate(formData);
  };

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case "premium": return 99;
      case "enterprise": return 299;
      default: return 0;
    }
  };

  const getTierFeatures = (tier: string) => {
    switch (tier) {
      case "trial":
        return ["1 consultant", "2 assistants", "Basic features", "30-day trial"];
      case "premium":
        return ["Up to 5 consultants", "Up to 10 assistants", "All features", "Priority support"];
      case "enterprise":
        return ["Unlimited consultants", "Unlimited assistants", "All features", "24/7 support", "Custom integrations"];
      default:
        return [];
    }
  };

  const isLoading = updateSubscriptionMutation.isPending;
  const currentPrice = getTierPrice(formData.subscription_tier);
  const nextBillingDate = addMonths(new Date(), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Subscription - {clinic?.name}</DialogTitle>
          <DialogDescription>
            Update subscription tier and status for this clinic
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Current Subscription Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  Current Tier
                </div>
                <Badge variant="outline" className="text-lg">
                  {clinic?.subscription_tier?.charAt(0).toUpperCase() + clinic?.subscription_tier?.slice(1)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Monthly Cost
                </div>
                <div className="text-2xl font-bold">${getTierPrice(clinic?.subscription_tier)}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Next Billing
                </div>
                <div className="text-sm font-medium">{format(nextBillingDate, "MMM d, yyyy")}</div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="tier">Subscription Tier</Label>
                <Select
                  value={formData.subscription_tier}
                  onValueChange={(value) => setFormData({ ...formData, subscription_tier: value })}
                >
                  <SelectTrigger id="tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">
                      <div className="flex items-center justify-between w-full">
                        <span>Trial</span>
                        <span className="ml-4 text-muted-foreground">$0/mo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="premium">
                      <div className="flex items-center justify-between w-full">
                        <span>Premium</span>
                        <span className="ml-4 text-muted-foreground">$99/mo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex items-center justify-between w-full">
                        <span>Enterprise</span>
                        <span className="ml-4 text-muted-foreground">$299/mo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tier Features */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="font-medium mb-2">Features included:</div>
                <ul className="space-y-1">
                  {getTierFeatures(formData.subscription_tier).map((feature, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Subscription Status</Label>
                <Select
                  value={formData.subscription_status}
                  onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="consultants">Max Consultants</Label>
                  <Select
                    value={formData.max_consultants.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, max_consultants: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="consultants">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 10, 20, 50, 100].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num === 100 ? "Unlimited" : num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assistants">Max Assistants</Label>
                  <Select
                    value={formData.max_assistants.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, max_assistants: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="assistants">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 5, 10, 20, 50, 100].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num === 100 ? "Unlimited" : num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing Change Preview */}
            {formData.subscription_tier !== clinic?.subscription_tier && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="font-medium text-sm mb-2">Price Change Preview</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    From: ${getTierPrice(clinic?.subscription_tier)}/mo
                  </span>
                  <span>→</span>
                  <span className="font-bold">
                    To: ${currentPrice}/mo
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Change takes effect immediately. Pro-rated billing applies.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
