import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  reviewerUserId: string;
  revieweeUserId: string;
  reviewerRole: "customer" | "provider";
  revieweeName: string;
  onReviewSubmitted?: () => void;
}

const customerRatingLabels: Record<string, string> = {
  communication: "Communication",
  quality: "Quality of Work",
  value: "Value for Money",
  reliability: "Reliability & Punctuality",
};

const providerRatingLabels: Record<string, string> = {
  communication: "Communication & Clarity",
  payment_timeliness: "Payment Timeliness",
  site_preparation: "Site Access & Preparation",
  overall_experience: "Overall Experience",
};

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className="p-0.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hover || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
        {value > 0 && <span className="text-sm text-muted-foreground ml-2 self-center">{value}/5</span>}
      </div>
    </div>
  );
};

const ReviewDialog = ({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  reviewerUserId,
  revieweeUserId,
  reviewerRole,
  revieweeName,
  onReviewSubmitted,
}: ReviewDialogProps) => {
  const { toast } = useToast();

  const ratingLabels = reviewerRole === "provider" ? providerRatingLabels : customerRatingLabels;
  const keys = useMemo(() => Object.keys(ratingLabels), [reviewerRole]);

  const initRatings = () => Object.fromEntries(keys.map(k => [k, 0]));
  const [ratings, setRatings] = useState<Record<string, number>>(initRatings);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset when dialog opens with potentially different role
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setRatings(initRatings());
      setComment("");
    }
    onOpenChange(next);
  };

  const allRated = keys.every(k => ratings[k] > 0);
  const ratingValues = keys.map(k => ratings[k]);
  const avgRating = allRated ? (ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length).toFixed(1) : null;

  const handleSubmit = async () => {
    if (!allRated) return;
    setSubmitting(true);

    // Map dynamic keys back to the DB columns — customer role uses original columns,
    // provider role stores in the same columns for DB compatibility
    const columnMap: Record<string, string> = reviewerRole === "provider"
      ? { communication: "communication_rating", payment_timeliness: "quality_rating", site_preparation: "value_rating", overall_experience: "reliability_rating" }
      : { communication: "communication_rating", quality: "quality_rating", value: "value_rating", reliability: "reliability_rating" };

    const ratingsPayload: Record<string, number> = {};
    for (const key of keys) {
      const col = columnMap[key];
      if (col) ratingsPayload[col] = ratings[key];
    }

    const { error } = await supabase.from("reviews").insert({
      job_id: jobId,
      reviewer_user_id: reviewerUserId,
      reviewee_user_id: revieweeUserId,
      reviewer_role: reviewerRole,
      ...ratingsPayload,
      comment: comment.trim() || null,
    } as any);

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        toast({ title: "Already reviewed", description: "You've already left a review for this job.", variant: "destructive" });
      } else {
        toast({ title: "Could not submit review", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      handleOpenChange(false);
      onReviewSubmitted?.();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Rate your experience with {revieweeName} on "{jobTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {keys.map(key => (
            <StarRating
              key={key}
              label={ratingLabels[key]}
              value={ratings[key]}
              onChange={v => setRatings(prev => ({ ...prev, [key]: v }))}
            />
          ))}

          {avgRating && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{avgRating}</span>
              <span className="text-sm text-muted-foreground">overall rating</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Comments (optional)</Label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience…"
              maxLength={1000}
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={!allRated || submitting} className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;

