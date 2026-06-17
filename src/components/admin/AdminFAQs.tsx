import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, GripVertical, Eye, EyeOff } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: boolean;
}

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Form state
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "General",
    sort_order: 0,
    is_published: true,
  });

  const fetchFaqs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order");
    setFaqs((data as FAQ[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const resetForm = () => {
    setForm({ question: "", answer: "", category: "General", sort_order: 0, is_published: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (faq: FAQ) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
    setEditingId(faq.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: "Error", description: "Question and answer are required", variant: "destructive" });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("faqs")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editingId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "FAQ updated" });
      }
    } else {
      const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 1;
      const { error } = await supabase
        .from("faqs")
        .insert({ ...form, sort_order: form.sort_order || nextOrder });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "FAQ created" });
      }
    }
    resetForm();
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "FAQ deleted" });
      fetchFaqs();
    }
  };

  const togglePublished = async (faq: FAQ) => {
    const { error } = await supabase
      .from("faqs")
      .update({ is_published: !faq.is_published, updated_at: new Date().toISOString() })
      .eq("id", faq.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchFaqs();
    }
  };

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">FAQ Management</h3>
          <p className="text-sm text-muted-foreground">{faqs.length} FAQs total</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add FAQ
        </Button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{editingId ? "Edit FAQ" : "Add New FAQ"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Question</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="e.g. How much does it cost?"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Answer</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Detailed answer..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. General, For Customers"
                  list="faq-categories"
                />
                <datalist id="faq-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="faq-published"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="faq-published" className="text-xs">Published</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                <Save className="h-3.5 w-3.5 mr-1" />
                {editingId ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm} size="sm">
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ List */}
      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
      ) : (
        <div className="space-y-1">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`flex items-start gap-3 p-4 border transition-colors ${
                !faq.is_published ? "opacity-50 bg-muted/30" : "hover:bg-muted/20"
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground leading-snug">{faq.question}</p>
                  <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 flex-shrink-0">
                    {faq.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublished(faq)} title={faq.is_published ? "Unpublish" : "Publish"}>
                  {faq.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(faq)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(faq.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFAQs;
