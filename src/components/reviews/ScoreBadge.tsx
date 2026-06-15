import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReviewsList from "./ReviewsList";

interface ScoreBadgeProps {
  userId: string;
  role: "customer" | "provider";
  showPopup?: boolean;
  className?: string;
}

const ScoreBadge = ({ userId, role, showPopup = true, className = "" }: ScoreBadgeProps) => {
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) fetchScore();
  }, [userId]);

  const fetchScore = async () => {
    // Get reviews where this user is the reviewee
    const { data } = await supabase
      .from("reviews")
      .select("overall_rating")
      .eq("reviewee_user_id", userId);

    if (data && data.length > 0) {
      const avg = (data as any[]).reduce((sum: number, r: any) => sum + Number(r.overall_rating), 0) / data.length;
      setAvgScore(avg);
      setReviewCount(data.length);
    }
  };

  const openReviews = async () => {
    if (!showPopup) return;

    const { data } = await supabase
      .from("reviews")
      .select("*, provider_reply, provider_reply_at")
      .eq("reviewee_user_id", userId)
      .order("created_at", { ascending: false });

    // Enrich with job titles and reviewer names
    const enriched = [];
    for (const r of (data as any[]) ?? []) {
      const { data: job } = await supabase.from("jobs").select("title").eq("id", r.job_id).single();
      let reviewerName = "Anonymous";
      if (r.reviewer_role === "customer") {
        const { data: profile } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", r.reviewer_user_id).single();
        if (profile) reviewerName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.full_name || "Customer";
      } else {
        const { data: pp } = await supabase.from("provider_profiles").select("business_name").eq("user_id", r.reviewer_user_id).maybeSingle();
        if (pp) reviewerName = pp.business_name;
      }
      enriched.push({ ...r, job_title: job?.title ?? "Unknown job", reviewer_name: reviewerName });
    }

    setReviews(enriched);
    setDialogOpen(true);
  };

  if (avgScore === null) return null;

  return (
    <>
      <button
        onClick={openReviews}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-sm font-medium hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors ${className}`}
        title={`${avgScore.toFixed(1)} average from ${reviewCount} review${reviewCount !== 1 ? "s" : ""}`}
      >
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        <span>{avgScore.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      </button>

      {showPopup && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Reviews ({reviewCount})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96 overflow-auto">
              <ReviewsList reviews={reviews} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ScoreBadge;
