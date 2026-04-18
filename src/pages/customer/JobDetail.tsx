import { useEffect, useState, useRef } from "react";
import { transformAcceptedMessageForCustomer } from "@/lib/message-transform";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Pencil, Save, CalendarDays, PoundSterling, CreditCard, MessageSquare, Send, Handshake, AlertTriangle, Star, AlertCircle, Upload, X } from "lucide-react";
import { useJobActions } from "@/hooks/use-job-actions";
import QuestionnaireAnswers from "@/components/QuestionnaireAnswers";
import MilestonePaymentSection from "@/components/MilestonePaymentSection";
import NegotiateDialog from "@/components/messaging/NegotiateDialog";
import ProposalCard from "@/components/messaging/ProposalCard";
import ScheduleChangeRequest from "@/components/ScheduleChangeRequest";
import WorkTracker from "@/components/WorkTracker";
import ReviewDialog from "@/components/reviews/ReviewDialog";
import CancellationRequestBanner from "@/components/CancellationRequestBanner";
import { format } from "date-fns";

const JobDetail = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories } = useTradeCategories(true);

  const [job, setJob] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [escrowPayments, setEscrowPayments] = useState<any[]>([]);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", timeline: "", budget: "" });
  const [saving, setSaving] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

  // Negotiate dialog
  const [negotiateDialog, setNegotiateDialog] = useState<{ quoteId: string; providerUserId: string; priceMin: number; priceMax: number } | null>(null);

  // Counter-propose from chat
  const [counterDialog, setCounterDialog] = useState<{ priceMin: number; priceMax: number; defaults: any } | null>(null);
  const [chatAccepting, setChatAccepting] = useState(false);

  // Payment
  const [payingAmount, setPayingAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);


  // Review
  const [reviewOpen, setReviewOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Inline messaging
  const [chatDialog, setChatDialog] = useState<{ providerUserId: string; quoteId: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (jobId) fetchAll();
  }, [jobId]);

  // Check for payment confirmation on redirect
  useEffect(() => {
    if (searchParams.get("payment") === "success" && jobId) {
      confirmPayment();
    }
  }, [searchParams, jobId]);

  const confirmPayment = async () => {
    const { error } = await supabase.functions.invoke("confirm-escrow-payment", {
      body: { job_id: jobId },
    });
    if (!error) {
      toast({ title: "Payment confirmed!", description: "Funds are now held in escrow." });
      fetchAll();
    }
  };

  const fetchAll = async () => {
    const [jobRes, quotesRes, mediaRes, paymentsRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId!).single(),
      supabase.from("quotes").select("*").eq("job_id", jobId!).order("created_at"),
      supabase.from("job_media").select("*").eq("job_id", jobId!).order("uploaded_at"),
      supabase.from("escrow_payments").select("*").eq("job_id", jobId!).order("created_at"),
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
    const allQuotes = quotesRes.data ?? [];
    setQuotes(allQuotes);
    const mediaData = mediaRes.data ?? [];
    setMedia(mediaData);
    // Generate signed URLs for job media
    if (mediaData.length > 0) {
      const paths = mediaData.map((m: any) => m.file_url);
      const { data: signedData } = await supabase.storage.from("job-media").createSignedUrls(paths, 3600);
      if (signedData) {
        const urlMap: Record<string, string> = {};
        signedData.forEach((item: any) => { if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl; });
        setMediaUrls(urlMap);
      }
    }
    setEscrowPayments(paymentsRes.data ?? []);

    // Fetch provider names for all quotes
    const providerUserIds = [...new Set(allQuotes.map(q => q.provider_user_id))];
    if (providerUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("provider_profiles")
        .select("user_id, business_name, contact_first_name, contact_last_name")
        .in("user_id", providerUserIds);
      const nameMap: Record<string, string> = {};
      (profiles ?? []).forEach(pp => {
        nameMap[pp.user_id] = pp.business_name || `${pp.contact_first_name} ${pp.contact_last_name}`;
      });
      setProviderNames(nameMap);
    } else {
      setProviderNames({});
    }

    // Fetch accepted provider's name
    if (jobRes.data?.provider_id) {
      const existing = providerUserIds.length > 0 ? null : null; // already fetched above
      setProviderName(null); // will use providerNames map instead
    } else {
      setProviderName(null);
    }

    // Check if already reviewed
    if (user) {
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("job_id", jobId!)
        .eq("reviewer_user_id", user.id)
        .maybeSingle();
      setHasReviewed(!!existingReview);
    }

    setLoading(false);
  };

  const addEditFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const allowed = ["image/png", "image/jpeg", "video/mp4"];
    const maxSize = 10 * 1024 * 1024;
    const toAdd: File[] = [];
    for (const f of Array.from(fileList)) {
      if (!allowed.includes(f.type)) {
        toast({ title: "Invalid file type", description: `${f.name} must be PNG, JPG, or MP4`, variant: "destructive" });
        continue;
      }
      if (f.size > maxSize) {
        toast({ title: "File too large", description: `${f.name} exceeds 10MB`, variant: "destructive" });
        continue;
      }
      toAdd.push(f);
    }
    const existingCount = media.filter(m => !mediaToDelete.includes(m.id)).length;
    const combined = [...newFiles, ...toAdd].slice(0, Math.max(0, 10 - existingCount));
    setNewFiles(combined);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("jobs").update({
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        timeline: editForm.timeline || null,
        budget: editForm.budget || null,
      } as any).eq("id", jobId!);
      if (error) throw error;

      // Delete removed media
      for (const mediaId of mediaToDelete) {
        const m = media.find(item => item.id === mediaId);
        if (m) {
          await supabase.storage.from("job-media").remove([m.file_url]);
          await supabase.from("job_media").delete().eq("id", mediaId);
        }
      }

      // Upload new files
      for (const file of newFiles) {
        const path = `${user!.id}/${jobId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("job-media").upload(path, file);
        if (!upErr) {
          await supabase.from("job_media").insert({
            job_id: jobId,
            user_id: user!.id,
            file_url: path,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          } as any);
        }
      }

      toast({ title: "Job updated" });
      setEditing(false);
      setNewFiles([]);
      setMediaToDelete([]);
      fetchAll();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const openNegotiateDialog = (q: any) => {
    setNegotiateDialog({
      quoteId: q.id,
      providerUserId: q.provider_user_id,
      priceMin: Number(q.price_min),
      priceMax: Number(q.price_max),
    });
  };

  const sendNegotiation = async (data: { agreed_price: number }) => {
    if (!negotiateDialog) return;

    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", jobId!)
      .eq("customer_user_id", user!.id)
      .eq("provider_user_id", negotiateDialog.providerUserId)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created } = await supabase
        .from("conversations")
        .upsert({
          job_id: jobId!,
          customer_user_id: user!.id,
          provider_user_id: negotiateDialog.providerUserId,
        } as any, { onConflict: "job_id,customer_user_id,provider_user_id" })
        .select("id")
        .single();
      convId = created?.id;
    }

    if (!convId) {
      toast({ title: "Could not create conversation", variant: "destructive" });
      return;
    }

    // Send as a proposal message
    await supabase.from("messages").insert({
      conversation_id: convId,
      sender_user_id: user!.id,
      body: `Proposal: £${data.agreed_price.toFixed(2)}`,
      message_type: "proposal",
      metadata: {
        agreed_price: data.agreed_price,
        status: "pending",
      },
    } as any);

    toast({ title: "Proposal sent to provider", description: "The provider can accept or counter your terms." });
    setNegotiateDialog(null);
  };

  const makePayment = async () => {
    const amount = parseFloat(payingAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setProcessingPayment(true);
    const { data, error } = await supabase.functions.invoke("create-escrow-payment", {
      body: { job_id: jobId, amount },
    });
    if (error) {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
    } else if (data?.url) {
      window.open(data.url, "_blank");
    }
    setProcessingPayment(false);
  };

  // Cancel job state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingJob, setCancellingJob] = useState(false);

  const hasConfirmedPayment = escrowPayments.some(p => p.status === "held" || p.status === "released");

  const handleCancelJob = async () => {
    setCancellingJob(true);
    if (!hasConfirmedPayment) {
      // Pre-payment: customer can cancel freely
      await supabase.from("jobs").update({ status: "cancelled" } as any).eq("id", jobId!);
      toast({ title: "Job cancelled", description: "The job has been removed." });
      setCancelDialogOpen(false);
      fetchAll();
    } else {
      // Post-payment: send cancellation request to provider via messaging
      // Find conversation with accepted provider
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("job_id", jobId!)
        .eq("customer_user_id", user!.id)
        .eq("provider_user_id", job.provider_id)
        .maybeSingle();

      if (conv?.id) {
        await supabase.from("messages").insert({
          conversation_id: conv.id,
          sender_user_id: user!.id,
          body: "🚫 The customer has requested to cancel this job. Provider confirmation is required before the job can be cancelled.",
          message_type: "cancellation_request",
          metadata: { status: "pending", requested_by: user!.id },
        } as any);

        // Add notification for provider (notification insert blocked by RLS, handled via email + message)

        // Email provider about cancellation request
        try {
          const { data: providerProfile } = await supabase.from("profiles").select("email, first_name").eq("id", job.provider_id).single();
          const { data: pp } = await supabase.from("provider_profiles").select("email_notifications_enabled, contact_first_name, business_name").eq("user_id", job.provider_id).single();
          if (providerProfile?.email && pp?.email_notifications_enabled !== false) {
            const catLabel = job.category ? job.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "N/A";
            const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">
              <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;"><h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1></div>
              <div style="padding:24px 0;">
                <p style="font-size:15px;color:#333;">Hi ${pp.contact_first_name || "there"},</p>
                <p style="font-size:15px;color:#333;">The customer has requested to cancel a job you are working on. Your confirmation is required before the job can be cancelled.</p>
                <div style="background:#f4f4f8;border-left:4px solid #cb2431;padding:16px;margin:16px 0;border-radius:4px;">
                  <p style="margin:0 0 8px;font-weight:bold;font-size:15px;color:#cb2431;">Cancellation Request</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Job:</strong> ${job.title}</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Category:</strong> ${catLabel}</p>
                  <p style="margin:0;font-size:14px;color:#555;"><strong>Area:</strong> ${job.postcode_district}</p>
                </div>
                <p style="font-size:14px;color:#555;">Please log in to review the request and accept or decline the cancellation.</p>
                <div style="text-align:center;padding:16px 0;">
                  <a href="https://bookatrade.lovable.app/provider/messages" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Review Request</a>
                </div>
              </div>
              <div style="text-align:center;padding-top:16px;border-top:1px solid #eee;"><p style="font-size:12px;color:#aaa;margin:0;">&copy; BookATrade. All rights reserved.</p></div>
            </div>`;
            await supabase.functions.invoke("send-provider-email", {
              body: { to: providerProfile.email, subject: `BookATrade: Cancellation requested for "${job.title}"`, html },
            });
          }
        } catch (e) { console.error("Failed to send cancellation email:", e); }
        toast({ title: "Cancellation requested", description: "The provider has been notified. Both parties must agree to cancel the job." });
      } else {
        toast({ title: "Could not find conversation", description: "Please contact support.", variant: "destructive" });
      }
      setCancelDialogOpen(false);
    }
    setCancellingJob(false);
  };

  // --- Inline chat functions ---
  const openChat = async (providerUserId: string, quoteId: string) => {
    setChatDialog({ providerUserId, quoteId });
    setChatLoading(true);
    setChatMessages([]);
    setChatConvId(null);

    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", jobId!)
      .eq("customer_user_id", user!.id)
      .eq("provider_user_id", providerUserId)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: created } = await supabase
        .from("conversations")
        .upsert({
          job_id: jobId!,
          customer_user_id: user!.id,
          provider_user_id: providerUserId,
        } as any, { onConflict: "job_id,customer_user_id,provider_user_id" })
        .select("id")
        .single();
      convId = created?.id;
    }

    if (convId) {
      setChatConvId(convId);
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at");
      setChatMessages(msgs ?? []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setChatLoading(false);
  };

  const sendChatMsg = async () => {
    if (!chatMsg.trim() || !chatConvId) return;
    setChatSending(true);
    await supabase.from("messages").insert({
      conversation_id: chatConvId,
      sender_user_id: user!.id,
      body: chatMsg.trim(),
    } as any);
    setChatMsg("");
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", chatConvId)
      .order("created_at");
    setChatMessages(msgs ?? []);
    setChatSending(false);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Accept proposal from provider in inline chat
  const handleChatAccept = async (msg: any) => {
    if (!chatConvId) return;
    setChatAccepting(true);
    const metadata = (msg as any).metadata;
    await supabase.from("messages").update({
      metadata: { ...metadata, status: "accepted" },
    } as any).eq("id", msg.id);

    // Update job
    await supabase.from("jobs").update({
      agreed_price: metadata.agreed_price,
      provider_id: chatDialog!.providerUserId,
      status: "accepted",
      scheduled_start: metadata.start_date,
      scheduled_end: metadata.end_date || null,
    } as any).eq("id", jobId!);

    // Decline other quotes, accept this provider's
    await supabase.from("quotes").update({ status: "declined" } as any)
      .eq("job_id", jobId!)
      .neq("provider_user_id", chatDialog!.providerUserId);
    await supabase.from("quotes").update({ status: "accepted" } as any)
      .eq("job_id", jobId!)
      .eq("provider_user_id", chatDialog!.providerUserId);

    await supabase.from("messages").insert({
      conversation_id: chatConvId,
      sender_user_id: user!.id,
      body: `✅ Terms accepted in principle! Price: £${Number(metadata.agreed_price).toFixed(2)}.\n\n⏳ Next steps:\n1. Please set up payment milestones for this job.\n2. Once the customer pays the first milestone deposit, you can start work based on the agreed schedule.\n\n💡 The job is fully confirmed once the customer makes the first milestone payment.`,
      message_type: "system",
    } as any);

    toast({ title: "Terms accepted in principle!", description: "The provider will now set up milestone payments." });
    setChatAccepting(false);
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", chatConvId).order("created_at");
    setChatMessages(msgs ?? []);
    fetchAll();
  };

  const handleChatDecline = async (msg: any) => {
    if (!chatConvId) return;
    await supabase.from("messages").update({
      metadata: { ...(msg as any).metadata, status: "declined" },
    } as any).eq("id", msg.id);
    await supabase.from("messages").insert({
      conversation_id: chatConvId,
      sender_user_id: user!.id,
      body: "Proposal declined.",
      message_type: "system",
    } as any);
    toast({ title: "Proposal declined" });
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", chatConvId).order("created_at");
    setChatMessages(msgs ?? []);
  };

  const handleChatCounter = (msg: any) => {
    const meta = (msg as any).metadata;
    // Find the quote to get price range
    const quote = quotes.find(q => q.provider_user_id === chatDialog?.providerUserId);
    setCounterDialog({
      priceMin: quote ? Number(quote.price_min) : 1,
      priceMax: quote ? Number(quote.price_max) : 999999,
      defaults: {
        agreed_price: meta.agreed_price,
        start_date: meta.start_date,
        start_time: meta.start_time,
        duration: meta.duration,
      },
    });
  };

  const sendCounterProposal = async (data: { agreed_price: number }) => {
    if (!chatConvId) return;
    // Decline existing pending proposals
    for (const m of chatMessages) {
      if ((m as any).message_type === "proposal" && (m as any).metadata?.status === "pending") {
        await supabase.from("messages").update({
          metadata: { ...(m as any).metadata, status: "declined" },
        } as any).eq("id", m.id);
      }
    }
    await supabase.from("messages").insert({
      conversation_id: chatConvId,
      sender_user_id: user!.id,
      body: `Counter-proposal: £${data.agreed_price.toFixed(2)}`,
      message_type: "proposal",
      metadata: { agreed_price: data.agreed_price, status: "pending" },
    } as any);
    toast({ title: "Counter-proposal sent" });
    setCounterDialog(null);
    const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", chatConvId).order("created_at");
    setChatMessages(msgs ?? []);
  };

  // Realtime for chat dialog
  useEffect(() => {
    if (!chatConvId) return;
    const channel = supabase
      .channel(`chat-inline-${chatConvId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${chatConvId}` }, async () => {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", chatConvId)
          .order("created_at");
        setChatMessages(msgs ?? []);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatConvId]);

  const isActiveJob = !!job && ["accepted", "in_progress"].includes(job.status);
  const { actions: jobActionsMap } = useJobActions(isActiveJob && job ? [job.id] : [], "customer", user?.id);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return <p className="text-muted-foreground">Job not found.</p>;

  const catName = categories.find(c => c.slug === job.category)?.name ?? job.category;
  const totalHeld = escrowPayments.filter(p => p.status === "held").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = escrowPayments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const jobActions = jobActionsMap[job.id] ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/jobs")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>

      {["accepted", "in_progress"].includes(job.status) && hasConfirmedPayment && (
        <CancellationRequestBanner jobId={jobId!} role="customer" onResolved={fetchAll} />
      )}

      {jobActions.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-destructive">Action Required</p>
            {jobActions.map((a, i) => (
              <p key={i} className="text-sm text-muted-foreground mt-0.5">• {a.label}</p>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl">{job.title}</CardTitle>
            <Badge className="self-start">{job.status.replace("_", " ")}</Badge>
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
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Input value={editForm.timeline} onChange={e => setEditForm(f => ({ ...f, timeline: e.target.value }))} />
              </div>
              {/* Media editing section */}
              <div className="space-y-2">
                <Label>Photos & Videos <span className="text-muted-foreground text-xs">(PNG, JPG, MP4 — max 10MB each, up to 10 files)</span></Label>
                {/* Existing media */}
                {media.filter(m => !mediaToDelete.includes(m.id)).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {media.filter(m => !mediaToDelete.includes(m.id)).map(m => {
                      const url = mediaUrls[m.file_url];
                      if (!url) return null;
                      return (
                        <div key={m.id} className="relative group rounded-lg border overflow-hidden bg-muted/30 aspect-square">
                          {m.file_type.startsWith("image") ? (
                            <img src={url} alt={m.file_name} className="h-full w-full object-cover" />
                          ) : (
                            <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaToDelete(prev => [...prev, m.id])}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* New files preview */}
                {newFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {newFiles.map((f, i) => (
                      <div key={i} className="relative group rounded-lg border overflow-hidden bg-muted/30 aspect-square border-dashed border-primary/40">
                        {f.type.startsWith("video") ? (
                          <video src={URL.createObjectURL(f)} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                        ) : (
                          <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setNewFiles(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-0.5">
                          <p className="text-[10px] text-white truncate">New</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Upload button */}
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById("edit-file-input")?.click()}
                >
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">Click to add photos or videos</p>
                  <input id="edit-file-input" type="file" multiple accept="image/png,image/jpeg,video/mp4" className="hidden" onChange={e => addEditFiles(e.target.files)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {media.filter(m => !mediaToDelete.includes(m.id)).length + newFiles.length}/10 files
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setNewFiles([]); setMediaToDelete([]); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{catName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{job.full_postcode ?? job.postcode_district}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Timeline</span><span>{job.timeline || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span>{job.budget || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Quotes</span><span>{job.quote_count}/3</span></div>
                {job.agreed_price && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Agreed Price</span><span className="font-semibold">£{Number(job.agreed_price).toFixed(2)}</span></div>
                )}
                {job.scheduled_start && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0">
                    <span className="text-muted-foreground">Starts</span>
                    <span className="flex flex-wrap items-center gap-1">
                      {format(new Date(job.scheduled_start), "dd/MM/yyyy 'at' h:mm a")}
                      {hasConfirmedPayment
                        ? <Badge variant="default" className="text-[10px] px-1.5 py-0">Confirmed</Badge>
                        : <Badge variant="outline" className="text-[10px] px-1.5 py-0">Suggested</Badge>}
                    </span>
                  </div>
                )}
                {job.scheduled_end && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0">
                    <span className="text-muted-foreground">Ends</span>
                    <span className="flex flex-wrap items-center gap-1">
                      {format(new Date(job.scheduled_end), "dd/MM/yyyy 'at' h:mm a")}
                      {hasConfirmedPayment
                        ? <Badge variant="default" className="text-[10px] px-1.5 py-0">Confirmed</Badge>
                        : <Badge variant="outline" className="text-[10px] px-1.5 py-0">Suggested</Badge>}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{job.description}</p>
              <QuestionnaireAnswers category={job.category} answers={(job as any).questionnaire_answers} />
              <div className="flex gap-2">
                {job.status === "open" && job.quote_count === 0 && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                )}
                {job.status !== "cancelled" && job.status !== "completed" && (
                  <Button variant="destructive" size="sm" onClick={() => setCancelDialogOpen(true)}>Cancel Job</Button>
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
                const url = mediaUrls[m.file_url];
                if (!url) return null;
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
        <CardHeader><CardTitle className="text-base">
          {job.status === "accepted" || job.status === "in_progress" || job.status === "completed"
            ? "Accepted Provider"
            : `Quotes (${quotes.length}/3)`}
        </CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quotes received yet.</p>
          ) : (
            (() => {
              const jobAwarded = ["accepted", "in_progress", "completed"].includes(job.status);
              const visibleQuotes = jobAwarded ? quotes.filter(q => q.status === "accepted") : quotes;
              return visibleQuotes.map(q => (
                <div key={q.id} className="rounded-lg border p-4 space-y-2">
                  {providerNames[q.provider_user_id] && (
                    <p className="text-sm font-medium">{providerNames[q.provider_user_id]}</p>
                  )}
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
                  <div className="flex gap-2 items-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/providers/${q.provider_user_id}`)}>
                      View Provider
                    </Button>
                    {(!jobAwarded || q.status === "accepted") && (
                      <Button size="sm" onClick={() => navigate("/dashboard/messages", { state: { selectConversation: { jobId: jobId!, providerUserId: q.provider_user_id } } })}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Discuss Job
                      </Button>
                    )}
                  </div>
                </div>
              ));
            })()
          )}
        </CardContent>
      </Card>

      {/* Pending milestone setup notice */}
      {job.status === "accepted" && !(job as any).milestones_confirmed && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3 text-sm">
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Awaiting milestone setup</p>
                <p className="text-muted-foreground">Your provider is setting up the milestones and payment schedule. Once ready, you'll need to pay the first milestone deposit to fully confirm the job.</p>
                <p className="text-muted-foreground mt-1">If you don't make payment before the scheduled start date, the job will be reopened for other providers to quote on.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Section - visible when milestones are confirmed */}
      {["accepted", "in_progress"].includes(job.status) && job.agreed_price && (job as any).milestones_confirmed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show info banner for accepted jobs without any payments yet */}
            {job.status === "accepted" && escrowPayments.filter(p => p.status === "held" || p.status === "released").length === 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm space-y-1">
                <p className="font-medium flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" /> Payment required to confirm job
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Pay the first milestone deposit below to fully confirm this job. If payment isn't made before the scheduled start date, the job will be reopened for other providers.
                </p>
              </div>
            )}

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Agreed Price</span><span className="font-semibold">£{Number(job.agreed_price).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Held in Escrow</span><span>£{totalHeld.toFixed(2)}</span></div>
              {totalPending > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Pending Confirmation</span><span>£{totalPending.toFixed(2)}</span></div>
              )}
            </div>

            {/* Payment history */}
            {escrowPayments.length > 0 && (
              <div className="space-y-1">
                {escrowPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs rounded border p-2">
                    <span>£{Number(p.amount).toFixed(2)}</span>
                    <Badge variant={p.status === "held" ? "secondary" : p.status === "released" ? "default" : "outline"} className="text-xs">
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Make payment for next milestone */}
            <MilestonePaymentSection jobId={jobId!} agreedPrice={Number(job.agreed_price)} escrowPayments={escrowPayments} onPaymentComplete={fetchAll} />

          </CardContent>
        </Card>
      )}

      {/* Work Tracker */}
      <WorkTracker jobId={jobId!} job={job} role="customer" onRefresh={fetchAll} />

      {/* Review section for completed jobs */}
      {job.status === "completed" && job.provider_id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" /> Leave a Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasReviewed ? (
              <p className="text-sm text-muted-foreground">✅ You've already reviewed this job. Thank you!</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This job is complete. Rate your experience with the provider.</p>
                <Button onClick={() => setReviewOpen(true)}>
                  <Star className="mr-2 h-4 w-4" /> Leave Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      {job.provider_id && (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          jobId={jobId!}
          jobTitle={job.title}
          reviewerUserId={user!.id}
          revieweeUserId={job.provider_id}
          reviewerRole="customer"
          revieweeName={providerNames[job.provider_id] || "the provider"}
          onReviewSubmitted={fetchAll}
        />
      )}
      {/* Schedule - read only for customer */}
      {["accepted", "in_progress"].includes(job.status) && (job.scheduled_start || job.scheduled_end) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Job Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              {job.scheduled_start && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starts</span>
                  <span>{format(new Date(job.scheduled_start), "dd/MM/yyyy 'at' h:mm a")}</span>
                </div>
              )}
              {job.scheduled_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ends</span>
                  <span>{format(new Date(job.scheduled_end), "dd/MM/yyyy 'at' h:mm a")}</span>
                </div>
              )}
            </div>
            <ScheduleChangeRequest jobId={jobId!} role="customer" onResolved={fetchAll} />
          </CardContent>
        </Card>
      )}

      {/* Negotiate Dialog */}
      {negotiateDialog && (
        <NegotiateDialog
          open={!!negotiateDialog}
          onClose={() => setNegotiateDialog(null)}
          priceMin={negotiateDialog.priceMin}
          priceMax={negotiateDialog.priceMax}
          onSubmit={sendNegotiation}
        />
      )}

      {/* Message Provider Chat Dialog */}
      <Dialog open={!!chatDialog} onOpenChange={(o) => !o && setChatDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Message Provider
            </DialogTitle>
          </DialogHeader>
          {chatLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 min-h-[200px] max-h-[400px] py-2">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet. Start the conversation to discuss job details with the provider.
                  </p>
                )}
                {chatMessages.map(m => {
                  const isOwn = m.sender_user_id === user!.id;
                  if ((m as any).message_type === "proposal") {
                    return (
                      <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <ProposalCard
                          proposal={(m as any).metadata}
                          isOwnMessage={isOwn}
                          role="customer"
                          onAccept={() => handleChatAccept(m)}
                          onDecline={() => handleChatDecline(m)}
                          onCounter={() => handleChatCounter(m)}
                          accepting={chatAccepting}
                        />
                      </div>
                    );
                  }
                  if ((m as any).message_type === "admin" || ((m as any).message_type === "system" && typeof m.body === "string" && m.body.startsWith("⚖️"))) {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 break-words overflow-hidden">
                          <p className="font-semibold text-xs text-blue-600 dark:text-blue-400 mb-1">Admin – Dispute Update</p>
                          <p>{m.body.replace(/^⚖️\s*Admin\s*\(Dispute\):\s*/, "")}</p>
                          <p className="text-[10px] mt-1 text-blue-500 dark:text-blue-400">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if ((m as any).message_type === "system") {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="bg-muted/50 rounded-lg px-4 py-2 text-xs text-muted-foreground text-center max-w-[80%]">
                          {transformAcceptedMessageForCustomer(m.body)}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm break-words overflow-hidden ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p>{m.body}</p>
                        <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  placeholder="Type a message…"
                  onKeyDown={e => e.key === "Enter" && sendChatMsg()}
                />
                <Button size="icon" onClick={sendChatMsg} disabled={chatSending || !chatMsg.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Counter-propose dialog from inline chat */}
      {counterDialog && (
        <NegotiateDialog
          open={!!counterDialog}
          onClose={() => setCounterDialog(null)}
          priceMin={counterDialog.priceMin}
          priceMax={counterDialog.priceMax}
          onSubmit={sendCounterProposal}
        />
      )}

      {/* Cancel Job Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Once you cancel this job, all details will be permanently deleted and it will no longer be available.</p>
              {hasConfirmedPayment && (
                <p className="font-medium text-foreground">
                  Because a payment has been made on this job, the provider must also confirm the cancellation before it takes effect. A cancellation request will be sent to the provider.
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

export default JobDetail;
