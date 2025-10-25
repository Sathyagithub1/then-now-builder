import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoImage from "@/assets/farmerchain-logo.png";
import { toast } from "sonner";

const Quotes = () => {
  const navigate = useNavigate();
  const [requestedQuotes, setRequestedQuotes] = useState<any[]>([]);
  const [receivedQuotes, setReceivedQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [updatedPrice, setUpdatedPrice] = useState("");

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUser(session.user);

    const { data: requested } = await supabase
      .from("quotes")
      .select(`
        *,
        services(title, category),
        profiles!quotes_provider_id_fkey(full_name)
      `)
      .eq("requester_id", session.user.id)
      .order("created_at", { ascending: false });

    const { data: received } = await supabase
      .from("quotes")
      .select(`
        *,
        services(title, category),
        profiles!quotes_requester_id_fkey(full_name)
      `)
      .eq("provider_id", session.user.id)
      .order("created_at", { ascending: false });

    setRequestedQuotes(requested || []);
    setReceivedQuotes(received || []);
    setLoading(false);
  };

  const updateQuoteStatus = async (quoteId: string, status: string, price?: number) => {
    const updateData: any = { status };
    if (price) updateData.proposed_price = price;

    const { error } = await supabase
      .from("quotes")
      .update(updateData)
      .eq("id", quoteId);

    if (error) {
      toast.error("Error updating quote");
    } else {
      toast.success(`Quote ${status}`);
      setSelectedQuote(null);
      fetchQuotes();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const QuoteCard = ({ quote, isProvider }: any) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{quote.services?.title}</CardTitle>
            <CardDescription>
              {isProvider ? `From: ${quote.profiles?.full_name}` : `To: ${quote.profiles?.full_name}`}
            </CardDescription>
          </div>
          {getStatusBadge(quote.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{quote.description}</p>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg text-primary">₹{quote.proposed_price}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(quote.created_at).toLocaleDateString()}
          </span>
        </div>
        {quote.notes && (
          <p className="text-sm italic text-muted-foreground">Note: {quote.notes}</p>
        )}
        {isProvider && quote.status === "pending" && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={() => {
                setSelectedQuote(quote);
                setUpdatedPrice(quote.proposed_price.toString());
              }}
            >
              Respond
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateQuoteStatus(quote.id, "rejected")}
            >
              Reject
            </Button>
          </div>
        )}
        {!isProvider && quote.status === "accepted" && (
          <Button size="sm" onClick={() => navigate(`/payment/${quote.id}`)}>
            Proceed to Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
            <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
          </div>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">My Quotes</h2>

        <Tabs defaultValue="requested">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="requested">Requested ({requestedQuotes.length})</TabsTrigger>
            <TabsTrigger value="received">Received ({receivedQuotes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="requested" className="mt-6">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : requestedQuotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No quotes requested yet</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {requestedQuotes.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} isProvider={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-6">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : receivedQuotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No quotes received yet</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {receivedQuotes.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} isProvider={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Quote</DialogTitle>
            <DialogDescription>Update the price and accept the quote</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Proposed Price (₹)</Label>
              <Input
                type="number"
                value={updatedPrice}
                onChange={(e) => setUpdatedPrice(e.target.value)}
              />
            </div>
            <Button
              onClick={() => updateQuoteStatus(selectedQuote?.id, "accepted", parseFloat(updatedPrice))}
              className="w-full"
            >
              Accept Quote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quotes;
