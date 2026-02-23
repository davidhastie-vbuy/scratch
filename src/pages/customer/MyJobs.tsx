import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  quoted: { label: "Quoted", variant: "secondary" },
  quotes_closed: { label: "Quotes Closed", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const MyJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("customer_user_id", user!.id)
      .order("created_at", { ascending: false });
    setJobs(data ?? []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-semibold">No jobs yet</h3>
        <p className="text-muted-foreground text-sm mt-1">Post your first job to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">My Jobs</h2>
      <div className="grid gap-4">
        {jobs.map((job) => {
          const st = STATUS_LABELS[job.status] ?? { label: job.status, variant: "secondary" as const };
          return (
            <Card key={job.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate(`/dashboard/jobs/${job.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{categories.find(c => c.slug === job.category)?.name ?? job.category}</span>
                  <span>•</span>
                  <span>{job.postcode_district}</span>
                  
                  <span>•</span>
                  <span>{job.quote_count}/3 quotes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Posted {new Date(job.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyJobs;
