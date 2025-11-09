// History of Presenting Illness Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface HistoryPresentingIllnessSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function HistoryPresentingIllnessSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: HistoryPresentingIllnessSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>History of Presenting Illness (HPI)</CardTitle>
        <CardDescription>
          Detailed chronological narrative of the patient's illness from onset to presentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Include: <strong>OLDCARTS</strong> - Onset, Location, Duration, Character, Aggravating/Alleviating factors, 
            Radiation, Timing, Severity. Also document associated symptoms and progression.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="historyPresentingIllness">
            History of Presenting Illness <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="historyPresentingIllness"
            placeholder="Describe the detailed history of the current illness using OLDCARTS framework..."
            value={data.historyPresentingIllness || ''}
            onChange={(e) => onUpdate({ historyPresentingIllness: e.target.value })}
            rows={10}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Provide a comprehensive chronological narrative. Be specific about timing, severity, and progression.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-hpi"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-hpi"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
