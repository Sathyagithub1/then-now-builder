import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoImage from "@/assets/farmerchain-logo.png";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    totalSpent: 0,
    pendingPayments: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

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

    if (profile?.role === "farmer") {
      await fetchFarmerStats(session.user.id);
    } else if (profile?.role === "farm_worker") {
      await fetchWorkerStats(session.user.id);
    }

    setLoading(false);
  };

  const fetchFarmerStats = async (userId: string) => {
    // Fetch orders created by farmer
    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_payments(*)")
      .eq("farmer_id", userId);

    const totalOrders = orders?.length || 0;
    const activeOrders = orders?.filter(o => 
      ["new", "in_progress", "accepted"].includes(o.status)
    ).length || 0;
    const completedOrders = orders?.filter(o => o.status === "completed").length || 0;
    const totalSpent = orders?.reduce((sum, o) => sum + Number(o.agreed_amount || 0), 0) || 0;
    const pendingPayments = orders?.filter(o => 
      o.order_payments?.some((p: any) => p.status === "pending")
    ).length || 0;

    // Fetch unread messages
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("receiver_id", userId)
      .eq("is_read", false);

    setStats({
      totalOrders,
      activeOrders,
      completedOrders,
      totalSpent,
      totalEarnings: 0,
      pendingPayments,
      unreadMessages: messages?.length || 0,
    });

    setRecentOrders(orders?.slice(0, 5) || []);
  };

  const fetchWorkerStats = async (userId: string) => {
    // Fetch orders assigned to worker
    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_payments(*)")
      .eq("worker_id", userId);

    const totalOrders = orders?.length || 0;
    const activeOrders = orders?.filter(o => 
      ["accepted", "in_progress"].includes(o.status)
    ).length || 0;
    const completedOrders = orders?.filter(o => o.status === "completed").length || 0;
    const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.agreed_amount || 0), 0) || 0;
    const pendingPayments = orders?.filter(o => 
      o.order_payments?.some((p: any) => p.status === "pending" && p.receiver_id === userId)
    ).length || 0;

    // Fetch unread messages
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("receiver_id", userId)
      .eq("is_read", false);

    setStats({
      totalOrders,
      activeOrders,
      completedOrders,
      totalEarnings,
      totalSpent: 0,
      pendingPayments,
      unreadMessages: messages?.length || 0,
    });

    setRecentOrders(orders?.slice(0, 5) || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      new: "bg-blue-500 text-white",
      accepted: "bg-green-500 text-white",
      in_progress: "bg-yellow-500 text-white",
      completed: "bg-purple-500 text-white",
      cancelled: "bg-red-500 text-white",
    };
    return statusColors[status] || "bg-gray-500 text-white";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
            <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Admin Panel
              </Button>
            )}
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
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {currentUser?.full_name}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading dashboard...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.activeOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.completedOrders}</div>
                </CardContent>
              </Card>

              {currentUser?.role === "farmer" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">₹{stats.totalSpent.toFixed(2)}</div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">₹{stats.totalEarnings.toFixed(2)}</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/orders")}>
                <CardHeader>
                  <CardTitle>View Orders</CardTitle>
                  <CardDescription>Manage your orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {stats.pendingPayments > 0 && (
                      <div className="text-yellow-600 font-medium">
                        {stats.pendingPayments} pending payment{stats.pendingPayments !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/chat")}>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>Chat with others</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {stats.unreadMessages > 0 ? (
                      <div className="text-red-600 font-medium">
                        {stats.unreadMessages} unread message{stats.unreadMessages !== 1 ? 's' : ''}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No new messages</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {currentUser?.role === "farmer" && (
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/workers")}>
                  <CardHeader>
                    <CardTitle>Find Workers</CardTitle>
                    <CardDescription>Browse farm workers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Hire experienced workers</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest order activity</CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No orders yet</div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => navigate("/orders")}
                      >
                        <div>
                          <div className="font-semibold">{order.title}</div>
                          <div className="text-sm text-muted-foreground">{order.location_address}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{order.agreed_amount}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
