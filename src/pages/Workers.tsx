import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logoImage from "@/assets/farmerchain-logo.png";
import { toast } from "sonner";

const Workers = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setCurrentUser(profile);

    // Fetch all farm workers with their ratings
    const { data: workersData, error } = await supabase
      .from("profiles")
      .select(`
        *,
        order_reviews:order_reviews!reviewee_id(rating)
      `)
      .eq("role", "farm_worker")
      .eq("is_active", true);

    if (error) {
      toast.error("Error loading workers");
    } else {
      // Calculate average rating for each worker
      const workersWithRatings = workersData?.map(worker => {
        const ratings = worker.order_reviews || [];
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
          : 0;
        return { ...worker, avgRating, reviewCount: ratings.length };
      }) || [];
      setWorkers(workersWithRatings);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
            <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
          </div>
          <div className="flex gap-2">
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Find Farm Workers</h2>
          <p className="text-muted-foreground">Connect with experienced agricultural workers</p>
        </div>

        <div className="mb-8">
          <Input
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Loading workers...</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No workers found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <Card
                key={worker.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/workers/${worker.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={worker.avatar_url} />
                      <AvatarFallback>{worker.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{worker.full_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {worker.avgRating > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold">{worker.avgRating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({worker.reviewCount})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    📍 {worker.district}, {worker.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {worker.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{worker.bio}</p>
                  )}
                  <Button className="w-full" size="sm">
                    View Profile & Hire
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Workers;
