import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send } from "lucide-react";

const CustomerMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*, jobs(title)")
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
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selected.id)
      .order("created_at");
    setMessages(data ?? []);
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Realtime subscription
  useEffect(() => {
    if (!selected) return;
    const channel = supabase
      .channel(`messages-${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as any]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Conversation list */}
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

      {/* Chat area */}
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
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_user_id === user!.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.sender_user_id === user!.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p>{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.sender_user_id === user!.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
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
