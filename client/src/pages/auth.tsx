import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicSignupWizard } from "@/components/clinic-signup-wizard";
import { Sparkles } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setLocation("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center rounded-t-lg">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center p-2">
              <img src="/zahaniflow.png" alt="ZahaniFlow" className="w-full h-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">ZahaniFlow</CardTitle>
          <p className="text-blue-100 mt-2">Modern Healthcare Management</p>
        </CardHeader>

        <CardContent className="p-6">
          {/* Demo Account Banner */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Try Demo Account</h3>
                <p className="text-sm text-green-800 mb-3">
                  Test the platform with pre-loaded data before signing up!
                </p>
                <div className="bg-white rounded-md p-3 space-y-2 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Email:</span>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">demo.consultant@zahaniflow.com</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Password:</span>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">DemoConsultant2025!</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("demo.consultant@zahaniflow.com");
                    setPassword("DemoConsultant2025!");
                  }}
                  className="mt-3 text-sm text-green-700 hover:text-green-800 font-medium hover:underline"
                >
                  → Use demo credentials
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="doctor@hospital.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full"
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                New to ZahaniFlow?
              </span>
            </div>
          </div>

          {/* SaaS Signup Button */}
          <div className="mt-6">
            <Button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Create Your Clinic - Start Free Trial
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Set up your clinic in minutes • No credit card required
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-center text-gray-500 max-w-md">
        By creating a clinic, you agree to our Terms of Service and Privacy Policy.
        <br />
        Need help? Contact us at <a href="mailto:tech@zahaniflow.com" className="text-blue-600 hover:underline">tech@zahaniflow.com</a>
      </p>

      {/* Clinic Signup Wizard */}
      <ClinicSignupWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen}
      />
    </div>
  );
}
