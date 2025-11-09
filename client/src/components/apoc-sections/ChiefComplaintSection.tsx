// Chief Complaint Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChiefComplaintSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function ChiefComplaintSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: ChiefComplaintSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chief Complaint</CardTitle>
        <CardDescription>
          Document the patient's main presenting concern in their own words
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chiefComplaint">
            Chief Complaint <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="chiefComplaint"
            placeholder="e.g., 'I have a severe headache that started 3 days ago...'"
            value={data.chiefComplaint || ''}
            onChange={(e) => onUpdate({ chiefComplaint: e.target.value })}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Minimum 10 characters required. Use the patient's own words when possible.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-cc"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-cc"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
