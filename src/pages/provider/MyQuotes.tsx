import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "outline" },
};

const MyQuotes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchQuotes();
  }, [user]);

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from("quotes")
      .select("*, jobs(title, postcode_district, status)")
      .eq("provider_user_id", user!.id)
      .order("created_at", { ascending: false });
    setQuotes(data ?? []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-semibold">No quotes yet</h3>
        <p className="text-muted-foreground text-sm mt-1">Submit quotes on available jobs to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">My Quotes</h2>
      <div className="grid gap-4">
        {quotes.map(q => {
          const st = STATUS_MAP[q.status] ?? { label: q.status, variant: "secondary" as const };
          const job = (q as any).jobs;
          return (
            <Card key={q.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate(`/provider/jobs/${q.job_id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{job?.title ?? "Job"}</CardTitle>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>£{Number(q.price_min).toFixed(0)} – £{Number(q.price_max).toFixed(0)}</span>
                  <span>•</span>
                  <span>{job?.postcode_district}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Quoted {new Date(q.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyQuotes;
