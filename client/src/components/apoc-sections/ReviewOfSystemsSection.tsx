// Review of Systems Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ReviewOfSystemsSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function ReviewOfSystemsSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: ReviewOfSystemsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review of Systems (ROS)</CardTitle>
        <CardDescription>
          Systematic review of symptoms across all body systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="guidelines">
            <AccordionTrigger>System Review Guidelines</AccordionTrigger>
            <AccordionContent>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Constitutional: Fever, weight changes, fatigue</li>
                <li>Neurological: Headache, dizziness, seizures, weakness, numbness</li>
                <li>Cardiovascular: Chest pain, palpitations, edema</li>
                <li>Respiratory: Cough, dyspnea, wheezing</li>
                <li>Gastrointestinal: Nausea, vomiting, diarrhea, constipation</li>
                <li>Genitourinary: Dysuria, hematuria, frequency</li>
                <li>Musculoskeletal: Joint pain, muscle weakness</li>
                <li>Skin: Rash, lesions, color changes</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-2">
          <Label htmlFor="reviewOfSystems">
            Review of Systems
          </Label>
          <Textarea
            id="reviewOfSystems"
            placeholder="Document positive and pertinent negative findings for each system..."
            value={data.reviewOfSystems || ''}
            onChange={(e) => onUpdate({ reviewOfSystems: e.target.value })}
            rows={12}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Include both positive findings and relevant negative findings for each system.
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-ros"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-ros"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
