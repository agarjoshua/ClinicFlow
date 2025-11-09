// Physical Examination Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExaminationSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
}

export default function ExaminationSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: ExaminationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Physical Examination</CardTitle>
        <CardDescription>
          Systematic physical examination findings organized by system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="cns" className="w-full">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="cns">CNS/Motor</TabsTrigger>
            <TabsTrigger value="cranial">Cranial Nerves</TabsTrigger>
            <TabsTrigger value="cvs">CVS</TabsTrigger>
            <TabsTrigger value="resp">Resp</TabsTrigger>
            <TabsTrigger value="gi">GI</TabsTrigger>
            <TabsTrigger value="gu">GU</TabsTrigger>
          </TabsList>

          <TabsContent value="cns" className="space-y-2">
            <Label htmlFor="cnsMotorExam">CNS & Motor Examination</Label>
            <Textarea
              id="cnsMotorExam"
              placeholder="Motor power (R/L UL, R/L LL), tone, reflexes, coordination, gait, sensation..."
              value={data.cnsMotorExam || ''}
              onChange={(e) => onUpdate({ cnsMotorExam: e.target.value })}
              rows={8}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Document motor power (0-5), tone, reflexes, coordination, gait, and sensation.
            </p>
          </TabsContent>

          <TabsContent value="cranial" className="space-y-2">
            <Label htmlFor="cranialNervesExam">Cranial Nerves Examination</Label>
            <Textarea
              id="cranialNervesExam"
              placeholder="CN I-XII examination findings..."
              value={data.cranialNervesExam || ''}
              onChange={(e) => onUpdate({ cranialNervesExam: e.target.value })}
              rows={8}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Document findings for each cranial nerve (CN I-XII).
            </p>
          </TabsContent>

          <TabsContent value="cvs" className="space-y-2">
            <Label htmlFor="cardiovascularExam">Cardiovascular Examination</Label>
            <Textarea
              id="cardiovascularExam"
              placeholder="Heart sounds, murmurs, peripheral pulses, edema..."
              value={data.cardiovascularExam || ''}
              onChange={(e) => onUpdate({ cardiovascularExam: e.target.value })}
              rows={8}
              className="resize-y"
            />
          </TabsContent>

          <TabsContent value="resp" className="space-y-2">
            <Label htmlFor="respiratoryExam">Respiratory Examination</Label>
            <Textarea
              id="respiratoryExam"
              placeholder="Breath sounds, chest expansion, percussion, adventitious sounds..."
              value={data.respiratoryExam || ''}
              onChange={(e) => onUpdate({ respiratoryExam: e.target.value })}
              rows={8}
              className="resize-y"
            />
          </TabsContent>

          <TabsContent value="gi" className="space-y-2">
            <Label htmlFor="gastrointestinalExam">Gastrointestinal Examination</Label>
            <Textarea
              id="gastrointestinalExam"
              placeholder="Abdomen inspection, palpation, percussion, bowel sounds..."
              value={data.gastrointestinalExam || ''}
              onChange={(e) => onUpdate({ gastrointestinalExam: e.target.value })}
              rows={8}
              className="resize-y"
            />
          </TabsContent>

          <TabsContent value="gu" className="space-y-2">
            <Label htmlFor="genitourinaryExam">Genitourinary Examination</Label>
            <Textarea
              id="genitourinaryExam"
              placeholder="As appropriate for the case..."
              value={data.genitourinaryExam || ''}
              onChange={(e) => onUpdate({ genitourinaryExam: e.target.value })}
              rows={8}
              className="resize-y"
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-exam"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-exam"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
