import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoImage from "@/assets/farmerchain-logo.png";
import { toast } from "sonner";

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUser(session.user);

    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .select(`
        *,
        profiles(full_name, avatar_url, mobile_number)
      `)
      .eq("id", id)
      .single();

    if (serviceError) {
      toast.error("Error loading service");
      navigate("/services");
      return;
    }

    setService(serviceData);

    const { data: reviewsData } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq("service_id", id)
      .order("created_at", { ascending: false });

    setReviews(reviewsData || []);
    setLoading(false);
  };

  const handleRequestQuote = async () => {
    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    const { error } = await supabase.from("quotes").insert({
      service_id: id,
      requester_id: currentUser.id,
      provider_id: service.user_id,
      description,
      proposed_price: service.price_per_unit,
      status: "pending",
    });

    if (error) {
      toast.error("Error requesting quote");
    } else {
      toast.success("Quote requested successfully!");
      setQuoteDialogOpen(false);
      setDescription("");
      navigate("/quotes");
    }
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
          <Button onClick={() => navigate("/services")} variant="outline">Back to Services</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="text-sm">{service.category}</Badge>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">₹{service.price_per_unit}</div>
                    <div className="text-sm text-muted-foreground">per {service.unit}</div>
                  </div>
                </div>
                <CardTitle className="text-3xl">{service.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>📍 {service.location_district}, {service.location_state}</span>
                  <span>⭐ {averageRating} ({reviews.length} reviews)</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>

                <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full" disabled={currentUser?.id === service.user_id}>
                      {currentUser?.id === service.user_id ? "This is your service" : "Request Quote"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Quote</DialogTitle>
                      <DialogDescription>Provide details about your requirements</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe what you need..."
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleRequestQuote} className="w-full">Submit Request</Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                              <div className="text-sm text-muted-foreground">
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
                <CardTitle>Service Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarImage src={service.profiles?.avatar_url} />
                    <AvatarFallback>{service.profiles?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{service.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{service.profiles?.mobile_number}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetail;
