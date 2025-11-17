import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save } from "lucide-react";

export default function OrganizationProfilePage() {
  const { clinic } = useClinic();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!clinic?.id) throw new Error("No clinic selected");

      const updates = {
        name: formData.get('name') as string,
        settings: {
          ...(clinic.settings as Record<string, unknown> || {}),
          address: formData.get('address') as string,
          phone: formData.get('phone') as string,
          email: formData.get('email') as string,
          website: formData.get('website') as string,
          description: formData.get('description') as string,
          timezone: formData.get('timezone') as string || 'Africa/Nairobi',
          currency: formData.get('currency') as string || 'KES',
        },
      };

      const { error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', clinic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Organization profile updated successfully" });
      setIsEditing(false);
      // Refresh the page to get updated clinic data
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate(formData);
  };

  const settings = (clinic?.settings as Record<string, string>) || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Organization Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your clinic's information and settings
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your clinic's public-facing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Clinic Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={clinic?.name}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Clinic Handle</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={clinic?.slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Your clinic's unique identifier (cannot be changed)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={settings.description || ''}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Brief description of your clinic..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How patients can reach your clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={settings.phone || ''}
                  disabled={!isEditing}
                  placeholder="+254 712 345 678"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={settings.email || ''}
                  disabled={!isEditing}
                  placeholder="info@clinic.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={settings.website || ''}
                  disabled={!isEditing}
                  placeholder="https://www.clinic.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Physical Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={settings.address || ''}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Street address, city, postal code..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Timezone and currency preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  defaultValue={settings.timezone || 'Africa/Nairobi'}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  name="currency"
                  defaultValue={settings.currency || 'KES'}
                  disabled={!isEditing}
                  placeholder="KES, USD, EUR, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Current plan and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Tier</Label>
                  <p className="text-lg font-semibold capitalize mt-1">
                    {clinic?.subscriptionTier || 'trial'}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-lg font-semibold capitalize mt-1">
                    {clinic?.subscriptionStatus || 'active'}
                  </p>
                </div>
                <div>
                  <Label>Max Consultants</Label>
                  <p className="text-lg font-semibold mt-1">
                    {clinic?.maxConsultants || 1}
                  </p>
                </div>
                <div>
                  <Label>Max Assistants</Label>
                  <p className="text-lg font-semibold mt-1">
                    {clinic?.maxAssistants || 2}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
