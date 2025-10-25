import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logoImage from "@/assets/farmerchain-logo.png";
import { toast } from "sonner";

const WorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Order form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workTypeId, setWorkTypeId] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [agreedAmount, setAgreedAmount] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

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

    // Fetch worker details
    const { data: workerData, error: workerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (workerError || !workerData) {
      toast.error("Worker not found");
      navigate("/workers");
      return;
    }

    setWorker(workerData);

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from("order_reviews")
      .select(`
        *,
        profiles:reviewer_id(full_name, avatar_url),
        orders(title)
      `)
      .eq("reviewee_id", id)
      .order("created_at", { ascending: false });

    setReviews(reviewsData || []);

    // Fetch work types
    const { data: workTypesData } = await supabase
      .from("work_types")
      .select("*")
      .eq("is_active", true);

    setWorkTypes(workTypesData || []);
    setLoading(false);
  };

  const handleCreateOrder = async () => {
    if (!title || !description || !workTypeId || !locationAddress || !startDate || !agreedAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("orders").insert({
      farmer_id: currentUser.id,
      worker_id: id,
      work_type_id: workTypeId,
      title,
      description,
      location_address: locationAddress,
      start_date: startDate,
      estimated_hours: parseFloat(estimatedHours) || null,
      agreed_amount: parseFloat(agreedAmount),
      status: "new",
    });

    if (error) {
      toast.error("Error creating order");
    } else {
      toast.success("Order created successfully!");
      setOrderDialogOpen(false);
      navigate("/orders");
    }
  };

  const handleStartChat = async () => {
    navigate(`/chat?user=${id}`);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
            <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
          </div>
          <Button onClick={() => navigate("/workers")} variant="outline">Back</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-6 mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={worker.avatar_url} />
                    <AvatarFallback className="text-2xl">{worker.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{worker.full_name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>📍 {worker.district}, {worker.state}</span>
                      <span>📞 {worker.mobile_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {averageRating !== "N/A" && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-xl">⭐</span>
                          <span className="text-xl font-bold">{averageRating}</span>
                          <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                        </div>
                      )}
                      {worker.kyc_verified && (
                        <Badge variant="default">✓ Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {worker.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{worker.bio}</p>
                  </div>
                )}

                {currentUser?.role === "farmer" && (
                  <div className="flex gap-3">
                    <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="flex-1">Create Order</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create Work Order</DialogTitle>
                          <DialogDescription>Hire {worker.full_name} for agricultural work</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Work Type *</Label>
                            <Select value={workTypeId} onValueChange={setWorkTypeId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select work type" />
                              </SelectTrigger>
                              <SelectContent>
                                {workTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.icon} {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Job Title *</Label>
                            <Input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="e.g., Harvest wheat crop"
                            />
                          </div>
                          <div>
                            <Label>Description *</Label>
                            <Textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Describe the work requirements..."
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label>Location Address *</Label>
                            <Input
                              value={locationAddress}
                              onChange={(e) => setLocationAddress(e.target.value)}
                              placeholder="Farm location address"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Start Date *</Label>
                              <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Estimated Hours</Label>
                              <Input
                                type="number"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(e.target.value)}
                                placeholder="e.g., 8"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Agreed Amount (₹) *</Label>
                            <Input
                              type="number"
                              value={agreedAmount}
                              onChange={(e) => setAgreedAmount(e.target.value)}
                              placeholder="e.g., 5000"
                            />
                          </div>
                          <Button onClick={handleCreateOrder} className="w-full">
                            Create Order
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="lg" variant="secondary" onClick={handleStartChat} className="flex-1">
                      💬 Message
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No reviews yet</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={review.profiles?.avatar_url} />
                          <AvatarFallback>{review.profiles?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{review.profiles?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{review.orders?.title}</p>
                              <div className="text-sm text-yellow-500">
                                {"⭐".repeat(review.rating)}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{worker.mobile_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{worker.district}, {worker.state}</p>
                </div>
                {worker.upi_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">UPI ID</p>
                    <p className="font-medium">{worker.upi_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDetail;
