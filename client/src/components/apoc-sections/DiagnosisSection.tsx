// Diagnosis & Impression Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DiagnosisSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function DiagnosisSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: DiagnosisSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnosis & Clinical Impression</CardTitle>
        <CardDescription>
          Primary diagnosis, differential diagnoses, and clinical impression
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="diagnosisImpression">
            Clinical Diagnosis & Impression <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="diagnosisImpression"
            placeholder="Primary diagnosis, differential diagnoses, clinical reasoning..."
            value={data.diagnosisImpression || ''}
            onChange={(e) => onUpdate({ diagnosisImpression: e.target.value })}
            rows={8}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Document primary diagnosis, differential diagnoses, and clinical reasoning.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="strokeClassification">Stroke Classification (if applicable)</Label>
          <Select
            value={data.strokeClassification || 'n/a'}
            onValueChange={(value) => onUpdate({ strokeClassification: value })}
          >
            <SelectTrigger id="strokeClassification">
              <SelectValue placeholder="Select classification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="n/a">Not Applicable</SelectItem>
              <SelectItem value="ischemic">Ischemic Stroke</SelectItem>
              <SelectItem value="hemorrhagic">Hemorrhagic Stroke</SelectItem>
              <SelectItem value="tia">Transient Ischemic Attack (TIA)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select if this is a stroke-related case.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-dx"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-dx"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
