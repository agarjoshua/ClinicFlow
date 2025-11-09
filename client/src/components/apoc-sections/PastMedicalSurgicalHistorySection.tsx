// Past Medical & Surgical History Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PastMedicalSurgicalHistorySectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function PastMedicalSurgicalHistorySection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: PastMedicalSurgicalHistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Medical & Surgical History</CardTitle>
        <CardDescription>
          Previous medical conditions, surgeries, hospitalizations, and current medications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pastMedicalSurgicalHistory">
            Past Medical & Surgical History
          </Label>
          <Textarea
            id="pastMedicalSurgicalHistory"
            placeholder="Document chronic conditions, previous surgeries, hospitalizations, current medications, allergies..."
            value={data.pastMedicalSurgicalHistory || ''}
            onChange={(e) => onUpdate({ pastMedicalSurgicalHistory: e.target.value })}
            rows={10}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Include dates when possible. List medications with dosages. Document known allergies.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-pmh"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-pmh"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
