import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2, Circle, Flag, Plus, Send, Loader2, AlertTriangle, MessageSquareWarning,
  ChevronDown, ChevronUp, PoundSterling, Pencil, Trash2, X, Check, ShieldAlert, Clock,
  Paperclip, Film,
} from "lucide-react";
import { format } from "date-fns";

interface WorkTrackerProps {
  jobId: string;
  job: any;
  role: "customer" | "provider";
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  completed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  flagged: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const WorkTracker = ({ jobId, job, role, onRefresh }: WorkTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [milestones, setMilestones] = useState<any[]>([]);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [escrowPayments, setEscrowPayments] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New milestone form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [adding, setAdding] = useState(false);

  // Editing milestones (change request mode)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Comment/action forms
  const [actionComment, setActionComment] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  // Dispute
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [raisingDispute, setRaisingDispute] = useState(false);

  // Cancel confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Escalate to admin
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalating, setEscalating] = useState(false);

  // Dispute/escalation file uploads
  const [disputeFiles, setDisputeFiles] = useState<{ file: File; preview: string; isVideo: boolean }[]>([]);
  const [escalateFiles, setEscalateFiles] = useState<{ file: File; preview: string; isVideo: boolean }[]>([]);
  const disputeFileRef = useRef<HTMLInputElement>(null);
  const escalateFileRef = useRef<HTMLInputElement>(null);

