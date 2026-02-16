import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Pencil, Save, X, Check, Image as ImageIcon, CalendarDays } from "lucide-react";
import JobScheduleForm from "@/components/JobScheduleForm";
import WorkTracker from "@/components/WorkTracker";
import { format } from "date-fns";

const JobDetail = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);

  const [job, setJob] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", timeline: "", budget: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (jobId) fetchAll();
  }, [jobId]);

  const fetchAll = async () => {
    const [jobRes, quotesRes, mediaRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId!).single(),
      supabase.from("quotes").select("*").eq("job_id", jobId!).order("created_at"),
      supabase.from("job_media").select("*").eq("job_id", jobId!).order("uploaded_at"),
    ]);
    if (jobRes.data) {
      setJob(jobRes.data);
      setEditForm({
        title: jobRes.data.title,
        description: jobRes.data.description,
        timeline: jobRes.data.timeline ?? "",
        budget: jobRes.data.budget ?? "",
      });
    }
    setQuotes(quotesRes.data ?? []);
    setMedia(mediaRes.data ?? []);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("jobs").update({
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      timeline: editForm.timeline || null,
      budget: editForm.budget || null,
    } as any).eq("id", jobId!);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job updated" });
      setEditing(false);
      fetchAll();
    }
    setSaving(false);
  };

  const acceptQuote = async (quoteId: string, providerUserId: string) => {
    // Accept the chosen quote
    await supabase.from("quotes").update({ status: "accepted" } as any).eq("id", quoteId);
    // Decline others
    await supabase.from("quotes").update({ status: "declined" } as any).eq("job_id", jobId!).neq("id", quoteId);
    // Update job
    await supabase.from("jobs").update({ status: "accepted", provider_id: providerUserId } as any).eq("id", jobId!);

    // Create conversation if not exists
    await supabase.from("conversations").upsert({
      job_id: jobId!,
      customer_user_id: user!.id,
      provider_user_id: providerUserId,
    } as any, { onConflict: "job_id,customer_user_id,provider_user_id" });

    toast({ title: "Quote accepted!" });
    fetchAll();
  };

  const cancelJob = async () => {
    await supabase.from("jobs").update({ status: "cancelled" } as any).eq("id", jobId!);
    toast({ title: "Job cancelled" });
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return <p className="text-muted-foreground">Job not found.</p>;

  const catName = categories.find(c => c.slug === job.category)?.name ?? job.category;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/jobs")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{job.title}</CardTitle>
            <Badge>{job.status.replace("_", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Input value={editForm.timeline} onChange={e => setEditForm(f => ({ ...f, timeline: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input value={editForm.budget} onChange={e => setEditForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{catName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{job.postcode_district}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Timeline</span><span>{job.timeline || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span>{job.budget || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Quotes</span><span>{job.quote_count}/3</span></div>
                {(job as any).scheduled_start && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Starts</span><span>{format(new Date((job as any).scheduled_start), "PPP 'at' h:mm a")}</span></div>
                )}
                {(job as any).scheduled_end && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Ends</span><span>{format(new Date((job as any).scheduled_end), "PPP 'at' h:mm a")}</span></div>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{job.description}</p>
              <div className="flex gap-2">
                {["open", "quoted", "quotes_closed"].includes(job.status) && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                )}
                {job.status !== "cancelled" && job.status !== "completed" && (
                  <Button variant="destructive" size="sm" onClick={cancelJob}>Cancel Job</Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      {media.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Photos & Videos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {media.map(m => {
                const url = supabase.storage.from("job-media").getPublicUrl(m.file_url).data.publicUrl;
                return m.file_type.startsWith("image") ? (
                  <img key={m.id} src={url} alt={m.file_name} className="rounded-md w-full h-24 object-cover" />
                ) : (
                  <video key={m.id} src={url} className="rounded-md w-full h-24 object-cover" controls />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Quotes ({quotes.length}/3)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quotes received yet.</p>
          ) : (
            quotes.map(q => (
              <div key={q.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">£{Number(q.price_min).toFixed(0)} – £{Number(q.price_max).toFixed(0)}</span>
                  <Badge variant={q.status === "accepted" ? "default" : q.status === "declined" ? "destructive" : "secondary"}>
                    {q.status}
                  </Badge>
                </div>
                {q.message && <p className="text-sm text-muted-foreground">{q.message}</p>}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {q.availability && <span>Available: {q.availability}</span>}
                  {q.estimated_duration && <span>Duration: {q.estimated_duration}</span>}
                </div>
                <div className="flex gap-2 items-center">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/providers/${q.provider_user_id}`)}>
                    View Provider
                  </Button>
                  {q.status === "pending" && job.status !== "cancelled" && (
                    <Button size="sm" onClick={() => acceptQuote(q.id, q.provider_user_id)}>
                      <Check className="mr-2 h-4 w-4" /> Accept Quote
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Work Tracker */}
      <WorkTracker jobId={jobId!} job={job} role="customer" onRefresh={fetchAll} />

      {/* Schedule - visible when job is accepted or in_progress */}
      {["accepted", "in_progress"].includes(job.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Job Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JobScheduleForm
              jobId={jobId!}
              currentStart={(job as any).scheduled_start}
              currentEnd={(job as any).scheduled_end}
              onSaved={fetchAll}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JobDetail;
