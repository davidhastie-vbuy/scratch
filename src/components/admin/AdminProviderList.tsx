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
import { Separator } from "@/components/ui/separator";
import { Search, Pencil, CheckCircle, XCircle, Clock, FileText, Download, Eye, AlertTriangle, History, MessageSquare, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type ProviderProfile = Tables<"provider_profiles">;
type ProviderStatus = Database["public"]["Enums"]["provider_status"];

interface ProviderWithEmail extends ProviderProfile {
  email?: string;
}

interface ProviderDocument {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

const STATUS_ALL: { value: string; label: string; icon: typeof CheckCircle; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: "pending", label: "Pending", icon: Clock, variant: "secondary" },
  { value: "pending_review", label: "Pending Review", icon: Clock, variant: "secondary" },
  { value: "active", label: "Active", icon: CheckCircle, variant: "default" },
  { value: "suspended", label: "Suspended", icon: AlertTriangle, variant: "destructive" },
  { value: "denied", label: "Denied", icon: XCircle, variant: "destructive" },
  { value: "changes_requested", label: "Changes Requested", icon: MessageSquare, variant: "outline" },
];

const getStatusConfig = (status: string) =>
  STATUS_ALL.find((s) => s.value === status) ?? { value: status, label: status, icon: Clock, variant: "secondary" as const };

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminProviderList = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<ProviderWithEmail | null>(null);
  const [viewing, setViewing] = useState<ProviderWithEmail | null>(null);
  const [viewDocs, setViewDocs] = useState<ProviderDocument[]>([]);
  const [viewHistory, setViewHistory] = useState<StatusHistoryEntry[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [form, setForm] = useState<Partial<ProviderProfile>>({});
  const [saving, setSaving] = useState(false);
  // Deny / changes_requested dialog
  const [actionDialog, setActionDialog] = useState<{ provider: ProviderWithEmail; action: "denied" | "changes_requested" } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [editDocs, setEditDocs] = useState<ProviderDocument[]>([]);
  const [editDocsLoading, setEditDocsLoading] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [deletingProvider, setDeletingProvider] = useState<ProviderWithEmail | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();
  const { categories: tradeCategories } = useTradeCategories(false);

  const fetchProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("provider_profiles").select("*").order("created_at", { ascending: false });
    
    if (data) {
      // Fetch emails from profiles table for each provider
      const providersWithEmails = await Promise.all(
        data.map(async (provider) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", provider.user_id)
            .single();
          return { ...provider, email: profile?.email };
        })
      );
      setProviders(providersWithEmails);
    } else {
      setProviders([]);
    }
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

  const changeStatus = async (profileId: string, oldStatus: string, newStatus: ProviderStatus, note?: string) => {
    const { error } = await supabase.from("provider_profiles").update({
      status: newStatus,
      admin_note: note ?? null,
    } as any).eq("id", profileId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }

    // Log to status history
    await supabase.from("application_status_history").insert({
      provider_profile_id: profileId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: user!.id,
      note: note || null,
    } as any);

    toast({ title: `Provider ${newStatus.replace("_", " ")}` });
    fetchProviders();
    return true;
  };

  const handleApprove = async (p: ProviderWithEmail) => {
    const ok = await changeStatus(p.id, p.status, "active" as ProviderStatus);
    if (ok && p.email) {
      const providerName = `${p.contact_first_name} ${p.contact_last_name}`.trim();
      const dashboardLink = `${window.location.origin}/provider`;
      try {
        await supabase.functions.invoke("send-provider-email", {
          body: {
            to: p.email,
            subject: "TradeTrust — Your application has been approved! 🎉",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Congratulations, ${providerName}!</h2>
                <p>Great news — your TradeTrust provider application has been <strong>approved</strong>.</p>
                <p>You can now log in and start viewing jobs available in your local area, submit quotes, and grow your business through TradeTrust.</p>
                <p style="margin: 24px 0;">
                  <a href="${dashboardLink}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Available Jobs</a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact our support team.</p>
                <p style="color: #6b7280; font-size: 14px;">— The TradeTrust Team</p>
              </div>
            `,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send approval email:", emailErr);
      }
    }
  };

  const handleActionSubmit = async () => {
    if (!actionDialog) return;
    if (actionDialog.action === "denied" && !adminNote.trim()) {
      toast({ title: "Note required", description: "Please provide a reason for denying this application.", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    const ok = await changeStatus(
      actionDialog.provider.id,
      actionDialog.provider.status,
      actionDialog.action as ProviderStatus,
      adminNote.trim()
    );
    // Send email notification for changes_requested
    if (ok && actionDialog.action === "changes_requested" && actionDialog.provider.email) {
      const providerName = `${actionDialog.provider.contact_first_name} ${actionDialog.provider.contact_last_name}`.trim();
      const profileLink = `${window.location.origin}/provider/profile`;
      try {
        await supabase.functions.invoke("send-provider-email", {
          body: {
            to: actionDialog.provider.email,
            subject: "TradeTrust — Changes requested on your application",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Hi ${providerName},</h2>
                <p>The TradeTrust team has reviewed your provider application and requested some changes before approval.</p>
                ${adminNote.trim() ? `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;"><strong>Admin feedback:</strong><br/>${adminNote.trim()}</div>` : ""}
                <p>Please log in to your dashboard to review the feedback and update your application:</p>
                <p style="margin: 24px 0;">
                  <a href="${profileLink}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to My Profile</a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact our support team.</p>
                <p style="color: #6b7280; font-size: 14px;">— The TradeTrust Team</p>
              </div>
            `,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send changes-requested email:", emailErr);
        // Non-blocking — status change already succeeded
      }
    }
    setActionLoading(false);
    if (ok) {
      setActionDialog(null);
      setAdminNote("");
    }
  };

  const openEdit = (p: ProviderWithEmail) => {
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
      years_experience: p.years_experience,
      qualifications_certifications: p.qualifications_certifications,
      about_work: p.about_work,
      accreditations: p.accreditations,
      operating_areas: p.operating_areas,
      platform_fee_percent: (p as any).platform_fee_percent ?? 10,
    });
    // Also load docs for the edit dialog
    loadEditDocs(p.id);
  };


  const loadEditDocs = async (profileId: string) => {
    setEditDocsLoading(true);
    const { data } = await supabase
      .from("provider_documents")
      .select("id, file_url, file_name, file_type, file_size, uploaded_at")
      .eq("provider_profile_id", profileId)
      .order("uploaded_at", { ascending: false });
    setEditDocs((data as ProviderDocument[]) ?? []);
    setEditDocsLoading(false);
  };

  const EXPERIENCE_OPTIONS = [
    "Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10-20 years", "20+ years",
  ];

  const ACCREDITATION_OPTIONS = [
    "Public Liability Insurance", "Gas Safe Registered", "NICEIC / Electrical Certification",
  ];

  const toggleEditAccreditation = (value: string) => {
    const current = (form.accreditations as string[]) ?? [];
    setForm((f) => ({
      ...f,
      accreditations: current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value],
    }));
  };

  const addOperatingArea = () => {
    const trimmed = newArea.trim().toUpperCase();
    if (!trimmed) return;
    const current = (form.operating_areas as string[]) ?? [];
    if (!current.includes(trimmed)) {
      setForm((f) => ({ ...f, operating_areas: [...current, trimmed] }));
    }
    setNewArea("");
  };
  const removeOperatingArea = (area: string) => {
    setForm((f) => ({ ...f, operating_areas: ((f.operating_areas as string[]) ?? []).filter((a) => a !== area) }));
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

  const openView = async (p: ProviderWithEmail) => {
    setViewing(p);
    setDocsLoading(true);

    const [docsRes, historyRes] = await Promise.all([
      supabase
        .from("provider_documents")
        .select("id, file_url, file_name, file_type, file_size, uploaded_at")
        .eq("provider_profile_id", p.id)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("application_status_history")
        .select("id, old_status, new_status, note, created_at")
        .eq("provider_profile_id", p.id)
        .order("created_at", { ascending: false }),
    ]);

    setViewDocs((docsRes.data as ProviderDocument[]) ?? []);
    setViewHistory((historyRes.data as StatusHistoryEntry[]) ?? []);
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

  const handleDeleteProvider = async () => {
    if (!deletingProvider) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: deletingProvider.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Account deleted", description: `${deletingProvider.business_name} has been removed.` });
      setDeletingProvider(null);
      fetchProviders();
    } catch (err: any) {
      toast({ title: "Error deleting account", description: err.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search providers…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_ALL.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
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
                <TableHead>Email</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[260px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const cfg = getStatusConfig(p.status);
                const Icon = cfg.icon;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.business_name}</TableCell>
                    <TableCell>{p.contact_first_name} {p.contact_last_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.email || "N/A"}</TableCell>
                    <TableCell>{tradeName(p.trade_category)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(p.status === "pending" || p.status === "pending_review" as string || p.status === "changes_requested" as string) && (
                          <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleApprove(p)}>
                            Approve
                          </Button>
                        )}
                        {(p.status === "pending" || p.status === "pending_review" as string || p.status === "changes_requested" as string) && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setActionDialog({ provider: p, action: "denied" }); setAdminNote(""); }}>
                            Deny
                          </Button>
                        )}
                        {(p.status === "pending" || p.status === "pending_review" as string) && (
                          <Button variant="ghost" size="sm" onClick={() => { setActionDialog({ provider: p, action: "changes_requested" }); setAdminNote(""); }}>
                            Request Changes
                          </Button>
                        )}
                        {p.status === "active" && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => changeStatus(p.id, p.status, "suspended" as ProviderStatus)}>
                            Suspend
                          </Button>
                        )}
                        {p.status === "suspended" && (
                          <Button variant="ghost" size="sm" className="text-primary" onClick={() => changeStatus(p.id, p.status, "active" as ProviderStatus)}>
                            Reactivate
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openView(p)} title="View application">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit profile">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingProvider(p)} title="Delete account">
                          <Trash2 className="h-4 w-4" />
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

      {/* Deny / Request Changes Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "denied" ? "Deny Application" : "Request Changes"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {actionDialog?.action === "denied"
                ? `Denying application for ${actionDialog.provider.business_name}. A reason is required.`
                : `Request changes from ${actionDialog?.provider.business_name}. Provide details about what needs to be updated.`
              }
            </p>
            <div className="space-y-2">
              <Label>Admin Note {actionDialog?.action === "denied" && <span className="text-destructive">*</span>}</Label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={actionDialog?.action === "denied" ? "Reason for denial..." : "What changes are needed..."}
                rows={4}
                maxLength={1000}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant={actionDialog?.action === "denied" ? "destructive" : "default"}
              onClick={handleActionSubmit}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : actionDialog?.action === "denied" ? "Deny Application" : "Request Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                 <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{viewing.email || "N/A"}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{viewing.phone}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{viewing.business_address}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Postcode</span><span className="font-medium">{viewing.postcode}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Trade</span><span className="font-medium">{tradeName(viewing.trade_category)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span className="font-medium">{new Date(viewing.created_at).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                  <Badge variant={getStatusConfig(viewing.status).variant} className="gap-1">
                    {getStatusConfig(viewing.status).label}
                  </Badge>
                </div>
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
                {(viewing as any).pending_operating_areas?.length > 0 && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30 space-y-2">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Pending Area Change Request</span>
                    <div className="flex flex-wrap gap-1">
                      {((viewing as any).pending_operating_areas as string[]).map((a: string) => (
                        <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="default" onClick={async () => {
                        const { error } = await supabase.from("provider_profiles").update({
                          operating_areas: (viewing as any).pending_operating_areas,
                          pending_operating_areas: null,
                        } as any).eq("id", viewing!.id);
                        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                        toast({ title: "Operating areas updated" });
                        setViewing(null);
                        fetchProviders();
                      }}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { error } = await supabase.from("provider_profiles").update({
                          pending_operating_areas: null,
                        } as any).eq("id", viewing!.id);
                        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                        toast({ title: "Area change rejected" });
                        setViewing(null);
                        fetchProviders();
                      }}>Reject</Button>
                    </div>
                  </div>
                )}
                {(viewing as any).pending_trade_category && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30 space-y-2">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Pending Trade Category Change</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{tradeName(viewing!.trade_category)}</Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-xs">{tradeName((viewing as any).pending_trade_category)}</Badge>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="default" onClick={async () => {
                        const { error } = await supabase.from("provider_profiles").update({
                          trade_category: (viewing as any).pending_trade_category,
                          pending_trade_category: null,
                        } as any).eq("id", viewing!.id);
                        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                        toast({ title: "Trade category updated" });
                        setViewing(null);
                        fetchProviders();
                      }}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { error } = await supabase.from("provider_profiles").update({
                          pending_trade_category: null,
                        } as any).eq("id", viewing!.id);
                        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                        toast({ title: "Category change rejected" });
                        setViewing(null);
                        fetchProviders();
                      }}>Reject</Button>
                    </div>
                  </div>
                )}
                {/* Additional categories */}
                {(viewing as any).additional_categories?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Additional Categories</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {((viewing as any).additional_categories as string[]).map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">{tradeName(a)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(viewing as any).pending_additional_categories?.length > 0 && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30 space-y-2">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Pending Additional Categories</span>
                    <div className="flex flex-wrap gap-1">
                      {((viewing as any).pending_additional_categories as string[]).map((a: string) => (
                        <Badge key={a} variant="outline" className="text-xs">{tradeName(a)}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="default" onClick={async () => {
                        const currentAdditional = ((viewing as any).additional_categories as string[]) ?? [];
                        const pendingAdditional = ((viewing as any).pending_additional_categories as string[]) ?? [];
                        const merged = [...currentAdditional, ...pendingAdditional].slice(0, 2);
                        const { error } = await supabase.from("provider_profiles").update({
                          additional_categories: merged,
                          pending_additional_categories: null,
                        } as any).eq("id", viewing!.id);
                        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                        toast({ title: "Additional categories approved" });
                        setViewing(null);
                        fetchProviders();
                      }}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { error } = await supabase.from("provider_profiles").update({
                          pending_additional_categories: null,
                        } as any).eq("id", viewing!.id);
                        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                        toast({ title: "Additional categories rejected" });
                        setViewing(null);
                        fetchProviders();
                      }}>Reject</Button>
                    </div>
                  </div>
                )}
                {(viewing as any).admin_note && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Admin Note</span>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{(viewing as any).admin_note}</p>
                  </div>
                )}
                {viewing.business_description && (
                  <div><span className="text-muted-foreground">Description</span><p className="mt-1 font-medium">{viewing.business_description}</p></div>
                )}
              </div>

              {/* Documents */}
              <Separator />
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

              {/* Status History */}
              {viewHistory.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                      <History className="h-4 w-4" />
                      Status History
                    </h4>
                    <div className="space-y-2">
                      {viewHistory.map((h) => (
                        <div key={h.id} className="rounded border border-border bg-muted/30 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {h.old_status && (
                                <>
                                  <Badge variant="outline" className="text-[10px]">{h.old_status.replace("_", " ")}</Badge>
                                  <span>→</span>
                                </>
                              )}
                              <Badge variant={getStatusConfig(h.new_status).variant} className="text-[10px]">
                                {getStatusConfig(h.new_status).label}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                          </div>
                          {h.note && <p className="mt-1 text-muted-foreground">{h.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Provider — {editing?.business_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Business Details */}
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Business Details</h4>
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
              <Label>Description</Label>
              <Textarea
                value={form.business_description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, business_description: e.target.value.slice(0, 300) }))}
                maxLength={300}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Platform Fee (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={(form as any).platform_fee_percent ?? 10}
                onChange={(e) => setForm((f) => ({ ...f, platform_fee_percent: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Percentage taken from each payment release to this provider.</p>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Trade Details</h4>

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
              <Label>Years of Experience</Label>
              <Select value={form.years_experience ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, years_experience: v }))}>
                <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Qualifications & Certifications</Label>
              <Textarea
                value={form.qualifications_certifications ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, qualifications_certifications: e.target.value }))}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>About Work</Label>
              <Textarea
                value={form.about_work ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, about_work: e.target.value }))}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Accreditations</Label>
              {ACCREDITATION_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-accred-${opt}`}
                    checked={((form.accreditations as string[]) ?? []).includes(opt)}
                    onCheckedChange={() => toggleEditAccreditation(opt)}
                  />
                  <Label htmlFor={`edit-accred-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                </div>
              ))}
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Operating Areas</h4>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add postcode district e.g. SW1"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOperatingArea())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addOperatingArea}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {((form.operating_areas as string[]) ?? []).map((area) => (
                  <Badge key={area} variant="secondary" className="gap-1">
                    {area}
                    <button type="button" onClick={() => removeOperatingArea(area)} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Documents (read-only view) */}
            <Separator />
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Uploaded Documents
            </h4>
            {editDocsLoading ? (
              <p className="text-muted-foreground text-xs">Loading documents…</p>
            ) : editDocs.length === 0 ? (
              <p className="text-muted-foreground text-xs">No documents uploaded.</p>
            ) : (
              <div className="space-y-1">
                {editDocs.map((doc) => (
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProvider} onOpenChange={(o) => !o && setDeletingProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingProvider?.business_name}</strong> ({deletingProvider?.email || "no email"}) and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProvider} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProviderList;
