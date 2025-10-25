import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoImage from "@/assets/farmerchain-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

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
              <Button variant="ghost" size="sm" onClick={() => navigate("/workers")}>Find Workers</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>Orders</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/chat")}>Messages</Button>
            </nav>
          </div>
          <div className="flex gap-2">
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
          <p className="text-xl text-muted-foreground">Connecting farmers and agricultural services</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/workers")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                Find Workers
              </CardTitle>
              <CardDescription>Browse farm workers in your area</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Search Workers</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/orders")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                My Orders
              </CardTitle>
              <CardDescription>Manage your work orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">View Orders</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/chat")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                Messages
              </CardTitle>
              <CardDescription>Chat with workers and farmers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">Open Chat</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                Reviews
              </CardTitle>
              <CardDescription>Rate and review services</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">My Reviews</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
