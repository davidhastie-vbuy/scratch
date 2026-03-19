import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, Flag, Plus, Send, Loader2, AlertTriangle, MessageSquareWarning,
  ChevronDown, ChevronUp, PoundSterling, Trash2, Pencil, Lock,
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
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New milestone form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit milestone state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Comment/action forms
  const [actionComment, setActionComment] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  // Dispute
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [raisingDispute, setRaisingDispute] = useState(false);

  useEffect(() => {
    fetchMilestones();
  }, [jobId]);

  const fetchMilestones = async () => {
    const [msRes, paymentsRes] = await Promise.all([
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
    ]);

    const ms = msRes.data ?? [];
    setMilestones(ms);
    setEscrowPayments(paymentsRes.data ?? []);

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
      toast({
        title: "Enter a valid amount",
        description: "Milestone payments must be greater than £0.00.",
        variant: "destructive",
      });
      return;
    }

    if (parsedAmount !== null && agreedPrice > 0 && parsedAmount > remainingBudget) {
      toast({
        title: "Milestone exceeds agreed price",
        description: `You only have £${remainingBudget.toFixed(2)} left to allocate.`,
        variant: "destructive",
      });
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

    // Insert comment
    await supabase.from("milestone_comments").insert({
      milestone_id: milestoneId,
      user_id: user!.id,
      body: comment || null,
      action,
    } as any);

    // Update milestone status
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

    await supabase.from("job_milestones").update({
      status: newStatus,
      flag_count: flagCount,
      completed_at: (action === "complete" || action === "reconfirm") ? new Date().toISOString() : milestone?.completed_at,
    } as any).eq("id", milestoneId);

    // If customer queries (flags) a milestone, send a message in the conversation
    if (action === "flag" && role === "customer" && comment.trim()) {
      try {
        // Find or create conversation for this job
        const { data: conv } = await supabase
          .from("conversations")
          .select("id")
          .eq("job_id", jobId)
          .eq("customer_user_id", user!.id)
          .limit(1)
          .maybeSingle();

        if (conv) {
          await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_user_id: user!.id,
            body: `📋 **Milestone query: "${milestone?.title}"**\n\n${comment}`,
            message_type: "text",
          } as any);
        }
      } catch (e) {
        console.error("Failed to send milestone query message:", e);
      }
    }

    // If customer accepts a milestone, trigger payment release
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
    }

    setActionComment((prev) => ({ ...prev, [milestoneId]: "" }));
    fetchMilestones();
    setActing(null);
  };

  const raiseDispute = async () => {
    if (!disputeReason.trim()) return;
    setRaisingDispute(true);
    const { error } = await supabase.from("job_disputes").insert({
      job_id: jobId,
      raised_by: user!.id,
      reason: disputeReason.trim(),
    } as any);
    if (error) {
      toast({ title: "Failed to raise dispute", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dispute raised", description: "An admin will review your case." });
      setShowDispute(false);
      setDisputeReason("");
    }
    setRaisingDispute(false);
  };

  const canProviderCancel = role === "provider" && milestones.some((m) => m.flag_count >= 5);

  // Hard lock: once any payment has been confirmed (held or released), no add/edit/delete
  const hasAnyConfirmedPayment = escrowPayments.some((p) => p.status === "held" || p.status === "released");

  const deleteMilestone = async (milestoneId: string) => {
    if (hasAnyConfirmedPayment) {
      toast({ title: "Milestones locked", description: "Milestones cannot be modified after payment has been made.", variant: "destructive" });
      return;
    }
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (milestone?.is_auto) return;
    setDeleting(milestoneId);
    const { error } = await supabase.from("job_milestones").delete().eq("id", milestoneId);
    if (error) {
      toast({ title: "Failed to delete milestone", description: error.message, variant: "destructive" });
    } else {
      fetchMilestones();
    }
    setDeleting(null);
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditAmount(m.payment_amount != null ? String(m.payment_amount) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
  };

  const saveEdit = async (milestoneId: string) => {
    if (hasAnyConfirmedPayment) {
      toast({ title: "Milestones locked", description: "Milestones cannot be modified after payment has been made.", variant: "destructive" });
      return;
    }
    if (!editTitle.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    const parsedAmt = editAmount ? parseFloat(editAmount) : null;
    if (parsedAmt !== null && (!Number.isFinite(parsedAmt) || parsedAmt <= 0)) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    // Check budget cap
    if (parsedAmt !== null && agreedPrice > 0) {
      const currentMilestone = milestones.find((m) => m.id === milestoneId);
      const currentAmt = Number(currentMilestone?.payment_amount) || 0;
      const otherAllocated = totalMilestoneAmounts - currentAmt;
      const maxAllowed = Math.round((agreedPrice - otherAllocated) * 100) / 100;
      if (parsedAmt > maxAllowed) {
        toast({ title: "Exceeds agreed price", description: `Maximum allowed: £${maxAllowed.toFixed(2)}`, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase.from("job_milestones").update({
      title: editTitle.trim(),
      payment_amount: parsedAmt,
    } as any).eq("id", milestoneId);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      cancelEdit();
      fetchMilestones();
    }
    setSaving(false);
  };

  const cancelJobDueToFlags = async () => {
    await supabase.from("jobs").update({ status: "cancelled" } as any).eq("id", jobId);
    toast({ title: "Job cancelled due to unresolved flags." });
    onRefresh?.();
  };

  // Payment helpers
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const getPaymentForMilestone = (milestoneId: string) => {
    return escrowPayments.find((p) => p.milestone_id === milestoneId);
  };

  const getPaymentStatus = (milestoneId: string): "unpaid" | "pending" | "complete" | "failed" => {
    const payments = escrowPayments.filter((p) => p.milestone_id === milestoneId);
    if (payments.length === 0) return "unpaid";
    // Check for held/released (complete)
    if (payments.some((p) => p.status === "held" || p.status === "released")) return "complete";
    // Check for failed
    if (payments.some((p) => p.status === "failed")) return "failed";
    // Otherwise pending
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
    const { error } = await supabase.functions.invoke("confirm-escrow-payment", {
      body: { job_id: jobId },
    });
    if (!error) {
      toast({ title: "Payment confirmed!" });
      fetchMilestones();
      onRefresh?.();
    } else {
      toast({ title: "Not yet confirmed", description: "Please try again shortly.", variant: "destructive" });
    }
  };

  const agreedPrice = Number(job.agreed_price ?? 0);
  const totalMilestoneAmounts = milestones.reduce((sum, m) => sum + (Number(m.payment_amount) || 0), 0);
  const remainingMilestoneBudget = agreedPrice > 0
    ? Math.max(0, Math.round((agreedPrice - totalMilestoneAmounts) * 100) / 100)
    : 0;
  const milestoneBudgetFullyAllocated = agreedPrice > 0 && totalMilestoneAmounts >= agreedPrice - 0.01;
  const totalPaid = escrowPayments
    .filter((p) => p.status === "held" || p.status === "released")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalReleased = escrowPayments
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + p.provider_payout, 0);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const showTracker = ["in_progress"].includes(job.status) || (job.status === "accepted" && job.milestones_confirmed);
  if (!showTracker) return null;

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
                disabled={milestoneBudgetFullyAllocated}
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

        {role === "provider" && milestoneBudgetFullyAllocated && (
          <p className="text-xs text-muted-foreground">
            Deposit, milestones, and final payment already equal the agreed price, so no more paid milestones can be added.
          </p>
        )}

        {/* Add milestone form */}
        {showAdd && role === "provider" && !milestoneBudgetFullyAllocated && (
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
                    if (value === "") {
                      setNewAmount("");
                      return;
                    }

                    const parsedValue = parseFloat(value);
                    if (Number.isNaN(parsedValue)) {
                      setNewAmount(value);
                      return;
                    }

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

        {/* Provider cancel option */}
        {canProviderCancel && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">A milestone has been flagged 5 times.</p>
              <p className="text-xs text-muted-foreground">You may cancel this job if the issues cannot be resolved.</p>
              <Button size="sm" variant="destructive" onClick={cancelJobDueToFlags}>Cancel Job</Button>
            </div>
          </div>
        )}

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

              const canComplete = isProvider && m.status === "pending" && !m.is_auto;
              const canReconfirm = isProvider && m.status === "flagged";
              const canAcceptOrFlag = isCustomer && m.status === "completed";
              const isFinishMilestone = m.is_auto && m.title === "Work Complete";
              const canCompleteFinish = isProvider && isFinishMilestone && m.status === "pending";

              return (
                <div key={m.id} className="rounded-lg border p-3 space-y-2">
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
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[m.status] || ""}>{m.status}</Badge>
                      {m.flag_count > 0 && (
                        <span className="text-xs text-destructive">({m.flag_count}/5 flags)</span>
                      )}
                      {/* Payment status badge - role-specific */}
                      {m.payment_amount && (() => {
                        const pStatus = getPaymentStatus(m.id);
                        const payment = getPaymentForMilestone(m.id);
                        if (isProvider) {
                          // Provider sees: pending or complete
                          if (pStatus === "complete") {
                            return <Badge variant="default" className="text-xs">{payment?.status === "released" ? "Released" : "Paid"}</Badge>;
                          }
                          return <Badge variant="outline" className="text-xs">Payment pending</Badge>;
                        }
                        // Customer sees: pay button, retry, pending confirmation, or complete
                        if (pStatus === "complete") {
                          return <Badge variant="default" className="text-xs">{payment?.status === "released" ? "Released" : "Paid"}</Badge>;
                        }
                        if (pStatus === "pending") {
                          return <Badge variant="outline" className="text-xs">Confirming…</Badge>;
                        }
                        return null;
                      })()}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pl-6 space-y-3">
                      {/* Customer payment actions */}
                      {isCustomer && m.payment_amount && (() => {
                        const pStatus = getPaymentStatus(m.id);
                        // Find the first milestone that hasn't been paid (held/released) to enforce sequential payment
                        const nextUnpaidMilestone = milestones.find(ms => {
                          if (!ms.payment_amount) return false;
                          const msPayment = escrowPayments.find(p => p.milestone_id === ms.id && (p.status === "held" || p.status === "released" || p.status === "pending"));
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

                      {m.status === "accepted" && (
                        <p className="text-xs text-green-600">✓ Milestone accepted by customer{payment?.status === "released" ? " — payment released" : ""}</p>
                      )}
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
