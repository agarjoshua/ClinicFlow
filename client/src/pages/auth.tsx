import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"consultant" | "assistant">("consultant");
  const [phone, setPhone] = useState("");
  
  // Organization details
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login existing user
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        } else {
          setLocation("/dashboard");
        }
      } else {
        // Sign up new user
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
        });
        
        if (signUpError) {
          setError(signUpError.message);
        } else if (data?.user) {
          // Create organization/clinic first
          try {
            // First create the user profile
            const { data: userProfile, error: userInsertError } = await supabase
              .from("users")
              .insert({
                user_id: data.user.id,
                name: name,
                email: email,
                role: role,
                phone: phone || null,
              })
              .select()
              .single();
              
            if (userInsertError || !userProfile) {
              console.error("User profile creation error:", userInsertError);
              setError("Account created but profile setup failed: " + userInsertError?.message);
              return;
            }
            
            // Generate clinic slug from name
            const slug = clinicName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
            
            // Create clinic with user's database ID as owner
            const { data: clinicData, error: clinicError } = await supabase
              .from("clinics")
              .insert({
                name: clinicName,
                slug: slug,
                owner_id: userProfile.id, // Use database user ID, not auth ID
                subscription_tier: 'trial',
                subscription_status: 'active',
                settings: {
                  address: clinicAddress || null,
                  phone: clinicPhone || null,
                  email: email,
                }
              })
              .select()
              .single();
            
            if (clinicError) {
              console.error("Clinic creation error:", clinicError);
              setError("Account created but clinic setup failed: " + clinicError.message);
              return;
            }
            
            // Update user profile with clinic_id
            const { error: updateError } = await supabase
              .from("users")
              .update({ clinic_id: clinicData.id })
              .eq("id", userProfile.id);
              
            if (updateError) {
              console.error("User clinic assignment error:", updateError);
              setError("Account created but clinic assignment failed: " + updateError.message);
              return;
            }
            
            // Auto login after signup
            setLocation("/dashboard");
          } catch (err: any) {
            console.error("Setup error:", err);
            setError("Account created but setup failed: " + err.message);
          }
        }
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
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🏥</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">ZahaniFlow</CardTitle>
          <p className="text-blue-100 mt-2">Modern Healthcare Management</p>
        </CardHeader>

        <CardContent className="p-6">
          <div className="flex justify-center gap-2 mb-6">
            <Button
              onClick={() => setIsLogin(true)}
              variant={isLogin ? "default" : "outline"}
              className={isLogin ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Login
            </Button>
            <Button
              onClick={() => setIsLogin(false)}
              variant={!isLogin ? "default" : "outline"}
              className={!isLogin ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Organization Details</h3>
                  <p className="text-xs text-blue-700">Set up your clinic/practice information</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic/Practice Name *
                  </label>
                  <Input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required={!isLogin}
                    placeholder="Dr. Smith Neurosurgery Clinic"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Address (Optional)
                  </label>
                  <Input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="123 Medical Plaza, Suite 100"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Phone (Optional)
                  </label>
                  <Input
                    type="tel"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Your Account</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="Dr. John Smith"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <Select value={role} onValueChange={(val: "consultant" | "assistant") => setRole(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultant">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Consultant</span>
                          <span className="text-xs text-gray-500">Neurosurgeon - Full access</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="assistant">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Assistant</span>
                          <span className="text-xs text-gray-500">Clinical assistant - Task management</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Phone (Optional)
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 987-6543"
                    className="w-full"
                  />
                </div>
              </>
            )}

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
              ) : isLogin ? (
                "Login"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-gray-600">
        {isLogin ? "Need an account? " : "Already have an account? "}
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="text-blue-600 font-medium hover:underline"
        >
          {isLogin ? "Sign up" : "Login"}
        </button>
      </p>
    </div>
  );
}
