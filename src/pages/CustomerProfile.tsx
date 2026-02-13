import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, Camera, Loader2 } from "lucide-react";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line_1: string;
  city: string;
  postcode: string;
  avatar_url: string;
}

const CustomerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    first_name: "", last_name: "", email: "", phone: "",
    address_line_1: "", city: "", postcode: "", avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, address_line_1, city, postcode, avatar_url")
      .eq("id", user!.id)
      .single();
    if (data) {
      setProfile({
        first_name: data.first_name ?? "", last_name: data.last_name ?? "",
        email: data.email ?? "", phone: data.phone ?? "",
        address_line_1: data.address_line_1 ?? "", city: data.city ?? "",
        postcode: data.postcode ?? "", avatar_url: data.avatar_url ?? "",
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      first_name: profile.first_name.trim(), last_name: profile.last_name.trim(),
      phone: profile.phone.trim(), address_line_1: profile.address_line_1.trim(),
      city: profile.city.trim(), postcode: profile.postcode.trim(),
    }).eq("id", user!.id);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large", variant: "destructive" }); return; }
    setUploading(true);
    const path = `${user!.id}/avatar.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user!.id);
    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    toast({ title: "Photo updated" });
    setUploading(false);
  };

  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and profile photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-medium">{profile.first_name} {profile.last_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>First name</Label><Input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} required maxLength={100} /></div>
              <div className="space-y-2"><Label>Last name</Label><Input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} required maxLength={100} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input value={profile.email} disabled className="bg-muted" /><p className="text-xs text-muted-foreground">Email cannot be changed here</p></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} maxLength={20} /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={profile.address_line_1} onChange={e => setProfile(p => ({ ...p, address_line_1: e.target.value }))} maxLength={255} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>City</Label><Input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} maxLength={100} /></div>
              <div className="space-y-2"><Label>Postcode</Label><Input value={profile.postcode} onChange={e => setProfile(p => ({ ...p, postcode: e.target.value }))} maxLength={10} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerProfile;
