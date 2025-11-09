// Investigations Section - APOC Documentation
// Manages lab works and imaging with media upload capabilities

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LAB_WORK_CATEGORIES, IMAGING_CATEGORIES } from '@/../../shared/apoc-types';

interface InvestigationsSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
  clinicalCaseId: string;
}

export default function InvestigationsSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
  clinicalCaseId,
}: InvestigationsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [investigationType, setInvestigationType] = useState<'lab_work' | 'imaging'>('lab_work');
  const [newInvestigation, setNewInvestigation] = useState({
    category: '',
    testName: '',
    resultText: '',
    resultValue: '',
    resultUnit: '',
    referenceRange: '',
    resultDate: '',
    status: 'pending',
    priority: 'routine',
    notes: '',
  });

  // Fetch investigations for this clinical case
  const { data: investigations = [], isLoading } = useQuery({
    queryKey: ['clinical-investigations', clinicalCaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinical_investigations')
        .select('*')
        .eq('clinical_case_id', clinicalCaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clinicalCaseId,
  });

  // Create investigation mutation
  const createInvestigationMutation = useMutation({
    mutationFn: async (investigationData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!userData) throw new Error("User record not found");

      const { data, error } = await supabase
        .from('clinical_investigations')
        .insert({
          ...investigationData,
          investigation_type: investigationType,
          clinical_case_id: clinicalCaseId,
          ordered_by: userData.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-investigations', clinicalCaseId] });
      toast({ title: 'Investigation added successfully' });
      setIsAddDialogOpen(false);
      resetNewInvestigation();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add investigation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete investigation mutation
  const deleteInvestigationMutation = useMutation({
    mutationFn: async (investigationId: string) => {
      const { error } = await supabase
        .from('clinical_investigations')
        .delete()
        .eq('id', investigationId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-investigations', clinicalCaseId] });
      toast({ title: 'Investigation deleted' });
    },
  });

  const resetNewInvestigation = () => {
    setNewInvestigation({
      category: '',
      testName: '',
      resultText: '',
      resultValue: '',
      resultUnit: '',
      referenceRange: '',
      resultDate: '',
      status: 'pending',
      priority: 'routine',
      notes: '',
    });
  };

  const handleAddInvestigation = () => {
    createInvestigationMutation.mutate(newInvestigation);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reviewed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const labWorks = (investigations as any[]).filter((inv: any) => inv.investigation_type === 'lab_work');
  const imagingStudies = (investigations as any[]).filter((inv: any) => inv.investigation_type === 'imaging');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Investigations</CardTitle>
            <CardDescription>
              Laboratory tests and imaging studies
            </CardDescription>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Investigation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Investigation</DialogTitle>
                <DialogDescription>
                  Add a lab work or imaging study to the clinical case
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Investigation Type */}
                <div className="space-y-2">
                  <Label>Investigation Type</Label>
                  <Select
                    value={investigationType}
                    onValueChange={(value) => setInvestigationType(value as 'lab_work' | 'imaging')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab_work">Laboratory Work</SelectItem>
                      <SelectItem value="imaging">Imaging Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newInvestigation.category}
                    onValueChange={(value) => setNewInvestigation({ ...newInvestigation, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(investigationType === 'lab_work' ? LAB_WORK_CATEGORIES : IMAGING_CATEGORIES).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Test Name */}
                <div className="space-y-2">
                  <Label>Test/Study Name</Label>
                  <Input
                    value={newInvestigation.testName}
                    onChange={(e) => setNewInvestigation({ ...newInvestigation, testName: e.target.value })}
                    placeholder="e.g., Complete Blood Count"
                  />
                </div>

                {/* Result */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 space-y-2">
                    <Label>Result Value</Label>
                    <Input
                      value={newInvestigation.resultValue}
                      onChange={(e) => setNewInvestigation({ ...newInvestigation, resultValue: e.target.value })}
                      placeholder="e.g., 12.5"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={newInvestigation.resultUnit}
                      onChange={(e) => setNewInvestigation({ ...newInvestigation, resultUnit: e.target.value })}
                      placeholder="e.g., g/dL"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>Reference Range</Label>
                    <Input
                      value={newInvestigation.referenceRange}
                      onChange={(e) => setNewInvestigation({ ...newInvestigation, referenceRange: e.target.value })}
                      placeholder="e.g., 12-16"
                    />
                  </div>
                </div>

                {/* Result Text */}
                <div className="space-y-2">
                  <Label>Result Text/Interpretation</Label>
                  <Textarea
                    value={newInvestigation.resultText}
                    onChange={(e) => setNewInvestigation({ ...newInvestigation, resultText: e.target.value })}
                    placeholder="Detailed result or radiologist interpretation..."
                    rows={4}
                  />
                </div>

                {/* Date, Status, Priority */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>Result Date</Label>
                    <Input
                      type="date"
                      value={newInvestigation.resultDate}
                      onChange={(e) => setNewInvestigation({ ...newInvestigation, resultDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newInvestigation.status}
                      onValueChange={(value) => setNewInvestigation({ ...newInvestigation, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newInvestigation.priority}
                      onValueChange={(value) => setNewInvestigation({ ...newInvestigation, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="stat">STAT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Clinical Notes</Label>
                  <Textarea
                    value={newInvestigation.notes}
                    onChange={(e) => setNewInvestigation({ ...newInvestigation, notes: e.target.value })}
                    placeholder="Additional clinical notes..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddInvestigation} disabled={createInvestigationMutation.isPending}>
                  Add Investigation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="lab" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lab">
              <FileText className="h-4 w-4 mr-2" />
              Lab Works ({labWorks.length})
            </TabsTrigger>
            <TabsTrigger value="imaging">
              <ImageIcon className="h-4 w-4 mr-2" />
              Imaging ({imagingStudies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lab" className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : labWorks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No lab works recorded yet. Click "Add Investigation" to add one.
              </p>
            ) : (
              labWorks.map((inv: any) => (
                <Card key={inv.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{inv.category || inv.testName}</CardTitle>
                          {getStatusIcon(inv.status)}
                          <Badge variant="outline" className="ml-auto">
                            {inv.priority}
                          </Badge>
                        </div>
                        {inv.resultDate && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(inv.resultDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvestigationMutation.mutate(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {inv.resultValue && (
                      <div>
                        <strong>Result:</strong> {inv.resultValue} {inv.resultUnit}
                        {inv.referenceRange && <span className="text-muted-foreground"> (Ref: {inv.referenceRange})</span>}
                      </div>
                    )}
                    {inv.resultText && (
                      <div>
                        <strong>Interpretation:</strong> {inv.resultText}
                      </div>
                    )}
                    {inv.notes && (
                      <div className="text-muted-foreground italic">
                        {inv.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="imaging" className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : imagingStudies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No imaging studies recorded yet. Click "Add Investigation" to add one.
              </p>
            ) : (
              imagingStudies.map((inv: any) => (
                <Card key={inv.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{inv.category || inv.testName}</CardTitle>
                          {getStatusIcon(inv.status)}
                          <Badge variant="outline" className="ml-auto">
                            {inv.priority}
                          </Badge>
                        </div>
                        {inv.resultDate && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(inv.resultDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvestigationMutation.mutate(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {inv.resultText && (
                      <div>
                        <strong>Report:</strong> {inv.resultText}
                      </div>
                    )}
                    {inv.notes && (
                      <div className="text-muted-foreground italic">
                        {inv.notes}
                      </div>
                    )}
                    {/* TODO: Add image gallery for imaging studies */}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="complete-ix"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-ix"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
