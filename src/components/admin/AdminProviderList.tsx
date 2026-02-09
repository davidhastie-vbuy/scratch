import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Pencil, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TRADE_CATEGORIES } from "@/lib/trade-categories";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProviderProfile = Tables<"provider_profiles">;
type ProviderStatus = Database["public"]["Enums"]["provider_status"];
type TradeCategory = Database["public"]["Enums"]["trade_category"];

const statusConfig: Record<ProviderStatus, { label: string; icon: typeof CheckCircle; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", icon: CheckCircle, variant: "default" },
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  suspended: { label: "Suspended", icon: XCircle, variant: "destructive" },
};

const AdminProviderList = () => {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<ProviderProfile | null>(null);
  const [form, setForm] = useState<Partial<ProviderProfile>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("provider_profiles").select("*").order("created_at", { ascending: false });
    setProviders(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const filtered = providers.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.business_name.toLowerCase().includes(q) ||
      p.contact_first_name.toLowerCase().includes(q) ||
      p.contact_last_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id: string, status: ProviderStatus) => {
    const { error } = await supabase.from("provider_profiles").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Provider ${status}` });
      fetchProviders();
    }
  };

  const openEdit = (p: ProviderProfile) => {
    setEditing(p);
    setForm({
      business_name: p.business_name,
      contact_first_name: p.contact_first_name,
      contact_last_name: p.contact_last_name,
      phone: p.phone,
      business_address: p.business_address,
      postcode: p.postcode,
      trade_category: p.trade_category,
      business_description: p.business_description,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("provider_profiles").update(form).eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Provider updated" });
      setEditing(null);
      fetchProviders();
    }
  };

  const tradeName = (cat: TradeCategory) => TRADE_CATEGORIES.find((t) => t.value === cat)?.label ?? cat;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search providers…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No providers found.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const cfg = statusConfig[p.status];
                const Icon = cfg.icon;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.business_name}</TableCell>
                    <TableCell>{p.contact_first_name} {p.contact_last_name}</TableCell>
                    <TableCell>{tradeName(p.trade_category)}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {p.status === "pending" && (
                          <Button variant="ghost" size="sm" className="text-primary" onClick={() => updateStatus(p.id, "active")}>
                            Approve
                          </Button>
                        )}
                        {p.status === "active" && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateStatus(p.id, "suspended")}>
                            Suspend
                          </Button>
                        )}
                        {p.status === "suspended" && (
                          <Button variant="ghost" size="sm" className="text-primary" onClick={() => updateStatus(p.id, "active")}>
                            Reactivate
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {[
              { key: "business_name", label: "Business name" },
              { key: "contact_first_name", label: "First name" },
              { key: "contact_last_name", label: "Last name" },
              { key: "phone", label: "Phone" },
              { key: "business_address", label: "Address" },
              { key: "postcode", label: "Postcode" },
            ].map(({ key, label }) => (
              <div key={key} className="grid gap-1.5">
                <Label>{label}</Label>
                <Input
                  value={(form as Record<string, string | null>)[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="grid gap-1.5">
              <Label>Trade category</Label>
              <Select value={form.trade_category ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, trade_category: v as TradeCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRADE_CATEGORIES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.business_description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, business_description: e.target.value.slice(0, 300) }))}
                maxLength={300}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviderList;
