import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ClipboardList, MessageSquare, MapPin, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JobRow {
  id: string;
  title: string;
  category: string;
  postcode_district: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  agreed_price: number | null;
  created_at: string;
  updated_at: string;
  customer_user_id: string;
}

interface CustomerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  accepted: { label: "Awaiting Payment", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const ProviderMyJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<(JobRow & { customerName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    // Jobs where this provider was awarded (provider_id = user)
    const { data } = await supabase
      .from("jobs")
      .select("id, title, category, postcode_district, status, scheduled_start, scheduled_end, agreed_price, created_at, updated_at, customer_user_id")
      .eq("provider_id", user!.id)
      .in("status", ["accepted", "in_progress", "completed", "cancelled"])
      .order("updated_at", { ascending: false });

    if (!data || data.length === 0) {
      setJobs([]);
      setLoading(false);
      return;
    }

    // Fetch customer names
    const customerIds = [...new Set(data.map(j => j.customer_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name")
      .in("id", customerIds);

    const profileMap = new Map<string, string>();
    (profiles ?? []).forEach((p: CustomerProfile) => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.full_name || "Customer";
      profileMap.set(p.id, name);
    });

    setJobs(data.map(j => ({
      ...j,
      customerName: profileMap.get(j.customer_user_id) || "Customer",
    })));
    setLoading(false);
  };

  const handleMessage = async (job: JobRow) => {
    // Find or create conversation, then navigate to messages
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", job.id)
      .eq("provider_user_id", user!.id)
      .eq("customer_user_id", job.customer_user_id)
      .maybeSingle();

    if (existing) {
      navigate("/provider/messages", { state: { conversationId: existing.id } });
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          job_id: job.id,
          provider_user_id: user!.id,
          customer_user_id: job.customer_user_id,
        })
        .select("id")
        .single();
      if (newConv) {
        navigate("/provider/messages", { state: { conversationId: newConv.id } });
      }
    }
  };

  // Categorise jobs
  const upcoming = jobs.filter(j => j.status === "accepted");
  const current = jobs.filter(j => j.status === "in_progress");
  const past = jobs.filter(j => j.status === "completed" || j.status === "cancelled");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderJobList = (list: typeof jobs, emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {list.map(job => {
          const st = STATUS_MAP[job.status] ?? { label: job.status, variant: "secondary" as const };
          return (
            <Card key={job.id} className="hover:bg-accent/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle
                    className="text-base cursor-pointer hover:underline"
                    onClick={() => navigate(`/provider/jobs/${job.id}`)}
                  >
                    {job.title}
                  </CardTitle>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {job.customerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.postcode_district}
                  </span>
                  {job.agreed_price != null && (
                    <span className="font-medium text-foreground">
                      £{Number(job.agreed_price).toLocaleString()}
                    </span>
                  )}
                  {job.scheduled_start && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(job.scheduled_start).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/provider/jobs/${job.id}`)}
                  >
                    View Job
                  </Button>
                  {job.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleMessage(job)}
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      Message Customer
                    </Button>
                  )}
                </div>
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

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-1.5">
            Upcoming
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {upcoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="current" className="gap-1.5">
            Current
            {current.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {current.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1.5">
            Past
            {past.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {past.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {renderJobList(upcoming, "No upcoming jobs. Jobs will appear here once a customer accepts your quote.")}
        </TabsContent>
        <TabsContent value="current">
          {renderJobList(current, "No jobs currently in progress.")}
        </TabsContent>
        <TabsContent value="past">
          {renderJobList(past, "No completed or cancelled jobs yet.")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderMyJobs;
