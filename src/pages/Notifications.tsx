import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, MessageSquare, ShoppingCart, DollarSign, Star, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import logoImage from "@/assets/farmerchain-logo.png";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  status: string;
  metadata: any;
}

const Notifications = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_message": return <MessageSquare className="h-5 w-5 text-primary" />;
      case "order_status": return <ShoppingCart className="h-5 w-5 text-primary" />;
      case "quote_received": 
      case "quote_response": return <DollarSign className="h-5 w-5 text-primary" />;
      case "new_review": return <Star className="h-5 w-5 text-primary" />;
      case "payment_update": return <DollarSign className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filteredNotifications = notifications?.filter(n => {
    if (activeTab === "all") return true;
    return n.type === activeTab;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logoImage} alt="Logo" className="h-8 w-auto" />
              <h1 className="text-2xl font-bold text-primary">Notifications</h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/profile")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Notifications</CardTitle>
            <CardDescription>
              Stay updated with your orders, messages, and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="order_status">Orders</TabsTrigger>
                <TabsTrigger value="new_message">Messages</TabsTrigger>
                <TabsTrigger value="payment_update">Payments</TabsTrigger>
                <TabsTrigger value="quote_received">Quotes</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : filteredNotifications?.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications?.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            <Badge variant={notification.status === "sent" ? "default" : "secondary"} className="text-xs">
                              {notification.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <span className="text-xs text-muted-foreground mt-2 block">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Notifications;
