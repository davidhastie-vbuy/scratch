import { useState } from "react";
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

const ratingLabels = {
  communication: "Communication",
  quality: "Quality of Work",
  value: "Value for Money",
  reliability: "Reliability & Punctuality",
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
  const [communication, setCommunication] = useState(0);
  const [quality, setQuality] = useState(0);
  const [value, setValue] = useState(0);
  const [reliability, setReliability] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allRated = communication > 0 && quality > 0 && value > 0 && reliability > 0;
  const avgRating = allRated ? ((communication + quality + value + reliability) / 4).toFixed(1) : null;

  const handleSubmit = async () => {
    if (!allRated) return;
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      job_id: jobId,
      reviewer_user_id: reviewerUserId,
      reviewee_user_id: revieweeUserId,
      reviewer_role: reviewerRole,
      communication_rating: communication,
      quality_rating: quality,
      value_rating: value,
      reliability_rating: reliability,
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
      onOpenChange(false);
      onReviewSubmitted?.();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Rate your experience with {revieweeName} on "{jobTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <StarRating label={ratingLabels.communication} value={communication} onChange={setCommunication} />
          <StarRating label={ratingLabels.quality} value={quality} onChange={setQuality} />
          <StarRating label={ratingLabels.value} value={value} onChange={setValue} />
          <StarRating label={ratingLabels.reliability} value={reliability} onChange={setReliability} />

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
