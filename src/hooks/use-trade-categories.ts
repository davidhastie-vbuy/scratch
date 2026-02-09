import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TradeCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export function useTradeCategories(activeOnly = true) {
  const [categories, setCategories] = useState<TradeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    let query = supabase.from("trade_categories").select("*").order("name");
    if (activeOnly) query = query.eq("is_active", true);
    const { data } = await query;
    setCategories(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [activeOnly]);

  return { categories, loading, refetch: fetch };
}
