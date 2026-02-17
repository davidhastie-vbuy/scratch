import { useEffect, useState, useRef } from "react";
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
import { Save, Camera, Loader2, MapPin, Plus, X, Clock } from "lucide-react";
import { useTradeCategories } from "@/hooks/use-trade-categories";

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
}

const ProviderProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories: tradeCategories } = useTradeCategories(true);

  const [profile, setProfile] = useState<ProviderProfileData>({
    business_name: "", contact_first_name: "", contact_last_name: "",
    phone: "", business_address: "", postcode: "",
    trade_category: "other", business_description: "", logo_url: "",
    operating_areas: [], pending_operating_areas: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [editedAreas, setEditedAreas] = useState<string[]>([]);
  const [areasEdited, setAreasEdited] = useState(false);
  const [savingAreas, setSavingAreas] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("provider_profiles")
      .select("business_name, contact_first_name, contact_last_name, phone, business_address, postcode, trade_category, business_description, logo_url, operating_areas, pending_operating_areas")
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
      });
      setEditedAreas(areas);
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
      trade_category: profile.trade_category as any, business_description: profile.business_description.trim(),
    }).eq("user_id", user!.id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
    setSaving(false);
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

  const initials = `${profile.contact_first_name?.[0] ?? ""}${profile.contact_last_name?.[0] ?? ""}`.toUpperCase() || "?";

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const hasPendingAreas = profile.pending_operating_areas && profile.pending_operating_areas.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} required maxLength={20} /></div>
            <div className="space-y-2"><Label>Business address</Label><Input value={profile.business_address} onChange={e => setProfile(p => ({ ...p, business_address: e.target.value }))} required maxLength={255} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Postcode</Label><Input value={profile.postcode} onChange={e => setProfile(p => ({ ...p, postcode: e.target.value }))} required maxLength={10} /></div>
              <div className="space-y-2">
                <Label>Trade category</Label>
                <Select value={profile.trade_category} onValueChange={v => setProfile(p => ({ ...p, trade_category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tradeCategories.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
    </div>
  );
};

export default ProviderProfile;
