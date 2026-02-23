import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Handshake, Lock } from "lucide-react";
import ProposalCard from "@/components/messaging/ProposalCard";
import ProposeTermsDialog from "@/components/messaging/ProposeTermsDialog";
import ChatImageUpload from "@/components/messaging/ChatImageUpload";
import MessageBubble from "@/components/messaging/MessageBubble";
import { cn } from "@/lib/utils";

interface ConversationWithUnread {
  id: string;
  job_id: string;
  provider_user_id: string;
  customer_user_id: string;
  jobs?: { title?: string; status?: string; agreed_price?: number; provider_id?: string | null };
  unreadCount: number;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
}

const ProviderMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithUnread[]>([]);
  const [selected, setSelected] = useState<ConversationWithUnread | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, any[]>>({});
  const [newMsg, setNewMsg] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
      .select("*, jobs(title, status, agreed_price, provider_id)")
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
    if (messageIds.length === 0) { setAttachmentsMap({}); return; }
    const { data } = await supabase
      .from("message_attachments")
      .select("*")
      .in("message_id", messageIds);
    const map: Record<string, any[]> = {};
    for (const a of data ?? []) {
      if (!map[a.message_id]) map[a.message_id] = [];
      map[a.message_id].push(a);
    }
    setAttachmentsMap(map);
  };

  const openConversation = async (conv: ConversationWithUnread) => {
    setSelected(conv);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at");
    const msgs = data ?? [];
    setMessages(msgs);
    await fetchAttachments(msgs.map(m => m.id));

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
    if ((!newMsg.trim() && !pendingFile) || !selected) return;
    setSending(true);
    setUploading(!!pendingFile);

    const { data: msg, error } = await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body: newMsg.trim() || (pendingFile ? `📷 ${pendingFile.name}` : ""),
    } as any).select("id").single();

    if (error || !msg) {
      const isBlocked = error?.message?.includes("row-level security") || error?.code === "42501";
      toast({
        title: isBlocked ? "This conversation is closed" : "Failed to send",
        description: isBlocked ? "You can no longer send messages in this conversation." : error?.message,
        variant: "destructive",
      });
      setSending(false);
      setUploading(false);
      return;
    }

    if (pendingFile) {
      const path = `${user!.id}/${selected.id}/${Date.now()}-${pendingFile.name}`;
      const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, pendingFile);
      if (!upErr) {
        await supabase.from("message_attachments").insert({
          message_id: msg.id,
          file_url: path,
          file_name: pendingFile.name,
          file_type: pendingFile.type,
          file_size: pendingFile.size,
        } as any);
      } else {
        toast({ title: "Image upload failed", description: upErr.message, variant: "destructive" });
      }
      setPendingFile(null);
    }

    setNewMsg("");
    await refreshMessages();
    setSending(false);
    setUploading(false);
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
    await fetchAttachments(msgs.map(m => m.id));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendProposal = async (data: { agreed_price: number; start_date: string; start_time: string; duration: string; end_date: string }) => {
    if (!selected) return;
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
  const isConversationClosed = jobAccepted && selected?.jobs?.provider_id != null && selected.provider_user_id !== selected.jobs.provider_id;
  const isJobFinished = selected?.jobs?.status && ["completed", "cancelled"].includes(selected.jobs.status);
  const isChatReadOnly = isConversationClosed || isJobFinished;
  const closedReason = isConversationClosed
    ? "This conversation is closed because another provider was selected."
    : isJobFinished
    ? `This conversation is closed because the job has been ${selected?.jobs?.status === "cancelled" ? "cancelled" : "completed"}.`
    : null;

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
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
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

      <div className="flex-1 flex flex-col border rounded-lg">
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
              <h3 className="font-semibold text-sm">{selected.jobs?.title ?? "Chat"}</h3>
              {!jobAccepted && !isChatReadOnly && (
                <Button size="sm" variant="outline" onClick={() => { setProposeDefaults(undefined); setProposeOpen(true); }}>
                  <Handshake className="mr-2 h-4 w-4" /> Propose Terms
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isOwn={isOwn}
                    attachments={attachmentsMap[m.id] ?? []}
                  />
                );
              })}
              <div ref={bottomRef} />
            </div>
            {isChatReadOnly ? (
              <div className="p-3 border-t">
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  {closedReason}
                </div>
              </div>
            ) : (
              <div className="p-3 border-t flex gap-2 items-center">
                <ChatImageUpload
                  onFileSelected={setPendingFile}
                  uploading={uploading}
                  pendingFile={pendingFile}
                  onClear={() => setPendingFile(null)}
                />
                <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message…" onKeyDown={e => e.key === "Enter" && sendMessage()} className="flex-1" />
                <Button size="icon" onClick={sendMessage} disabled={sending || (!newMsg.trim() && !pendingFile)}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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
