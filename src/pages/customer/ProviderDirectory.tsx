import { useEffect, useState } from "react";
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
  const navigate = useNavigate();
  const { categories } = useTradeCategories(true);
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    const { data } = await supabase
      .from("provider_profiles")
      .select("id, user_id, business_name, contact_first_name, contact_last_name, trade_category, business_description, logo_url, postcode, years_experience, operating_areas")
      .eq("status", "active" as any)
      .order("business_name");
    setProviders((data as any[]) ?? []);
    setLoading(false);
  };

  const filtered = providers.filter(p => {
    const matchSearch = !search || p.business_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.trade_category === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Find a Tradesperson</h2>
        <p className="text-muted-foreground text-sm">Browse our vetted and approved providers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by business name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trades</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No providers found matching your criteria.</p>
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
