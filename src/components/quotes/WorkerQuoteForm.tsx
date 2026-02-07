import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkerQuoteFormProps {
  farmerId: string;
  jobPostingId?: string;
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const WorkerQuoteForm = ({
  farmerId,
  jobPostingId,
  orderId,
  onSuccess,
  onCancel
}: WorkerQuoteFormProps) => {
  const [proposedAmount, setProposedAmount] = useState("");
  const [proposedHours, setProposedHours] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!proposedAmount || parseFloat(proposedAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to submit a quote");
        return;
      }

      const { error } = await supabase.from("worker_quotes").insert({
        worker_id: session.user.id,
        farmer_id: farmerId,
        job_posting_id: jobPostingId || null,
        order_id: orderId || null,
        proposed_amount: parseFloat(proposedAmount),
        proposed_hours: proposedHours ? parseInt(proposedHours) : null,
        message: message.trim() || null,
        status: "pending"
      });

      if (error) throw error;

      toast.success("Quote submitted successfully!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="proposed_amount">Proposed Amount (₹) *</Label>
        <Input
          id="proposed_amount"
          type="number"
          min="0"
          step="0.01"
          value={proposedAmount}
          onChange={(e) => setProposedAmount(e.target.value)}
          placeholder="Enter your proposed amount"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposed_hours">Estimated Hours (Optional)</Label>
        <Input
          id="proposed_hours"
          type="number"
          min="1"
          value={proposedHours}
          onChange={(e) => setProposedHours(e.target.value)}
          placeholder="How many hours will this take?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add any details about your quote..."
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={submitting || !proposedAmount}
          className="flex-1"
        >
          {submitting ? "Submitting..." : "Submit Quote"}
        </Button>
      </div>
    </div>
  );
};
