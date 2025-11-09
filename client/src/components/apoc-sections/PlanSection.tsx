// Treatment Plan Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function PlanSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: PlanSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Plan</CardTitle>
        <CardDescription>
          Management plan, medications, follow-up, and patient instructions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="treatmentPlan">
            Treatment Plan & Management <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="treatmentPlan"
            placeholder="Medications (with dosages), procedures planned, follow-up schedule, patient education, referrals..."
            value={data.treatmentPlan || ''}
            onChange={(e) => onUpdate({ treatmentPlan: e.target.value })}
            rows={10}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Include medications with dosages, procedures, follow-up plan, patient instructions, and referrals.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-plan"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-plan"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
