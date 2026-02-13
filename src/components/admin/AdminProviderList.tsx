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
import { Search, Pencil, CheckCircle, XCircle, Clock, FileText, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProviderProfile = Tables<"provider_profiles">;
type ProviderStatus = Database["public"]["Enums"]["provider_status"];

interface ProviderDocument {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

const statusConfig: Record<ProviderStatus, { label: string; icon: typeof CheckCircle; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", icon: CheckCircle, variant: "default" },
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  suspended: { label: "Suspended", icon: XCircle, variant: "destructive" },
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminProviderList = () => {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<ProviderProfile | null>(null);
  const [viewing, setViewing] = useState<ProviderProfile | null>(null);
  const [viewDocs, setViewDocs] = useState<ProviderDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [form, setForm] = useState<Partial<ProviderProfile>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { categories: tradeCategories } = useTradeCategories(false);

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

  const openView = async (p: ProviderProfile) => {
    setViewing(p);
    setDocsLoading(true);
    const { data } = await supabase
      .from("provider_documents")
      .select("id, file_url, file_name, file_type, file_size, uploaded_at")
      .eq("provider_profile_id", p.id)
      .order("uploaded_at", { ascending: false });
    setViewDocs((data as ProviderDocument[]) ?? []);
    setDocsLoading(false);
  };

  const downloadDoc = async (doc: ProviderDocument) => {
    const { data, error } = await supabase.storage
      .from("provider-documents")
      .createSignedUrl(doc.file_url, 60);

    if (error || !data?.signedUrl) {
      toast({ title: "Download failed", description: error?.message ?? "Could not generate download link", variant: "destructive" });
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  const tradeName = (cat: string) => tradeCategories.find((t) => t.slug === cat)?.name ?? cat;

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
                <TableHead className="w-[220px]">Actions</TableHead>
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
                        <Button variant="ghost" size="icon" onClick={() => openView(p)} title="View application">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit profile">
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

      {/* View Application Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Review — {viewing?.business_name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid gap-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span className="font-medium">{viewing.contact_first_name} {viewing.contact_last_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{viewing.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{viewing.business_address}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Postcode</span><span className="font-medium">{viewing.postcode}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Trade</span><span className="font-medium">{tradeName(viewing.trade_category)}</span></div>
                {(viewing as any).years_experience && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span className="font-medium">{(viewing as any).years_experience}</span></div>
                )}
                {(viewing as any).qualifications_certifications && (
                  <div><span className="text-muted-foreground">Qualifications</span><p className="mt-1 font-medium">{(viewing as any).qualifications_certifications}</p></div>
                )}
                {(viewing as any).about_work && (
                  <div><span className="text-muted-foreground">About Work</span><p className="mt-1 font-medium">{(viewing as any).about_work}</p></div>
                )}
                {(viewing as any).accreditations?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Accreditations</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {((viewing as any).accreditations as string[]).map((a) => (
                        <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(viewing as any).operating_areas?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Operating Areas</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {((viewing as any).operating_areas as string[]).map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {viewing.business_description && (
                  <div><span className="text-muted-foreground">Description</span><p className="mt-1 font-medium">{viewing.business_description}</p></div>
                )}
              </div>

              {/* Documents section */}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Supporting Documents
                </h4>
                {docsLoading ? (
                  <p className="text-muted-foreground text-xs">Loading documents…</p>
                ) : viewDocs.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No documents uploaded.</p>
                ) : (
                  <div className="space-y-1">
                    {viewDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-xs">{doc.file_name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatSize(doc.file_size)} · {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => downloadDoc(doc)} title="Download">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
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
              <Select value={form.trade_category ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, trade_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tradeCategories.map((t) => (
                    <SelectItem key={t.id} value={t.slug}>{t.name}</SelectItem>
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
