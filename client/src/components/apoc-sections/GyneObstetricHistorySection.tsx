// Gynecological & Obstetric History Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GyneObstetricHistorySectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function GyneObstetricHistorySection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: GyneObstetricHistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gynecological & Obstetric History</CardTitle>
        <CardDescription>
          Reproductive and pregnancy history (for female patients)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gyneObstetricHistory">
            Gyne/Obstetric History
          </Label>
          <Textarea
            id="gyneObstetricHistory"
            placeholder="LMP, menstrual history, pregnancies (G_P_), contraception, menopause status..."
            value={data.gyneObstetricHistory || ''}
            onChange={(e) => onUpdate({ gyneObstetricHistory: e.target.value })}
            rows={8}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Include LMP, gravida/para, pregnancy complications, contraception method, menopause status.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-gyne"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-gyne"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
