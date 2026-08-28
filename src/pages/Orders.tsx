import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import logoImage from "@/assets/farmerchain-logo.png";
import { toast } from "sonner";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { StarRating } from "@/components/reviews/StarRating";

// Build the order update payload for a given status/note.
function buildStatusUpdateData(newStatus: string, statusNote: string): Record<string, unknown> {
  const updateData: Record<string, unknown> = { status: newStatus };
  if (statusNote) {
    if (newStatus === "canceled") updateData.cancellation_reason = statusNote;
    if (newStatus === "dispute") updateData.dispute_reason = statusNote;
    if (!updateData.notes) updateData.notes = statusNote;
  }
  return updateData;
}

// Maps a server error substring to a user-friendly message.
const STATUS_UPDATE_ERROR_MESSAGES: { match: string; message: string }[] = [
  { match: "Only the farmer can mark", message: "Only the farmer can mark this order as completed" },
  { match: "Cannot change a completed order", message: "Cannot modify a completed order (except to raise a dispute)" },
  { match: "Cannot modify a canceled order", message: "Canceled orders cannot be modified" },
  { match: "not authorized", message: "You are not authorized to update this order" },
];

function resolveStatusUpdateError(rawMessage: string | undefined): string {
  const message = rawMessage || "Error updating order";
  const mapped = STATUS_UPDATE_ERROR_MESSAGES.find((entry) => message.includes(entry.match));
  return mapped ? mapped.message : message;
}

const Orders = () => {
  const navigate = useNavigate();
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
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

    // Fetch orders created by user (if farmer)
    const { data: myOrdersData } = await supabase
      .from("orders")
      .select(`
        *,
        work_types(name, icon),
        worker:worker_id(full_name, mobile_number, avatar_url)
      `)
      .eq("farmer_id", session.user.id)
      .order("created_at", { ascending: false });

    // Fetch orders assigned to user (if farm worker)
    const { data: receivedOrdersData } = await supabase
      .from("orders")
      .select(`
        *,
        work_types(name, icon),
        farmer:farmer_id(full_name, mobile_number, avatar_url)
      `)
      .eq("worker_id", session.user.id)
      .order("created_at", { ascending: false });

    setMyOrders(myOrdersData || []);
    setReceivedOrders(receivedOrdersData || []);
    setLoading(false);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }

    // Client-side validation for better UX (server also validates)
    if ((newStatus === "canceled" || newStatus === "dispute") && !statusNote.trim()) {
      toast.error(newStatus === "canceled"
        ? "Please provide a cancellation reason"
        : "Please provide a dispute reason");
      return;
    }

    const updateData = buildStatusUpdateData(newStatus, statusNote);

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", selectedOrder.id);

    if (error) {
      // Display meaningful server validation errors
      toast.error(resolveStatusUpdateError(error.message));
    } else {
      toast.success("Order status updated");
      setStatusDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus("");
      setStatusNote("");
      fetchOrders();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      new: "secondary",
      ongoing: "default",
      completed: "default",
      partially_accepted: "secondary",
      agreed_partially: "secondary",
      accepted_finished: "default",
      canceled: "destructive",
      dispute: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  const OrderCard = ({ order, isFarmer }: any) => {
    const canReview = order.status === "completed" || order.status === "accepted_finished";
    const otherParty = isFarmer ? order.worker : order.farmer;
    const revieweeId = isFarmer ? order.worker_id : order.farmer_id;
    const ratingType = isFarmer ? "farmer_to_worker" : "worker_to_farmer";

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{order.work_types?.icon}</span>
                <CardTitle className="text-lg">{order.title}</CardTitle>
              </div>
              <CardDescription>
                {isFarmer
                  ? `Worker: ${order.worker?.full_name}`
                  : `Farmer: ${order.farmer?.full_name}`}
              </CardDescription>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Location:</span>
              <p className="font-medium">{order.location_address}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <p className="font-medium text-primary text-lg">₹{order.agreed_amount}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Start Date:</span>
              <p className="font-medium">{new Date(order.start_date).toLocaleDateString()}</p>
            </div>
            {order.estimated_hours && (
              <div>
                <span className="text-muted-foreground">Est. Hours:</span>
                <p className="font-medium">{order.estimated_hours}h</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/chat?user=${isFarmer ? order.worker_id : order.farmer_id}&order=${order.id}`)}
            >
              💬 Chat
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedOrder(order);
                setStatusDialogOpen(true);
              }}
            >
              Update Status
            </Button>
          </div>
          {canReview && (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSelectedOrder({ ...order, revieweeId, otherPartyName: otherParty?.full_name, ratingType });
                setReviewDialogOpen(true);
              }}
            >
              ⭐ Leave Review
            </Button>
          )}
          {order.notes && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <span className="text-muted-foreground">Notes:</span> {order.notes}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
        <h2 className="text-3xl font-bold mb-6">My Orders</h2>

        <Tabs defaultValue={currentUser?.role === "farmer" ? "created" : "received"}>
          {currentUser?.role === "farmer" && (
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="created">Created ({myOrders.length})</TabsTrigger>
              <TabsTrigger value="received">Assigned ({receivedOrders.length})</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="created" className="mt-6">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No orders created yet</p>
                <Button onClick={() => navigate("/workers")}>Find Workers</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {myOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isFarmer={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-6">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : receivedOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No orders received yet
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {receivedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isFarmer={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>Change the status of order: {selectedOrder?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="partially_accepted">Partially Accepted</SelectItem>
                  <SelectItem value="agreed_partially">Agreed Partially</SelectItem>
                  <SelectItem value="accepted_finished">Accepted & Finished</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="dispute">Dispute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
              />
            </div>
            <Button onClick={handleUpdateStatus} className="w-full">
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience for order: {selectedOrder?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <ReviewForm
              orderId={selectedOrder.id}
              revieweeId={selectedOrder.revieweeId}
              revieweeName={selectedOrder.otherPartyName || "User"}
              ratingType={selectedOrder.ratingType}
              onSuccess={() => {
                setReviewDialogOpen(false);
                setSelectedOrder(null);
                fetchOrders();
              }}
              onCancel={() => setReviewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
