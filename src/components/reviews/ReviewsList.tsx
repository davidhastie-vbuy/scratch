import { useState } from "react";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  job_id: string;
  reviewer_role: string;
  communication_rating: number;
  quality_rating: number;
  value_rating: number;
  reliability_rating: number;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  job_title?: string;
  reviewer_name?: string;
  provider_reply?: string | null;
  provider_reply_at?: string | null;
}

type RatingLabels = {
  communication: string;
  quality: string;
  value: string;
  reliability: string;
};

const CUSTOMER_TO_PROVIDER_LABELS: RatingLabels = {
  communication: "Communication",
  quality: "Quality",
  value: "Value",
  reliability: "Reliability",
};

const PROVIDER_TO_CUSTOMER_LABELS: RatingLabels = {
  communication: "Communication",
  quality: "Payment Timeliness",
  value: "Accuracy of Brief",
  reliability: "Reliability",
};

interface ReviewsListProps {
  reviews: Review[];
  showReviewerName?: boolean;
  showJobTitle?: boolean;
  /** The user_id of the provider viewing their own reviews — enables reply functionality */
  canReplyAsProvider?: string | null;
  /** Called after a reply is submitted so the parent can refresh */
  onReplySubmitted?: () => void;
  /** When showing provider-to-customer reviews, set this to swap the rating labels */
  reviewDirection?: "customer_to_provider" | "provider_to_customer";
}

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        className={`h-3.5 w-3.5 ${
          s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"
        }`}
      />
    ))}
  </div>
);

const ReviewReplyForm = ({ reviewId, onSubmitted }: { reviewId: string; onSubmitted: () => void }) => {
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("reviews")
      .update({
        provider_reply: reply.trim(),
        provider_reply_at: new Date().toISOString(),
      } as any)
      .eq("id", reviewId);
    if (error) {
      toast({ title: "Failed to submit reply", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reply posted" });
      onSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-2 space-y-2 pl-4 border-l-2 border-primary/20">
      <Textarea
        value={reply}
        onChange={e => setReply(e.target.value)}
        placeholder="Write your reply…"
        rows={2}
        maxLength={1000}
        className="text-sm"
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !reply.trim()}>
          {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
          Post Reply
        </Button>
      </div>
    </div>
  );
};

const ReviewsList = ({
  reviews,
  showReviewerName = true,
  showJobTitle = true,
  canReplyAsProvider = null,
  onReplySubmitted,
  reviewDirection = "customer_to_provider",
}: ReviewsListProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const labels = reviewDirection === "provider_to_customer" ? PROVIDER_TO_CUSTOMER_LABELS : CUSTOMER_TO_PROVIDER_LABELS;

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarDisplay rating={review.overall_rating} />
              <span className="font-semibold text-sm">{Number(review.overall_rating).toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(review.created_at), "dd MMM yyyy")}
            </span>
          </div>

          {showJobTitle && review.job_title && (
            <p className="text-xs text-muted-foreground">Job: {review.job_title}</p>
          )}
          {showReviewerName && review.reviewer_name && (
            <p className="text-xs text-muted-foreground">By: {review.reviewer_name}</p>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{labels.communication}</span>
              <span>{review.communication_rating}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{labels.quality}</span>
              <span>{review.quality_rating}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{labels.value}</span>
              <span>{review.value_rating}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{labels.reliability}</span>
              <span>{review.reliability_rating}/5</span>
            </div>
          </div>

          {review.comment && (
            <p className="text-sm whitespace-pre-wrap mt-1">{review.comment}</p>
          )}

          {/* Provider reply display */}
          {review.provider_reply && (
            <div className="mt-2 pl-4 border-l-2 border-primary/20 space-y-0.5">
              <p className="text-xs font-medium text-primary flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Provider Reply
              </p>
              <p className="text-sm whitespace-pre-wrap">{review.provider_reply}</p>
              {review.provider_reply_at && (
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(review.provider_reply_at), "dd MMM yyyy")}
                </p>
              )}
            </div>
          )}

          {/* Reply button for provider */}
          {canReplyAsProvider && !review.provider_reply && review.reviewer_role === "customer" && (
            <>
              {replyingTo === review.id ? (
                <ReviewReplyForm
                  reviewId={review.id}
                  onSubmitted={() => {
                    setReplyingTo(null);
                    onReplySubmitted?.();
                  }}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setReplyingTo(review.id)}
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Reply
                </Button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export { StarDisplay };
export default ReviewsList;
