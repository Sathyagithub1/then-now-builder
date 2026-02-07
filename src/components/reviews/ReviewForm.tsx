import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewFormProps {
  orderId: string;
  revieweeId: string;
  revieweeName: string;
  ratingType: "farmer_to_worker" | "worker_to_farmer";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({
  orderId,
  revieweeId,
  revieweeName,
  ratingType,
  onSuccess,
  onCancel
}: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to submit a review");
        return;
      }

      const { error } = await supabase.from("order_reviews").insert({
        order_id: orderId,
        reviewer_id: session.user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
        rating_type: ratingType
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("You have already reviewed this order");
        } else {
          throw error;
        }
      } else {
        toast.success("Review submitted successfully!");
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          Rate your experience with {revieweeName}
        </Label>
        <div className="mt-2">
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment (Optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
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
          disabled={submitting || rating === 0}
          className="flex-1"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
};
