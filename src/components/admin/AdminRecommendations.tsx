import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageSquare, Image, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const AdminRecommendations = () => {
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["admin-recommendations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_recommendations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Generate signed URLs for all recommendation photos
  useEffect(() => {
    if (!recommendations) return;
    const allPaths: string[] = [];
    for (const rec of recommendations) {
      if (rec.photo_urls) {
        for (const p of rec.photo_urls) {
          // Only process storage paths (not full URLs from before migration)
          if (!p.startsWith("http")) allPaths.push(p);
        }
      }
    }
    if (allPaths.length === 0) return;

    supabase.storage
      .from("recommendation-photos")
      .createSignedUrls(allPaths, 3600)
      .then(({ data }) => {
        if (data) {
          const urlMap: Record<string, string> = {};
          data.forEach((item: any) => {
            if (item.signedUrl && item.path) urlMap[item.path] = item.signedUrl;
          });
          setPhotoUrls(urlMap);
        }
      });
  }, [recommendations]);

  const getPhotoUrl = (path: string) => {
    // Support both old public URLs and new storage paths
    if (path.startsWith("http")) return path;
    return photoUrls[path] || null;
  };

  if (isLoading) return <p className="text-muted-foreground">Loading recommendations...</p>;

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No customer recommendations yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{recommendations.length} recommendation(s) from customers</p>
      {recommendations.map((rec) => (
        <Card key={rec.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
           <CardTitle className="text-base flex items-center gap-2">
                 <MessageSquare className="h-4 w-4 text-primary" />
                 {rec.customer_name || rec.user_email || "Unknown user"}
               </CardTitle>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-xs">
                  {format(new Date(rec.created_at), "dd MMM yyyy HH:mm")}
                </Badge>
                {rec.customer_postcode && (
                  <Badge variant="secondary" className="text-xs">
                    {rec.customer_postcode}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
           <CardContent className="space-y-3">
             {rec.user_email && (
               <p className="text-xs text-muted-foreground">
                 Email: <span className="font-medium">{rec.user_email}</span>
               </p>
             )}
             {rec.message && <p className="text-sm whitespace-pre-wrap">{rec.message}</p>}
            {rec.photo_urls && rec.photo_urls.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" /> {rec.photo_urls.length} photo(s) attached
                </p>
                <div className="flex flex-wrap gap-2">
                  {rec.photo_urls.map((path: string, i: number) => {
                    const url = getPhotoUrl(path);
                    if (!url) {
                      return (
                        <div key={i} className="h-24 w-24 rounded-md border bg-muted flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      );
                    }
                    return (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Recommendation photo ${i + 1}`}
                          className="h-24 w-24 rounded-md object-cover border hover:ring-2 hover:ring-primary transition-all"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminRecommendations;
