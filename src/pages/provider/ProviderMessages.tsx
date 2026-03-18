import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Handshake, Clock } from "lucide-react";
import ScoreBadge from "@/components/reviews/ScoreBadge";
import ProposalCard from "@/components/messaging/ProposalCard";
import ProposeTermsDialog from "@/components/messaging/ProposeTermsDialog";
import QuoteBanner from "@/components/messaging/QuoteBanner";
import { AttachmentButton, StagedFilePreview, MessageAttachments, uploadAttachments, type StagedFile } from "@/components/messaging/ChatAttachments";
import { cn } from "@/lib/utils";

interface ConversationWithUnread {
  id: string;
  job_id: string;
  provider_user_id: string;
  customer_user_id: string;
  jobs?: { title?: string; status?: string; agreed_price?: number; updated_at?: string };
  unreadCount: number;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
}

const ProviderMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithUnread[]>([]);
  const [selected, setSelected] = useState<ConversationWithUnread | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachmentMap, setAttachmentMap] = useState<Record<string, any[]>>({});
  const [newMsg, setNewMsg] = useState("");
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposeDefaults, setProposeDefaults] = useState<any>(undefined);
  const [accepting, setAccepting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*, jobs(title, status, updated_at, agreed_price)")
      .eq("provider_user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!data) { setConversations([]); setLoading(false); return; }

    const enriched: ConversationWithUnread[] = await Promise.all(
      data.map(async (c: any) => {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_user_id", user!.id)
          .is("read_at", null);

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("body, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          ...c,
          unreadCount: count ?? 0,
          lastMessageBody: lastMsg?.[0]?.body ?? null,
          lastMessageAt: lastMsg?.[0]?.created_at ?? null,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  };

  const fetchAttachments = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    const { data } = await supabase
      .from("message_attachments")
      .select("message_id, file_url, file_name, file_type")
      .in("message_id", messageIds);
    if (data) {
      const map: Record<string, any[]> = {};
      for (const a of data) {
        if (!map[a.message_id]) map[a.message_id] = [];
        map[a.message_id].push(a);
      }
      setAttachmentMap(map);
    }
  };

  const openConversation = async (conv: ConversationWithUnread) => {
    setSelected(conv);
    setStagedFiles([]);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at");
    const msgs = data ?? [];
    setMessages(msgs);
    fetchAttachments(msgs.map((m: any) => m.id));

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("conversation_id", conv.id)
      .neq("sender_user_id", user!.id)
      .is("read_at", null);

    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    );

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendMessage = async () => {
    if ((!newMsg.trim() && stagedFiles.length === 0) || !selected) return;
    setSending(true);

    const body = newMsg.trim() || (stagedFiles.length > 0 ? `📎 ${stagedFiles.length} attachment${stagedFiles.length > 1 ? "s" : ""}` : "");

    const { data: inserted } = await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body,
    } as any).select("id").single();

    if (inserted && stagedFiles.length > 0) {
      await uploadAttachments(stagedFiles, inserted.id, user!.id);
      setStagedFiles([]);
    }

    setNewMsg("");
    await refreshMessages();
    setSending(false);
  };

  const refreshMessages = async () => {
    if (!selected) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selected.id)
      .order("created_at");
    const msgs = data ?? [];
    setMessages(msgs);
    fetchAttachments(msgs.map((m: any) => m.id));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendProposal = async (data: { agreed_price: number; start_date: string; start_time: string; duration: string; end_date: string }) => {
    if (!selected) return;
    // Decline all pending proposals (including the customer one we're responding to)
    for (const m of messages) {
      if ((m as any).message_type === "proposal" && (m as any).metadata?.status === "pending") {
        await supabase.from("messages").update({
          metadata: { ...(m as any).metadata, status: "declined" },
        } as any).eq("id", m.id);
      }
    }
    await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body: `Proposal: £${data.agreed_price.toFixed(2)}, starting ${new Date(data.start_date).toLocaleDateString()}, duration: ${data.duration}`,
      message_type: "proposal",
      metadata: { ...data, status: "pending" },
    } as any);
    toast({ title: "Proposal sent to customer" });
    setProposeDefaults(undefined);
    await refreshMessages();
  };

  const handleAcceptProposal = async (msg: any) => {
    if (!selected) return;
    setAccepting(true);
    const metadata = (msg as any).metadata;
    const isCustomerProposal = msg.sender_user_id !== user!.id;

    if (isCustomerProposal) {
      // Provider accepting a customer's proposal — open propose terms dialog pre-filled
      // Do NOT decline the customer's proposal yet; only decline when provider sends their formal proposal
      setProposeDefaults({
        agreed_price: metadata.agreed_price,
        _customerProposalMsgId: msg.id,
      });
      setProposeOpen(true);

      toast({ title: "Please confirm the details", description: "Fill in the start date and duration, then send the formal proposal for the customer to accept." });
      setAccepting(false);
      return;
    }

    // Provider accepting their OWN proposal that was countered back — this shouldn't happen in normal flow
    // But handle gracefully by finalizing
    await supabase.from("messages").update({
      metadata: { ...metadata, status: "accepted" },
    } as any).eq("id", msg.id);

    const updateData: any = {
      agreed_price: metadata.agreed_price,
      provider_id: user!.id,
      status: "accepted",
      scheduled_start: metadata.start_date,
      scheduled_end: metadata.end_date || null,
    };
    await supabase.from("jobs").update(updateData).eq("id", selected.job_id);

    await supabase.from("quotes").update({ status: "declined" } as any)
      .eq("job_id", selected.job_id)
      .neq("provider_user_id", user!.id);
    await supabase.from("quotes").update({ status: "accepted" } as any)
      .eq("job_id", selected.job_id)
      .eq("provider_user_id", user!.id);

    await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body: `Terms accepted! Job scheduled for £${Number(metadata.agreed_price).toFixed(2)}.`,
      message_type: "system",
    } as any);

    toast({ title: "Terms accepted!", description: "The job has been scheduled." });
    setAccepting(false);
    await refreshMessages();
    fetchConversations();
  };

  const handleDeclineProposal = async (msg: any) => {
    await supabase.from("messages").update({
      metadata: { ...(msg as any).metadata, status: "declined" },
    } as any).eq("id", msg.id);
    await supabase.from("messages").insert({
      conversation_id: selected!.id,
      sender_user_id: user!.id,
      body: "Proposal declined.",
      message_type: "system",
    } as any);
    toast({ title: "Proposal declined" });
    await refreshMessages();
  };

  const handleCounterProposal = (msg: any) => {
    const meta = (msg as any).metadata;
    setProposeDefaults({
      agreed_price: meta.agreed_price,
      start_date: meta.start_date,
      start_time: meta.start_time,
      duration: meta.duration,
    });
    setProposeOpen(true);
  };

  const jobAccepted = selected?.jobs?.status && ["accepted", "in_progress", "completed"].includes(selected.jobs.status);

  const graceInfo = useMemo(() => {
    if (!selected?.jobs?.status || !["completed", "cancelled"].includes(selected.jobs.status)) return null;
    const updatedAt = selected.jobs.updated_at ? new Date(selected.jobs.updated_at) : null;
    if (!updatedAt) return { expired: true };
    const expiresAt = new Date(updatedAt.getTime() + 72 * 60 * 60 * 1000);
    const now = new Date();
    if (now >= expiresAt) return { expired: true };
    const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    return { expired: false, hoursLeft };
  }, [selected?.jobs?.status, selected?.jobs?.updated_at]);

  const isReadOnly = graceInfo?.expired === true;

  useEffect(() => {
    if (!selected) return;
    const channel = supabase
      .channel(`messages-${selected.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` }, () => {
        refreshMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)] overflow-hidden">
      <div className="w-72 shrink-0 border rounded-lg overflow-y-auto">
        <div className="p-3 border-b"><h3 className="font-semibold text-sm">Conversations</h3></div>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">No conversations yet. Submit a quote to start messaging.</p>
        ) : (
          conversations.map(c => (
            <div
              key={c.id}
              className={cn(
                "p-3 cursor-pointer hover:bg-accent/50 border-b text-sm transition-colors",
                selected?.id === c.id && "bg-accent",
                c.unreadCount > 0 && selected?.id !== c.id && "bg-accent/20"
              )}
              onClick={() => openConversation(c)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate", c.unreadCount > 0 ? "font-bold" : "font-medium")}>
                  {c.jobs?.title ?? "Job"}
                </p>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground shrink-0">
                    {c.unreadCount > 9 ? "9+" : c.unreadCount}
                  </span>
                )}
              </div>
              {c.lastMessageBody && (
                <p className={cn(
                  "text-xs mt-0.5 truncate",
                  c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {c.lastMessageBody}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex-1 flex flex-col border rounded-lg min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 mb-2" />
              <p>Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{selected.jobs?.title ?? "Chat"}</h3>
                <ScoreBadge userId={selected.customer_user_id} role="customer" />
              </div>
              {!jobAccepted && (
                <Button size="sm" variant="outline" onClick={() => { setProposeDefaults(undefined); setProposeOpen(true); }}>
                  <Handshake className="mr-2 h-4 w-4" /> Propose Terms
                </Button>
              )}
            </div>
            <QuoteBanner jobId={selected.job_id} providerUserId={selected.provider_user_id} showProviderLink={false} />
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
              {messages.map(m => {
                const isOwn = m.sender_user_id === user!.id;
                if ((m as any).message_type === "proposal") {
                  return (
                    <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <ProposalCard
                        proposal={(m as any).metadata}
                        isOwnMessage={isOwn}
                        role="provider"
                        onAccept={() => handleAcceptProposal(m)}
                        onDecline={() => handleDeclineProposal(m)}
                        onCounter={() => handleCounterProposal(m)}
                        onSetupMilestones={
                          (m as any).metadata?.status === "accepted" && selected && jobAccepted
                            ? () => navigate(`/provider/jobs/${selected.job_id}`)
                            : undefined
                        }
                        accepting={accepting}
                      />
                    </div>
                  );
                }
                if ((m as any).message_type === "system") {
                  return (
                    <div key={m.id} className="flex justify-center">
                      <div className="bg-muted/50 rounded-lg px-4 py-2 text-xs text-muted-foreground text-center max-w-[80%]">
                        {m.body}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm break-words overflow-hidden ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p>{m.body}</p>
                      <MessageAttachments messageId={m.id} attachments={attachmentMap[m.id] || []} />
                      <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {graceInfo && !graceInfo.expired && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>This job is {selected?.jobs?.status}. You can still message for {graceInfo.hoursLeft} more hour{graceInfo.hoursLeft !== 1 ? "s" : ""}.</span>
              </div>
            )}
            {isReadOnly ? (
              <div className="p-3 border-t text-center text-sm text-muted-foreground">
                This conversation is now read-only. The 72-hour messaging window has ended.
              </div>
            ) : (
              <>
                <StagedFilePreview stagedFiles={stagedFiles} setStagedFiles={setStagedFiles} />
                <div className="p-3 border-t flex gap-2">
                  <AttachmentButton stagedFiles={stagedFiles} setStagedFiles={setStagedFiles} disabled={sending} />
                  <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message…" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                  <Button size="icon" onClick={sendMessage} disabled={sending || (!newMsg.trim() && stagedFiles.length === 0)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <ProposeTermsDialog
        open={proposeOpen}
        onClose={() => { setProposeOpen(false); setProposeDefaults(undefined); }}
        onSubmit={sendProposal}
        defaults={proposeDefaults}
      />
    </div>
  );
};

export default ProviderMessages;
