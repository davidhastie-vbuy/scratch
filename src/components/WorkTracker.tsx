import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, Flag, Plus, Send, Loader2, AlertTriangle, MessageSquareWarning,
  ChevronDown, ChevronUp,
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
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New milestone form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

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
    const { data: ms } = await supabase
      .from("job_milestones")
      .select("*")
      .eq("job_id", jobId)
      .order("sort_order");
    setMilestones(ms ?? []);

    // Fetch comments for all milestones
    if (ms && ms.length > 0) {
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
    setAdding(true);
    // Insert before "Work Complete" (sort_order 1000)
    const maxOrder = milestones
      .filter((m) => !m.is_auto || m.title !== "Work Complete")
      .reduce((max, m) => Math.max(max, m.sort_order), 0);
    const { error } = await supabase.from("job_milestones").insert({
      job_id: jobId,
      title: newTitle.trim(),
      sort_order: maxOrder + 1,
      created_by: user!.id,
    } as any);
    if (error) {
      toast({ title: "Failed to add milestone", description: error.message, variant: "destructive" });
    } else {
      setNewTitle("");
      setShowAdd(false);
      fetchMilestones();
    }
    setAdding(false);
  };

  const performAction = async (milestoneId: string, action: "complete" | "accept" | "flag" | "reconfirm") => {
    const comment = actionComment[milestoneId] || "";
    if (action === "flag" && !comment.trim()) {
      toast({ title: "Comment required", description: "Please explain why you're flagging this milestone.", variant: "destructive" });
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

  // Check if provider can cancel (any milestone flagged 5+ times)
  const canProviderCancel = role === "provider" && milestones.some((m) => m.flag_count >= 5);

  const cancelJobDueToFlags = async () => {
    await supabase.from("jobs").update({ status: "cancelled" } as any).eq("id", jobId);
    toast({ title: "Job cancelled due to unresolved flags." });
    onRefresh?.();
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const showTracker = ["in_progress"].includes(job.status);
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
              <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
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
        {/* Add milestone form */}
        {showAdd && role === "provider" && (
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Milestone title…"
              className="flex-1"
            />
            <Button size="sm" onClick={addMilestone} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
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

              // Determine available actions
              const canComplete = isProvider && m.status === "pending" && !m.is_auto;
              const canReconfirm = isProvider && m.status === "flagged";
              const canAcceptOrFlag = isCustomer && m.status === "completed";
              // "Work Complete" milestone - provider marks, customer accepts
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
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[m.status] || ""}>{m.status}</Badge>
                      {m.flag_count > 0 && (
                        <span className="text-xs text-destructive">({m.flag_count}/5 flags)</span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pl-6 space-y-3">
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
                            placeholder="Leave a comment (required for flagging)…"
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
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => performAction(m.id, "flag")}
                              disabled={acting === m.id}
                            >
                              <Flag className="mr-1 h-3 w-3" /> Flag Issue
                            </Button>
                          </div>
                        </div>
                      )}

                      {m.status === "accepted" && (
                        <p className="text-xs text-green-600">✓ Milestone accepted by customer</p>
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
