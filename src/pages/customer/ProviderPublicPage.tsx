import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, MapPin, Phone, Calendar, Award, Send, Star, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ScoreBadge from "@/components/reviews/ScoreBadge";
import ReviewsList from "@/components/reviews/ReviewsList";

interface ProviderData {
  id: string;
  business_name: string;
  contact_first_name: string;
  contact_last_name: string;
  trade_category: string;
  business_description: string | null;
  public_bio: string | null;
  logo_url: string | null;
  banner_url: string | null;
  postcode: string;
  years_experience: string | null;
  accreditations: string[] | null;
  operating_areas: string[] | null;
  about_work: string | null;
  additional_categories: string[] | null;
  qualifications_certifications: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  images: { id: string; file_url: string; file_name: string; caption: string | null }[];
}

const ProviderPublicPage = () => {
  const { providerId } = useParams(); // this is user_id
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories } = useTradeCategories(true);

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFavourite, setIsFavourite] = useState(false);
  const [canFavourite, setCanFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  // Invite to job state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [alreadyInvited, setAlreadyInvited] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (providerId) fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    const { data: profile } = await supabase
      .from("provider_profiles")
      .select("id, business_name, contact_first_name, contact_last_name, trade_category, business_description, public_bio, logo_url, banner_url, postcode, years_experience, accreditations, operating_areas, about_work, additional_categories, qualifications_certifications")
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

    // Fetch reviews for this provider
    const { data: revs } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_user_id", providerId!)
      .eq("reviewer_role", "customer")
      .order("created_at", { ascending: false });

    const enrichedRevs = [];
    for (const r of (revs as any[]) ?? []) {
      const { data: jb } = await supabase.from("jobs").select("title").eq("id", r.job_id).single();
      const { data: prof } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", r.reviewer_user_id).single();
      const name = prof ? (`${prof.first_name || ""} ${prof.last_name || ""}`.trim() || prof.full_name || "Customer") : "Customer";
      enrichedRevs.push({ ...r, job_title: jb?.title ?? "Job", reviewer_name: name });
    }
    setReviews(enrichedRevs);

    setLoading(false);

    // Check favourite status
    if (user && role === "customer") {
      const [favRes, jobRes] = await Promise.all([
        supabase
          .from("customer_favourites")
          .select("id")
          .eq("customer_user_id", user.id)
          .eq("provider_user_id", providerId!)
          .maybeSingle(),
        supabase
          .from("jobs")
          .select("id")
          .eq("customer_user_id", user.id)
          .eq("provider_id", providerId!)
          .eq("status", "completed" as any)
          .limit(1),
      ]);
      setIsFavourite(!!favRes.data);
      setCanFavourite((jobRes.data ?? []).length > 0);
    }
  };

  const toggleFavourite = async () => {
    if (!user || !providerId) return;
    setFavouriteLoading(true);
    if (isFavourite) {
      await supabase.from("customer_favourites").delete()
        .eq("customer_user_id", user.id)
        .eq("provider_user_id", providerId);
      setIsFavourite(false);
      toast({ title: "Removed from favourites" });
    } else {
      const { error } = await supabase.from("customer_favourites").insert({
        customer_user_id: user.id,
        provider_user_id: providerId,
      } as any);
      if (error) {
        toast({ title: "Could not add to favourites", description: "You can only favourite providers you've completed a job with.", variant: "destructive" });
      } else {
        setIsFavourite(true);
        toast({ title: "Added to favourites!" });
      }
    }
    setFavouriteLoading(false);
  };

  const openInviteDialog = async () => {
    if (!user || !providerId) return;
    // Only show jobs whose category matches the provider's primary or additional categories
    const providerCategories = [
      provider?.trade_category,
      ...(provider?.additional_categories ?? []),
    ].filter(Boolean);

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, status, category")
      .eq("customer_user_id", user.id)
      .in("status", ["open", "quoted"] as any)
      .order("created_at", { ascending: false });

    const eligible = (jobs ?? []).filter((j: any) => providerCategories.includes(j.category));
    setCustomerJobs(eligible);

    const [invRes, quoteRes] = await Promise.all([
      supabase
        .from("job_invitations")
        .select("job_id")
        .eq("provider_user_id", providerId)
        .eq("customer_user_id", user.id),
      supabase
        .from("quotes")
        .select("job_id")
        .eq("provider_user_id", providerId),
    ]);
    const invitedIds = (invRes.data ?? []).map((e: any) => e.job_id);
    const quotedIds = (quoteRes.data ?? []).map((e: any) => e.job_id);
    setAlreadyInvited([...new Set([...invitedIds, ...quotedIds])]);

    setSelectedJobId("");
    setInviteOpen(true);
  };

  const sendInvitation = async () => {
    if (!selectedJobId || !providerId || !user) return;
    setInviting(true);
    const { error } = await supabase.from("job_invitations").insert({
      job_id: selectedJobId,
      provider_user_id: providerId,
      customer_user_id: user.id,
    } as any);
    if (error) {
      toast({ title: "Could not send invitation", description: error.message, variant: "destructive" });
    } else {
      // Create conversation so both parties can message each other
      await supabase.from("conversations").upsert({
        job_id: selectedJobId,
        customer_user_id: user.id,
        provider_user_id: providerId,
      } as any, { onConflict: "job_id,customer_user_id,provider_user_id" });

      toast({ title: "Invitation sent!", description: "The provider will see your job in their dashboard." });
      setAlreadyInvited(prev => [...prev, selectedJobId]);
      setInviteOpen(false);
    }
    setInviting(false);
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
      <Card className="overflow-hidden">
        {provider.banner_url && (
          <img src={provider.banner_url} alt="Banner" className="w-full h-40 object-cover" />
        )}
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={provider.logo_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                {provider.business_name}
                <ScoreBadge userId={providerId!} role="provider" />
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>{catName}</Badge>
                {provider.additional_categories && provider.additional_categories.length > 0 && (
                  provider.additional_categories.map(cat => (
                    <Badge key={cat} variant="secondary">
                      {categories.find(c => c.slug === cat)?.name ?? cat}
                    </Badge>
                  ))
                )}
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
          {role === "customer" && (
            <div className="mt-4 flex gap-2">
              <Button onClick={openInviteDialog}>
                <Send className="mr-2 h-4 w-4" /> Invite to Job
              </Button>
              {canFavourite && (
                <Button
                  variant={isFavourite ? "secondary" : "outline"}
                  onClick={toggleFavourite}
                  disabled={favouriteLoading}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFavourite ? "fill-current text-destructive" : ""}`} />
                  {isFavourite ? "Favourited" : "Add to Favourites"}
                </Button>
              )}
            </div>
          )}
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

      {/* Customer Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewsList reviews={reviews} showReviewerName={true} showJobTitle={true} />
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightboxImg && <img src={lightboxImg} alt="Project" className="w-full rounded-md" />}
        </DialogContent>
      </Dialog>

      {/* Invite to Job Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Job</DialogTitle>
            <DialogDescription>
              Select one of your open jobs to invite {provider?.business_name} to quote on.
            </DialogDescription>
          </DialogHeader>
          {customerJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">You don't have any open jobs. Post a job first to invite providers.</p>
          ) : (
            <div className="space-y-4">
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job…" />
                </SelectTrigger>
                <SelectContent>
                  {customerJobs.map(j => (
                    <SelectItem key={j.id} value={j.id} disabled={alreadyInvited.includes(j.id)}>
                      {j.title} {alreadyInvited.includes(j.id) ? "(already invited or quoted)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={sendInvitation} disabled={!selectedJobId || inviting} className="w-full">
                {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Invitation
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderPublicPage;
