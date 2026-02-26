import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PoundSterling, Clock, CalendarDays } from "lucide-react";

interface QuoteBannerProps {
  jobId: string;
  providerUserId: string;
}

interface QuoteData {
  price_min: number;
  price_max: number;
  availability: string | null;
  estimated_duration: string | null;
  message: string | null;
}

const QuoteBanner = ({ jobId, providerUserId }: QuoteBannerProps) => {
  const [quote, setQuote] = useState<QuoteData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("quotes")
        .select("price_min, price_max, availability, estimated_duration, message")
        .eq("job_id", jobId)
        .eq("provider_user_id", providerUserId)
        .limit(1);
      if (data?.[0]) setQuote(data[0]);
    };
    fetch();
  }, [jobId, providerUserId]);

  if (!quote) return null;

  return (
    <div className="px-4 py-2.5 bg-muted/40 border-b text-xs space-y-1">
      <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Original Quote</p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <PoundSterling className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">£{Number(quote.price_min).toFixed(2)} – £{Number(quote.price_max).toFixed(2)}</span>
        </span>
        {quote.availability && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{quote.availability}</span>
          </span>
        )}
        {quote.estimated_duration && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{quote.estimated_duration}</span>
          </span>
        )}
      </div>
      {quote.message && (
        <p className="text-muted-foreground italic truncate">&ldquo;{quote.message}&rdquo;</p>
      )}
    </div>
  );
};

export default QuoteBanner;