  const DISPUTE_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];
  const MAX_DISPUTE_FILE_SIZE = 5 * 1024 * 1024;

  const handleDisputeFiles = (e: React.ChangeEvent<HTMLInputElement>, target: "dispute" | "escalate") => {
    const files = Array.from(e.target.files || []);
    const setter = target === "dispute" ? setDisputeFiles : setEscalateFiles;
    for (const file of files) {
      if (!DISPUTE_ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: "Unsupported file type", description: "Only images and videos are allowed.", variant: "destructive" });
        continue;
      }
      if (file.size > MAX_DISPUTE_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds the 5MB limit.`, variant: "destructive" });
        continue;
      }
      const isVideo = file.type.startsWith("video/");
      const preview = URL.createObjectURL(file);
      setter(prev => [...prev, { file, preview, isVideo }]);
    }
    e.target.value = "";
  };

  const removeDisputeFile = (idx: number, target: "dispute" | "escalate") => {
    const setter = target === "dispute" ? setDisputeFiles : setEscalateFiles;
    setter(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadDisputeAttachments = async (disputeId: string, files: { file: File; preview: string; isVideo: boolean }[]) => {
    for (const sf of files) {
      const ext = sf.file.name.split(".").pop() || "bin";
      const storagePath = `${user!.id}/${disputeId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("dispute-attachments")
        .upload(storagePath, sf.file, { contentType: sf.file.type });
      if (uploadErr) {
        console.error("Dispute attachment upload error:", uploadErr);
        continue;
      }
      await supabase.from("dispute_attachments").insert({
        dispute_id: disputeId,
        user_id: user!.id,
        file_url: storagePath,
        file_name: sf.file.name,
        file_type: sf.file.type,
        file_size: sf.file.size,
      } as any);
      URL.revokeObjectURL(sf.preview);
    }
  };

  // Change request review
  const [reviewingCR, setReviewingCR] = useState<string | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, [jobId]);

  const fetchMilestones = async () => {
    const [msRes, paymentsRes, crRes] = await Promise.all([
      supabase
        .from("job_milestones")
        .select("*")
        .eq("job_id", jobId)
        .order("sort_order"),
      supabase
        .from("escrow_payments")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at"),
      supabase
        .from("milestone_change_requests")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at"),
    ]);

    const ms = msRes.data ?? [];
    setMilestones(ms);
    setEscrowPayments(paymentsRes.data ?? []);
    setChangeRequests(crRes.data ?? []);

    // Fetch comments for all milestones
    if (ms.length > 0) {
      const ids = ms.map((m: any) => m.id);
      const { data: cmts } = await supabase
        .from("milestone_comments")
        .select("*")
        .in("milestone_id", ids)
        .order("created_at");
      const grouped: Record<string, any[]> = {};
      (cmts ?? []).forEach((c: any) => {
        if (!grouped[c.milestone_id]) grouped[c.milestone_id] = [];
        grouped[c.milestone_id].push(c);
      });
      setComments(grouped);
    }
    setLoading(false);
  };

  const addMilestone = async () => {
    if (!newTitle.trim()) return;

    const agreedPrice = Number(job.agreed_price ?? 0);
    const currentlyAllocated = milestones.reduce((sum, milestone) => sum + (Number(milestone.payment_amount) || 0), 0);
    const remainingBudget = Math.round((agreedPrice - currentlyAllocated) * 100) / 100;
    const parsedAmount = newAmount ? parseFloat(newAmount) : null;

    if (agreedPrice > 0 && remainingBudget <= 0.01) {
      toast({
        title: "No payment amount remaining",
        description: "Deposit, milestones, and final payment already equal the agreed price for this job.",
        variant: "destructive",
      });
      return;
    }

    if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      toast({ title: "Enter a valid amount", description: "Milestone payments must be greater than £0.00.", variant: "destructive" });
      return;
    }

    if (parsedAmount !== null && agreedPrice > 0 && parsedAmount > remainingBudget) {
      toast({ title: "Milestone exceeds agreed price", description: `You only have £${remainingBudget.toFixed(2)} left to allocate.`, variant: "destructive" });
      return;
    }

    setAdding(true);
    const maxOrder = milestones
      .filter((m) => !m.is_auto || m.title !== "Work Complete")
      .reduce((max, m) => Math.max(max, m.sort_order), 0);
    const { error } = await supabase.from("job_milestones").insert({
      job_id: jobId,
      title: newTitle.trim(),
      sort_order: maxOrder + 1,
      created_by: user!.id,
      payment_amount: parsedAmount,
    } as any);
    if (error) {
      toast({ title: "Failed to add milestone", description: error.message, variant: "destructive" });
    } else {
      setNewTitle("");
      setNewAmount("");
      setShowAdd(false);
      fetchMilestones();
    }
    setAdding(false);
  };

  const performAction = async (milestoneId: string, action: "complete" | "accept" | "flag" | "reconfirm") => {
    const comment = actionComment[milestoneId] || "";
    if (action === "flag" && !comment.trim()) {
      toast({ title: "Comment required", description: "Please explain your query about this milestone.", variant: "destructive" });
      return;
    }
    setActing(milestoneId);

    await supabase.from("milestone_comments").insert({
      milestone_id: milestoneId,
      user_id: user!.id,
      body: comment || null,
      action,
    } as any);

    const milestone = milestones.find((m) => m.id === milestoneId);
    let newStatus: string;
    let flagCount = milestone?.flag_count ?? 0;

    if (action === "complete" || action === "reconfirm") {
      newStatus = "completed";
    } else if (action === "accept") {
      newStatus = "accepted";
    } else {
      newStatus = "flagged";
      flagCount += 1;
    }

    const { error: updateError } = await supabase.from("job_milestones").update({
      status: newStatus,
      flag_count: flagCount,
      completed_at: (action === "complete" || action === "reconfirm") ? new Date().toISOString() : milestone?.completed_at,
    } as any).eq("id", milestoneId);

    if (updateError) {
      toast({ title: "Failed to update milestone", description: updateError.message, variant: "destructive" });
      setActing(null);
      await fetchMilestones();
      return;
    }

    // Notify customer when provider marks milestone as complete
    if ((action === "complete" || action === "reconfirm") && role === "provider") {
      try {
        await supabase.functions.invoke("notify-milestone-complete", {
          body: { job_id: jobId, milestone_id: milestoneId },
        });
      } catch (e) {
        console.error("Milestone notification failed:", e);
      }
    }

    if (action === "accept" && role === "customer") {
      try {
        const { error } = await supabase.functions.invoke("release-escrow-payment", {
          body: { milestone_id: milestoneId, job_id: jobId },
        });
        if (error) {
          console.error("Payment release error:", error);
        } else {
          toast({ title: "Payment released to provider" });
        }
      } catch (e) {
        console.error("Payment release failed:", e);
      }

      // Check if ALL milestones are now accepted → mark job as completed
      const updatedMilestones = milestones.map((m) =>
        m.id === milestoneId ? { ...m, status: "accepted" } : m
      );
      const allAccepted = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.status === "accepted");
      if (allAccepted) {
        await supabase.from("jobs").update({ status: "completed" } as any).eq("id", jobId);
        toast({ title: "Job completed! 🎉", description: "All milestones have been accepted. You can now leave a review." });
        onRefresh?.();
      }
    }

    setActionComment((prev) => ({ ...prev, [milestoneId]: "" }));
    await fetchMilestones();
    setActing(null);
  };

  const raiseDispute = async () => {
    if (!disputeReason.trim()) return;
    setRaisingDispute(true);
    const { data, error } = await supabase.from("job_disputes").insert({
      job_id: jobId,
      raised_by: user!.id,
      reason: disputeReason.trim(),
    } as any).select("id").single();
    if (error) {
      toast({ title: "Failed to raise dispute", description: error.message, variant: "destructive" });
    } else {
      if (data && disputeFiles.length > 0) {
        await uploadDisputeAttachments(data.id, disputeFiles);
      }
      toast({ title: "Dispute raised", description: "An admin will review your case." });
      setShowDispute(false);
      setDisputeReason("");
      setDisputeFiles([]);
    }
    setRaisingDispute(false);
  };

  const canProviderCancel = role === "provider" && milestones.some((m) => m.flag_count >= 5);
  const hasFlaggedMilestone = milestones.some((m) => m.status === "flagged" || m.flag_count > 0);

  const cancelJobDueToFlags = async () => {
    setCancelling(true);
    await supabase.from("jobs").update({ status: "cancelled" } as any).eq("id", jobId);
    toast({ title: "Job cancelled", description: "All escrow funds will be returned to the customer." });
    setShowCancelConfirm(false);
    setCancelling(false);
    onRefresh?.();
  };

  const escalateToAdmin = async () => {
    if (!escalateReason.trim()) {
      toast({ title: "Reason required", description: "Please explain why you're escalating.", variant: "destructive" });
      return;
    }
    setEscalating(true);
    const { data, error } = await supabase.from("job_disputes").insert({
      job_id: jobId,
      raised_by: user!.id,
      reason: `[Escalated after milestone flags] ${escalateReason.trim()}`,
    } as any).select("id").single();
    if (error) {
      toast({ title: "Failed to escalate", description: error.message, variant: "destructive" });
    } else {
      if (data && escalateFiles.length > 0) {
        await uploadDisputeAttachments(data.id, escalateFiles);
      }
      toast({ title: "Escalated to admin", description: "An admin will review the job, milestones, and all communications." });
      setShowEscalate(false);
      setEscalateReason("");
      setEscalateFiles([]);
    }
    setEscalating(false);
  };

  // Payment helpers
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const getPaymentForMilestone = (milestoneId: string) => {
    return escrowPayments.find((p) => p.milestone_id === milestoneId);
  };

  const getPaymentStatus = (milestoneId: string): "unpaid" | "pending" | "complete" | "failed" => {
    const payments = escrowPayments.filter((p) => p.milestone_id === milestoneId);
    if (payments.length === 0) return "unpaid";
    if (payments.some((p) => p.status === "held" || p.status === "released")) return "complete";
    if (payments.some((p) => p.status === "failed")) return "failed";
    if (payments.some((p) => p.status === "pending")) return "pending";
    return "unpaid";
  };

  const payMilestone = async (milestoneId: string, amount: number) => {
    setProcessingPayment(milestoneId);
    const { data, error } = await supabase.functions.invoke("create-escrow-payment", {
      body: { job_id: jobId, amount, milestone_id: milestoneId },
    });
    if (error) {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
    } else if (data?.url) {
      window.location.href = data.url;
    }
    setProcessingPayment(null);
  };

  const confirmPendingPayment = async () => {
    const { data, error } = await supabase.functions.invoke("confirm-escrow-payment", {
      body: { job_id: jobId },
    });
    if (!error && data?.confirmed > 0) {
      toast({ title: "Payment confirmed!" });
      fetchMilestones();
      onRefresh?.();
    } else if (!error && data?.expired > 0) {
      toast({ title: "Payment not completed", description: "The checkout session expired. Please try paying again." });
      fetchMilestones();
    } else if (!error) {
      toast({ title: "Still processing", description: "Payment not yet confirmed. Please try again shortly." });
    } else {
      toast({ title: "Not yet confirmed", description: "Please try again shortly.", variant: "destructive" });
    }
  };

  // ---- Milestone edit logic ----
  const agreedPrice = Number(job.agreed_price ?? 0);
  const totalMilestoneAmounts = milestones.reduce((sum, m) => sum + (Number(m.payment_amount) || 0), 0);
  const remainingMilestoneBudget = agreedPrice > 0
    ? Math.max(0, Math.round((agreedPrice - totalMilestoneAmounts) * 100) / 100)
    : 0;
  const milestoneBudgetFullyAllocated = agreedPrice > 0 && totalMilestoneAmounts >= agreedPrice - 0.01;

  // Has the deposit (first milestone) been paid?
  const depositMilestone = milestones.find((m) => m.sort_order === 0);
  const depositPaid = depositMilestone
    ? escrowPayments.some((p) => p.milestone_id === depositMilestone.id && (p.status === "held" || p.status === "released"))
    : false;

  // Has ANY milestone payment been confirmed?
  const hasAnyConfirmedPayment = escrowPayments.some(
    (p) => p.status === "held" || p.status === "released"
  );

  // Determine if a specific milestone has been paid
  const isMilestonePaid = (milestoneId: string) => {
    return escrowPayments.some((p) => p.milestone_id === milestoneId && (p.status === "held" || p.status === "released"));
  };

  // Provider can propose changes to unpaid milestones ONLY after deposit is paid
  const canProposeChanges = role === "provider" && depositPaid;

  // Get pending change request for a milestone
  const getPendingCR = (milestoneId: string) => {
    return changeRequests.find((cr) => cr.milestone_id === milestoneId && cr.status === "pending");
  };

  // Provider: start proposing a change (uses the edit form but submits as change request)
  const startEditMilestone = (m: any) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditAmount(m.payment_amount ? String(m.payment_amount) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
  };

  // Submit a change request (not a direct edit)
  const submitChangeRequest = async (milestoneId: string) => {
    if (!editTitle.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    const parsedAmount = editAmount ? parseFloat(editAmount) : null;
    if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    // Budget validation
    if (parsedAmount !== null && agreedPrice > 0) {
      const otherTotal = milestones
        .filter((m) => m.id !== milestoneId)
        .reduce((sum, m) => sum + (Number(m.payment_amount) || 0), 0);
      if (otherTotal + parsedAmount > agreedPrice + 0.01) {
        toast({
          title: "Exceeds agreed price",
          description: `Only £${Math.max(0, agreedPrice - otherTotal).toFixed(2)} available.`,
          variant: "destructive",
        });
        return;
      }
    }
    setSavingEdit(true);
    const { error } = await supabase.from("milestone_change_requests").insert({
      milestone_id: milestoneId,
      job_id: jobId,
      requested_by: user!.id,
      proposed_title: editTitle.trim(),
      proposed_amount: parsedAmount,
    } as any);
    if (error) {
      toast({ title: "Failed to submit change request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Change request submitted", description: "The customer will need to approve this change." });
      cancelEdit();
      fetchMilestones();
    }
    setSavingEdit(false);
  };

  // Customer approves a change request
  const approveChangeRequest = async (cr: any) => {
    setReviewingCR(cr.id);
    // Apply the changes to the milestone
    const { error: updateError } = await supabase.from("job_milestones").update({
      title: cr.proposed_title,
      payment_amount: cr.proposed_amount,
    } as any).eq("id", cr.milestone_id);
    if (updateError) {
      toast({ title: "Failed to apply changes", description: updateError.message, variant: "destructive" });
      setReviewingCR(null);
      return;
    }
    // Mark change request as approved
    await supabase.from("milestone_change_requests").update({
      status: "approved",
      resolved_at: new Date().toISOString(),
    } as any).eq("id", cr.id);
    toast({ title: "Change approved", description: "The milestone has been updated." });
    setReviewingCR(null);
    fetchMilestones();
  };

  // Customer rejects a change request
  const rejectChangeRequest = async (cr: any) => {
    setReviewingCR(cr.id);
    await supabase.from("milestone_change_requests").update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
    } as any).eq("id", cr.id);
    toast({ title: "Change rejected", description: "The milestone remains unchanged." });
    setReviewingCR(null);
    fetchMilestones();
  };

  const deleteMilestone = async (milestoneId: string) => {
    setDeletingId(milestoneId);
    const { error } = await supabase
      .from("job_milestones")
      .delete()
      .eq("id", milestoneId);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Milestone deleted" });
      fetchMilestones();
    }
    setDeletingId(null);
  };

  const totalPaid = escrowPayments
    .filter((p) => p.status === "held" || p.status === "released")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalReleased = escrowPayments
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + p.provider_payout, 0);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const showForProvider = role === "provider" && milestones.length > 0;
  const showTracker = ["in_progress"].includes(job.status) || (job.status === "accepted" && job.milestones_confirmed) || showForProvider;
  if (!showTracker) return null;

  // Pending change requests for customer banner
  const pendingCRs = changeRequests.filter((cr) => cr.status === "pending");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Work Tracker
          </CardTitle>
          <div className="flex gap-2">
            {role === "provider" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdd(!showAdd)}
                disabled={milestoneBudgetFullyAllocated || !depositPaid}
              >
                <Plus className="mr-1 h-3 w-3" /> Add Milestone
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowDispute(!showDispute)}>
              <MessageSquareWarning className="mr-1 h-3 w-3" /> Raise Dispute
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment summary */}
        {job.agreed_price && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Agreed Price</span><span className="font-semibold">£{Number(job.agreed_price).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total in Escrow</span><span>£{totalPaid.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Released to Provider</span><span>£{totalReleased.toFixed(2)}</span></div>
          </div>
        )}

        {role === "provider" && !depositPaid && hasAnyConfirmedPayment === false && (
          <p className="text-xs text-muted-foreground">
            Milestones are locked until the customer pays the deposit. No changes can be made until then.
          </p>
        )}

        {role === "provider" && !depositPaid && milestones.length > 0 && !hasAnyConfirmedPayment && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">
              ⏳ Waiting for the customer to pay the deposit before milestones can be edited.
            </p>
          </div>
        )}

        {/* Pending change requests banner for customer */}
        {role === "customer" && pendingCRs.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-medium">
                {pendingCRs.length} milestone change {pendingCRs.length === 1 ? "request" : "requests"} awaiting your approval
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              The provider has proposed changes to milestones below. Expand the relevant milestone to review.
            </p>
          </div>
        )}

        {role === "provider" && !depositPaid && milestoneBudgetFullyAllocated && (
          <p className="text-xs text-muted-foreground">
            Deposit, milestones, and final payment already equal the agreed price, so no more paid milestones can be added.
          </p>
        )}

        {/* Add milestone form - only after deposit is paid */}
        {showAdd && role === "provider" && !milestoneBudgetFullyAllocated && depositPaid && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Milestone title…"
                className="flex-1"
              />
              <div className="w-32">
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") { setNewAmount(""); return; }
                    const parsedValue = parseFloat(value);
                    if (Number.isNaN(parsedValue)) { setNewAmount(value); return; }
                    if (agreedPrice > 0) {
                      setNewAmount(String(Math.min(parsedValue, remainingMilestoneBudget)));
                      return;
                    }
                    setNewAmount(value);
                  }}
                  placeholder="£ Amount"
                />
              </div>
              <Button size="sm" onClick={addMilestone} disabled={adding || milestoneBudgetFullyAllocated}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Set the payment amount due at this milestone. The customer must have paid this before work can continue.
              {agreedPrice > 0 && ` £${remainingMilestoneBudget.toFixed(2)} remains available to allocate.`}
            </p>
          </div>
        )}

        {/* Dispute form */}
        {showDispute && (
          <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
            <p className="text-sm font-medium text-destructive">Raise a Dispute</p>
            <p className="text-xs text-muted-foreground">Admin will be sent full details of this job, all communications, and contact details for both parties.</p>
            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue…"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={raiseDispute} disabled={raisingDispute}>
                {raisingDispute ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                Submit Dispute
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDispute(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Escalate to admin - available to both parties as soon as any milestone is queried */}
        {hasFlaggedMilestone && !canProviderCancel && (
          <div className="rounded-lg border border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/30 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">A milestone query is unresolved</p>
                <p className="text-xs text-muted-foreground">If you're unable to resolve this between yourselves, you can escalate to an admin for review.</p>
              </div>
            </div>
            <div className="pl-6">
              <Button size="sm" variant="outline" onClick={() => setShowEscalate(!showEscalate)}>
                <ShieldAlert className="mr-1 h-3 w-3" /> Escalate to Admin
              </Button>
            </div>
            {showEscalate && (
              <div className="pl-6 space-y-2">
                <Textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Explain the situation for the admin to review…"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={escalateToAdmin} disabled={escalating}>
                    {escalating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                    Submit Escalation
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowEscalate(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {canProviderCancel && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">A milestone has been flagged 5 or more times without resolution.</p>
                <p className="text-xs text-muted-foreground">You can cancel the job or escalate to an admin for review.</p>
              </div>
            </div>
            <div className="flex gap-2 pl-6">
              <Button size="sm" variant="destructive" onClick={() => setShowCancelConfirm(true)}>
                <X className="mr-1 h-3 w-3" /> Cancel Job
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowEscalate(!showEscalate)}>
                <ShieldAlert className="mr-1 h-3 w-3" /> Escalate to Admin
              </Button>
            </div>
            {showEscalate && (
              <div className="pl-6 space-y-2">
                <Textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Explain the situation for the admin to review…"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={escalateToAdmin} disabled={escalating}>
                    {escalating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                    Submit Escalation
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowEscalate(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancel confirmation dialog */}
        <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>By cancelling this job, <strong>you will not receive any payment</strong> for outstanding milestones. All funds held in escrow will be returned to the customer.</p>
                <p>This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Go Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={cancelJobDueToFlags}
                disabled={cancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelling ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Yes, Cancel Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Milestones */}
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones yet. They will appear once the job is in progress.</p>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => {
              const isExpanded = expandedId === m.id;
              const mComments = comments[m.id] || [];
              const isProvider = role === "provider";
              const isCustomer = role === "customer";
              const payment = getPaymentForMilestone(m.id);
              const isDeposit = m.title === "Deposit" || m.title === "Full Payment";
              const milestoneIsPaid = isMilestonePaid(m.id);

              // Provider can propose edits: deposit must be paid, milestone must be unpaid, not deposit, not auto, pending status
              const canPropose = canProposeChanges && !isDeposit && !m.is_auto && m.status === "pending" && !milestoneIsPaid;
              const pendingCR = getPendingCR(m.id);
              const isEditing = editingId === m.id;

              // Provider can only complete milestone if payment for it is confirmed (held/released)
              const milestonePaymentStatus = getPaymentStatus(m.id);
              const milestonePaymentConfirmed = !m.payment_amount || milestonePaymentStatus === "complete";

              const canComplete = isProvider && m.status === "pending" && !m.is_auto && milestonePaymentConfirmed;
              const canReconfirm = isProvider && m.status === "flagged";
              const canAcceptOrFlag = isCustomer && m.status === "completed";
              const isFinishMilestone = m.is_auto && m.title === "Work Complete";
              const canCompleteFinish = isProvider && isFinishMilestone && m.status === "pending" && milestonePaymentConfirmed;

              return (
                <div key={m.id} className="rounded-lg border p-3 space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-primary">Propose changes (requires customer approval)</p>
                      <div className="flex gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Milestone title"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="£ Amount"
                          className="w-28"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitChangeRequest(m.id)} disabled={savingEdit}>
                          {savingEdit ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                          Submit for Approval
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="mr-1 h-3 w-3" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    >
                      <div className="flex items-center gap-2">
                        {m.status === "accepted" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : m.status === "flagged" ? (
                          <Flag className="h-4 w-4 text-destructive" />
                        ) : m.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{m.title}</span>
                        {m.is_auto && <Badge variant="outline" className="text-xs">Auto</Badge>}
                        {m.payment_amount && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <PoundSterling className="h-3 w-3" />
                            {Number(m.payment_amount).toFixed(2)}
                          </Badge>
                        )}
                        {pendingCR && (
                          <Badge variant="outline" className="text-xs border-primary text-primary gap-1">
                            <Clock className="h-3 w-3" />
                            Change pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {canPropose && !pendingCR && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); startEditMilestone(m); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        <Badge className={STATUS_COLORS[m.status] || ""}>{m.status}</Badge>
                        {m.flag_count > 0 && (
                          <span className="text-xs text-destructive">({m.flag_count} {m.flag_count === 1 ? "query" : "queries"})</span>
                        )}
                        {/* Payment status badge */}
                        {m.payment_amount && (() => {
                          const pStatus = getPaymentStatus(m.id);
                          const pmnt = getPaymentForMilestone(m.id);
                          if (pStatus === "complete") {
                            return <Badge variant="default" className="text-xs">{pmnt?.status === "released" ? "Released" : "Paid"}</Badge>;
                          }
                          if (isProvider) {
                            return <Badge variant="outline" className="text-xs">Payment pending</Badge>;
                          }
                          if (pStatus === "pending") {
                            return <Badge variant="outline" className="text-xs">Confirming…</Badge>;
                          }
                          return null;
                        })()}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="pl-6 space-y-3">
                      {/* Pending change request for customer to review */}
                      {isCustomer && pendingCR && (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Pencil className="h-3 w-3" /> Provider has proposed changes
                          </p>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">New title:</span>
                              <span className="font-medium">{pendingCR.proposed_title}</span>
                            </div>
                            {pendingCR.proposed_amount !== null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">New amount:</span>
                                <span className="font-medium">£{Number(pendingCR.proposed_amount).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveChangeRequest(pendingCR)}
                              disabled={reviewingCR === pendingCR.id}
                            >
                              {reviewingCR === pendingCR.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectChangeRequest(pendingCR)}
                              disabled={reviewingCR === pendingCR.id}
                            >
                              <X className="mr-1 h-3 w-3" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Provider sees pending change request status */}
                      {isProvider && pendingCR && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Change request submitted — waiting for customer approval.
                          </p>
                          <div className="text-xs mt-1 space-y-0.5">
                            <p>Proposed title: <span className="font-medium">{pendingCR.proposed_title}</span></p>
                            {pendingCR.proposed_amount !== null && (
                              <p>Proposed amount: <span className="font-medium">£{Number(pendingCR.proposed_amount).toFixed(2)}</span></p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Customer payment actions */}
                      {isCustomer && m.payment_amount && (() => {
                        const pStatus = getPaymentStatus(m.id);
                        const nextUnpaidMilestone = milestones.find(ms => {
                          if (!ms.payment_amount) return false;
                          const msPayment = escrowPayments.find(p => p.milestone_id === ms.id && (p.status === "held" || p.status === "released"));
                          return !msPayment;
                        });
                        const isNextToPay = nextUnpaidMilestone?.id === m.id;
                        if (pStatus === "unpaid") {
                          if (!isNextToPay) {
                            return (
                              <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="text-sm text-muted-foreground">Pay earlier milestones first before this one becomes available.</p>
                              </div>
                            );
                          }
                          return (
                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                              <p className="text-sm font-medium">Payment required for this milestone</p>
                              <p className="text-xs text-muted-foreground">Pay before this stage of work begins. Funds are held securely and released when you accept the milestone.</p>
                              <Button
                                size="sm"
                                onClick={() => payMilestone(m.id, Number(m.payment_amount))}
                                disabled={processingPayment === m.id}
                              >
                                {processingPayment === m.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <PoundSterling className="mr-1 h-3 w-3" />
                                )}
                                Pay £{Number(m.payment_amount).toFixed(2)}
                              </Button>
                            </div>
                          );
                        }
                        if (pStatus === "failed") {
                          return (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                                <p className="text-sm font-medium text-destructive">Payment failed</p>
                              </div>
                              <p className="text-xs text-muted-foreground">Your previous payment attempt was unsuccessful. Please try again.</p>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => payMilestone(m.id, Number(m.payment_amount))}
                                disabled={processingPayment === m.id}
                              >
                                {processingPayment === m.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <PoundSterling className="mr-1 h-3 w-3" />
                                )}
                                Retry £{Number(m.payment_amount).toFixed(2)}
                              </Button>
                            </div>
                          );
                        }
                        if (pStatus === "pending") {
                          return (
                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                              <p className="text-sm font-medium">Payment being confirmed…</p>
                              <p className="text-xs text-muted-foreground">Your payment is being processed. If you've completed checkout, click below to check status.</p>
                              <Button size="sm" variant="outline" onClick={confirmPendingPayment}>
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Check Status
                              </Button>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Comment history */}
                      {mComments.length > 0 && (
                        <div className="space-y-2">
                          {mComments.map((c) => (
                            <div key={c.id} className="text-xs border-l-2 border-muted pl-2 py-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Badge variant="outline" className="text-[10px]">{c.action}</Badge>
                                <span className="text-muted-foreground">
                                  {c.user_id === job.provider_id ? "Provider" : "Customer"} · {format(new Date(c.created_at), "d MMM, h:mm a")}
                                </span>
                              </div>
                              {c.body && <p className="text-foreground">{c.body}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payment not yet confirmed message for provider */}
                      {isProvider && m.payment_amount && !milestonePaymentConfirmed && m.status === "pending" && !m.is_auto && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-sm text-muted-foreground">
                            ⏳ Payment for this milestone has not been confirmed yet. You can mark it complete once the customer's payment is confirmed.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {(canComplete || canCompleteFinish) && (
                        <div className="space-y-2">
                          <Textarea
                            value={actionComment[m.id] || ""}
                            onChange={(e) => setActionComment((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="Optional comment…"
                            rows={2}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => performAction(m.id, "complete")}
                            disabled={acting === m.id}
                          >
                            {acting === m.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                            Mark Complete
                          </Button>
                        </div>
                      )}

                      {canReconfirm && (
                        <div className="space-y-2">
                          <Textarea
                            value={actionComment[m.id] || ""}
                            onChange={(e) => setActionComment((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="Reply to the customer's concern…"
                            rows={2}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => performAction(m.id, "reconfirm")}
                            disabled={acting === m.id}
                          >
                            {acting === m.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                            Reconfirm Complete
                          </Button>
                        </div>
                      )}

                      {canAcceptOrFlag && (
                        <div className="space-y-2">
                          <Textarea
                            value={actionComment[m.id] || ""}
                            onChange={(e) => setActionComment((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder="Leave a comment (required for querying)…"
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => performAction(m.id, "accept")}
                              disabled={acting === m.id}
                            >
                              {acting === m.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                              Accept {m.payment_amount ? `& Release £${Number(m.payment_amount).toFixed(2)}` : ""}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => performAction(m.id, "flag")}
                              disabled={acting === m.id}
                            >
                              <Flag className="mr-1 h-3 w-3" /> Query
                            </Button>
                          </div>
                        </div>
                      )}

                      {m.status === "accepted" && (() => {
                        const adminAccepted = (comments[m.id] || []).some((c: any) => c.action === "admin_accepted");
                        return (
                          <p className="text-xs text-green-600">
                            ✓ {adminAccepted ? "Milestone approved by admin" : "Milestone accepted by customer"}
                            {payment?.status === "released" ? " — payment released" : ""}
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkTracker;
