import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wallet, ArrowDownLeft, ArrowUpRight, Banknote, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const ProviderAccount = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [providerProfile, setProviderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payout request form
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [bankForm, setBankForm] = useState({ accountName: "", sortCode: "", accountNumber: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [txRes, prRes, bdRes, ppRes] = await Promise.all([
      supabase.from("provider_transactions").select("*").eq("provider_user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("payout_requests").select("*").eq("provider_user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("provider_bank_details").select("*").eq("provider_user_id", user!.id).maybeSingle(),
      supabase.from("provider_profiles").select("platform_fee_percent").eq("user_id", user!.id).single(),
    ]);
    setTransactions(txRes.data ?? []);
    setPayoutRequests(prRes.data ?? []);
    setBankDetails(bdRes.data);
    setProviderProfile(ppRes.data);
    if (bdRes.data) {
      setBankForm({
        accountName: bdRes.data.account_name,
        sortCode: bdRes.data.sort_code,
        accountNumber: bdRes.data.account_number,
      });
    }
    setLoading(false);
  };

  // Balance = sum of all transaction amounts (earnings positive, payouts negative)
  const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const hasPendingPayout = payoutRequests.some(p => p.status === "pending");
  const feePercent = providerProfile?.platform_fee_percent ?? 10;

  const requestPayout = async () => {
    if (!bankForm.accountName || !bankForm.sortCode || !bankForm.accountNumber) {
      toast({ title: "Please fill in all bank details", variant: "destructive" });
      return;
    }
    // Validate sort code format (6 digits)
    const sortCodeClean = bankForm.sortCode.replace(/[^0-9]/g, "");
    if (sortCodeClean.length !== 6) {
      toast({ title: "Sort code must be 6 digits", variant: "destructive" });
      return;
    }
    // Validate account number (7-8 digits)
    const accNumClean = bankForm.accountNumber.replace(/[^0-9]/g, "");
    if (accNumClean.length < 7 || accNumClean.length > 8) {
      toast({ title: "Account number must be 7-8 digits", variant: "destructive" });
      return;
    }
    if (balance <= 0) {
      toast({ title: "No funds available for payout", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Save/update bank details
    if (bankDetails) {
      await supabase.from("provider_bank_details").update({
        account_name: bankForm.accountName.trim(),
        sort_code: sortCodeClean,
        account_number: accNumClean,
      } as any).eq("provider_user_id", user!.id);
    } else {
      await supabase.from("provider_bank_details").insert({
        provider_user_id: user!.id,
        account_name: bankForm.accountName.trim(),
        sort_code: sortCodeClean,
        account_number: accNumClean,
      } as any);
    }

    // Create payout request — the gross amount is the current balance
    // Balance already has the fee deducted (earnings are stored net), so amount = balance
    const { error } = await supabase.from("payout_requests").insert({
      provider_user_id: user!.id,
      amount: balance,
      platform_fee: 0, // fee was already deducted at earning time
      net_amount: balance,
    } as any);

    if (error) {
      toast({ title: "Failed to request payout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout requested!", description: "Your request is now pending admin approval." });
      setShowPayoutForm(false);
      fetchAll();
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="font-display text-2xl font-bold">Account</h2>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" /> Your Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">£{balance.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">Platform commission: {feePercent}% (deducted per milestone)</p>
            </div>
            {balance > 0 && !hasPendingPayout && (
              <Button onClick={() => setShowPayoutForm(true)}>
                <Banknote className="mr-2 h-4 w-4" /> Request Payout
              </Button>
            )}
            {hasPendingPayout && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Payout Pending
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payout Request Form */}
      {showPayoutForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">Request Payout — £{balance.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You will receive <strong>£{balance.toFixed(2)}</strong> (commission already deducted per milestone).
            </p>

            <Separator />

            <p className="text-sm font-medium">{bankDetails ? "Confirm your bank details" : "Enter your bank details"}</p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  value={bankForm.accountName}
                  onChange={e => setBankForm(f => ({ ...f, accountName: e.target.value }))}
                  placeholder="e.g. John Smith"
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Sort Code *</Label>
                  <Input
                    value={bankForm.sortCode}
                    onChange={e => setBankForm(f => ({ ...f, sortCode: e.target.value }))}
                    placeholder="00-00-00"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={requestPayout} disabled={submitting} className="flex-1">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Confirm & Request Payout"}
              </Button>
              <Button variant="outline" onClick={() => setShowPayoutForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payout Requests */}
      {payoutRequests.filter(p => p.status === "pending").length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Pending Payouts</CardTitle></CardHeader>
          <CardContent>
            {payoutRequests.filter(p => p.status === "pending").map(p => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">£{Number(p.net_amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Requested {format(new Date(p.created_at), "PPP")}</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rejected with notes */}
      {payoutRequests.filter(p => p.status === "rejected" && p.admin_note).length > 0 && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /> Rejected Payouts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {payoutRequests.filter(p => p.status === "rejected" && p.admin_note).map(p => (
              <div key={p.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">£{Number(p.net_amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "PPP")}</p>
                </div>
                <p className="text-sm text-destructive">{p.admin_note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet. Earnings will appear here as milestones are completed.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{format(new Date(t.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {t.type === "earning" ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                        )}
                        {t.description || t.type}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${Number(t.amount) >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {Number(t.amount) >= 0 ? "+" : ""}£{Math.abs(Number(t.amount)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderAccount;
