import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send } from "lucide-react";
import ProposalCard from "@/components/messaging/ProposalCard";

const CustomerMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*, jobs(title, status, id)")
      .eq("customer_user_id", user!.id)
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

  const handleAcceptProposal = async (message: any) => {
    setAccepting(true);
    const proposal = message.metadata;
    const jobId = selected?.job_id;

    if (!jobId) {
      toast({ title: "Error", description: "Could not find associated job.", variant: "destructive" });
      setAccepting(false);
      return;
    }

    // Calculate scheduled_start and scheduled_end from proposal
    const startDate = new Date(proposal.start_date);
    const [sh, sm] = (proposal.start_time || "09:00").split(":").map(Number);
    startDate.setHours(sh, sm, 0, 0);

    // Parse duration for end date (simple: look for number + days/weeks)
    const durationText = (proposal.duration || "").toLowerCase();
    const endDate = new Date(startDate);
    const daysMatch = durationText.match(/(\d+)\s*day/);
    const weeksMatch = durationText.match(/(\d+)\s*week/);
    if (weeksMatch) {
      endDate.setDate(endDate.getDate() + parseInt(weeksMatch[1]) * 7);
    } else if (daysMatch) {
      endDate.setDate(endDate.getDate() + parseInt(daysMatch[1]));
    } else {
      // Default 1 day
      endDate.setDate(endDate.getDate() + 1);
    }
    endDate.setHours(17, 0, 0, 0);

    // Update job: set agreed_price, scheduled dates, status to accepted, provider_id
    const { error: jobError } = await supabase.from("jobs").update({
      agreed_price: proposal.agreed_price,
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
      status: "accepted",
      provider_id: selected.provider_user_id,
    } as any).eq("id", jobId);

    if (jobError) {
      toast({ title: "Failed to confirm terms", description: jobError.message, variant: "destructive" });
      setAccepting(false);
      return;
    }

    // Accept the provider's quote (if exists)
    await supabase.from("quotes").update({ status: "accepted" } as any)
      .eq("job_id", jobId)
      .eq("provider_user_id", selected.provider_user_id);

    // Decline other quotes
    await supabase.from("quotes").update({ status: "declined" } as any)
      .eq("job_id", jobId)
      .neq("provider_user_id", selected.provider_user_id);

    // Update the proposal message metadata to "accepted"
    await supabase.from("messages").update({
      metadata: { ...proposal, status: "accepted" },
    } as any).eq("id", message.id);

    // Send confirmation system message
    await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body: `✅ Terms confirmed! Price: £${Number(proposal.agreed_price).toFixed(2)}, starting ${new Date(proposal.start_date).toLocaleDateString()}, duration: ${proposal.duration}. Work has been scheduled.`,
      message_type: "system",
    } as any);

    // Send confirmation emails via edge function
    try {
      await supabase.functions.invoke("send-provider-email", {
        body: {
          to: "provider", // Will be resolved by checking profiles
          subject: "TradeTrust — Job Terms Confirmed",
          html: `<h2>Job Terms Confirmed</h2><p>The customer has confirmed the terms for the job.</p><p><strong>Price:</strong> £${Number(proposal.agreed_price).toFixed(2)}<br/><strong>Start:</strong> ${startDate.toLocaleDateString()}<br/><strong>Duration:</strong> ${proposal.duration}</p><p>Log in to your TradeTrust dashboard for more details.</p>`,
        },
      });
    } catch {
      // Email is best-effort
    }

    toast({ title: "Terms confirmed!", description: "Work has been scheduled in the provider's calendar." });
    setAccepting(false);
    await refreshMessages();
    fetchConversations();
  };

  const handleDeclineProposal = async (message: any) => {
    setAccepting(true);
    const proposal = message.metadata;

    // Update the proposal message metadata to "declined"
    await supabase.from("messages").update({
      metadata: { ...proposal, status: "declined" },
    } as any).eq("id", message.id);

    // Send decline system message
    await supabase.from("messages").insert({
      conversation_id: selected.id,
      sender_user_id: user!.id,
      body: "❌ The proposed terms were declined. Please discuss and submit a revised proposal.",
      message_type: "system",
    } as any);

    toast({ title: "Proposal declined" });
    setAccepting(false);
    await refreshMessages();
  };

  // Realtime subscription
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
          <p className="text-sm text-muted-foreground p-4">No conversations yet. Accept a quote to start messaging.</p>
        ) : (
          conversations.map(c => (
            <div
              key={c.id}
              className={`p-3 cursor-pointer hover:bg-accent/50 border-b text-sm ${selected?.id === c.id ? "bg-accent" : ""}`}
              onClick={() => openConversation(c)}
            >
              <p className="font-medium truncate">{(c as any).jobs?.title ?? "Job"}</p>
              <p className="text-xs text-muted-foreground">Conversation</p>
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
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">{(selected as any).jobs?.title ?? "Chat"}</h3>
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
                        role="customer"
                        onAccept={() => handleAcceptProposal(m)}
                        onDecline={() => handleDeclineProposal(m)}
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
              <Input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <Button size="icon" onClick={sendMessage} disabled={sending || !newMsg.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerMessages;
