import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquareWarning, ChevronDown, ChevronUp, Send, UserCheck, UserX, Lock, Image, Film } from "lucide-react";
import { format } from "date-fns";
import { getSignedStorageUrl } from "@/lib/storage-urls";

const AdminDisputes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    const { data } = await supabase
      .from("job_disputes")
      .select("*")
      .order("created_at", { ascending: false });
    setDisputes(data ?? []);
    setLoading(false);
  };

  const loadDetails = async (dispute: any, force = false) => {
    if (!force && details[dispute.id]) return;

    const [jobRes, msgsRes, milestonesRes, conversationsRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", dispute.job_id).single(),
      supabase.from("dispute_messages").select("*").eq("dispute_id", dispute.id).order("created_at"),
      supabase.from("job_milestones").select("*").eq("job_id", dispute.job_id).order("sort_order"),
      supabase.from("conversations").select("*").eq("job_id", dispute.job_id),
    ]);

    const job = jobRes.data;
    let customerProfile = null;
    let providerProfile = null;
    let conversationMessages: any[] = [];
    let conversationId: string | null = null;

    if (job) {
      const [cp, pp] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", job.customer_user_id).single(),
        supabase.from("profiles").select("*").eq("id", job.provider_id).single(),
      ]);
      customerProfile = cp.data;
      providerProfile = pp.data;

      const milestoneIds = (milestonesRes.data ?? []).map((m: any) => m.id);
      let milestoneComments: any[] = [];
      if (milestoneIds.length > 0) {
        const { data: mc } = await supabase
          .from("milestone_comments")
          .select("*")
          .in("milestone_id", milestoneIds)
          .order("created_at");
        milestoneComments = mc ?? [];
      }

      if (conversationsRes.data && conversationsRes.data.length > 0) {
        // Find the conversation between the assigned provider and customer
        const mainConv = conversationsRes.data.find(
          (c: any) => c.provider_user_id === job.provider_id
        ) || conversationsRes.data[0];
        conversationId = mainConv.id;

        // Fetch ALL messages from this conversation
        const { data: cm } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", mainConv.id)
          .order("created_at");
        conversationMessages = cm ?? [];
      }

      setDetails((prev) => ({
        ...prev,
        [dispute.id]: {
          job,
          customerProfile,
          providerProfile,
          milestones: milestonesRes.data ?? [],
          milestoneComments,
          conversationMessages,
          conversationId,
        },
      }));
    }

    setMessages((prev) => ({ ...prev, [dispute.id]: msgsRes.data ?? [] }));
  };

  const toggleExpand = async (dispute: any) => {
    if (expandedId === dispute.id) {
      setExpandedId(null);
    } else {
      setExpandedId(dispute.id);
      await loadDetails(dispute);
    }
  };

  const updateStatus = async (disputeId: string, status: string) => {
    const dispute = disputes.find((d) => d.id === disputeId);
    await supabase.from("job_disputes").update({ status } as any).eq("id", disputeId);

    const det = details[disputeId];
    const statusLabel = status.replace("_", " ");

    if (det?.job) {
      await supabase.functions.invoke("notify-dispute-reply", {
        body: {
          dispute_id: disputeId,
          body: `Dispute status updated to "${statusLabel}".`,
          conversation_id: det.conversationId || null,
          job_id: det.job.id,
        },
      });
    }

    toast({ title: `Dispute marked as ${status}` });
    fetchDisputes();
    if (det) {
      setDetails((prev) => {
        const copy = { ...prev };
        delete copy[disputeId];
        return copy;
      });
      if (dispute) await loadDetails(dispute, true);
    }
  };

  const resolveInFavour = async (disputeId: string, favouredParty: "provider" | "customer") => {
    setResolving(disputeId);
    const det = details[disputeId];
    if (!det?.job) { setResolving(null); return; }

    const flaggedMilestones = (det.milestones || []).filter(
      (m: any) => m.status === "flagged" || m.flag_count > 0
    );

    if (favouredParty === "provider") {
      // Mark flagged milestones as accepted (work deemed complete)
      for (const m of flaggedMilestones) {
        await supabase.from("job_milestones").update({
          status: "accepted" as any,
          flag_count: 0,
          completed_at: new Date().toISOString(),
        }).eq("id", m.id);

        await supabase.from("milestone_comments").insert({
          milestone_id: m.id,
          user_id: user!.id,
          action: "admin_accepted",
          body: "Admin ruled in favour of provider. Milestone approved by admin.",
        });
      }

      // Check if ALL milestones are now accepted → complete the job
      const allMilestones = det.milestones || [];
      const remainingPending = allMilestones.filter(
        (m: any) => !flaggedMilestones.find((f: any) => f.id === m.id) && m.status !== "accepted"
      );
      if (remainingPending.length === 0) {
        await supabase.from("jobs").update({ status: "completed" as any }).eq("id", det.job.id);
      }

      const msg = flaggedMilestones.length > 0
        ? `Dispute resolved in favour of the provider. Milestone(s) "${flaggedMilestones.map((m: any) => m.title).join(", ")}" marked as accepted. The job continues as normal.`
        : "Dispute resolved in favour of the provider.";

      await notifyResolution(disputeId, det, msg);
    } else {
      // Favour customer: reset flagged milestones to pending so provider can redo work
      for (const m of flaggedMilestones) {
        await supabase.from("job_milestones").update({
          status: "pending" as any,
          flag_count: 0,
          completed_at: null,
        }).eq("id", m.id);

        // Add a milestone comment so the history is visible
        await supabase.from("milestone_comments").insert({
          milestone_id: m.id,
          user_id: user!.id,
          action: "admin_reset",
          body: "Admin ruled in favour of customer. Provider must redo this milestone.",
        });
      }

      const msg = flaggedMilestones.length > 0
        ? `Dispute resolved in favour of the customer. Milestone(s) "${flaggedMilestones.map((m: any) => m.title).join(", ")}" reset to pending. The provider must redo the work.`
        : "Dispute resolved in favour of the customer. The provider must redo the work.";

      await notifyResolution(disputeId, det, msg);
    }

    // Mark dispute as closed
    await supabase.from("job_disputes").update({ status: "closed" as any }).eq("id", disputeId);

    toast({ title: `Dispute resolved in favour of ${favouredParty}` });
    fetchDisputes();

    // Refresh details
    const dispute = disputes.find((d) => d.id === disputeId);
    setDetails((prev) => {
      const copy = { ...prev };
      delete copy[disputeId];
      return copy;
    });
    if (dispute) await loadDetails(dispute, true);
    setResolving(null);
  };

  const notifyResolution = async (disputeId: string, det: any, message: string) => {
    await supabase.functions.invoke("notify-dispute-reply", {
      body: {
        dispute_id: disputeId,
        body: message,
        conversation_id: det.conversationId || null,
        job_id: det.job.id,
      },
    });
  };

  const sendMessage = async (disputeId: string, isAdminOnly: boolean) => {
    const body = newMessage[disputeId]?.trim();
    if (!body) return;
    setSending(disputeId);

    const dispute = disputes.find((d) => d.id === disputeId);
    const det = details[disputeId];

    // Always save to dispute_messages for the dispute thread
    await supabase.from("dispute_messages").insert({
      dispute_id: disputeId,
      sender_user_id: user!.id,
      body,
      is_admin_only: isAdminOnly,
    } as any);

    // If "Reply to All", use edge function to post to conversation, notify, and email both parties
    if (!isAdminOnly && det?.job) {
      await supabase.functions.invoke("notify-dispute-reply", {
        body: {
          dispute_id: disputeId,
          body,
          conversation_id: det.conversationId || null,
          job_id: det.job.id,
        },
      });
    }

    setNewMessage((prev) => ({ ...prev, [disputeId]: "" }));

    // Refresh dispute messages
    const { data } = await supabase
      .from("dispute_messages")
      .select("*")
      .eq("dispute_id", disputeId)
      .order("created_at");
    setMessages((prev) => ({ ...prev, [disputeId]: data ?? [] }));

    // Refresh conversation messages in details
    if (det?.conversationId) {
      const { data: cm } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", det.conversationId)
        .order("created_at");
      setDetails((prev) => ({
        ...prev,
        [disputeId]: { ...prev[disputeId], conversationMessages: cm ?? [] },
      }));
    }

    setSending(null);
  };

  const statusColor = (s: string) => {
    if (s === "open") return "destructive" as const;
    if (s === "closed") return "default" as const;
    return "outline" as const;
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {disputes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No disputes raised.</p>
      ) : (
        disputes.map((d) => {
          const isExpanded = expandedId === d.id;
          const det = details[d.id];
          const dMsgs = messages[d.id] || [];

          return (
            <Card key={d.id}>
              <CardHeader className="cursor-pointer" onClick={() => toggleExpand(d)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareWarning className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-sm">Dispute – {d.job_id.slice(0, 8)}…</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(d.status)}>{d.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(d.created_at), "d MMM yyyy")}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="font-medium">Reason:</p>
                    <p className="text-muted-foreground">{d.reason}</p>
                  </div>

                  {/* Resolution buttons - only show for open disputes */}
                  {d.status === "open" && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <p className="text-sm font-medium">Resolve Dispute</p>
                      <p className="text-xs text-muted-foreground">
                        Choose which party to rule in favour of. This will update the milestone status and notify both parties.
                      </p>
                      {det && (() => {
                        const flaggedMilestones = (det.milestones || []).filter(
                          (m: any) => m.status === "flagged" || m.flag_count > 0
                        );
                        return flaggedMilestones.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Affected milestone(s): <span className="font-medium text-foreground">{flaggedMilestones.map((m: any) => m.title).join(", ")}</span>
                          </p>
                        ) : null;
                      })()}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => resolveInFavour(d.id, "provider")}
                          disabled={resolving === d.id}
                        >
                          {resolving === d.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <UserCheck className="mr-1 h-3 w-3" />}
                          Favour Provider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveInFavour(d.id, "customer")}
                          disabled={resolving === d.id}
                        >
                          {resolving === d.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <UserX className="mr-1 h-3 w-3" />}
                          Favour Customer
                        </Button>
                      </div>
                    </div>
                  )}

                  {det && (
                    <>
                      {/* Job info */}
                      <div className="rounded-lg border p-3 space-y-1 text-sm">
                        <p className="font-medium">Job: {det.job.title}</p>
                        <p className="text-muted-foreground">{det.job.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground mt-2">
                          <span>Status: {det.job.status}</span>
                          <span>Category: {det.job.category}</span>
                          <span>Budget: {det.job.budget || "—"}</span>
                          <span>Location: {det.job.postcode_district}</span>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3 text-sm space-y-1">
                          <p className="font-medium">Customer</p>
                          <p>{det.customerProfile?.first_name} {det.customerProfile?.last_name}</p>
                          <p className="text-xs text-muted-foreground">{det.customerProfile?.email}</p>
                          <p className="text-xs text-muted-foreground">{det.customerProfile?.phone}</p>
                        </div>
                        <div className="rounded-lg border p-3 text-sm space-y-1">
                          <p className="font-medium">Provider</p>
                          <p>{det.providerProfile?.first_name} {det.providerProfile?.last_name}</p>
                          <p className="text-xs text-muted-foreground">{det.providerProfile?.email}</p>
                          <p className="text-xs text-muted-foreground">{det.providerProfile?.phone}</p>
                        </div>
                      </div>

                      {/* Milestones summary */}
                      {det.milestones.length > 0 && (
                        <div className="rounded-lg border p-3 text-sm space-y-1">
                          <p className="font-medium">Milestones ({det.milestones.length})</p>
                          {det.milestones.map((m: any) => (
                            <div key={m.id} className="flex justify-between text-xs">
                              <span>{m.title}</span>
                              <Badge variant="outline" className="text-[10px]">{m.status} {m.flag_count > 0 ? `(${m.flag_count} flags)` : ""}</Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Milestone query comments */}
                      {det.milestoneComments && det.milestoneComments.length > 0 && (
                        <div className="rounded-lg border p-3 text-sm space-y-1">
                          <p className="font-medium">Milestone Queries ({det.milestoneComments.length} messages)</p>
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {det.milestoneComments.map((mc: any) => {
                              const milestone = det.milestones.find((m: any) => m.id === mc.milestone_id);
                              const isCustomer = mc.user_id === det.job.customer_user_id;
                              const isProvider = mc.user_id === det.job.provider_id;
                              const senderLabel = isCustomer ? "Customer" : isProvider ? "Provider" : "Admin";
                              const borderColor = isCustomer ? "border-blue-400" : isProvider ? "border-green-400" : "border-yellow-400";

                              return (
                                <div key={mc.id} className={`text-xs border-l-2 ${borderColor} pl-2`}>
                                  <span className="text-muted-foreground">
                                    <span className="font-medium">{senderLabel}</span> · {format(new Date(mc.created_at), "d MMM, h:mm a")}
                                    {milestone && <Badge variant="outline" className="text-[10px] ml-1">{milestone.title}</Badge>}
                                    <Badge variant="outline" className="text-[10px] ml-1">{mc.action}</Badge>
                                  </span>
                                  {mc.body && <p>{mc.body}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Full conversation messages between customer and provider */}
                      {det.conversationMessages.length > 0 && (
                        <div className="rounded-lg border p-3 text-sm space-y-1">
                          <p className="font-medium">Full Chat History ({det.conversationMessages.length} messages)</p>
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {det.conversationMessages.map((msg: any) => {
                              const isCustomer = msg.sender_user_id === det.job.customer_user_id;
                              const isProvider = msg.sender_user_id === det.job.provider_id;
                              const senderLabel = isCustomer
                                ? "Customer"
                                : isProvider
                                ? "Provider"
                                : "Admin";
                              const borderColor = isCustomer
                                ? "border-blue-400"
                                : isProvider
                                ? "border-green-400"
                                : "border-yellow-400";

                              return (
                                <div key={msg.id} className={`text-xs border-l-2 ${borderColor} pl-2`}>
                                  <span className="text-muted-foreground">
                                    <span className="font-medium">{senderLabel}</span> · {format(new Date(msg.created_at), "d MMM, h:mm a")}
                                    {msg.message_type !== "text" && (
                                      <Badge variant="outline" className="text-[10px] ml-1">{msg.message_type}</Badge>
                                    )}
                                  </span>
                                  <p>{msg.body}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Dispute messages (internal thread) */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Dispute Messages</p>
                    {dMsgs.length > 0 && (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {dMsgs.map((msg) => (
                          <div key={msg.id} className={`text-xs border-l-2 pl-2 py-1 ${msg.is_admin_only ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : "border-muted"}`}>
                            <span className="text-muted-foreground">
                              {msg.is_admin_only && <Badge variant="outline" className="text-[10px] mr-1">Admin Only</Badge>}
                              {format(new Date(msg.created_at), "d MMM, h:mm a")}
                            </span>
                            <p>{msg.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {d.status === "open" && (
                      <>
                        <Textarea
                          value={newMessage[d.id] || ""}
                          onChange={(e) => setNewMessage((prev) => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Reply to dispute…"
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => sendMessage(d.id, false)} disabled={sending === d.id}>
                            <Send className="mr-1 h-3 w-3" /> Reply to All
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => sendMessage(d.id, true)} disabled={sending === d.id}>
                            Internal Note
                          </Button>
                        </div>
                      </>
                    )}
                    {d.status === "closed" && (
                      <p className="text-xs text-muted-foreground italic">This dispute has been closed and cannot be reopened.</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
};

export default AdminDisputes;
