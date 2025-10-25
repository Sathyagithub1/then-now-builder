import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logoImage from "@/assets/farmerchain-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"farmer" | "farm_worker">("farmer");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          role,
          full_name: fullName,
          mobile_number: mobileNumber,
          state,
          district,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      // Create profile - id will be set by the database trigger
      const { error: profileError } = await supabase.from("profiles").insert({
        role,
        full_name: fullName,
        mobile_number: mobileNumber,
        state,
        district,
      } as any);

      if (profileError) {
        toast.error("Error creating profile");
      } else {
        toast.success("Account created successfully!");
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <img src={logoImage} alt="FarmerChain Logo" className="h-12 w-auto" style={{ imageRendering: 'crisp-edges' }} />
          </div>
          <CardDescription>Connect farmers and agricultural services</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(v) => setIsSignUp(v === "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label>I am a</Label>
                  <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="farmer" id="farmer" />
                      <Label htmlFor="farmer">Farmer (Hire Workers)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="farm_worker" id="farm_worker" />
                      <Label htmlFor="farm_worker">Farm Worker (Find Jobs)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input id="signupEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input id="signupPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
