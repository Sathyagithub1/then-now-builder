import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { formatDistanceToNow } from "date-fns";

interface ReviewListProps {
  userId: string;
}

export const ReviewList = ({ userId }: ReviewListProps) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["user-reviews", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_reviews")
        .select(`
          *,
          reviewer:reviewer_id(full_name, avatar_url)
        `)
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review: any) => (
        <Card key={review.id}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.reviewer?.avatar_url} />
                <AvatarFallback>
                  {review.reviewer?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.reviewer?.full_name || "Anonymous"}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1">
                  <StarRating rating={review.rating} readonly size="sm" />
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
