import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Briefcase, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AvailableJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [invitedJobs, setInvitedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [jobsRes, invRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .in("status", ["open"])
        .order("created_at", { ascending: false }),
      supabase
        .from("job_invitations")
        .select("*, jobs:job_id(id, title, description, category, postcode_district, budget, timeline, quote_count, status, created_at)")
        .eq("provider_user_id", user!.id)
        .eq("status", "pending" as any),
    ]);

    const eligibleJobs = jobsRes.data ?? [];
    const invData = (invRes.data ?? []) as any[];

    // Build invited jobs list from invitations
    const invitedJobIds = new Set(invData.map((inv: any) => inv.job_id));
    const invited: any[] = [];

    // Add invitation data to eligible jobs that are also invited
    for (const inv of invData) {
      if (inv.jobs && inv.jobs.status === "open") {
        invited.push({ ...inv.jobs, _invitation_id: inv.id });
      }
    }

    // Mark eligible jobs that also have invitations
    const markedJobs = eligibleJobs.map((j: any) => ({
      ...j,
      _invited: invitedJobIds.has(j.id),
      _invitation_id: invData.find((inv: any) => inv.job_id === j.id)?.id,
    }));

    // Sort: invited first, then by date
    markedJobs.sort((a, b) => {
      if (a._invited && !b._invited) return -1;
      if (!a._invited && b._invited) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    invited.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setAllJobs(markedJobs);
    setInvitedJobs(invited);
    setLoading(false);
  };

  const markViewed = async (invitationId: string) => {
    await supabase.from("job_invitations").update({ status: "viewed" } as any).eq("id", invitationId);
  };

  const JobCard = ({ job, showInvitedBadge = false }: { job: any; showInvitedBadge?: boolean }) => (
    <Card
      className={`cursor-pointer hover:bg-accent/30 transition-colors ${showInvitedBadge || job._invited ? "border-primary/40" : ""}`}
      onClick={() => {
        if (job._invitation_id) markViewed(job._invitation_id);
        navigate(`/provider/jobs/${job.id}`);
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{job.title}</CardTitle>
            {(showInvitedBadge || job._invited) && (
              <Badge variant="default" className="gap-1 text-xs">
                <Mail className="h-3 w-3" /> Invited
              </Badge>
            )}
          </div>
          <Badge variant="secondary">{job.quote_count}/3 quotes</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{job.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{categories.find(c => c.slug === job.category)?.name ?? job.category}</span>
          <span>•</span>
          <span>{job.postcode_district}</span>
          
          {job.timeline && <><span>•</span><span>{job.timeline}</span></>}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Posted {new Date(job.created_at).toLocaleDateString()}</p>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-display text-lg font-semibold">No jobs found</h3>
      <p className="text-muted-foreground text-sm mt-1">{message}</p>
    </div>
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Available Jobs</h2>
      <Tabs defaultValue={invitedJobs.length > 0 ? "invited" : "all"}>
        <TabsList>
          <TabsTrigger value="all">All Jobs ({allJobs.length})</TabsTrigger>
          <TabsTrigger value="invited">
            Invited ({invitedJobs.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {allJobs.length === 0 ? (
            <EmptyState message="No jobs matching your trade and areas right now. Check back soon!" />
          ) : (
            <div className="grid gap-4">
              {allJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="invited">
          {invitedJobs.length === 0 ? (
            <EmptyState message="No job invitations yet. Customers can invite you directly from your profile!" />
          ) : (
            <div className="grid gap-4">
              {invitedJobs.map(job => <JobCard key={job.id} job={job} showInvitedBadge />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvailableJobs;
