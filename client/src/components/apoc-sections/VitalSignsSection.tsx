// Vital Signs Section - APOC Documentation
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VitalSignsSectionProps {
  data: any;
  onUpdate: (updates: any) => void;
  onMarkComplete: (completed: boolean) => void;
  isCompleted: boolean;
  patient?: { age?: number };
}

export default function VitalSignsSection({
  data,
  onUpdate,
  onMarkComplete,
  isCompleted,
}: VitalSignsSectionProps) {
  // Helper to determine if vital sign is within normal range
  const getStatusBadge = (value: number | undefined, min: number, max: number) => {
    if (!value) return null;
    if (value < min || value > max) {
      return <Badge variant="destructive">Abnormal</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50">Normal</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vital Signs</CardTitle>
        <CardDescription>
          Record patient's vital signs at the time of examination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Blood Pressure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vitalSignsBp">Blood Pressure (mmHg)</Label>
              {data.vitalSignsBp && (
                <span className="text-xs text-muted-foreground">120/80 normal</span>
              )}
            </div>
            <Input
              id="vitalSignsBp"
              placeholder="e.g., 120/80"
              value={data.vitalSignsBp || ''}
              onChange={(e) => onUpdate({ vitalSignsBp: e.target.value })}
            />
          </div>

          {/* Pulse Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vitalSignsPr">Pulse Rate (bpm)</Label>
              {getStatusBadge(data.vitalSignsPr, 60, 100)}
            </div>
            <Input
              id="vitalSignsPr"
              type="number"
              placeholder="e.g., 72"
              value={data.vitalSignsPr || ''}
              onChange={(e) => onUpdate({ vitalSignsPr: parseInt(e.target.value) || null })}
            />
            <p className="text-xs text-muted-foreground">Normal: 60-100 bpm</p>
          </div>

          {/* SpO2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vitalSignsSpo2">SpO₂ (%)</Label>
              {getStatusBadge(data.vitalSignsSpo2, 95, 100)}
            </div>
            <Input
              id="vitalSignsSpo2"
              type="number"
              min="0"
              max="100"
              placeholder="e.g., 98"
              value={data.vitalSignsSpo2 || ''}
              onChange={(e) => onUpdate({ vitalSignsSpo2: parseInt(e.target.value) || null })}
            />
            <p className="text-xs text-muted-foreground">Normal: ≥95%</p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vitalSignsTemp">Temperature (°C)</Label>
              {getStatusBadge(data.vitalSignsTemp, 36.5, 37.5)}
            </div>
            <Input
              id="vitalSignsTemp"
              type="number"
              step="0.1"
              placeholder="e.g., 37.0"
              value={data.vitalSignsTemp || ''}
              onChange={(e) => onUpdate({ vitalSignsTemp: parseFloat(e.target.value) || null })}
            />
            <p className="text-xs text-muted-foreground">Normal: 36.5-37.5°C</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="complete-vitals"
            checked={isCompleted}
            onCheckedChange={(checked) => onMarkComplete(checked as boolean)}
          />
          <label
            htmlFor="complete-vitals"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark this section as complete
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
