import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Pencil, Briefcase, ArrowLeft, Eye, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Job = Tables<"jobs">;
type JobStatus = Database["public"]["Enums"]["job_status"];

const JOB_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  quoted: { label: "Quoted", variant: "secondary" },
  quotes_closed: { label: "Quotes Closed", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const AdminCustomerList = () => {
  const [customers, setCustomers] = useState<(Profile & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { categories: tradeCategories } = useTradeCategories(false);

  // Jobs view state
  const [viewingCustomer, setViewingCustomer] = useState<Profile | null>(null);
  const [customerJobs, setCustomerJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Job edit state
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobForm, setJobForm] = useState<Partial<Job>>({});
  const [jobSaving, setJobSaving] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Profile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");

    if (!roles?.length) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const ids = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    setCustomers((profiles ?? []).map((p) => ({ ...p, role: "customer" })));
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  const openEdit = (c: Profile) => {
    setEditing(c);
    setForm({ first_name: c.first_name, last_name: c.last_name, phone: c.phone, address_line_1: c.address_line_1, city: c.city, postcode: c.postcode });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const fullName = [form.first_name, form.last_name].filter(Boolean).join(" ");
    const { error } = await supabase
      .from("profiles")
      .update({ ...form, full_name: fullName })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      setEditing(null);
      fetchCustomers();
    }
  };

  const openCustomerJobs = async (customer: Profile) => {
    setViewingCustomer(customer);
    setJobsLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("customer_user_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading jobs", description: error.message, variant: "destructive" });
    }
    setCustomerJobs(data ?? []);
    setJobsLoading(false);
  };

  const openJobEdit = (job: Job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      description: job.description,
      category: job.category,
      postcode_district: job.postcode_district,
      budget: job.budget,
      timeline: job.timeline,
      status: job.status,
    });
  };

  const saveJobEdit = async () => {
    if (!editingJob) return;
    setJobSaving(true);
    const { error } = await supabase
      .from("jobs")
      .update(jobForm)
      .eq("id", editingJob.id);
    setJobSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job updated" });
      setEditingJob(null);
      // Refresh jobs list
      if (viewingCustomer) openCustomerJobs(viewingCustomer);
    }
  };

  const tradeName = (cat: string) => tradeCategories.find((t) => t.slug === cat)?.name ?? cat;

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: deletingCustomer.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Account deleted", description: `${deletingCustomer.full_name || "Customer"} has been removed.` });
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      toast({ title: "Error deleting account", description: err.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg = JOB_STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  // If viewing a customer's jobs, show that view
  if (viewingCustomer) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setViewingCustomer(null); setCustomerJobs([]); }}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Customers
          </Button>
          <h3 className="font-display text-lg font-semibold">
            Jobs posted by {viewingCustomer.full_name || viewingCustomer.email || "Customer"}
          </h3>
        </div>

        {jobsLoading ? (
          <p className="text-muted-foreground text-sm">Loading jobs…</p>
        ) : customerJobs.length === 0 ? (
          <p className="text-muted-foreground text-sm">This customer has not posted any jobs yet.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Postcode</TableHead>
                  <TableHead className="hidden md:table-cell">Budget</TableHead>
                  <TableHead className="hidden sm:table-cell">Quotes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Posted</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">{tradeName(job.category)}</TableCell>
                    <TableCell className="hidden md:table-cell">{(job as any).full_postcode ?? job.postcode_district}</TableCell>
                    <TableCell className="hidden md:table-cell">{job.budget || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{job.quote_count}/3</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openJobEdit(job)} title="Edit job">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Job Dialog */}
        <Dialog open={!!editingJob} onOpenChange={(o) => !o && setEditingJob(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input
                  value={jobForm.title ?? ""}
                  onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea
                  value={jobForm.description ?? ""}
                  onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select
                  value={jobForm.category ?? ""}
                  onValueChange={(v) => setJobForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tradeCategories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Postcode District</Label>
                  <Input
                    value={jobForm.postcode_district ?? ""}
                    onChange={(e) => setJobForm((f) => ({ ...f, postcode_district: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Budget</Label>
                  <Input
                    value={jobForm.budget ?? ""}
                    onChange={(e) => setJobForm((f) => ({ ...f, budget: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Timeline</Label>
                  <Input
                    value={jobForm.timeline ?? ""}
                    onChange={(e) => setJobForm((f) => ({ ...f, timeline: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <Select
                    value={jobForm.status ?? ""}
                    onValueChange={(v) => setJobForm((f) => ({ ...f, status: v as JobStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(JOB_STATUS_CONFIG).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
              <Button onClick={saveJobEdit} disabled={jobSaving}>
                {jobSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, city…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No customers found.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">City</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{c.email || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.phone || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.city || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openCustomerJobs(c)} title="View jobs">
                        <Briefcase className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit profile">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingCustomer(c)} title="Delete account">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {[
              { key: "first_name", label: "First name" },
              { key: "last_name", label: "Last name" },
              { key: "phone", label: "Phone" },
              { key: "address_line_1", label: "Address" },
              { key: "city", label: "City" },
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(o) => !o && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingCustomer?.full_name || "this customer"}</strong> ({deletingCustomer?.email || "no email"}) and all associated data including jobs and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCustomerList;
