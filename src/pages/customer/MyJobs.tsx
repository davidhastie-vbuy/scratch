import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { useJobActions } from "@/hooks/use-job-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Briefcase, AlertCircle } from "lucide-react";
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

  const activeJobIds = jobs
    .filter(j => ["accepted", "in_progress"].includes(j.status))
    .map(j => j.id);

  const { actions } = useJobActions(activeJobIds, "customer", user?.id);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const openJobs = jobs.filter(j => ["open", "quoted", "quotes_closed"].includes(j.status));
  const inProgressJobs = jobs.filter(j => ["accepted", "in_progress"].includes(j.status));
  const pastJobs = jobs.filter(j => ["completed", "cancelled"].includes(j.status));

  const actionCount = inProgressJobs.filter(j => (actions[j.id]?.length ?? 0) > 0).length;

  const renderJobList = (list: any[], emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {list.map((job) => {
          const st = STATUS_LABELS[job.status] ?? { label: job.status, variant: "secondary" as const };
          const jobActions = actions[job.id] ?? [];
          return (
            <Card key={job.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate(`/dashboard/jobs/${job.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    {jobActions.length > 0 && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Action Required
                      </Badge>
                    )}
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{categories.find(c => c.slug === job.category)?.name ?? job.category}</span>
                  <span>•</span>
                  <span>{job.postcode_district}</span>
                  {job.budget && <><span>•</span><span>{job.budget}</span></>}
                  <span>•</span>
                  <span>{job.quote_count}/3 quotes</span>
                </div>
                {jobActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {jobActions.map((a, i) => (
                      <span key={i} className="text-xs font-medium text-destructive">
                        • {a.label}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Posted {format(new Date(job.created_at), "dd/MM/yyyy")}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">My Jobs</h2>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open" className="gap-1.5">
            Open
            {openJobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {openJobs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5">
            In Progress
            {inProgressJobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {inProgressJobs.length}
              </Badge>
            )}
            {actionCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {actionCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1.5">
            Past Jobs
            {pastJobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {pastJobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {renderJobList(openJobs, "No open jobs. Post a job to get started.")}
        </TabsContent>
        <TabsContent value="in_progress">
          {renderJobList(inProgressJobs, "No jobs currently in progress.")}
        </TabsContent>
        <TabsContent value="past">
          {renderJobList(pastJobs, "No completed or cancelled jobs yet.")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyJobs;
