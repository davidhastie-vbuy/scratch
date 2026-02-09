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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Camera, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
}

const ProviderProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories: tradeCategories } = useTradeCategories(true);

  const [profile, setProfile] = useState<ProviderProfileData>({
    business_name: "",
    contact_first_name: "",
    contact_last_name: "",
    phone: "",
    business_address: "",
    postcode: "",
    trade_category: "other",
    business_description: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("provider_profiles")
      .select("business_name, contact_first_name, contact_last_name, phone, business_address, postcode, trade_category, business_description, logo_url")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setProfile({
        business_name: data.business_name ?? "",
        contact_first_name: data.contact_first_name ?? "",
        contact_last_name: data.contact_last_name ?? "",
        phone: data.phone ?? "",
        business_address: data.business_address ?? "",
        postcode: data.postcode ?? "",
        trade_category: data.trade_category ?? "other",
        business_description: data.business_description ?? "",
        logo_url: data.logo_url ?? "",
      });
    }
    if (error) {
      toast({ title: "Error loading profile", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("provider_profiles")
      .update({
        business_name: profile.business_name.trim(),
        contact_first_name: profile.contact_first_name.trim(),
        contact_last_name: profile.contact_last_name.trim(),
        phone: profile.phone.trim(),
        business_address: profile.business_address.trim(),
        postcode: profile.postcode.trim(),
        trade_category: profile.trade_category as any,
        business_description: profile.business_description.trim(),
      })
      .eq("user_id", user!.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("provider_profiles").update({ logo_url: logoUrl }).eq("user_id", user!.id);
    setProfile((p) => ({ ...p, logo_url: logoUrl }));
    toast({ title: "Logo updated" });
    setUploading(false);
  };

  const initials = `${profile.contact_first_name?.[0] ?? ""}${profile.contact_last_name?.[0] ?? ""}`.toUpperCase() || "?";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/provider")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="font-display text-xl font-bold">Business Profile</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Update your business details and logo</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Logo */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.logo_url || undefined} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
              <div>
                <p className="font-medium">{profile.business_name}</p>
                <p className="text-sm text-muted-foreground">
                {tradeCategories.find((c) => c.slug === profile.trade_category)?.name ?? profile.trade_category}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input
                  id="businessName"
                  value={profile.business_name}
                  onChange={(e) => setProfile((p) => ({ ...p, business_name: e.target.value }))}
                  required
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Contact first name</Label>
                  <Input
                    id="firstName"
                    value={profile.contact_first_name}
                    onChange={(e) => setProfile((p) => ({ ...p, contact_first_name: e.target.value }))}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Contact last name</Label>
                  <Input
                    id="lastName"
                    value={profile.contact_last_name}
                    onChange={(e) => setProfile((p) => ({ ...p, contact_last_name: e.target.value }))}
                    required
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  required
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business address</Label>
                <Input
                  id="address"
                  value={profile.business_address}
                  onChange={(e) => setProfile((p) => ({ ...p, business_address: e.target.value }))}
                  required
                  maxLength={255}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={profile.postcode}
                    onChange={(e) => setProfile((p) => ({ ...p, postcode: e.target.value }))}
                    required
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trade">Trade category</Label>
                  <Select
                    value={profile.trade_category}
                    onValueChange={(v) => setProfile((p) => ({ ...p, trade_category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tradeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your business..."
                  value={profile.business_description}
                  onChange={(e) => setProfile((p) => ({ ...p, business_description: e.target.value }))}
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {profile.business_description.length}/300 characters
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProviderProfile;
