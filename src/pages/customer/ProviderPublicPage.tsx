import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, MapPin, Phone, Calendar, Award } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProviderData {
  id: string;
  business_name: string;
  contact_first_name: string;
  contact_last_name: string;
  trade_category: string;
  business_description: string | null;
  public_bio: string | null;
  logo_url: string | null;
  postcode: string;
  years_experience: string | null;
  accreditations: string[] | null;
  operating_areas: string[] | null;
  about_work: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  images: { id: string; file_url: string; file_name: string; caption: string | null }[];
}

const ProviderPublicPage = () => {
  const { providerId } = useParams(); // this is user_id
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (providerId) fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    const { data: profile } = await supabase
      .from("provider_profiles")
      .select("id, business_name, contact_first_name, contact_last_name, trade_category, business_description, public_bio, logo_url, postcode, years_experience, accreditations, operating_areas, about_work")
      .eq("user_id", providerId!)
      .eq("status", "active" as any)
      .single();

    if (!profile) { setLoading(false); return; }
    setProvider(profile as any);

    const { data: projs } = await supabase
      .from("provider_portfolio_projects")
      .select("id, title, description")
      .eq("provider_profile_id", profile.id)
      .order("sort_order");

    const withImages: Project[] = [];
    for (const p of projs ?? []) {
      const { data: imgs } = await supabase
        .from("provider_portfolio_images")
        .select("id, file_url, file_name, caption")
        .eq("project_id", p.id)
        .order("sort_order");
      withImages.push({ ...p, images: imgs ?? [] });
    }
    setProjects(withImages);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!provider) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Provider not found or not yet approved.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const catName = categories.find(c => c.slug === provider.trade_category)?.name ?? provider.trade_category;
  const initials = `${provider.contact_first_name?.[0] ?? ""}${provider.contact_last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={provider.logo_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">{provider.business_name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>{catName}</Badge>
                {provider.years_experience && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" /> {provider.years_experience} years
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> {provider.postcode}
                </Badge>
              </div>
              {provider.operating_areas && provider.operating_areas.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Serves: {provider.operating_areas.join(", ")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      {(provider.public_bio || provider.about_work || provider.business_description) && (
        <Card>
          <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm whitespace-pre-wrap">
              {provider.public_bio || provider.about_work || provider.business_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Accreditations */}
      {provider.accreditations && provider.accreditations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Accreditations</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {provider.accreditations.map((a, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" /> {a}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Projects */}
      {projects.length > 0 && (
        <>
          <h2 className="font-display text-xl font-bold">Completed Projects</h2>
          {projects.map(project => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="text-base">{project.title}</CardTitle>
                {project.description && <CardDescription>{project.description}</CardDescription>}
              </CardHeader>
              {project.images.length > 0 && (
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {project.images.map(img => (
                      <img
                        key={img.id}
                        src={img.file_url}
                        alt={img.caption || img.file_name}
                        className="rounded-md w-full h-28 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxImg(img.file_url)}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightboxImg && <img src={lightboxImg} alt="Project" className="w-full rounded-md" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderPublicPage;
