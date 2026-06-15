import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin } from "lucide-react";
import { useTradeCategories } from "@/hooks/use-trade-categories";

const MAX_SLOTS = 3;

interface ProviderSlim {
  id: string;
  business_name: string;
  trade_category: string;
  additional_categories: string[] | null;
  operating_areas: string[] | null;
}

interface SlotEntry {
  postcode: string;
  category: string;
  count: number;
  remaining: number;
  providers: string[];
}

const AdminProviderSlots = () => {
  const { categories } = useTradeCategories(true);
  const [providers, setProviders] = useState<ProviderSlim[]>([]);
  const [loading, setLoading] = useState(true);
  const [postcodeFilter, setPostcodeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    const { data } = await supabase
      .from("provider_profiles")
      .select("id, business_name, trade_category, additional_categories, operating_areas")
      .eq("status", "active" as any);
    setProviders((data as any[]) ?? []);
    setLoading(false);
  };

  // Build the slot map: for each (postcode, category) combination, count active providers
  const slots = useMemo(() => {
    const map = new Map<string, SlotEntry>();

    for (const p of providers) {
      const allCats = [p.trade_category, ...(p.additional_categories ?? [])];
      const areas = p.operating_areas ?? [];

      for (const area of areas) {
        for (const cat of allCats) {
          const key = `${area}::${cat}`;
          if (!map.has(key)) {
            map.set(key, { postcode: area, category: cat, count: 0, remaining: MAX_SLOTS, providers: [] });
          }
          const entry = map.get(key)!;
          entry.count += 1;
          entry.remaining = MAX_SLOTS - entry.count;
          entry.providers.push(p.business_name);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      return a.postcode.localeCompare(b.postcode) || a.category.localeCompare(b.category);
    });
  }, [providers]);

  const filtered = useMemo(() => {
    return slots.filter(s => {
      if (postcodeFilter && !s.postcode.toLowerCase().includes(postcodeFilter.toLowerCase())) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      return true;
    });
  }, [slots, postcodeFilter, categoryFilter]);

  // Summary stats
  const fullSlots = slots.filter(s => s.remaining <= 0).length;
  const lowSlots = slots.filter(s => s.remaining === 1).length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{slots.length}</p>
            <p className="text-sm text-muted-foreground">Active Combinations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-destructive">{fullSlots}</p>
            <p className="text-sm text-muted-foreground">Full (0 slots left)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-amber-600">{lowSlots}</p>
            <p className="text-sm text-muted-foreground">Low (1 slot left)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider Slots</CardTitle>
          <CardDescription>Maximum {MAX_SLOTS} providers per postcode per category. Search and filter to view availability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by postcode…"
                value={postcodeFilter}
                onChange={e => setPostcodeFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {postcodeFilter || categoryFilter !== "all"
                ? "No results match your filters."
                : "No active provider slots to display."}
            </p>
          ) : (
            <div className="border overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Postcode</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-center p-3 font-medium">Filled</th>
                    <th className="text-center p-3 font-medium">Remaining</th>
                    <th className="text-left p-3 font-medium">Providers</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const catName = categories.find(c => c.slug === s.category)?.name ?? s.category;
                    return (
                      <tr key={`${s.postcode}::${s.category}`} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono font-medium">{s.postcode}</span>
                          </span>
                        </td>
                        <td className="p-3">{catName}</td>
                        <td className="p-3 text-center">
                          <span className="font-semibold">{s.count}</span>
                          <span className="text-muted-foreground">/{MAX_SLOTS}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={s.remaining <= 0 ? "destructive" : s.remaining === 1 ? "outline" : "secondary"}
                            className={s.remaining === 1 ? "border-amber-500 text-amber-700 dark:text-amber-400" : ""}
                          >
                            {s.remaining <= 0 ? "FULL" : `${s.remaining} left`}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {s.providers.map((name, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProviderSlots;
