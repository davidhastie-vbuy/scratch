import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Check, X } from "lucide-react";
import { format } from "date-fns";

const AdminPayouts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    // Fetch payout requests with provider info
    const { data } = await supabase
      .from("payout_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Enrich with provider + bank details
      const providerIds = [...new Set(data.map(r => r.provider_user_id))];
      const [profilesRes, bankRes, namesRes] = await Promise.all([
        supabase.from("provider_profiles").select("user_id, business_name, platform_fee_percent").in("user_id", providerIds),
        supabase.from("provider_bank_details").select("*").in("provider_user_id", providerIds),
        supabase.from("profiles").select("id, full_name, email").in("id", providerIds),
      ]);

      const profileMap = Object.fromEntries((profilesRes.data ?? []).map(p => [p.user_id, p]));
      const bankMap = Object.fromEntries((bankRes.data ?? []).map(b => [b.provider_user_id, b]));
      const nameMap = Object.fromEntries((namesRes.data ?? []).map(n => [n.id, n]));

      setRequests(data.map(r => ({
        ...r,
        provider: profileMap[r.provider_user_id],
        bank: bankMap[r.provider_user_id],
        profile: nameMap[r.provider_user_id],
      })));
    }
    setLoading(false);
  };

  const handleApprove = async (req: any) => {
    setProcessing(true);
    setActionId(req.id);

    // 1. Update payout request to approved
    const { error: updateErr } = await supabase.from("payout_requests").update({
      status: "approved",
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    } as any).eq("id", req.id);

    if (updateErr) {
      toast({ title: "Failed to approve", description: updateErr.message, variant: "destructive" });
      setProcessing(false);
      setActionId(null);
      return;
    }

    // 2. Insert payout transaction (negative amount) for the provider
    // Using service role via RPC isn't available, so we use an edge function approach
    // For now, insert via a workaround: temporarily allow inserts or use edge function
    // Since provider_transactions has INSERT = false, we'll call an edge function
    const resp = await supabase.functions.invoke("process-payout", {
      body: {
        payout_request_id: req.id,
        provider_user_id: req.provider_user_id,
        amount: Number(req.net_amount),
      },
    });

    if (resp.error) {
      toast({ title: "Payout approved but transaction recording failed", description: String(resp.error), variant: "destructive" });
    } else {
      toast({ title: "Payout approved and recorded" });
    }

    fetchRequests();
    setProcessing(false);
    setActionId(null);
  };

  const handleReject = async (reqId: string) => {
    if (!rejectNote.trim()) {
      toast({ title: "Please provide a reason for rejection", variant: "destructive" });
      return;
    }
    setProcessing(true);
    setActionId(reqId);

    const { error } = await supabase.from("payout_requests").update({
      status: "rejected",
      admin_note: rejectNote.trim(),
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    } as any).eq("id", reqId);

    if (error) {
      toast({ title: "Failed to reject", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout request rejected" });
      setShowRejectForm(null);
      setRejectNote("");
    }

    fetchRequests();
    setProcessing(false);
    setActionId(null);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const pending = requests.filter(r => r.status === "pending");
  const history = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Payout Requests ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending payout requests.</p>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Bank Details</TableHead>
                  <TableHead className="hidden sm:table-cell">Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.provider?.business_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{r.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">£{Number(r.net_amount).toFixed(2)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {r.bank ? (
                        <div>
                          <p>{r.bank.account_name}</p>
                          <p className="text-muted-foreground">{r.bank.sort_code} / {r.bank.account_number}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No bank details</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{format(new Date(r.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      {showRejectForm === r.id ? (
                        <div className="space-y-2 text-left">
                          <Textarea
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            placeholder="Reason for rejection…"
                            rows={2}
                            maxLength={500}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)} disabled={processing && actionId === r.id}>
                              {processing && actionId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setShowRejectForm(null); setRejectNote(""); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleApprove(r)} disabled={processing && actionId === r.id}>
                            {processing && actionId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Approve</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setShowRejectForm(r.id); setRejectNote(""); }}>
                            <X className="mr-1 h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.provider?.business_name || "Unknown"}</TableCell>
                    <TableCell>£{Number(r.net_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(r.reviewed_at || r.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.admin_note || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPayouts;
