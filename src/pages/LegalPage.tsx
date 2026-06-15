import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText } from "lucide-react";

const HUB_PAGES = [
  { slug: "platform-terms", label: "Platform Terms of Use", description: "Applies to all users" },
  { slug: "terms-of-service", label: "Terms of Service", description: "Audience-specific service terms" },
  { slug: "privacy-policy", label: "Privacy Notice", description: "How we handle your data" },
  { slug: "acceptable-use", label: "Acceptable Use Policy", description: "Standards of conduct" },
  { slug: "payment-terms", label: "Payment & Escrow Terms", description: "How payments and escrow work" },
  { slug: "cancellation-policy", label: "Cancellation & Refund Policy", description: "Cancellation rules and refunds" },
  { slug: "dispute-resolution", label: "Dispute Resolution Policy", description: "How disputes are handled" },
  { slug: "review-policy", label: "Review & Feedback Policy", description: "Review standards" },
  { slug: "provider-standards", label: "Provider Standards & Conduct", description: "Professional standards for Providers" },
  { slug: "sanctions-policy", label: "Deactivation & Sanctions Policy", description: "Enforcement actions" },
];

const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const audience = searchParams.get("audience") || "customer";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const isHub = !slug;

  useEffect(() => {
    if (isHub) { setLoading(false); return; }
    const fetchPage = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("legal_pages")
        .select("title, content")
        .eq("slug", slug!)
        .eq("audience", audience)
        .maybeSingle();
      if (data) { setTitle(data.title); setContent(data.content); }
      setLoading(false);
    };
    fetchPage();
  }, [slug, audience, isHub]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center gap-4">
          <Link to={isHub ? "/signup" : `/legal?audience=${audience}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-xl font-bold text-foreground">BOOKaTRADE</h1>
        </div>
      </header>
      <main className="container max-w-3xl py-8 px-4">
        {isHub ? (
          <>
            <h2 className="font-display text-2xl font-bold mb-2">Terms & Conditions</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Welcome to our Terms & Conditions. Select a section below to read the full details.
              Viewing as: <span className="font-medium text-foreground capitalize">{audience}</span>.
            </p>
            <div className="space-y-2">
              {HUB_PAGES.map((p) => (
                <Link
                  key={p.slug}
                  to={`/legal/${p.slug}?audience=${audience}`}
                  className="flex items-start gap-3 border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-6">{title}</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">{content}</div>
          </>
        )}
      </main>
    </div>
  );
};

export default LegalPage;
