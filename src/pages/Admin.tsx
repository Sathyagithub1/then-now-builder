import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2, Users, Briefcase, ShoppingCart, DollarSign, Settings, Shield } from "lucide-react";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { SecurityFindings } from "@/components/admin/SecurityFindings";

const Admin = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newWorkType, setNewWorkType] = useState({ name: "", description: "", icon: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (isAdmin === false) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, navigate, toast]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, ordersRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("order_payments").select("amount").eq("status", "completed"),
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
      };
    },
    enabled: isAdmin === true,
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, user_roles(role), profile_sensitive_data(mobile_number, email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: workTypes } = useQuery({
    queryKey: ["admin-work-types"],
    queryFn: async () => {
      const { data } = await supabase
        .from("work_types")
        .select("*")
        .order("name");
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          farmer:profiles!orders_farmer_id_fkey(full_name),
          worker:profiles!orders_worker_id_fkey(full_name),
          work_type:work_types(name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const createWorkTypeMutation = useMutation({
    mutationFn: async (workType: typeof newWorkType) => {
      const { error } = await supabase.from("work_types").insert([workType]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-work-types"] });
      toast({ title: "Success", description: "Work type created successfully" });
      setNewWorkType({ name: "", description: "", icon: "" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create work type", variant: "destructive" });
    },
  });

  const deleteWorkTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_types").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-work-types"] });
      toast({ title: "Success", description: "Work type deactivated" });
    },
  });

  if (isAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (isAdmin === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toFixed(2) || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Work Types</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workTypes?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="work-types">Work Types</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{(user as any).profile_sensitive_data?.mobile_number || "N/A"}</TableCell>
                        <TableCell>{user.district}, {user.state}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {Array.isArray(user.user_roles) && user.user_roles.length > 0 
                              ? user.user_roles[0].role 
                              : "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "destructive"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work-types">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Work Types</CardTitle>
                    <CardDescription>Manage available work categories</CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Work Type
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Work Type</DialogTitle>
                        <DialogDescription>Add a new category of work</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={newWorkType.name}
                            onChange={(e) => setNewWorkType({ ...newWorkType, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newWorkType.description}
                            onChange={(e) => setNewWorkType({ ...newWorkType, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="icon">Icon (emoji or text)</Label>
                          <Input
                            id="icon"
                            value={newWorkType.icon}
                            onChange={(e) => setNewWorkType({ ...newWorkType, icon: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => createWorkTypeMutation.mutate(newWorkType)}>
                          <Save className="h-4 w-4 mr-2" />
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workTypes?.map((workType) => (
                      <TableRow key={workType.id}>
                        <TableCell className="text-2xl">{workType.icon}</TableCell>
                        <TableCell className="font-medium">{workType.name}</TableCell>
                        <TableCell>{workType.description}</TableCell>
                        <TableCell>
                          <Badge variant={workType.is_active ? "default" : "destructive"}>
                            {workType.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {workType.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWorkTypeMutation.mutate(workType.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Monitoring</CardTitle>
                <CardDescription>View and monitor all orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Farmer</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Work Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.title}</TableCell>
                        <TableCell>{order.farmer?.full_name}</TableCell>
                        <TableCell>{order.worker?.full_name || "Unassigned"}</TableCell>
                        <TableCell>{order.work_type?.name || "N/A"}</TableCell>
                        <TableCell>₹{order.agreed_amount}</TableCell>
                        <TableCell>
                          <Badge>{order.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="security">
            <SecurityFindings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
