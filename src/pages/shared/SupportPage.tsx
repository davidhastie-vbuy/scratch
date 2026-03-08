import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, MessageSquare, Send, HelpCircle } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "outline" },
  closed: { label: "Closed", variant: "destructive" },
};

const SupportPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  };

  const createTicket = async () => {
    if (!newSubject.trim() || !newDesc.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user!.id,
      subject: newSubject.trim(),
      description: newDesc.trim(),
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ticket created" });
      setShowNew(false);
      setNewSubject("");
      setNewDesc("");
      fetchTickets();
    }
    setCreating(false);
  };

  const openTicket = async (ticket: any) => {
    setViewing(ticket);
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at");
    setTicketMessages(data ?? []);
  };

  const sendReply = async () => {
    if (!reply.trim() || !viewing) return;
    setSending(true);
    await supabase.from("support_ticket_messages").insert({
      ticket_id: viewing.id,
      sender_user_id: user!.id,
      body: reply.trim(),
      is_internal_note: false,
    } as any);
    setReply("");
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", viewing.id)
      .order("created_at");
    setTicketMessages(data ?? []);
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const openTickets = tickets.filter(t => t.status === "open");
  const inProgressTickets = tickets.filter(t => t.status === "in_progress");
  const closedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed");

  const renderTicketList = (list: any[], emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {list.map(t => {
          const st = STATUS_MAP[t.status] ?? { label: t.status, variant: "secondary" as const };
          return (
            <Card key={t.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => openTicket(t)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{t.subject}</CardTitle>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(t.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Support</h2>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open" className="gap-1.5">
            Open
            {openTickets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {openTickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5">
            In Progress
            {inProgressTickets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {inProgressTickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-1.5">
            Closed
            {closedTickets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                {closedTickets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          {renderTicketList(openTickets, "No open tickets. Create one if you need help.")}
        </TabsContent>
        <TabsContent value="in_progress">
          {renderTicketList(inProgressTickets, "No tickets currently being reviewed.")}
        </TabsContent>
        <TabsContent value="closed">
          {renderTicketList(closedTickets, "No resolved or closed tickets yet.")}
        </TabsContent>
      </Tabs>

      {/* New ticket dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} maxLength={200} placeholder="Brief summary of your issue" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} maxLength={2000} rows={4} placeholder="Describe your issue in detail…" />
            </div>
            <Button onClick={createTicket} disabled={creating} className="w-full">
              {creating ? "Creating…" : "Submit Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>{viewing?.subject}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{viewing?.description}</p>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {ticketMessages.map(m => (
              <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.sender_user_id === user!.id ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                <p>{m.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {m.sender_user_id === user!.id ? "You" : "Support"} · {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          {viewing?.status !== "closed" && (
            <div className="flex gap-2 pt-2 border-t">
              <Input value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply…" onKeyDown={e => e.key === "Enter" && sendReply()} />
              <Button size="icon" onClick={sendReply} disabled={sending || !reply.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportPage;
