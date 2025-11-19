import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ClinicCrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic?: any;
  mode: "create" | "edit";
}

export function ClinicCrudDialog({ open, onOpenChange, clinic, mode }: ClinicCrudDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: clinic?.name || "",
    slug: clinic?.slug || "",
    subscription_tier: clinic?.subscription_tier || "starter",
    subscription_status: clinic?.subscription_status || "active",
    max_consultants: clinic?.max_consultants || 1,
    max_assistants: clinic?.max_assistants || 2,
  });

  const createClinicMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("clinics")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Clinic created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-clinic-stats"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClinicMutation = useMutation({
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
        description: "Clinic updated successfully",
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

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      subscription_tier: "starter",
      subscription_status: "active",
      max_consultants: 1,
      max_assistants: 2,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast({
        title: "Error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }

    if (mode === "create") {
      createClinicMutation.mutate(formData);
    } else {
      updateClinicMutation.mutate(formData);
    }
  };

  const isLoading = createClinicMutation.isPending || updateClinicMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create New Clinic" : "Edit Clinic"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new clinic to the platform"
              : "Update clinic information and settings"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Clinic Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter clinic name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                }
                placeholder="clinic-slug"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (e.g., central-neuro-clinic)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="starter">Starter (KES 5,000/mo)</SelectItem>
                    <SelectItem value="professional">Professional (KES 15,000/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="consultants">Max Consultants</Label>
                <Input
                  id="consultants"
                  type="number"
                  min="1"
                  value={formData.max_consultants}
                  onChange={(e) =>
                    setFormData({ ...formData, max_consultants: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assistants">Max Assistants</Label>
                <Input
                  id="assistants"
                  type="number"
                  min="1"
                  value={formData.max_assistants}
                  onChange={(e) =>
                    setFormData({ ...formData, max_assistants: parseInt(e.target.value) || 2 })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                if (mode === "create") resetForm();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Clinic" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
