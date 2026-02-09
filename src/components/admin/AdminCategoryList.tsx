import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTradeCategories, type TradeCategory } from "@/hooks/use-trade-categories";

const AdminCategoryList = () => {
  const { categories, loading, refetch } = useTradeCategories(false);
  const [editing, setEditing] = useState<TradeCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setSlug("");
  };

  const openEdit = (cat: TradeCategory) => {
    setCreating(false);
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
  };

  const generateSlug = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const handleNameChange = (value: string) => {
    setName(value);
    if (creating) setSlug(generateSlug(value));
  };

  const saveCategory = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);

    if (creating) {
      const { error } = await supabase.from("trade_categories").insert({ name: name.trim(), slug: slug.trim() });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Category created" });
        setCreating(false);
        refetch();
      }
    } else if (editing) {
      const { error } = await supabase.from("trade_categories").update({ name: name.trim(), slug: slug.trim() }).eq("id", editing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Category updated" });
        setEditing(null);
        refetch();
      }
    }
    setSaving(false);
  };

  const toggleActive = async (cat: TradeCategory) => {
    const { error } = await supabase
      .from("trade_categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      refetch();
    }
  };

  const dialogOpen = creating || !!editing;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>
                    <Badge variant={cat.is_active ? "default" : "secondary"}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat)} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creating ? "New Category" : "Edit Category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Plumbing" />
            </div>
            <div className="grid gap-1.5">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. plumbing" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground">Used internally for data storage</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving || !name.trim() || !slug.trim()}>
              {saving ? "Saving…" : creating ? "Create" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategoryList;
