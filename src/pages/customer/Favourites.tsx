import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, MapPin, Trash2 } from "lucide-react";
import ScoreBadge from "@/components/reviews/ScoreBadge";
import { useToast } from "@/hooks/use-toast";

interface FavouriteProvider {
  id: string;
  provider_user_id: string;
  created_at: string;
  provider?: {
    business_name: string;
    contact_first_name: string;
    contact_last_name: string;
    trade_category: string;
    additional_categories: string[] | null;
    logo_url: string | null;
    postcode: string;
    years_experience: string | null;
  };
}

const Favourites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories } = useTradeCategories(true);
  const [favourites, setFavourites] = useState<FavouriteProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFavourites();
  }, [user]);

  const fetchFavourites = async () => {
    const { data } = await supabase
      .from("customer_favourites")
      .select("id, provider_user_id, created_at")
      .eq("customer_user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setFavourites([]);
      setLoading(false);
      return;
    }

    const enriched: FavouriteProvider[] = [];
    for (const fav of data) {
      const { data: profile } = await supabase
        .from("provider_profiles")
        .select("business_name, contact_first_name, contact_last_name, trade_category, additional_categories, logo_url, postcode, years_experience")
        .eq("user_id", fav.provider_user_id)
        .eq("status", "active" as any)
        .single();
      enriched.push({ ...fav, provider: profile as any ?? undefined });
    }
    setFavourites(enriched);
    setLoading(false);
  };

  const removeFavourite = async (favId: string) => {
    await supabase.from("customer_favourites").delete().eq("id", favId);
    setFavourites(prev => prev.filter(f => f.id !== favId));
    toast({ title: "Removed from favourites" });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Favourites</h1>
        <p className="text-sm text-muted-foreground mt-1">Providers you've worked with and saved for future jobs.</p>
      </div>

      {favourites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No favourites yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a job with a provider, then add them to your favourites from their profile page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favourites.map(fav => {
            const p = fav.provider;
            if (!p) return null;
            const initials = `${p.contact_first_name?.[0] ?? ""}${p.contact_last_name?.[0] ?? ""}`.toUpperCase();
            const catName = categories.find(c => c.slug === p.trade_category)?.name ?? p.trade_category;

            return (
              <Card key={fav.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Avatar
                      className="h-14 w-14 cursor-pointer"
                      onClick={() => navigate(`/dashboard/providers/${fav.provider_user_id}`)}
                    >
                      <AvatarImage src={p.logo_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className="font-semibold truncate cursor-pointer hover:underline"
                          onClick={() => navigate(`/dashboard/providers/${fav.provider_user_id}`)}
                        >
                          {p.business_name}
                        </h3>
                        <ScoreBadge userId={fav.provider_user_id} role="provider" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge variant="secondary" className="text-xs">{catName}</Badge>
                        {(p.additional_categories ?? []).map(slug => {
                          const addCatName = categories.find(c => c.slug === slug)?.name ?? slug;
                          return <Badge key={slug} variant="outline" className="text-xs bg-muted/50">{addCatName}</Badge>;
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.postcode}</span>
                        {p.years_experience && <span>{p.years_experience} yrs exp</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFavourite(fav.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favourites;
