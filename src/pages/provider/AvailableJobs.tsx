import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AvailableJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    // RLS handles filtering - only eligible jobs visible
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .in("status", ["open"])
      .order("created_at", { ascending: false });
    setJobs(data ?? []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-semibold">No available jobs</h3>
        <p className="text-muted-foreground text-sm mt-1">No jobs matching your trade and areas right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Available Jobs</h2>
      <div className="grid gap-4">
        {jobs.map(job => (
          <Card key={job.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate(`/provider/jobs/${job.id}`)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{job.title}</CardTitle>
                <Badge variant="secondary">{job.quote_count}/3 quotes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{job.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{categories.find(c => c.slug === job.category)?.name ?? job.category}</span>
                <span>•</span>
                <span>{job.postcode_district}</span>
                {job.budget && <><span>•</span><span>{job.budget}</span></>}
                {job.timeline && <><span>•</span><span>{job.timeline}</span></>}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Posted {new Date(job.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AvailableJobs;
