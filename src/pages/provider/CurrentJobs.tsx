import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ClipboardList, MapPin, CalendarDays, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  accepted: { label: "Awaiting Payment", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
};

const CurrentJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [milestones, setMilestones] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    // Get jobs where this provider is assigned (quote accepted)
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .eq("provider_id", user!.id)
      .in("status", ["accepted", "in_progress", "completed"])
      .order("updated_at", { ascending: false });

    const allJobs = jobsData ?? [];
    setJobs(allJobs);

    if (allJobs.length > 0) {
      // Fetch customer names
      const customerIds = [...new Set(allJobs.map(j => j.customer_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name")
        .in("id", customerIds);

      const custMap: Record<string, string> = {};
      for (const p of profiles ?? []) {
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.full_name || "Customer";
        custMap[p.id] = name;
      }
      setCustomers(custMap);

      // Fetch latest milestones for each job
      const jobIds = allJobs.map(j => j.id);
      const { data: msData } = await supabase
        .from("job_milestones")
        .select("*")
        .in("job_id", jobIds)
        .order("sort_order", { ascending: true });

      const msMap: Record<string, any[]> = {};
      for (const ms of msData ?? []) {
        if (!msMap[ms.job_id]) msMap[ms.job_id] = [];
        msMap[ms.job_id].push(ms);
      }
      setMilestones(msMap);
    }

    setLoading(false);
  };

  const getNextAction = (job: any) => {
    const ms = milestones[job.id] ?? [];
    if (job.status === "accepted") return "Awaiting customer payment";
    if (job.status === "completed") return "Job complete";
    const pending = ms.find(m => m.status === "pending");
    if (pending) return `Next: ${pending.title}`;
    return "In progress";
  };

  const getLatestActivity = (job: any) => {
    const ms = milestones[job.id] ?? [];
    const completed = ms.filter(m => m.completed_at).sort((a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    if (completed.length > 0) {
      return `"${completed[0].title}" completed ${new Date(completed[0].completed_at).toLocaleDateString()}`;
    }
    return `Updated ${new Date(job.updated_at).toLocaleDateString()}`;
  };

  const filterJobs = (filter: string) => {
    if (filter === "all") return jobs;
    if (filter === "awaiting_payment") return jobs.filter(j => j.status === "accepted");
    return jobs.filter(j => j.status === filter);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const counts = {
    all: jobs.length,
    accepted: jobs.filter(j => j.status === "accepted").length,
    in_progress: jobs.filter(j => j.status === "in_progress").length,
    completed: jobs.filter(j => j.status === "completed").length,
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-display text-lg font-semibold">No jobs found</h3>
      <p className="text-muted-foreground text-sm mt-1">{message}</p>
    </div>
  );

  const JobCard = ({ job }: { job: any }) => {
    const st = STATUS_MAP[job.status] ?? { label: job.status, variant: "secondary" as const };
    return (
      <Card
        className="cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => navigate(`/provider/jobs/${job.id}`)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{job.title}</CardTitle>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {customers[job.customer_user_id] ?? "Customer"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.postcode_district}
            </span>
            {job.scheduled_start && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(job.scheduled_start).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{getLatestActivity(job)}</p>
            <p className="font-medium text-foreground">{getNextAction(job)}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Current Jobs</h2>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="awaiting_payment">Awaiting Payment ({counts.accepted})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({counts.in_progress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
        </TabsList>
        {["all", "awaiting_payment", "in_progress", "completed"].map(tab => (
          <TabsContent key={tab} value={tab}>
            {filterJobs(tab).length === 0 ? (
              <EmptyState message={tab === "all" ? "No won jobs yet. Quote on available jobs to get started!" : `No ${tab.replace("_", " ")} jobs.`} />
            ) : (
              <div className="grid gap-4">
                {filterJobs(tab).map(job => <JobCard key={job.id} job={job} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CurrentJobs;
