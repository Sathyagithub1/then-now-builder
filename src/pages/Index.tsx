import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoImage from "@/assets/farmerchain-logo.png";
import { RoleToggle } from "@/components/RoleToggle";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const { data: rolesData } = useUserRoles();
  
  const { data: workers } = useQuery({
    queryKey: ["farm-workers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "farm_worker")
        .eq("is_active", true)
        .limit(6);
      return data || [];
    },
    enabled: rolesData?.activeRole === "farmer",
  });

  const { data: jobPostings } = useQuery({
    queryKey: ["job-postings-home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_postings")
        .select(`
          *,
          profiles(full_name, state, district)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: rolesData?.activeRole === "farm_worker",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
              <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
            </div>
            <nav className="hidden md:flex gap-4">
              {rolesData?.activeRole === "farmer" ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/search")}>Find Workers</Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/create-job")}>Post Job</Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/job-postings")}>Find Jobs</Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/availability")}>My Availability</Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>Orders</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/chat")}>Messages</Button>
            </nav>
          </div>
          <div className="flex gap-2 items-center">
            <RoleToggle />
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Profile
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to FarmerChain</h2>
          <p className="text-xl text-muted-foreground">
            {rolesData?.activeRole === "farmer" 
              ? "Find and hire farm workers" 
              : "Find job opportunities"}
          </p>
        </div>

        {rolesData?.activeRole === "farmer" ? (
          <>
            <div className="mb-8 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Available Farm Workers</h3>
              <Button onClick={() => navigate("/search")}>View All Workers</Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {workers?.map((worker: any) => (
                <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{worker.full_name}</CardTitle>
                    <CardDescription>
                      {worker.district}, {worker.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{worker.bio || "No bio available"}</p>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/workers/${worker.id}`)}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Button size="lg" onClick={() => navigate("/create-job")}>
                Post a Job
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8 flex justify-between items-center">
              <h3 className="text-2xl font-bold">Latest Job Postings</h3>
              <Button onClick={() => navigate("/job-postings")}>View All Jobs</Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobPostings?.map((job: any) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>
                      {job.profiles?.full_name} • {job.profiles?.district}, {job.profiles?.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-3">{job.description}</p>
                    {job.estimated_budget && (
                      <p className="font-semibold mb-2">Budget: ₹{job.estimated_budget}</p>
                    )}
                    <Button 
                      className="w-full"
                      onClick={() => navigate("/job-postings")}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
