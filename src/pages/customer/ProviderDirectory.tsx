import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeCategories } from "@/hooks/use-trade-categories";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, MapPin } from "lucide-react";

interface ProviderListItem {
  id: string;
  user_id: string;
  business_name: string;
  contact_first_name: string;
  contact_last_name: string;
  trade_category: string;
  business_description: string | null;
  logo_url: string | null;
  postcode: string;
  years_experience: string | null;
  operating_areas: string[] | null;
}

const ProviderDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [customerPostcode, setCustomerPostcode] = useState("");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    // Get customer's postcode
    const { data: profile } = await supabase
      .from("profiles")
      .select("postcode")
      .eq("id", user!.id)
      .single();

    const postcode = profile?.postcode ?? "";
    setCustomerPostcode(postcode);

    // Extract postcode district (e.g. "SW1A 1AA" -> "SW1A", "B1 1AA" -> "B1")
    const district = postcode.trim().split(" ")[0]?.toUpperCase() || "";

    if (!district) {
      // No postcode set — show all active providers
      const { data } = await supabase
        .from("provider_profiles")
        .select("id, user_id, business_name, contact_first_name, contact_last_name, trade_category, business_description, logo_url, postcode, years_experience, operating_areas")
        .eq("status", "active" as any)
        .order("business_name");
      setProviders((data as any[]) ?? []);
    } else {
      // Filter to providers whose operating_areas contain the customer's postcode district
      const { data } = await supabase
        .from("provider_profiles")
        .select("id, user_id, business_name, contact_first_name, contact_last_name, trade_category, business_description, logo_url, postcode, years_experience, operating_areas")
        .eq("status", "active" as any)
        .contains("operating_areas", [district])
        .order("business_name");
      setProviders((data as any[]) ?? []);
    }

    setLoading(false);
  };

  const filtered = providers.filter(p => {
    return catFilter === "all" || p.trade_category === catFilter;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Local Trades</h2>
        <p className="text-muted-foreground text-sm">
          {customerPostcode
            ? `Vetted providers serving your area (${customerPostcode.trim().split(" ")[0]?.toUpperCase()})`
            : "Update your profile postcode to see providers in your area"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trades</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No providers found in your area{catFilter !== "all" ? " for this trade" : ""}.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(p => {
            const catName = categories.find(c => c.slug === p.trade_category)?.name ?? p.trade_category;
            const initials = `${p.contact_first_name?.[0] ?? ""}${p.contact_last_name?.[0] ?? ""}`.toUpperCase();
            return (
              <Card
                key={p.id}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => navigate(`/dashboard/providers/${p.user_id}`)}
              >
                <CardContent className="flex items-start gap-4 pt-6">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={p.logo_url || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{p.business_name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-xs">{catName}</Badge>
                      {p.years_experience && <Badge variant="outline" className="text-xs">{p.years_experience} yrs</Badge>}
                    </div>
                    {p.business_description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.business_description}</p>
                    )}
                    {p.operating_areas && p.operating_areas.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {p.operating_areas.slice(0, 5).join(", ")}
                        {p.operating_areas.length > 5 && ` +${p.operating_areas.length - 5} more`}
                      </p>
                    )}
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

export default ProviderDirectory;
