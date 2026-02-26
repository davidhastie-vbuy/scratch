import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const audience = searchParams.get("audience") || "customer";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("legal_pages")
        .select("title, content")
        .eq("slug", slug!)
        .eq("audience", audience)
        .maybeSingle();
      if (data) {
        setTitle(data.title);
        setContent(data.content);
      }
      setLoading(false);
    };
    fetch();
  }, [slug, audience]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/signup" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-xl font-bold text-foreground">TradeTrust</h1>
        </div>
      </header>
      <main className="container max-w-3xl py-8">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-6">{title}</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
              {content}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LegalPage;
