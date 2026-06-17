import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Shield, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/bookatrade-logo-black.png";
import tradeJoiners from "@/assets/trade-joiners.jpg";
import tradeKitchen from "@/assets/trade-kitchen.jpg";
import tradeElectricians from "@/assets/trade-electricians.jpg";
import tradePainters from "@/assets/trade-painters.jpg";
import tradePlumbers from "@/assets/trade-plumbers.jpg";
import tradeRoofers from "@/assets/trade-roofers.jpg";
import tradeLandscapers from "@/assets/trade-landscapers.jpg";
import tradeTilers from "@/assets/trade-tilers.jpg";

/* ─── TRADE DATA ─────────────────────────────────────────── */

const TRADES: Record<
  string,
  {
    name: string;
    tagline: string;
    description: string;
    bg: string;
    text: string;
    border: string;
    mark: string;
    img: string;
  }
> = {
  joiners: {
    name: "Joiners",
    tagline: "Made to Measure",
    description: "Wardrobes, staircases & bespoke fitted furniture",
    bg: "bg-trade-olive",
    text: "text-trade-olive",
    border: "border-trade-olive",
    mark: "J",
    img: tradeJoiners,
  },
  "kitchen-fitters": {
    name: "Kitchen Fitters",
    tagline: "Heart of the Home",
    description: "Designed for living, installed with precision",
    bg: "bg-trade-orange",
    text: "text-trade-orange",
    border: "border-trade-orange",
    mark: "K",
    img: tradeKitchen,
  },
  electricians: {
    name: "Electricians",
    tagline: "Find the Spark",
    description: "Powered by precision, wired for results",
    bg: "bg-trade-lilac",
    text: "text-trade-lilac",
    border: "border-trade-lilac",
    mark: "E",
    img: tradeElectricians,
  },
  painters: {
    name: "Painters",
    tagline: "Paint the Room",
    description: "Interior, exterior, wallpaper & feature walls",
    bg: "bg-trade-cobalt",
    text: "text-trade-cobalt",
    border: "border-trade-cobalt",
    mark: "P",
    img: tradePainters,
  },
  plumbers: {
    name: "Plumbers",
    tagline: "Keeping Life Flowing",
    description: "No leaks. No hassle. Trusted local plumbers",
    bg: "bg-trade-aqua",
    text: "text-trade-aqua",
    border: "border-trade-aqua",
    mark: "P",
    img: tradePlumbers,
  },
  roofers: {
    name: "Roofers",
    tagline: "The Roof Over Everything",
    description: "Protection starts at the top. Built to last",
    bg: "bg-trade-slate",
    text: "text-trade-slate",
    border: "border-trade-slate",
    mark: "R",
    img: tradeRoofers,
  },
  landscapers: {
    name: "Landscapers",
    tagline: "Bring the Outside to Life",
    description: "Gardens that work beautifully, year-round",
    bg: "bg-trade-forest",
    text: "text-trade-forest",
    border: "border-trade-forest",
    mark: "L",
    img: tradeLandscapers,
  },
  tilers: {
    name: "Tilers",
    tagline: "Every Detail Aligned",
    description: "Find skilled tilers who get the finish right",
    bg: "bg-trade-stone",
    text: "text-trade-stone",
    border: "border-trade-stone",
    mark: "T",
    img: tradeTilers,
  },
};

const TRADE_SLUGS: { slug: string; name: string }[] = [
  { slug: "joiners", name: "Joiners" },
  { slug: "kitchen-fitters", name: "Kitchen Fitters" },
  { slug: "electricians", name: "Electricians" },
  { slug: "painters", name: "Painters" },
  { slug: "plumbers", name: "Plumbers" },
  { slug: "roofers", name: "Roofers" },
  { slug: "landscapers", name: "Landscapers" },
  { slug: "tilers", name: "Tilers" },
];

/* ─── COMPONENT ──────────────────────────────────────────── */

const TradeCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const trade = slug ? TRADES[slug] : undefined;

  const [featuredProviders, setFeaturedProviders] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('public_provider_profiles')
        .select('id, user_id, business_name, public_bio, business_description, logo_url, banner_url, years_experience, trade_category')
        .eq('trade_category', slug)
        .eq('is_featured', true)
        .limit(3);
      setFeaturedProviders(data || []);
    };
    fetchFeatured();
  }, [slug]);

  /* ── Not Found state ──────────────────────────────────── */
  if (!trade) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <Header />

        <main className="flex flex-1 items-center justify-center py-24">
          <div className="text-center max-w-md px-6">
            <p className="eyebrow mb-4">Trade Not Found</p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground leading-[0.93] mb-6">
              404
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              We couldn't find a trade category matching "{slug}". Browse our available trades below.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {TRADE_SLUGS.map((t) => (
                <Link
                  key={t.slug}
                  to={`/trades/${t.slug}`}
                  className="text-sm text-foreground/60 hover:text-foreground border border-foreground/10 px-3 py-1.5 transition-colors hover:border-foreground/30"
                >
                  {t.name}
                </Link>
              ))}
            </div>
            <Button asChild className="font-semibold bg-foreground text-background hover:bg-foreground/90 px-8 h-11 text-[11px] uppercase tracking-[0.12em]">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /* ── Main page ────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* ═══ Category Hero ═══ */}
      <section className="relative overflow-hidden">
        <img src={trade.img} alt={trade.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />

        <div className="container relative z-10 py-20 sm:py-28 md:py-36 lg:py-44">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-white/50 mb-5">
            Find a Trade
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[0.9] mb-5">
            {trade.name}
          </h1>
          <p className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white/70 mb-4 max-w-lg">
            {trade.tagline}
          </p>
          <p className="text-sm sm:text-base text-white/50 max-w-md leading-relaxed">
            {trade.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-white text-foreground hover:bg-white/90 font-bold h-12 px-8 text-[11px] uppercase tracking-[0.14em] transition-all duration-300 hover:scale-105">
              <Link to="/signup" className="flex items-center gap-2">
                <span>Get Quotes</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-bold h-12 px-8 text-[11px] uppercase tracking-[0.14em] transition-all duration-300">
              <Link to="/signup?role=provider">Join as {trade.name.endsWith("s") ? trade.name.slice(0, -1) : trade.name}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ Featured Providers ═══ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container">
          <div className="mb-8">
            <p className="eyebrow mb-4">Trusted Professionals</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[0.95]">
              Featured {trade.name}
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-lg">
              Hand-picked, vetted professionals ready to deliver outstanding results.
            </p>
          </div>

          {/* Provider grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              const TEST_PROVIDERS: Record<string, { name: string; initials: string; bio: string; years: string; rating: number; reviews: number; color: string }[]> = {
                joiners: [
                  { name: "Highland Joinery Co.", initials: "HJ", bio: "Bespoke fitted furniture, staircases and wardrobes. Over 15 years crafting beautiful interiors.", years: "15+ years", rating: 4.9, reviews: 47, color: "bg-trade-olive" },
                  { name: "McAllister Woodworks", initials: "MW", bio: "Custom kitchen units, shelving and built-in storage solutions. Quality craftsmanship guaranteed.", years: "12 years", rating: 4.7, reviews: 33, color: "bg-trade-forest" },
                  { name: "Precision Timber Ltd", initials: "PT", bio: "Specialist in oak flooring, skirting boards and architectural timber features.", years: "8 years", rating: 4.8, reviews: 28, color: "bg-trade-stone" },
                ],
                "kitchen-fitters": [
                  { name: "Urban Kitchen Design", initials: "UK", bio: "Complete kitchen installations from design to finish. German and Italian kitchen specialists.", years: "18 years", rating: 4.9, reviews: 62, color: "bg-trade-orange" },
                  { name: "Brooks Kitchens & Bathrooms", initials: "BK", bio: "Family-run business specialising in modern and traditional kitchen refurbishments.", years: "10 years", rating: 4.6, reviews: 41, color: "bg-trade-stone" },
                  { name: "Fitted Right Ltd", initials: "FR", bio: "Worktop templating, appliance fitting and full kitchen installations across the region.", years: "7 years", rating: 4.8, reviews: 19, color: "bg-trade-cobalt" },
                ],
                electricians: [
                  { name: "Spark & Wire Electrical", initials: "SW", bio: "NICEIC registered. Domestic and commercial electrical work, rewiring and smart home installations.", years: "20+ years", rating: 4.9, reviews: 89, color: "bg-trade-lilac" },
                  { name: "CityLight Electrics", initials: "CL", bio: "EV charger installations, consumer unit upgrades and full property rewires.", years: "11 years", rating: 4.7, reviews: 54, color: "bg-trade-cobalt" },
                  { name: "PowerSafe Solutions", initials: "PS", bio: "Emergency electrician available 24/7. Fault finding, testing and certification specialists.", years: "14 years", rating: 4.8, reviews: 37, color: "bg-trade-aqua" },
                ],
                painters: [
                  { name: "Brushstrokes Decorating", initials: "BD", bio: "Interior and exterior painting, wallpapering and feature wall specialists. Dulux Select Decorator.", years: "16 years", rating: 4.8, reviews: 73, color: "bg-trade-cobalt" },
                  { name: "Premier Finish Painters", initials: "PF", bio: "High-end residential decorating. Farrow & Ball and Little Greene specialists.", years: "9 years", rating: 4.9, reviews: 31, color: "bg-trade-lilac" },
                  { name: "Colour & Co.", initials: "CC", bio: "Commercial and residential painting services. Period property restoration and modern makeovers.", years: "12 years", rating: 4.6, reviews: 44, color: "bg-trade-stone" },
                ],
                plumbers: [
                  { name: "FlowFix Plumbing", initials: "FF", bio: "Gas Safe registered. Boiler installations, central heating and bathroom plumbing.", years: "22 years", rating: 4.9, reviews: 96, color: "bg-trade-aqua" },
                  { name: "AquaPro Services", initials: "AP", bio: "Leak detection, pipe repairs and full bathroom installations. Emergency callouts available.", years: "13 years", rating: 4.7, reviews: 58, color: "bg-trade-cobalt" },
                  { name: "Heatwave Plumbing & Gas", initials: "HG", bio: "Underfloor heating, boiler servicing and power flushing specialists.", years: "8 years", rating: 4.8, reviews: 22, color: "bg-trade-forest" },
                ],
                roofers: [
                  { name: "Apex Roofing Solutions", initials: "AR", bio: "Flat roofs, pitched roofs, slate and tile work. Full roof replacements and repairs.", years: "25+ years", rating: 4.9, reviews: 81, color: "bg-trade-slate" },
                  { name: "StormShield Roofing", initials: "SS", bio: "Emergency roof repairs, chimney repointing and leadwork. Insurance work specialists.", years: "15 years", rating: 4.7, reviews: 49, color: "bg-trade-forest" },
                  { name: "TopDeck Roofers", initials: "TD", bio: "GRP fibreglass roofing, fascias, soffits and gutter replacements.", years: "10 years", rating: 4.8, reviews: 35, color: "bg-trade-stone" },
                ],
                landscapers: [
                  { name: "GreenScape Gardens", initials: "GS", bio: "Full garden design and landscaping. Patios, decking, fencing and planting schemes.", years: "14 years", rating: 4.9, reviews: 67, color: "bg-trade-forest" },
                  { name: "Outdoor Living Co.", initials: "OL", bio: "Porcelain paving, composite decking and outdoor kitchens. Garden transformations.", years: "9 years", rating: 4.8, reviews: 42, color: "bg-trade-olive" },
                  { name: "Stonecraft Landscapes", initials: "SL", bio: "Natural stone walling, driveways and water features. RHS-qualified designers.", years: "18 years", rating: 4.7, reviews: 55, color: "bg-trade-stone" },
                ],
                tilers: [
                  { name: "Precision Tiling Co.", initials: "PT", bio: "Floor and wall tiling, mosaic work and underfloor heating installations.", years: "12 years", rating: 4.9, reviews: 51, color: "bg-trade-stone" },
                  { name: "Metro Tile & Stone", initials: "MT", bio: "Large format porcelain, natural stone and wet room specialists. Commercial and domestic.", years: "15 years", rating: 4.8, reviews: 38, color: "bg-trade-aqua" },
                  { name: "TileWorks Pro", initials: "TW", bio: "Bathroom and kitchen tiling, splashbacks and outdoor tiling. Mapei-certified installer.", years: "7 years", rating: 4.7, reviews: 24, color: "bg-trade-cobalt" },
                ],
              };

              const providers = featuredProviders.length > 0
                ? featuredProviders
                : (TEST_PROVIDERS[slug!] || TEST_PROVIDERS.joiners).map((t, i) => ({
                    id: `test-${i}`,
                    business_name: t.name,
                    logo_url: null,
                    banner_url: null,
                    public_bio: t.bio,
                    years_experience: t.years,
                    _initials: t.initials,
                    _rating: t.rating,
                    _reviews: t.reviews,
                    _color: t.color,
                    _isTest: true,
                  }));

              return providers.map((provider: any) => {
                const isTest = provider._isTest;
                const rating = isTest ? provider._rating : null;
                const reviews = isTest ? provider._reviews : null;
                const initials = isTest ? provider._initials : trade.mark;
                const cardColor = isTest ? provider._color : trade.bg;

                return (
                  <div key={provider.id} className="group relative overflow-hidden border border-foreground/8 transition-all duration-300 hover-lift bg-card">
                    {/* Banner */}
                    <div className="h-36 overflow-hidden relative">
                      <img
                        src={provider.banner_url || trade.img}
                        alt={provider.business_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-3">
                        {/* Logo / Initials */}
                        {provider.logo_url ? (
                          <img src={provider.logo_url} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
                        ) : (
                          <div className={cn("w-12 h-12 flex items-center justify-center flex-shrink-0", cardColor)}>
                            <span className="font-display text-sm font-extrabold text-white tracking-tight">{initials}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-bold text-foreground truncate">{provider.business_name}</h3>
                          {provider.years_experience && (
                            <p className="text-xs text-muted-foreground">{provider.years_experience} experience</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {provider.public_bio || provider.business_description || 'Professional tradesperson ready to help.'}
                      </p>
                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("h-3.5 w-3.5", rating && s <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-foreground/10 text-foreground/10")} />
                          ))}
                        </div>
                        {rating && (
                          <span className="text-xs font-semibold text-foreground">{rating}</span>
                        )}
                        {reviews && (
                          <span className="text-xs text-foreground/40">({reviews} reviews)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[10px] text-foreground/35 uppercase tracking-wider">
                          <Shield className="h-3 w-3" /> Vetted
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-foreground/35 uppercase tracking-wider">
                          <Users className="h-3 w-3" /> Verified
                        </span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* ═══ Login Gate ═══ */}
      <section className="py-10 md:py-14 bg-background">
        <div className="container">
          <div className="relative border border-foreground/8 bg-card overflow-hidden">

            <div className="relative z-10 px-8 py-14 sm:px-14 sm:py-20 md:px-20 md:py-24 max-w-2xl mx-auto text-center">
              <p className="eyebrow mb-5">Local Professionals</p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-[0.95] mb-5">
                Find {trade.name} in Your Area
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto mb-10">
                Sign in to find trusted {trade.name.toLowerCase()} near you, read local reviews, and get quotes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" asChild className="w-full sm:w-auto font-bold h-12 px-10 text-[11px] uppercase tracking-[0.14em] shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto font-bold border border-foreground/14 text-foreground hover:bg-foreground/5 h-12 px-10 text-[11px] uppercase tracking-[0.14em] transition-all duration-300 hover:scale-105">
                  <Link to="/signup">Create Account</Link>
                </Button>
              </div>
              <p className="mt-5 text-[11px] text-foreground/30 tracking-wide">
                Free to join. No commitment. No spam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Browse Other Trades ═══ */}
      <section className="py-16 md:py-20 bg-foreground">
        <div className="container">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-primary-foreground/35 mb-5">
            Browse Trades
          </p>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground leading-[0.95] mb-10">
            Explore All Trades
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TRADE_SLUGS.map((t) => {
              const td = TRADES[t.slug];
              const isActive = t.slug === slug;
              return (
                <Link
                  key={t.slug}
                  to={`/trades/${t.slug}`}
                  className={cn(
                    "group flex items-center gap-3 p-4 border transition-all duration-300",
                    isActive
                      ? "border-primary-foreground/30 bg-primary-foreground/10"
                      : "border-primary-foreground/8 hover:border-primary-foreground/25 hover:bg-primary-foreground/5"
                  )}
                >
                  <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                    <img src={td.img} alt={td.name} className="w-full h-full object-cover" />
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-primary-foreground" : "text-primary-foreground/80 group-hover:text-primary-foreground"
                  )}>
                    {t.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/* ─── HEADER ─────────────────────────────────────────────── */

const Header = () => (
  <header className="border-b border-foreground/8 bg-background sticky top-0 z-50">
    <div className="container flex h-[68px] items-center justify-between gap-4">
      <Link to="/" className="flex items-center group min-w-0 flex-shrink">
        <img src={logo} alt="BOOKaTRADE" className="h-8 flex-shrink-0 object-contain transition-transform duration-300 group-hover:scale-105" />
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        <Link to="/trades/joiners" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">
          Find a Trade
        </Link>
        <Link to="/signup" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">
          Post a Job
        </Link>
        <Link to="/signup" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">
          For Trades
        </Link>
        <Link to="/login" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">
          Sign In
        </Link>
      </nav>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Button variant="ghost" size="sm" asChild className="font-semibold hover:bg-foreground/5 transition-all px-3 sm:px-4 sm:h-10 hidden sm:inline-flex">
          <Link to="/login">Sign In</Link>
        </Button>
        <Button size="sm" asChild className="font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all px-4 sm:px-6 sm:h-10 text-[11px] uppercase tracking-[0.12em]">
          <Link to="/signup">Get Started</Link>
        </Button>
      </div>
    </div>
  </header>
);

/* ─── FOOTER ─────────────────────────────────────────────── */

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground py-16 md:py-20">
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 pb-12 border-b border-primary-foreground/9 mb-10">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center mb-4">
            <img src={logo} alt="BOOKaTRADE" className="h-8 brightness-0 invert" />
          </Link>
          <p className="text-sm text-primary-foreground/42 leading-relaxed max-w-[250px]">
            Connecting homes with trusted tradespeople across the UK. Find the right trade, first time.
          </p>
        </div>
        {/* Find a Trade */}
        <div>
          <h4 className="text-[10px] tracking-[0.16em] uppercase text-primary-foreground/35 font-semibold mb-5">
            Find a Trade
          </h4>
          <ul className="space-y-2.5">
            {TRADE_SLUGS.map((t) => (
              <li key={t.slug}>
                <Link
                  to={`/trades/${t.slug}`}
                  className="text-sm text-primary-foreground/58 hover:text-primary-foreground transition-colors"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Platform */}
        <div>
          <h4 className="text-[10px] tracking-[0.16em] uppercase text-primary-foreground/35 font-semibold mb-5">
            Platform
          </h4>
          <ul className="space-y-2.5">
            {["How It Works", "Post a Job", "Reviews", "Trust & Safety"].map((link) => (
              <li key={link}>
                <Link to="/signup" className="text-sm text-primary-foreground/58 hover:text-primary-foreground transition-colors">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* For Trades */}
        <div>
          <h4 className="text-[10px] tracking-[0.16em] uppercase text-primary-foreground/35 font-semibold mb-5">
            For Trades
          </h4>
          <ul className="space-y-2.5">
            {["Join as a Provider", "How It Works", "Help Centre", "Contact Us"].map((link) => (
              <li key={link}>
                <Link to="/signup" className="text-sm text-primary-foreground/58 hover:text-primary-foreground transition-colors">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[11px] text-primary-foreground/28">
          © {new Date().getFullYear()} BOOKaTRADE Ltd. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-[11px] text-primary-foreground/28">
          <Link to="/legal?audience=customer" className="hover:text-primary-foreground/65 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/legal?audience=customer" className="hover:text-primary-foreground/65 transition-colors">
            Terms of Use
          </Link>
          <Link to="/login" className="hover:text-primary-foreground/65 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default TradeCategory;
