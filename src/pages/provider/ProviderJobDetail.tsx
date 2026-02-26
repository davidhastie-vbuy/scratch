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
import { Loader2, ArrowLeft, Send, AlertTriangle, CalendarDays, MessageSquare } from "lucide-react";
import JobScheduleForm from "@/components/JobScheduleForm";
import WorkTracker from "@/components/WorkTracker";
import MilestoneSetup from "@/components/MilestoneSetup";
import MediaLightbox from "@/components/MediaLightbox";
import { format } from "date-fns";

const ProviderJobDetail = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);

  const [job, setJob] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [existingQuote, setExistingQuote] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [quoteForm, setQuoteForm] = useState({
    priceMin: "",
    priceMax: "",
    message: "",
    availability: "",
    estimatedDuration: "",
  });

  useEffect(() => {
    if (jobId && user) fetchAll();
  }, [jobId, user]);

  const fetchAll = async () => {
    const [jobRes, mediaRes, quoteRes, convRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId!).single(),
      supabase.from("job_media").select("*").eq("job_id", jobId!),
      supabase.from("quotes").select("*").eq("job_id", jobId!).eq("provider_user_id", user!.id).maybeSingle(),
      supabase.from("conversations").select("id").eq("job_id", jobId!).eq("provider_user_id", user!.id).maybeSingle(),
    ]);
    setJob(jobRes.data);
    setMedia(mediaRes.data ?? []);
    setExistingQuote(quoteRes.data);
    setConversationId(convRes.data?.id ?? null);
    setLoading(false);
  };

  const submitQuote = async () => {
    const min = parseFloat(quoteForm.priceMin);
    const max = parseFloat(quoteForm.priceMax);

    if (isNaN(min) || isNaN(max)) {
      toast({ title: "Price range required", variant: "destructive" });
      return;
    }

    if (max < min) {
      toast({ title: "Invalid price range", description: "Maximum price cannot be lower than minimum price.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("quotes").insert({
      job_id: jobId!,
      provider_user_id: user!.id,
      price_min: parseFloat(quoteForm.priceMin),
      price_max: parseFloat(quoteForm.priceMax),
      message: quoteForm.message || null,
      availability: quoteForm.availability || null,
      estimated_duration: quoteForm.estimatedDuration || null,
    } as any);

    if (error) {
      if (error.message.includes("Maximum of 3 quotes")) {
        toast({ title: "Quote limit reached", description: "This job already has 3 quotes.", variant: "destructive" });
      } else if (error.message.includes("duplicate key") || error.message.includes("idx_quotes_provider_job")) {
        toast({ title: "Already quoted", description: "You've already submitted a quote for this job.", variant: "destructive" });
      } else {
        toast({ title: "Failed to submit quote", description: error.message, variant: "destructive" });
      }
    } else {
      // Create conversation
      await supabase.from("conversations").upsert({
        job_id: jobId!,
        customer_user_id: job.customer_user_id,
        provider_user_id: user!.id,
      } as any, { onConflict: "job_id,customer_user_id,provider_user_id" });

      toast({ title: "Quote submitted!" });
      fetchAll();
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return <p className="text-muted-foreground">Job not found.</p>;

  const catName = categories.find(c => c.slug === job.category)?.name ?? job.category;
  const quotesMaxed = job.quote_count >= 3;

  // If this provider's quote was declined and job is awarded, show restricted view
  const isDeclined = existingQuote?.status === "declined";
  const jobAwarded = ["accepted", "in_progress", "completed"].includes(job.status);

  if (isDeclined && jobAwarded) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/provider/jobs")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{job.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{catName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{job.postcode_district}</span></div>
            </div>
            <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm space-y-2">
              <p className="font-medium">This job has been awarded to another provider</p>
              <p className="text-muted-foreground">Unfortunately, your quote was not selected for this job. The customer chose a different provider.</p>
              <p className="text-muted-foreground">Don't be discouraged — keep quoting on jobs that match your skills and area.</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Your quote: £{Number(existingQuote.price_min).toFixed(0)} – £{Number(existingQuote.price_max).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Submitted {new Date(existingQuote.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/provider/jobs")}>
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
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{catName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{job.postcode_district}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Timeline</span><span>{job.timeline || "—"}</span></div>
            
            <div className="flex justify-between"><span className="text-muted-foreground">Quotes</span><span>{job.quote_count}/3</span></div>
            {(job as any).agreed_price && (
              <div className="flex justify-between"><span className="text-muted-foreground">Agreed Price</span><span className="font-semibold">£{Number((job as any).agreed_price).toFixed(2)}</span></div>
            )}
            {(job as any).scheduled_start && (
              <div className="flex justify-between"><span className="text-muted-foreground">Starts</span><span>{format(new Date((job as any).scheduled_start), "PPP 'at' h:mm a")}</span></div>
            )}
            {(job as any).scheduled_end && (
              <div className="flex justify-between"><span className="text-muted-foreground">Ends</span><span>{format(new Date((job as any).scheduled_end), "PPP 'at' h:mm a")}</span></div>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{job.description}</p>
        </CardContent>
      </Card>

      {/* Media */}
      {media.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Photos & Videos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {media.map((m, i) => {
                const url = supabase.storage.from("job-media").getPublicUrl(m.file_url).data.publicUrl;
                return m.file_type.startsWith("image") ? (
                  <button key={m.id} onClick={() => setLightboxIndex(i)} className="rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                    <img src={url} alt={m.file_name} className="w-full h-24 object-cover" />
                  </button>
                ) : (
                  <button key={m.id} onClick={() => setLightboxIndex(i)} className="relative rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all bg-muted h-24 flex items-center justify-center">
                    <video src={url} className="w-full h-24 object-cover" />
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">▶ Video</span>
                  </button>
                );
              })}
            </div>
            <MediaLightbox
              media={media.map(m => ({
                url: supabase.storage.from("job-media").getPublicUrl(m.file_url).data.publicUrl,
                type: m.file_type,
                name: m.file_name,
              }))}
              initialIndex={lightboxIndex ?? 0}
              open={lightboxIndex !== null}
              onOpenChange={(open) => { if (!open) setLightboxIndex(null); }}
            />
          </CardContent>
        </Card>
      )}

      {/* Quote section */}
      <Card>
        <CardHeader><CardTitle className="text-base">Your Quote</CardTitle></CardHeader>
        <CardContent>
          {existingQuote ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">£{Number(existingQuote.price_min).toFixed(0)} – £{Number(existingQuote.price_max).toFixed(0)}</span>
                <Badge variant={existingQuote.status === "accepted" ? "default" : existingQuote.status === "declined" ? "destructive" : "secondary"}>
                  {existingQuote.status}
                </Badge>
              </div>
              {existingQuote.message && <p className="text-sm text-muted-foreground">{existingQuote.message}</p>}
              <p className="text-xs text-muted-foreground">Submitted {new Date(existingQuote.created_at).toLocaleDateString()}</p>
              {conversationId && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/provider/messages", { state: { conversationId } })}>
                  <MessageSquare className="mr-2 h-4 w-4" /> View Messages
                </Button>
              )}
            </div>
          ) : quotesMaxed ? (
            <div className="flex items-start gap-3 text-sm">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Quote limit reached</p>
                <p className="text-muted-foreground">This job already has 3 quotes and is no longer accepting new ones.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="priceMin">Min price (£) *</Label>
                    <Input id="priceMin" type="number" value={quoteForm.priceMin} onChange={e => setQuoteForm(f => ({ ...f, priceMin: e.target.value }))} placeholder="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceMax">Max price (£) *</Label>
                    <Input id="priceMax" type="number" value={quoteForm.priceMax} onChange={e => setQuoteForm(f => ({ ...f, priceMax: e.target.value }))} placeholder="500" />
                  </div>
                </div>
                {quoteForm.priceMin && quoteForm.priceMax && parseFloat(quoteForm.priceMax) < parseFloat(quoteForm.priceMin) && (
                  <p className="text-xs text-destructive font-medium">Maximum price must be at least £{quoteForm.priceMin}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Message to customer</Label>
                <Textarea value={quoteForm.message} onChange={e => setQuoteForm(f => ({ ...f, message: e.target.value }))} maxLength={1000} rows={3} placeholder="Introduce yourself and explain your approach…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Input value={quoteForm.availability} onChange={e => setQuoteForm(f => ({ ...f, availability: e.target.value }))} placeholder="e.g. Next week" />
                </div>
                <div className="space-y-2">
                  <Label>Estimated duration</Label>
                  <Input value={quoteForm.estimatedDuration} onChange={e => setQuoteForm(f => ({ ...f, estimatedDuration: e.target.value }))} placeholder="e.g. 2 days" />
                </div>
              </div>
              <Button onClick={submitQuote} disabled={submitting} className="w-full">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="mr-2 h-4 w-4" /> Submit Quote</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Setup - shown when job is accepted but milestones not yet confirmed */}
      {existingQuote?.status === "accepted" && job.status === "accepted" && !(job as any).milestones_confirmed && job.agreed_price && (
        <MilestoneSetup
          jobId={jobId!}
          agreedPrice={Number(job.agreed_price)}
          onConfirmed={fetchAll}
        />
      )}

      {/* Work Tracker */}
      <WorkTracker jobId={jobId!} job={job} role="provider" onRefresh={fetchAll} />

      {/* Schedule - visible when provider's quote was accepted */}
      {existingQuote?.status === "accepted" && ["accepted", "in_progress"].includes(job.status) && (
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

export default ProviderJobDetail;
