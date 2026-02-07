import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface QuoteListProps {
  farmerId?: string;
  workerId?: string;
  jobPostingId?: string;
  showActions?: boolean;
}

export const QuoteList = ({ 
  farmerId, 
  workerId, 
  jobPostingId,
  showActions = false 
}: QuoteListProps) => {
  const queryClient = useQueryClient();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["worker-quotes", farmerId, workerId, jobPostingId],
    queryFn: async () => {
      let query = supabase
        .from("worker_quotes")
        .select(`
          *,
          worker:worker_id(full_name, avatar_url, state, district),
          farmer:farmer_id(full_name)
        `)
        .order("created_at", { ascending: false });

      if (farmerId) query = query.eq("farmer_id", farmerId);
      if (workerId) query = query.eq("worker_id", workerId);
      if (jobPostingId) query = query.eq("job_posting_id", jobPostingId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: string }) => {
      const { error } = await supabase
        .from("worker_quotes")
        .update({ status })
        .eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-quotes"] });
      toast.success("Quote updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update quote");
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      expired: "secondary"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading quotes...</div>;
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No quotes found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote: any) => (
        <Card key={quote.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {quote.worker?.full_name || "Worker"}
              </CardTitle>
              {getStatusBadge(quote.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {quote.worker?.district}, {quote.worker?.state}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Proposed Amount:</span>
                <span className="text-lg font-semibold text-primary">
                  ₹{quote.proposed_amount}
                </span>
              </div>
              {quote.proposed_hours && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Hours:</span>
                  <span>{quote.proposed_hours}h</span>
                </div>
              )}
              {quote.message && (
                <p className="text-sm bg-muted p-2 rounded mt-2">{quote.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
              </p>

              {showActions && quote.status === "pending" && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => updateQuoteMutation.mutate({ quoteId: quote.id, status: "accepted" })}
                    disabled={updateQuoteMutation.isPending}
                    className="flex-1"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuoteMutation.mutate({ quoteId: quote.id, status: "rejected" })}
                    disabled={updateQuoteMutation.isPending}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
