import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";

interface LegalPage {
  id: string;
  slug: string;
  audience: string;
  title: string;
  content: string;
}

const PAGES = [
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "privacy-policy", label: "Privacy Policy" },
];

const AdminLegalPages = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { title: string; content: string }>>({});

  const fetchPages = async () => {
    setLoading(true);
    const { data } = await supabase.from("legal_pages").select("*").order("slug").order("audience");
    setPages((data as LegalPage[]) ?? []);
    const editMap: Record<string, { title: string; content: string }> = {};
    (data ?? []).forEach((p: LegalPage) => {
      editMap[p.id] = { title: p.title, content: p.content };
    });
    setEdits(editMap);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); }, []);

  const handleSave = async (page: LegalPage) => {
    const edit = edits[page.id];
    if (!edit) return;
    setSaving(page.id);
    const { error } = await supabase
      .from("legal_pages")
      .update({ title: edit.title, content: edit.content, updated_at: new Date().toISOString() })
      .eq("id", page.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${page.title} updated successfully.` });
    }
    setSaving(null);
  };

  const updateEdit = (id: string, field: "title" | "content", value: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  if (loading) return <p className="text-muted-foreground py-4">Loading legal pages...</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Edit the Terms of Service and Privacy Policy for customers and providers. Changes are saved immediately and visible on the public pages.
      </p>
      {PAGES.map((pageDef) => {
        const customerPage = pages.find((p) => p.slug === pageDef.slug && p.audience === "customer");
        const providerPage = pages.find((p) => p.slug === pageDef.slug && p.audience === "provider");
        return (
          <Card key={pageDef.slug}>
            <CardHeader>
              <CardTitle className="text-lg">{pageDef.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="customer">
                <TabsList className="mb-4">
                  <TabsTrigger value="customer">Customer Version</TabsTrigger>
                  <TabsTrigger value="provider">Provider Version</TabsTrigger>
                </TabsList>
                {[customerPage, providerPage].map((page) => {
                  if (!page) return null;
                  const edit = edits[page.id];
                  return (
                    <TabsContent key={page.id} value={page.audience} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={edit?.title ?? ""}
                          onChange={(e) => updateEdit(page.id, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea
                          value={edit?.content ?? ""}
                          onChange={(e) => updateEdit(page.id, "content", e.target.value)}
                          className="min-h-[300px] font-mono text-xs"
                        />
                      </div>
                      <Button onClick={() => handleSave(page)} disabled={saving === page.id}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving === page.id ? "Saving..." : "Save"}
                      </Button>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminLegalPages;
