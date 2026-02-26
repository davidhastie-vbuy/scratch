import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Briefcase, Mail, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MediaLightbox from "@/components/MediaLightbox";

const AvailableJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [invitedJobs, setInvitedJobs] = useState<any[]>([]);
  const [jobMedia, setJobMedia] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ jobId: string; index: number } | null>(null);

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

    const invitedJobIds = new Set(invData.map((inv: any) => inv.job_id));
    const invited: any[] = [];

    for (const inv of invData) {
      if (inv.jobs && inv.jobs.status === "open") {
        invited.push({ ...inv.jobs, _invitation_id: inv.id });
      }
    }

    const markedJobs = eligibleJobs.map((j: any) => ({
      ...j,
      _invited: invitedJobIds.has(j.id),
      _invitation_id: invData.find((inv: any) => inv.job_id === j.id)?.id,
    }));

    markedJobs.sort((a, b) => {
      if (a._invited && !b._invited) return -1;
      if (!a._invited && b._invited) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    invited.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setAllJobs(markedJobs);
    setInvitedJobs(invited);

    // Fetch media for all visible jobs
    const allJobIds = [...new Set([...markedJobs.map(j => j.id), ...invited.map(j => j.id)])];
    if (allJobIds.length > 0) {
      const { data: mediaData } = await supabase
        .from("job_media")
        .select("*")
        .in("job_id", allJobIds);
      
      const mediaMap: Record<string, any[]> = {};
      for (const m of mediaData ?? []) {
        if (!mediaMap[m.job_id]) mediaMap[m.job_id] = [];
        mediaMap[m.job_id].push(m);
      }
      setJobMedia(mediaMap);
    }

    setLoading(false);
  };

  const markViewed = async (invitationId: string) => {
    await supabase.from("job_invitations").update({ status: "viewed" } as any).eq("id", invitationId);
  };

  const getMediaItems = (jobId: string) => {
    return (jobMedia[jobId] ?? []).map(m => ({
      url: supabase.storage.from("job-media").getPublicUrl(m.file_url).data.publicUrl,
      type: m.file_type,
      name: m.file_name,
    }));
  };

  const JobCard = ({ job, showInvitedBadge = false }: { job: any; showInvitedBadge?: boolean }) => {
    const media = jobMedia[job.id] ?? [];

    return (
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

          {media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2" onClick={e => e.stopPropagation()}>
              {media.map((m, i) => {
                const url = supabase.storage.from("job-media").getPublicUrl(m.file_url).data.publicUrl;
                return (
                  <button
                    key={m.id}
                    className="relative shrink-0 w-20 h-16 rounded-md overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox({ jobId: job.id, index: i });
                    }}
                  >
                    {m.file_type.startsWith("video") ? (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/60 text-white px-1 rounded">▶</span>
                      </div>
                    ) : (
                      <img src={url} alt={m.file_name} className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

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
  };

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

      {lightbox && (
        <MediaLightbox
          media={getMediaItems(lightbox.jobId)}
          initialIndex={lightbox.index}
          open={!!lightbox}
          onOpenChange={(open) => { if (!open) setLightbox(null); }}
        />
      )}
    </div>
  );
};

export default AvailableJobs;
