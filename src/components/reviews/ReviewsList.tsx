import { Star } from "lucide-react";
import { format } from "date-fns";

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
}

interface ReviewsListProps {
  reviews: Review[];
  showReviewerName?: boolean;
  showJobTitle?: boolean;
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

const ReviewsList = ({ reviews, showReviewerName = true, showJobTitle = true }: ReviewsListProps) => {
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
              <span className="text-muted-foreground">Communication</span>
              <span>{review.communication_rating}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quality</span>
              <span>{review.quality_rating}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value</span>
              <span>{review.value_rating}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reliability</span>
              <span>{review.reliability_rating}/5</span>
            </div>
          </div>

          {review.comment && (
            <p className="text-sm whitespace-pre-wrap mt-1">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export { StarDisplay };
export default ReviewsList;
