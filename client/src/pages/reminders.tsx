import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Bell, Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import type { Reminder } from "@shared/schema";

const REMINDER_TYPES = [
  { value: 'anniversary', label: 'Anniversary', color: '#EC4899' },
  { value: 'license_renewal', label: 'License Renewal', color: '#F59E0B' },
  { value: 'birthday', label: 'Birthday', color: '#8B5CF6' },
  { value: 'custom', label: 'Custom', color: '#3B82F6' },
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'No recurrence' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function RemindersPage() {
  const { clinic } = useClinic();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Helper to safely format dates
  const formatDate = (date: string | Date | null | undefined, formatString: string) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, formatString);
    } catch {
      return 'Invalid Date';
    }
  };

  // Fetch reminders
  const { data: reminders = [], refetch } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('reminder_date', { ascending: true });
      
      if (error) throw error;
      return data as Reminder[];
    },
  });

  // Create/update reminder mutation
  const saveMutation = useMutation({
    mutationFn: async (reminder: Partial<Reminder>) => {
      const payload: any = {
        ...reminder,
        is_recurring: reminder.recurrencePattern !== 'none' && !!reminder.recurrencePattern,
        recurrence_pattern: reminder.recurrencePattern === 'none' ? null : reminder.recurrencePattern,
      };
      
      // Add clinic_id if available
      if (clinic?.id) {
        payload.clinic_id = clinic.id;
      }

      if (editingReminder) {
        const { error } = await supabase
          .from('reminders')
          .update(payload)
          .eq('id', editingReminder.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: `Reminder ${editingReminder ? 'updated' : 'created'}` });
      refetch();
      setIsDialogOpen(false);
      setEditingReminder(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete reminder mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Reminder deleted" });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const reminder = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      reminder_type: formData.get('reminder_type') as string,
      reminder_date: new Date(formData.get('reminder_date') as string).toISOString(),
      color_code: formData.get('color_code') as string,
      recurrence_pattern: formData.get('recurrence_pattern') as string,
    };

    saveMutation.mutate(reminder);
  };

  const openEditDialog = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingReminder(null);
    setIsDialogOpen(true);
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return reminders.filter(r => {
      const reminderDate = new Date(r.reminderDate);
      return reminderDate >= now && reminderDate <= thirtyDaysFromNow && r.status === 'active';
    });
  };

  const upcomingReminders = getUpcomingReminders();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Reminders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage anniversaries, license renewals, and custom reminders
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingReminder ? 'Edit' : 'Create'} Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder for important dates and events
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingReminder?.title}
                  placeholder="e.g., Medical License Renewal"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingReminder?.description || ''}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="reminder_type">Type</Label>
                <Select name="reminder_type" defaultValue={editingReminder?.reminderType || 'custom'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reminder_date">Date</Label>
                <Input
                  id="reminder_date"
                  name="reminder_date"
                  type="date"
                  defaultValue={editingReminder?.reminderDate ? formatDate(editingReminder.reminderDate, 'yyyy-MM-dd') : ''}
                  required
                />
              </div>

              <div>
                <Label htmlFor="color_code">Color Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_code"
                    name="color_code"
                    type="color"
                    defaultValue={editingReminder?.colorCode || '#3B82F6'}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    defaultValue={editingReminder?.colorCode || '#3B82F6'}
                    placeholder="#3B82F6"
                    className="flex-1"
                    onChange={(e) => {
                      const colorInput = document.getElementById('color_code') as HTMLInputElement;
                      if (colorInput) colorInput.value = e.target.value;
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recurrence_pattern">Recurrence</Label>
                <Select name="recurrence_pattern" defaultValue={editingReminder?.recurrencePattern || 'none'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Reminders Card */}
      {upcomingReminders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              Upcoming (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center gap-3 p-2 bg-white rounded">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: reminder.colorCode }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{reminder.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(reminder.reminderDate, 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {REMINDER_TYPES.find(t => t.value === reminder.reminderType)?.label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
          <CardDescription>Manage all your reminders in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recurrence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No reminders yet. Click "New Reminder" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map(reminder => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: reminder.colorCode }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{reminder.title}</div>
                      {reminder.description && (
                        <div className="text-sm text-muted-foreground">{reminder.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {REMINDER_TYPES.find(t => t.value === reminder.reminderType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(reminder.reminderDate, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {reminder.isRecurring ? (
                        <Badge variant="secondary">{reminder.recurrencePattern}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reminder.status === 'active' ? 'default' : 'secondary'}>
                        {reminder.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(reminder)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
