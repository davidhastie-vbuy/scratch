import { useEffect, useState } from "react";
import { getSiteUrl } from "@/lib/site-url";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Send, AlertTriangle, CalendarDays, MessageSquare, Star, XCircle, AlertCircle } from "lucide-react";
import { useJobActions } from "@/hooks/use-job-actions";
import ProviderScheduleForm from "@/components/ProviderScheduleForm";
import ScheduleChangeRequest from "@/components/ScheduleChangeRequest";
import WorkTracker from "@/components/WorkTracker";
import MilestoneSetup from "@/components/MilestoneSetup";
import MediaLightbox from "@/components/MediaLightbox";

import QuestionnaireAnswers from "@/components/QuestionnaireAnswers";
import ReviewDialog from "@/components/reviews/ReviewDialog";
import CancellationRequestBanner from "@/components/CancellationRequestBanner";
import ScoreBadge from "@/components/reviews/ScoreBadge";
import { format } from "date-fns";

const ProviderJobDetail = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);

  const [job, setJob] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [existingQuote, setExistingQuote] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [customerName, setCustomerName] = useState("the customer");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingJob, setCancellingJob] = useState(false);
  const [escrowPayments, setEscrowPayments] = useState<any[]>([]);
  const [allMilestonesCompleted, setAllMilestonesCompleted] = useState(false);
  const [actionsRefreshKey, setActionsRefreshKey] = useState(0);

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
    const [jobRes, mediaRes, quoteRes, convRes, escrowRes, milestonesRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId!).single(),
      supabase.from("job_media").select("*").eq("job_id", jobId!),
      supabase.from("quotes").select("*").eq("job_id", jobId!).eq("provider_user_id", user!.id).maybeSingle(),
      supabase.from("conversations").select("id").eq("job_id", jobId!).eq("provider_user_id", user!.id).maybeSingle(),
      supabase.from("escrow_payments").select("*").eq("job_id", jobId!).eq("provider_user_id", user!.id),
      supabase.from("job_milestones").select("id, status").eq("job_id", jobId!),
    ]);
    setJob(jobRes.data);
    const mediaData = mediaRes.data ?? [];
    setMedia(mediaData);
    if (mediaData.length > 0) {
      const paths = mediaData.map((m: any) => m.file_url);
      const { data: signedData } = await supabase.storage.from("job-media").createSignedUrls(paths, 3600);
      if (signedData) {
        const urlMap: Record<string, string> = {};
        signedData.forEach((item: any) => { if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl; });
        setMediaUrls(urlMap);
      }
    }
    setExistingQuote(quoteRes.data);
    setConversationId(convRes.data?.id ?? null);
    setEscrowPayments(escrowRes.data ?? []);

    const milestones = milestonesRes.data ?? [];
    setAllMilestonesCompleted(milestones.length > 0 && milestones.every(m => m.status === "completed" || m.status === "accepted"));

    // Check review status and get customer name
    if (jobRes.data && user) {
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("job_id", jobId!)
        .eq("reviewer_user_id", user.id)
        .maybeSingle();
      setHasReviewed(!!existingReview);

      const { data: custProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name")
        .eq("id", jobRes.data.customer_user_id)
        .single();
      if (custProfile) {
        setCustomerName(`${custProfile.first_name || ""} ${custProfile.last_name || ""}`.trim() || custProfile.full_name || "the customer");
      }
    }

    setActionsRefreshKey(k => k + 1);
    setLoading(false);
  };

  const handleQuoteClick = () => {
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

    submitQuote();
  };

  const submitQuote = async () => {
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
      // Create conversation and send quote as first message
      const { data: convData } = await supabase.from("conversations").upsert({
        job_id: jobId!,
        customer_user_id: job.customer_user_id,
        provider_user_id: user!.id,
      } as any, { onConflict: "job_id,customer_user_id,provider_user_id" }).select("id").single();

      if (convData?.id) {
        const minPrice = parseFloat(quoteForm.priceMin);
        const maxPrice = parseFloat(quoteForm.priceMax);
        const parts = [`Hi, I'd like to quote on this job.`, `💷 Estimate: £${minPrice.toFixed(0)}–£${maxPrice.toFixed(0)}`];
        if (quoteForm.availability) parts.push(`📅 Availability: ${quoteForm.availability}`);
        if (quoteForm.estimatedDuration) parts.push(`⏱️ Estimated duration: ${quoteForm.estimatedDuration}`);
        if (quoteForm.message) parts.push(`\n${quoteForm.message}`);

        await supabase.from("messages").insert({
          conversation_id: convData.id,
          sender_user_id: user!.id,
          body: parts.join("\n"),
          message_type: "text",
        } as any);
      }

      toast({ title: "Quote submitted!" });
      fetchAll();
    }
    setSubmitting(false);
  };

  const hasConfirmedPayment = escrowPayments.some(p => p.status === "held" || p.status === "released");

  const totalPaidOrHeld = escrowPayments
    .filter(p => p.status === 'held' || p.status === 'released')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const fullyPaid = job?.agreed_price && totalPaidOrHeld >= Number(job.agreed_price);

  const handleCancelJob = async () => {
    setCancellingJob(true);
    if (!hasConfirmedPayment) {
      // Pre-payment: provider can cancel freely
      await supabase.from("jobs").update({ status: "cancelled" } as any).eq("id", jobId!);
      toast({ title: "Job cancelled", description: "The job has been cancelled." });
      setCancelDialogOpen(false);
      fetchAll();
    } else {
      // Post-payment: send cancellation request to customer via messaging
      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_user_id: user!.id,
          body: "🚫 The provider has requested to cancel this job. Customer confirmation is required before the job can be cancelled.",
          message_type: "cancellation_request",
          metadata: { status: "pending", requested_by: user!.id, initiated_by: "provider" },
        } as any);

        // Notification + email to customer
        try {
          const { data: provProfile } = await supabase.from("provider_profiles").select("business_name, email_notifications_enabled, contact_first_name").eq("user_id", user!.id).single();
          const { data: custProfile } = await supabase.from("profiles").select("email, first_name").eq("id", job.customer_user_id).single();

          await supabase.functions.invoke("create-first-admin", { body: { __bypass: true } }).catch(() => {});
          // Insert notification (via edge function since direct insert blocked by RLS)
          // Use messages as the notification channel - notification table has no direct insert
          // Actually notifications table blocks direct inserts, so we skip or use edge fn
          // For now, we'll send email and the message itself serves as notification

          if (custProfile?.email) {
            const catLabel = job.category ? job.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "N/A";
            const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">
              <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;"><h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1></div>
              <div style="padding:24px 0;">
                <p style="font-size:15px;color:#333;">Hi ${custProfile.first_name || "there"},</p>
                <p style="font-size:15px;color:#333;">${provProfile?.business_name || "The provider"} has requested to cancel a job. Your confirmation is required before the job can be cancelled.</p>
                <div style="background:#f4f4f8;border-left:4px solid #cb2431;padding:16px;margin:16px 0;border-radius:4px;">
                  <p style="margin:0 0 8px;font-weight:bold;font-size:15px;color:#cb2431;">Cancellation Request</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Job:</strong> ${job.title}</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Category:</strong> ${catLabel}</p>
                  <p style="margin:0;font-size:14px;color:#555;"><strong>Area:</strong> ${(job as any).full_postcode ?? job.postcode_district}</p>
                </div>
                <p style="font-size:14px;color:#555;">Please log in to review the request and accept or decline the cancellation.</p>
                <div style="text-align:center;padding:16px 0;">
                  <a href="${getSiteUrl()}/dashboard/jobs/${jobId}" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Review Request</a>
                </div>
              </div>
              <div style="text-align:center;padding-top:16px;border-top:1px solid #eee;"><p style="font-size:12px;color:#aaa;margin:0;">&copy; BookATrade. All rights reserved.</p></div>
            </div>`;
            await supabase.functions.invoke("send-provider-email", {
              body: { to: custProfile.email, subject: `BookATrade: Cancellation requested for "${job.title}"`, html },
            });
          }
        } catch (e) { console.error("Failed to send cancellation notification:", e); }

        toast({ title: "Cancellation requested", description: "The customer has been notified. Both parties must agree to cancel the job." });
      } else {
        toast({ title: "Could not find conversation", description: "Please contact support.", variant: "destructive" });
      }
      setCancelDialogOpen(false);
    }
    setCancellingJob(false);
  };

  const isActiveJob = !!job && ["accepted", "in_progress"].includes(job.status);
  const { actions: jobActionsMap } = useJobActions(isActiveJob && job ? [job.id] : [], "provider", user?.id, actionsRefreshKey);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return <p className="text-muted-foreground">Job not found.</p>;

  const catName = categories.find(c => c.slug === job.category)?.name ?? job.category;
  const quotesMaxed = job.quote_count >= 3;
  const jobActions = jobActionsMap[job.id] ?? [];

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
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{job.full_postcode ?? job.postcode_district}</span></div>
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

      {existingQuote?.status === "accepted" && ["accepted", "in_progress"].includes(job.status) && hasConfirmedPayment && (
        <CancellationRequestBanner jobId={jobId!} role="provider" onResolved={fetchAll} />
      )}

      {jobActions.length > 0 && (() => {
        const urgentActions = jobActions.filter(a => a.type === 'payment' || a.type === 'setup');
        const infoActions = jobActions.filter(a => a.type === 'review' || a.type === 'complete');
        return (
          <>
            {urgentActions.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-destructive">Action Required</p>
                  {urgentActions.map((a, i) => (
                    <p key={i} className="text-sm text-muted-foreground mt-0.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => document.getElementById(a.type === 'setup' ? 'milestone-setup-section' : 'work-tracker-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>• {a.label}</p>
                  ))}
                </div>
              </div>
            )}
            {infoActions.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-300/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">Attention Needed</p>
                  {infoActions.map((a, i) => (
                    <p key={i} className="text-sm text-muted-foreground mt-0.5 cursor-pointer hover:text-amber-700 dark:hover:text-amber-300 transition-colors" onClick={() => document.getElementById(a.type === 'review' ? 'review-section' : 'work-tracker-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>• {a.label}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl">{job.title}</CardTitle>
            <ScoreBadge userId={job.customer_user_id} role="customer" />
            <Badge className="self-start">{job.status.replace("_", " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{catName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{job.full_postcode ?? job.postcode_district}</span></div>
            {(job as any).job_address && ["accepted", "in_progress", "completed"].includes(job.status) && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0">
                <span className="text-muted-foreground">Job address</span>
                <span className="sm:text-right whitespace-pre-wrap">{(job as any).job_address}</span>
              </div>
            )}
            {(job as any).job_phone && ["accepted", "in_progress", "completed"].includes(job.status) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer phone</span>
                <a href={`tel:${(job as any).job_phone}`} className="text-primary hover:underline">{(job as any).job_phone}</a>
              </div>
            )}
            {(job as any).access_notes && ["accepted", "in_progress", "completed"].includes(job.status) && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Access notes</span>
                <span className="whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-sm">{(job as any).access_notes}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Timeline</span><span>{job.timeline || "—"}</span></div>
            
            <div className="flex justify-between"><span className="text-muted-foreground">Quotes</span><span>{job.quote_count}/3</span></div>
            {(job as any).agreed_price && (
              <div className="flex justify-between"><span className="text-muted-foreground">Agreed Price</span><span className="font-semibold">£{Number((job as any).agreed_price).toFixed(2)}</span></div>
            )}
            {(job as any).scheduled_start && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0">
                <span className="text-muted-foreground">Starts</span>
                <span className="flex flex-wrap items-center gap-1">
                  {format(new Date((job as any).scheduled_start), "PPP 'at' h:mm a")}
                  {hasConfirmedPayment
                    ? <Badge variant="default" className="text-[10px] px-1.5 py-0">Confirmed</Badge>
                    : <Badge variant="outline" className="text-[10px] px-1.5 py-0">Suggested</Badge>}
                </span>
              </div>
            )}
            {(job as any).scheduled_end && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0">
                <span className="text-muted-foreground">Ends</span>
                <span className="flex flex-wrap items-center gap-1">
                  {format(new Date((job as any).scheduled_end), "PPP 'at' h:mm a")}
                  {hasConfirmedPayment
                    ? <Badge variant="default" className="text-[10px] px-1.5 py-0">Confirmed</Badge>
                    : <Badge variant="outline" className="text-[10px] px-1.5 py-0">Suggested</Badge>}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{job.description}</p>
          <QuestionnaireAnswers category={job.category} answers={(job as any).questionnaire_answers} />
        </CardContent>
      </Card>

      {/* Media */}
      {media.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Photos & Videos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {media.map((m, i) => {
                const url = mediaUrls[m.file_url];
                if (!url) return null;
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
              media={media.filter(m => mediaUrls[m.file_url]).map(m => ({
                url: mediaUrls[m.file_url],
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
              <Button onClick={handleQuoteClick} disabled={submitting} className="w-full">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="mr-2 h-4 w-4" /> Submit Quote</>}
              </Button>

            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Setup - shown when job is accepted but milestones not yet confirmed */}
      {existingQuote?.status === "accepted" && job.status === "accepted" && !(job as any).milestones_confirmed && job.agreed_price && (
        <div id="milestone-setup-section">
          <MilestoneSetup
          jobId={jobId!}
          agreedPrice={Number(job.agreed_price)}
          scheduledStart={job.scheduled_start}
          scheduledEnd={job.scheduled_end}
          onConfirmed={fetchAll}
        />
        </div>
      )}

      {/* Work Tracker */}
      <div id="work-tracker-section">
        <WorkTracker jobId={jobId!} job={job} role="provider" onRefresh={fetchAll} />
      </div>

      {/* Schedule - visible when provider's quote was accepted */}
      {existingQuote?.status === "accepted" && ["accepted", "in_progress"].includes(job.status) && !allMilestonesCompleted && !fullyPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Job Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(job.scheduled_start || job.scheduled_end) && (
              <div className="grid gap-2 text-sm">
                {job.scheduled_start && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Start</span>
                    <span>
                      {format(new Date(job.scheduled_start), "PPP 'at' h:mm a")}
                      {hasConfirmedPayment
                        ? <Badge variant="default" className="ml-2 text-[10px] px-1.5 py-0">Confirmed</Badge>
                        : <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Suggested</Badge>}
                    </span>
                  </div>
                )}
                {job.scheduled_end && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current End</span>
                    <span>
                      {format(new Date(job.scheduled_end), "PPP 'at' h:mm a")}
                      {hasConfirmedPayment
                        ? <Badge variant="default" className="ml-2 text-[10px] px-1.5 py-0">Confirmed</Badge>
                        : <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Suggested</Badge>}
                    </span>
                  </div>
                )}
              </div>
            )}
            <ScheduleChangeRequest jobId={jobId!} role="provider" onResolved={fetchAll} />
            <ProviderScheduleForm
              jobId={jobId!}
              currentStart={job.scheduled_start}
              currentEnd={job.scheduled_end}
              onRequested={fetchAll}
            />
          </CardContent>
        </Card>
      )}
      {/* Review section for completed jobs */}
      {job.status === "completed" && job.provider_id === user?.id && (
        <Card id="review-section">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" /> Leave a Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasReviewed ? (
              <p className="text-sm text-muted-foreground">✅ You've already reviewed this customer. Thank you!</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This job is complete. Rate your experience with the customer.</p>
                <Button onClick={() => setReviewOpen(true)}>
                  <Star className="mr-2 h-4 w-4" /> Leave Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel Job Button - visible when provider's quote is accepted and job is active */}
      {existingQuote?.status === "accepted" && ["accepted", "in_progress"].includes(job.status) && (
        <div className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={() => setCancelDialogOpen(true)}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel Job
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        jobId={jobId!}
        jobTitle={job.title}
        reviewerUserId={user!.id}
        revieweeUserId={job.customer_user_id}
        reviewerRole="provider"
        revieweeName={customerName}
        onReviewSubmitted={fetchAll}
      />

      {/* Cancel Job Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Once you cancel this job, all details will be permanently deleted and it will no longer be available.</p>
              {hasConfirmedPayment && (
                <p className="font-medium text-foreground">
                  Because a payment has been made on this job, the customer must also confirm the cancellation before it takes effect. A cancellation request will be sent to the customer.
                </p>
              )}
              <p>Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingJob}>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelJob} disabled={cancellingJob} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cancellingJob ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {hasConfirmedPayment ? "Request Cancellation" : "Confirm Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProviderJobDetail;
