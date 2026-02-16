import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquareWarning, ChevronDown, ChevronUp, Send } from "lucide-react";
import { format } from "date-fns";

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

  const loadDetails = async (dispute: any) => {
    if (details[dispute.id]) return;

    // Fetch job, profiles, milestones, messages, conversations all at once
    const [jobRes, msgsRes, milestonesRes, conversationsRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", dispute.job_id).single(),
      supabase.from("dispute_messages").select("*").eq("dispute_id", dispute.id).order("created_at"),
      supabase.from("job_milestones").select("*").eq("job_id", dispute.job_id).order("sort_order"),
      supabase.from("conversations").select("*").eq("job_id", dispute.job_id),
    ]);

    const job = jobRes.data;
    let customerProfile = null;
    let providerProfile = null;
    let raisedByProfile = null;
    let conversationMessages: any[] = [];

    if (job) {
      const [cp, pp] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", job.customer_user_id).single(),
        supabase.from("profiles").select("*").eq("id", job.provider_id).single(),
      ]);
      customerProfile = cp.data;
      providerProfile = pp.data;

      // Get milestone comments
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

      // Get conversation messages
      if (conversationsRes.data && conversationsRes.data.length > 0) {
        const convIds = conversationsRes.data.map((c: any) => c.id);
        const { data: cm } = await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", convIds)
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
    await supabase.from("job_disputes").update({ status } as any).eq("id", disputeId);
    toast({ title: `Dispute marked as ${status}` });
    fetchDisputes();
  };

  const sendMessage = async (disputeId: string, isAdminOnly: boolean) => {
    const body = newMessage[disputeId]?.trim();
    if (!body) return;
    setSending(disputeId);
    await supabase.from("dispute_messages").insert({
      dispute_id: disputeId,
      sender_user_id: user!.id,
      body,
      is_admin_only: isAdminOnly,
    } as any);
    setNewMessage((prev) => ({ ...prev, [disputeId]: "" }));
    // Refresh messages
    const { data } = await supabase
      .from("dispute_messages")
      .select("*")
      .eq("dispute_id", disputeId)
      .order("created_at");
    setMessages((prev) => ({ ...prev, [disputeId]: data ?? [] }));
    setSending(null);
  };

  const statusColor = (s: string) => {
    if (s === "open") return "destructive" as const;
    if (s === "under_review") return "secondary" as const;
    if (s === "resolved") return "default" as const;
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

                  {/* Status control */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Status:</span>
                    <Select value={d.status} onValueChange={(v) => updateStatus(d.id, v)}>
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {det && (
                    <>
                      {/* Job info */}
                      <div className="rounded-lg border p-3 space-y-1 text-sm">
                        <p className="font-medium">Job: {det.job.title}</p>
                        <p className="text-muted-foreground">{det.job.description}</p>
                        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mt-2">
                          <span>Status: {det.job.status}</span>
                          <span>Category: {det.job.category}</span>
                          <span>Budget: {det.job.budget || "—"}</span>
                          <span>Location: {det.job.postcode_district}</span>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="grid grid-cols-2 gap-3">
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

                      {/* Conversation messages */}
                      {det.conversationMessages.length > 0 && (
                        <div className="rounded-lg border p-3 text-sm space-y-1">
                          <p className="font-medium">Chat History ({det.conversationMessages.length} messages)</p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {det.conversationMessages.map((msg: any) => (
                              <div key={msg.id} className="text-xs border-l-2 border-muted pl-2">
                                <span className="text-muted-foreground">
                                  {msg.sender_user_id === det.job.customer_user_id ? "Customer" : "Provider"} · {format(new Date(msg.created_at), "d MMM, h:mm a")}
                                </span>
                                <p>{msg.body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Dispute messages */}
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
