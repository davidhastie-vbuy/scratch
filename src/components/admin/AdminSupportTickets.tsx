import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, Send } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "outline" },
  closed: { label: "Closed", variant: "destructive" },
};

const AdminSupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    const tickets = data ?? [];
    
    // Fetch user profiles and roles for all ticket creators
    const userIds = [...new Set(tickets.map(t => t.user_id))];
    const [profilesRes, rolesRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("id, first_name, last_name, full_name, email").in("id", userIds)
        : { data: [] },
      userIds.length > 0
        ? supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
        : { data: [] },
    ]);
    const profileMap: Record<string, any> = {};
    (profilesRes.data ?? []).forEach(p => { profileMap[p.id] = p; });
    const roleMap: Record<string, string> = {};
    (rolesRes.data ?? []).forEach(r => { roleMap[r.user_id] = r.role; });
    
    setTickets(tickets.map(t => ({
      ...t,
      _profile: profileMap[t.user_id] || null,
      _role: roleMap[t.user_id] || null,
    })));
    setLoading(false);
  };

  const openTicket = async (ticket: any) => {
    setViewing(ticket);
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at");
    setMessages(data ?? []);
  };

  const sendReply = async () => {
    if (!reply.trim() || !viewing) return;
    setSending(true);
    await supabase.from("support_ticket_messages").insert({
      ticket_id: viewing.id,
      sender_user_id: user!.id,
      body: reply.trim(),
      is_internal_note: isInternal,
    } as any);
    setReply("");
    setIsInternal(false);
    // Refresh messages
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", viewing.id)
      .order("created_at");
    setMessages(data ?? []);
    setSending(false);
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status } as any).eq("id", ticketId);
    toast({ title: `Ticket ${status.replace("_", " ")}` });
    fetchTickets();
    if (viewing?.id === ticketId) setViewing({ ...viewing, status });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No support tickets.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden sm:table-cell">Submitted By</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(t => {
                const st = STATUS_MAP[t.status] ?? { label: t.status, variant: "secondary" as const };
                return (
                  <TableRow key={t.id}>
                     <TableCell className="font-medium">{t.subject}</TableCell>
                     <TableCell className="hidden sm:table-cell">
                       <div className="text-sm">
                         {t._profile ? (t._profile.first_name || t._profile.last_name ? `${t._profile.first_name ?? ''} ${t._profile.last_name ?? ''}`.trim() : t._profile.full_name || '—') : '—'}
                       </div>
                       {t._profile?.email && <div className="text-xs text-muted-foreground">{t._profile.email}</div>}
                     </TableCell>
                     <TableCell className="hidden md:table-cell">
                       <Badge variant="outline" className="capitalize">{t._role ?? '—'}</Badge>
                     </TableCell>
                     <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                     <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openTicket(t)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewing?.subject}</DialogTitle>
            {viewing?._profile && (
              <p className="text-xs text-muted-foreground">
                Submitted by: {viewing._profile.first_name || viewing._profile.last_name ? `${viewing._profile.first_name ?? ''} ${viewing._profile.last_name ?? ''}`.trim() : viewing._profile.full_name || '—'}
                {viewing._profile.email ? ` (${viewing._profile.email})` : ''}
                {viewing._role ? ` · ${viewing._role}` : ''}
              </p>
            )}
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{viewing?.description}</p>

          <div className="flex gap-2 items-center">
            <Label className="text-xs">Status:</Label>
            <Select value={viewing?.status ?? "open"} onValueChange={(v) => updateStatus(viewing.id, v)}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {messages.map(m => (
              <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.is_internal_note ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900" : m.sender_user_id === user!.id ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                {m.is_internal_note && <p className="text-[10px] font-semibold text-amber-600 mb-1">Internal Note</p>}
                <p>{m.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {m.sender_user_id === user!.id ? "You (Admin)" : "User"} · {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="internal" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
              <Label htmlFor="internal" className="text-xs">Internal note (not visible to user)</Label>
            </div>
            <div className="flex gap-2">
              <Input value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply…" onKeyDown={e => e.key === "Enter" && sendReply()} />
              <Button size="icon" onClick={sendReply} disabled={sending || !reply.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupportTickets;
