import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Handshake } from "lucide-react";
import ProposalCard from "@/components/messaging/ProposalCard";
import ProposeTermsDialog from "@/components/messaging/ProposeTermsDialog";

const ProviderMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*, jobs(title, status, agreed_price)")
      .eq("provider_user_id", user!.id)
      .order("created_at", { ascending: false });
    setConversations(data ?? []);
    setLoading(false);
  };

  const openConversation = async (conv: any) => {
    setSelected(conv);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at");
    setMessages(data ?? []);
    // Mark messages as read
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("conversation_id", conv.id)
      .neq("sender_user_id", user!.id)
      .is("read_at", null);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body: newMsg.trim(),
    } as any);
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
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendProposal = async (data: { agreed_price: number; start_date: string; start_time: string; duration: string }) => {
    if (!selected) return;
    await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body: `Proposal: £${data.agreed_price.toFixed(2)}, starting ${new Date(data.start_date).toLocaleDateString()}, duration: ${data.duration}`,
      message_type: "proposal",
      metadata: { ...data, status: "pending" },
    } as any);
    toast({ title: "Proposal sent to customer" });
    await refreshMessages();
  };

  // Check if there's already a pending proposal
  const hasPendingProposal = messages.some(
    m => (m as any).message_type === "proposal" && (m as any).metadata?.status === "pending"
  );

  // Check if job already has agreed terms
  const jobAccepted = selected?.jobs?.status && ["accepted", "in_progress", "completed"].includes(selected.jobs.status);

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
              className={`p-3 cursor-pointer hover:bg-accent/50 border-b text-sm ${selected?.id === c.id ? "bg-accent" : ""}`}
              onClick={() => openConversation(c)}
            >
              <p className="font-medium truncate">{(c as any).jobs?.title ?? "Job"}</p>
              <p className="text-xs text-muted-foreground">Customer conversation</p>
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
              <h3 className="font-semibold text-sm">{(selected as any).jobs?.title ?? "Chat"}</h3>
              {!jobAccepted && !hasPendingProposal && (
                <Button size="sm" variant="outline" onClick={() => setProposeOpen(true)}>
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
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p>{m.body}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message…" onKeyDown={e => e.key === "Enter" && sendMessage()} />
              <Button size="icon" onClick={sendMessage} disabled={sending || !newMsg.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <ProposeTermsDialog
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        onSubmit={sendProposal}
      />
    </div>
  );
};

export default ProviderMessages;
