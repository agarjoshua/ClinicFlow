// Personal, Family & Social History Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PersonalFamilySocialHistorySectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function PersonalFamilySocialHistorySection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: PersonalFamilySocialHistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal, Family & Social History</CardTitle>
        <CardDescription>
          Lifestyle factors, family medical history, and social determinants of health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="personalFamilySocialHistory">
            Personal, Family & Social History
          </Label>
          <Textarea
            id="personalFamilySocialHistory"
            placeholder="Smoking, alcohol, occupation, living situation, family history of neurological/cardiovascular diseases..."
            value={data.personalFamilySocialHistory || ''}
            onChange={(e) => onUpdate({ personalFamilySocialHistory: e.target.value })}
            rows={10}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Include tobacco/alcohol use, occupation, marital status, living arrangements, family history 
            of stroke/neurological conditions.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-pfsh"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-pfsh"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
