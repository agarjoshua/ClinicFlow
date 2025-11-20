import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Mail, Phone, Globe, MapPin, Clock, DollarSign, Crown, Check, Edit2 } from "lucide-react";

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

  // View mode component for displaying data
  const InfoField = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | undefined | null }) => (
    <div className="flex items-start gap-2 sm:gap-3 py-3">
      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
        <p className="text-sm sm:text-base font-semibold text-foreground mt-0.5 break-words">
          {value || <span className="text-muted-foreground italic">Not set</span>}
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <img 
              src="/zahaniflow.png" 
              alt="ZahaniFlow" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            Organization Profile
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Manage your clinic's information and settings
          </p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"} className="w-full sm:w-auto">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {!isEditing ? (
        /* VIEW MODE */
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Your clinic's public-facing information</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoField icon={Building2} label="Clinic Name" value={clinic?.name} />
              <div className="flex items-start gap-3 py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                  <span className="text-sm font-mono text-gray-600">@</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Clinic Handle</p>
                  <p className="text-base font-mono font-semibold text-foreground mt-0.5">
                    {clinic?.slug}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your clinic's unique identifier (cannot be changed)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50">
                  <span className="text-lg">📝</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-base font-semibold text-foreground mt-0.5 whitespace-pre-wrap">
                    {settings.description || <span className="text-muted-foreground italic">No description provided</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>How patients can reach your clinic</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoField icon={Phone} label="Phone Number" value={settings.phone} />
              <InfoField icon={Mail} label="Email Address" value={settings.email} />
              <InfoField icon={Globe} label="Website" value={settings.website} />
              <div className="flex items-start gap-3 py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Physical Address</p>
                  <p className="text-base font-semibold text-foreground mt-0.5 whitespace-pre-wrap">
                    {settings.address || <span className="text-muted-foreground italic">No address provided</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>Timezone and currency preferences</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoField icon={Clock} label="Timezone" value={settings.timezone || 'Africa/Nairobi'} />
              <InfoField icon={DollarSign} label="Currency" value={settings.currency || 'KES'} />
            </CardContent>
          </Card>

          {/* Subscription Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Current plan and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Tier</p>
                    <Badge variant="secondary" className="mt-1 text-sm font-semibold capitalize">
                      {clinic?.subscriptionTier || 'trial'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge 
                      variant={clinic?.subscriptionStatus === 'active' ? 'default' : 'secondary'} 
                      className="mt-1 text-sm font-semibold capitalize"
                    >
                      {clinic?.subscriptionStatus || 'active'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                    <span className="text-lg font-bold text-blue-600">{clinic?.maxConsultants || 1}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Consultants</p>
                    <p className="text-base font-semibold mt-0.5">{clinic?.maxConsultants || 1}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50">
                    <span className="text-lg font-bold text-purple-600">{clinic?.maxAssistants || 2}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Assistants</p>
                    <p className="text-base font-semibold mt-0.5">{clinic?.maxAssistants || 2}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* EDIT MODE */
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Information - Edit Mode */}
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
                    rows={4}
                    placeholder="Brief description of your clinic..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information - Edit Mode */}
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
                    placeholder="https://www.clinic.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Physical Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    defaultValue={settings.address || ''}
                    rows={3}
                    placeholder="Street address, city, postal code..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Regional Settings - Edit Mode */}
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
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    defaultValue={settings.currency || 'KES'}
                    placeholder="KES, USD, EUR, etc."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
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
          </div>
        </form>
      )}
    </div>
  );
}
