import { useEffect, useState, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Camera, Loader2, MapPin, Plus, X, Clock, Wrench, Mail, Upload, FileText, Trash2, Eye } from "lucide-react";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import DocumentViewer from "@/components/DocumentViewer";

interface ProviderProfileData {
  business_name: string;
  contact_first_name: string;
  contact_last_name: string;
  phone: string;
  business_address: string;
  postcode: string;
  trade_category: string;
  business_description: string;
  logo_url: string;
  operating_areas: string[];
  pending_operating_areas: string[] | null;
  pending_trade_category: string | null;
  additional_categories: string[];
  pending_additional_categories: string[] | null;
  email_notifications_enabled: boolean;
}

const ProviderProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const { categories: tradeCategories } = useTradeCategories(true);

  const [profile, setProfile] = useState<ProviderProfileData>({
    business_name: "", contact_first_name: "", contact_last_name: "",
    phone: "", business_address: "", postcode: "",
    trade_category: "other", business_description: "", logo_url: "",
    operating_areas: [], pending_operating_areas: null, pending_trade_category: null,
    additional_categories: [], pending_additional_categories: null,
    email_notifications_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [editedAreas, setEditedAreas] = useState<string[]>([]);
  const [areasEdited, setAreasEdited] = useState(false);
  const [savingAreas, setSavingAreas] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [selectedAdditional, setSelectedAdditional] = useState("");
  const [savingAdditional, setSavingAdditional] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; file_name: string; file_url: string; file_size: number; file_type: string; uploaded_at: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<typeof documents[0] | null>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("provider_profiles")
      .select("id, status, business_name, contact_first_name, contact_last_name, phone, business_address, postcode, trade_category, business_description, logo_url, operating_areas, pending_operating_areas, pending_trade_category, additional_categories, pending_additional_categories, email_notifications_enabled")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      const areas = (data.operating_areas as string[]) ?? [];
      setProfile({
        business_name: data.business_name ?? "", contact_first_name: data.contact_first_name ?? "",
        contact_last_name: data.contact_last_name ?? "", phone: data.phone ?? "",
        business_address: data.business_address ?? "", postcode: data.postcode ?? "",
        trade_category: data.trade_category ?? "other", business_description: data.business_description ?? "",
        logo_url: data.logo_url ?? "",
        operating_areas: areas,
        pending_operating_areas: (data as any).pending_operating_areas ?? null,
        pending_trade_category: (data as any).pending_trade_category ?? null,
        additional_categories: (data as any).additional_categories ?? [],
        pending_additional_categories: (data as any).pending_additional_categories ?? null,
        email_notifications_enabled: (data as any).email_notifications_enabled ?? true,
      });
      setEditedAreas(areas);
      setProviderProfileId(data.id);
      setProviderStatus(data.status);

      // Fetch documents
      const { data: docs } = await supabase
        .from("provider_documents")
        .select("id, file_name, file_url, file_size, file_type, uploaded_at")
        .eq("user_id", user!.id)
        .order("uploaded_at", { ascending: false });
      if (docs) setDocuments(docs);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("provider_profiles").update({
      business_name: profile.business_name.trim(), contact_first_name: profile.contact_first_name.trim(),
      contact_last_name: profile.contact_last_name.trim(), phone: profile.phone.trim(),
      business_address: profile.business_address.trim(), postcode: profile.postcode.trim(),
      business_description: profile.business_description.trim(),
    }).eq("user_id", user!.id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
    setSaving(false);
  };

  const handleResubmit = async () => {
    setResubmitting(true);
    const { error } = await supabase.rpc("resubmit_provider_application", {
      _user_id: user!.id,
    });
    if (error) {
      toast({ title: "Re-submit failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Application re-submitted", description: "Your updated application has been sent for admin review." });
      setProviderStatus("pending_review");
    }
    setResubmitting(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large", variant: "destructive" }); return; }
    setUploading(true);
    const path = `${user!.id}/logo.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("provider_profiles").update({ logo_url: logoUrl }).eq("user_id", user!.id);
    setProfile(p => ({ ...p, logo_url: logoUrl }));
    toast({ title: "Logo updated" });
    setUploading(false);
  };

  const addArea = () => {
    const trimmed = newArea.trim().toUpperCase();
    if (!trimmed) return;
    if (!editedAreas.includes(trimmed)) {
      setEditedAreas(prev => [...prev, trimmed]);
      setAreasEdited(true);
    }
    setNewArea("");
  };

  const removeArea = (area: string) => {
    setEditedAreas(prev => prev.filter(a => a !== area));
    setAreasEdited(true);
  };

  const submitAreaChange = async () => {
    if (editedAreas.length === 0) {
      toast({ title: "At least one area required", description: "Please add at least one operating area.", variant: "destructive" });
      return;
    }
    setSavingAreas(true);
    const { error } = await supabase.from("provider_profiles").update({
      pending_operating_areas: editedAreas,
    } as any).eq("user_id", user!.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Area change submitted", description: "Your updated operating areas have been submitted for admin approval." });
      setProfile(p => ({ ...p, pending_operating_areas: editedAreas }));
      setAreasEdited(false);
    }
    setSavingAreas(false);
  };

  const submitCategoryChange = async () => {
    if (!selectedCategory || selectedCategory === profile.trade_category) {
      toast({ title: "No change", description: "Please select a different category.", variant: "destructive" });
      return;
    }
    setSavingCategory(true);
    const { error } = await supabase.from("provider_profiles").update({
      pending_trade_category: selectedCategory,
    } as any).eq("user_id", user!.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category change submitted", description: "Your trade category change has been submitted for admin approval." });
      setProfile(p => ({ ...p, pending_trade_category: selectedCategory }));
      setSelectedCategory("");
    }
    setSavingCategory(false);
  };

  const submitAdditionalCategory = async () => {
    if (!selectedAdditional) return;
    const allCurrent = [profile.trade_category, ...profile.additional_categories];
    if (allCurrent.includes(selectedAdditional)) {
      toast({ title: "Already added", description: "This category is already in your profile.", variant: "destructive" });
      return;
    }
    const pendingOnes = profile.pending_additional_categories ?? [];
    if (pendingOnes.includes(selectedAdditional)) {
      toast({ title: "Already pending", description: "This category is already pending approval.", variant: "destructive" });
      return;
    }
    if (profile.additional_categories.length + pendingOnes.length >= 2) {
      toast({ title: "Maximum reached", description: "You can add up to 2 additional categories.", variant: "destructive" });
      return;
    }
    setSavingAdditional(true);
    const newPending = [...pendingOnes, selectedAdditional];
    const { error } = await supabase.from("provider_profiles").update({
      pending_additional_categories: newPending,
    } as any).eq("user_id", user!.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Additional category submitted", description: "Your request has been submitted for admin approval." });
      setProfile(p => ({ ...p, pending_additional_categories: newPending }));
      setSelectedAdditional("");
    }
    setSavingAdditional(false);
  };

  const ACCEPTED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
  const MAX_DOC_SIZE = 5 * 1024 * 1024;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!providerProfileId) return;
    setUploadingDoc(true);

    for (const file of files) {
      if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
        toast({ title: "Unsupported format", description: `${file.name}: only PDF, JPG, PNG allowed.`, variant: "destructive" });
        continue;
      }
      if (file.size > MAX_DOC_SIZE) {
        toast({ title: "File too large", description: `${file.name}: max 5MB.`, variant: "destructive" });
        continue;
      }

      const storagePath = `${user!.id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("provider-documents").upload(storagePath, file);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        continue;
      }

      const { data: docRow, error: insertErr } = await supabase.from("provider_documents").insert({
        provider_profile_id: providerProfileId,
        user_id: user!.id,
        file_url: storagePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      } as any).select("id, file_name, file_url, file_size, file_type, uploaded_at").single();

      if (insertErr) {
        toast({ title: "Save failed", description: insertErr.message, variant: "destructive" });
      } else if (docRow) {
        setDocuments(prev => [docRow, ...prev]);
      }
    }

    toast({ title: "Documents uploaded" });
    setUploadingDoc(false);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleDeleteDoc = async (doc: typeof documents[0]) => {
    const { error: storageErr } = await supabase.storage.from("provider-documents").remove([doc.file_url]);
    if (storageErr) console.error("Storage delete error:", storageErr);

    const { error: dbErr } = await supabase.from("provider_documents").delete().eq("id", doc.id);
    if (dbErr) {
      toast({ title: "Delete failed", description: dbErr.message, variant: "destructive" });
      return;
    }
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    toast({ title: "Document deleted" });
  };

  const initials = `${profile.contact_first_name?.[0] ?? ""}${profile.contact_last_name?.[0] ?? ""}`.toUpperCase() || "?";

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const hasPendingAreas = profile.pending_operating_areas && profile.pending_operating_areas.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {providerStatus === "changes_requested" && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Changes have been requested</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Update your details and documents, then re-submit for review.</p>
            </div>
            <Button onClick={handleResubmit} disabled={resubmitting} className="shrink-0">
              {resubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Re-submit for Review"}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business details and logo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.logo_url || undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div>
              <p className="font-medium">{profile.business_name}</p>
              <p className="text-sm text-muted-foreground">
                {tradeCategories.find(c => c.slug === profile.trade_category)?.name ?? profile.trade_category}
              </p>
            </div>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label>Business name</Label><Input value={profile.business_name} onChange={e => setProfile(p => ({ ...p, business_name: e.target.value }))} required maxLength={200} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Contact first name</Label><Input value={profile.contact_first_name} onChange={e => setProfile(p => ({ ...p, contact_first_name: e.target.value }))} required maxLength={100} /></div>
              <div className="space-y-2"><Label>Contact last name</Label><Input value={profile.contact_last_name} onChange={e => setProfile(p => ({ ...p, contact_last_name: e.target.value }))} required maxLength={100} /></div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={user?.email ?? ""} disabled className="pl-10 bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground">To change your email, please contact support</p>
            </div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} required maxLength={20} /></div>
            <div className="space-y-2"><Label>Business address</Label><Input value={profile.business_address} onChange={e => setProfile(p => ({ ...p, business_address: e.target.value }))} required maxLength={255} /></div>
            <div className="space-y-2">
              <Label>Postcode</Label>
              <Input value={profile.postcode} onChange={e => setProfile(p => ({ ...p, postcode: e.target.value }))} required maxLength={10} />
            </div>
            <div className="space-y-2">
              <Label>Short description</Label>
              <Textarea value={profile.business_description} onChange={e => setProfile(p => ({ ...p, business_description: e.target.value }))} maxLength={300} rows={3} />
              <p className="text-xs text-muted-foreground">{profile.business_description.length}/300</p>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Trade Categories Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Trade Categories
          </CardTitle>
          <CardDescription>Your primary category and up to 2 additional categories. Changes require admin approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Primary category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Primary category</Label>
            <Badge variant="secondary" className="text-sm">
              {tradeCategories.find(c => c.slug === profile.trade_category)?.name ?? profile.trade_category}
            </Badge>
          </div>

          {profile.pending_trade_category && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Primary category change pending</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {tradeCategories.find(c => c.slug === profile.pending_trade_category)?.name ?? profile.pending_trade_category}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Change primary category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue placeholder="Select a new category" /></SelectTrigger>
              <SelectContent>
                {tradeCategories
                  .filter(c => c.slug !== profile.trade_category)
                  .map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && selectedCategory !== profile.trade_category && (
            <Button onClick={submitCategoryChange} disabled={savingCategory} className="w-full">
              {savingCategory ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit primary category change for approval"}
            </Button>
          )}

          {/* Additional categories */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-medium">Additional categories ({profile.additional_categories.length}/2)</Label>
            {profile.additional_categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.additional_categories.map(cat => (
                  <Badge key={cat} variant="secondary" className="text-sm">
                    {tradeCategories.find(c => c.slug === cat)?.name ?? cat}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No additional categories approved yet.</p>
            )}

            {/* Pending additional */}
            {profile.pending_additional_categories && profile.pending_additional_categories.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Additional categories pending approval</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.pending_additional_categories.map(cat => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {tradeCategories.find(c => c.slug === cat)?.name ?? cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add additional category */}
            {(() => {
              const pendingCount = (profile.pending_additional_categories ?? []).length;
              const totalSlots = profile.additional_categories.length + pendingCount;
              if (totalSlots >= 2) return null;
              const usedSlugs = [profile.trade_category, ...profile.additional_categories, ...(profile.pending_additional_categories ?? [])];
              const available = tradeCategories.filter(c => !usedSlugs.includes(c.slug));
              if (available.length === 0) return null;
              return (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Add additional category</Label>
                  <div className="flex gap-2">
                    <Select value={selectedAdditional} onValueChange={setSelectedAdditional}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                      <SelectContent>
                        {available.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={submitAdditionalCategory} disabled={!selectedAdditional || savingAdditional} size="sm">
                      {savingAdditional ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Operating Areas Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Operating Areas
          </CardTitle>
          <CardDescription>Postcode districts where you provide services. Changes require admin approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current approved areas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current approved areas</Label>
            <div className="flex flex-wrap gap-2">
              {profile.operating_areas.length > 0 ? (
                profile.operating_areas.map(area => (
                  <Badge key={area} variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {area}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No operating areas set.</p>
              )}
            </div>
          </div>

          {/* Pending change banner */}
          {hasPendingAreas && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Area change pending approval</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.pending_operating_areas!.map(area => (
                      <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit areas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{hasPendingAreas ? "Update your request" : "Edit operating areas"}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedAreas.map(area => (
                <Badge key={area} variant="default" className="gap-1 pr-1">
                  {area}
                  <button type="button" onClick={() => removeArea(area)} className="ml-1 rounded-full hover:bg-primary-foreground/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. SW1, E1, Manchester"
                value={newArea}
                onChange={e => setNewArea(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addArea(); } }}
                maxLength={20}
              />
              <Button type="button" variant="outline" size="icon" onClick={addArea}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {areasEdited && (
            <Button onClick={submitAreaChange} disabled={savingAreas} className="w-full">
              {savingAreas ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit area change for approval"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Supporting Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Supporting Documents
          </CardTitle>
          <CardDescription>Upload qualifications, certifications, insurance documents, or other supporting files. PDF, JPG, PNG — max 5MB each.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={docInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleDocUpload}
          />
          <Button type="button" variant="outline" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}>
            {uploadingDoc ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="mr-2 h-4 w-4" /> Upload documents</>}
          </Button>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{doc.file_name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setViewingDoc(doc)} title="View">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteDoc(doc)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Control whether you receive email alerts when customers message you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New message emails</p>
              <p className="text-xs text-muted-foreground">Receive an email when a customer sends you a message</p>
            </div>
            <Switch
              checked={profile.email_notifications_enabled}
              onCheckedChange={async (checked) => {
                setProfile(p => ({ ...p, email_notifications_enabled: checked }));
                const { error } = await supabase
                  .from("provider_profiles")
                  .update({ email_notifications_enabled: checked } as any)
                  .eq("user_id", user!.id);
                if (error) {
                  setProfile(p => ({ ...p, email_notifications_enabled: !checked }));
                  toast({ title: "Failed to update", description: error.message, variant: "destructive" });
                } else {
                  toast({ title: checked ? "Email notifications enabled" : "Email notifications disabled" });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer */}
      {viewingDoc && (
        <DocumentViewer
          open={!!viewingDoc}
          onOpenChange={(o) => !o && setViewingDoc(null)}
          fileUrl={viewingDoc.file_url}
          fileName={viewingDoc.file_name}
          fileType={viewingDoc.file_type}
          bucket="provider-documents"
        />
      )}
    </div>
  );
};

export default ProviderProfile;
