import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Hospitals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hospitals</h1>
        <p className="text-gray-600 mt-1">Hospital and clinic session management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Hospital and clinic session management features will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
