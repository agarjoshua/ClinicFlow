import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClinicalCases() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clinical Cases</h1>
        <p className="text-gray-600 mt-1">Patient clinical case management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Clinical case management features will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
