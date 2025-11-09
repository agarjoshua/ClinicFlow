// Developmental History Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface DevelopmentalHistorySectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function DevelopmentalHistorySection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: DevelopmentalHistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developmental History</CardTitle>
        <CardDescription>
          Developmental milestones (for pediatric or stroke patients)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Document motor, language, social, and cognitive milestones. For stroke patients, 
            document pre-morbid functional status.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="developmentalHistory">
            Developmental History
          </Label>
          <Textarea
            id="developmentalHistory"
            placeholder="Document developmental milestones, pre-morbid functional status..."
            value={data.developmentalHistory || ''}
            onChange={(e) => onUpdate({ developmentalHistory: e.target.value })}
            rows={8}
            className="resize-y"
          />
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-dev"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-dev"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
