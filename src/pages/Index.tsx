import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menu, X, Mail, Lock } from "lucide-react";
import logo from "@/assets/bookatrade-logo-black.png";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/* ── Image imports ───────────────────────────────────── */
import tradeJoiners from "@/assets/trade-joiners.jpg";
import tradeKitchen from "@/assets/trade-kitchen.jpg";
import tradeElectricians from "@/assets/trade-electricians.jpg";
import tradePainters from "@/assets/trade-painters.jpg";
import tradePlumbers from "@/assets/trade-plumbers.jpg";
import tradeRoofers from "@/assets/trade-roofers.jpg";
import tradeLandscapers from "@/assets/trade-landscapers.jpg";
import tradeTilers from "@/assets/trade-tilers.jpg";
import heroScrewdriver from "@/assets/hero-screwdriver.jpg";
import campaignHammer from "@/assets/campaign-hammer.jpg";
import brandTapeMeasure from "@/assets/brand-tape-measure.png";
import projectBathroom from "@/assets/project-bathroom.jpg";
import projectKitchenSage from "@/assets/project-kitchen-sage.jpg";
import projectExterior from "@/assets/project-exterior.jpg";
import projectKitchenWarm from "@/assets/project-kitchen-warm.jpg";
import projectJoinery from "@/assets/project-joinery.jpg";
import heroGarden from "@/assets/hero-garden.png";
import projectKitchenDark from "@/assets/project-kitchen-dark.jpg";
import projectBathroomGreen from "@/assets/project-bathroom-green.jpg";

/* ── Trade tile data ─────────────────────────────────── */
const TRADES = [
  { slug: "joiners",         name: "Joiners",         tagline: "Made to Measure",          sub: "Wardrobes, staircases & bespoke fitted furniture",  mark: "J", bg: "bg-trade-olive",   img: tradeJoiners },
  { slug: "kitchen-fitters", name: "Kitchen Fitters",  tagline: "Heart of the Home",         sub: "Designed for living, installed with precision",      mark: "K", bg: "bg-trade-orange",  img: tradeKitchen },
  { slug: "electricians",    name: "Electricians",     tagline: "Find the Spark",            sub: "Powered by precision, wired for results",            mark: "E", bg: "bg-trade-lilac",   img: tradeElectricians },
  { slug: "painters",        name: "Painters",         tagline: "Paint the Room",            sub: "Interior, exterior, wallpaper & feature walls",      mark: "P", bg: "bg-trade-cobalt",  img: tradePainters },
  { slug: "plumbers",        name: "Plumbers",         tagline: "Keeping Life Flowing",      sub: "No leaks. No hassle. Trusted local plumbers",        mark: "P", bg: "bg-trade-aqua",    img: tradePlumbers },
  { slug: "roofers",         name: "Roofers",          tagline: "The Roof Over Everything",  sub: "Protection starts at the top. Built to last",        mark: "R", bg: "bg-trade-slate",   img: tradeRoofers },
  { slug: "landscapers",     name: "Landscapers",      tagline: "Bring the Outside to Life", sub: "Gardens that work beautifully, year-round",          mark: "L", bg: "bg-trade-forest",  img: tradeLandscapers },
  { slug: "tilers",          name: "Tilers",           tagline: "Every Detail Aligned",      sub: "Find skilled tilers who get the finish right",        mark: "T", bg: "bg-trade-stone",   img: tradeTilers },
];

/* ── Review ticker data ──────────────────────────────── */
const REVIEWS = [
  { quote: "Incredible finish. Booked within the hour.", name: "Sarah M., London" },
  { quote: "Found the perfect kitchen fitter. Seamless.", name: "James T., Manchester" },
  { quote: "Trusted, local and exactly what we needed.",  name: "Priya K., Bristol" },
  { quote: "Our joiner was brilliant. Made to measure, indeed.", name: "Tom W., Edinburgh" },
];

/* ── Recent works data ───────────────────────────────── */
const WORKS = [
  { tag: "Bathroom",  tagColor: "#80DDE5", title: "Teal Marble\nWet Room",        loc: "Manchester · Tiler + Plumber",  img: projectBathroom },
  { tag: "Kitchen",   tagColor: "#C8CB82", title: "Sage Green\nKitchen",          loc: "London · Kitchen Fitter",       img: projectKitchenSage },
  { tag: "Exterior",  tagColor: "#A0AEBC", title: "Full Roof\nReplacement",       loc: "Edinburgh · Roofer",            img: projectExterior },
  { tag: "Kitchen",   tagColor: "#F4A06A", title: "Warm Oak\nKitchen",            loc: "Bristol · Kitchen Fitter",       img: projectKitchenWarm },
  { tag: "Joinery",   tagColor: "#D4C8A8", title: "Bespoke\nFitted Study",        loc: "Leeds · Joiner",                img: projectJoinery },
];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      setSignInOpen(false);
      navigate("/");
    }
    setSignInLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ═══ 1. NAV ══════════════════════════════════════ */}
      <header className="border-b border-foreground/[0.07] bg-background sticky top-0 z-50">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center group min-w-0 flex-shrink">
            <img src={logo} alt="BOOKaTRADE" className="h-7 sm:h-9 flex-shrink-0 object-contain" />
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#trades" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors">Find a Trade</a>
            <Link to="/signup" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors">Post a Job</Link>
            <a href="#recent-works" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors">Recent Works</a>
            <a href="#for-providers" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors">For Trades</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="ghost" size="sm" className="font-semibold hover:bg-foreground/5 transition-all px-3 sm:px-4 sm:h-10 hidden sm:inline-flex" onClick={() => setSignInOpen(true)}>
              Sign In
            </Button>
            <Button size="sm" asChild className="font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all px-4 sm:px-6 sm:h-10 text-[11px] uppercase tracking-[0.12em]">
              <Link to="/signup">Sign Up Free</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-foreground/[0.07] bg-background px-6 py-4 space-y-3">
            <a href="#trades" className="block text-sm text-foreground/70" onClick={() => setMobileMenuOpen(false)}>Find a Trade</a>
            <Link to="/signup" className="block text-sm text-foreground/70" onClick={() => setMobileMenuOpen(false)}>Post a Job</Link>
            <a href="#recent-works" className="block text-sm text-foreground/70" onClick={() => setMobileMenuOpen(false)}>Recent Works</a>
            <a href="#for-providers" className="block text-sm text-foreground/70" onClick={() => setMobileMenuOpen(false)}>For Trades</a>
            <button className="block text-sm text-foreground/70 text-left" onClick={() => { setMobileMenuOpen(false); setSignInOpen(true); }}>Sign In</button>
          </div>
        )}
      </header>

      {/* ═══ 2. HERO ═════════════════════════════════════ */}
      <section className="bg-background">
        <div className="grid lg:grid-cols-2 min-h-[75vh] lg:min-h-[88vh]">
          {/* Left column */}
          <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20 py-16 lg:py-20 animate-fade-in">
            <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-5">Craftsmanship Starts Here</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[5.5rem] tracking-tight text-foreground leading-[1.4] mb-7">
              Find the Right<br />Trade.<br />First Time.
            </h1>
            <p className="text-base leading-relaxed text-foreground/60 max-w-[380px] mb-10">
              Connect with trusted, vetted tradespeople for every home project. From small fixes to full transformations.
            </p>

            {/* Search bar */}
            <div className="flex max-w-[500px] border-[1.5px] border-foreground/[0.14] shadow-[0_6px_28px_rgba(37,37,37,0.07)] bg-white overflow-hidden">
              <input
                type="text"
                placeholder="What do you need done?"
                className="flex-1 px-4 py-[15px] text-sm border-none outline-none font-sans text-foreground bg-transparent placeholder:text-foreground/[0.38]"
                onFocus={() => navigate("/signup")}
              />
              <div className="w-px bg-foreground/10 my-[11px]" />
              <input
                type="text"
                placeholder="Your postcode"
                className="max-w-[140px] px-4 py-[15px] text-sm border-none outline-none font-sans text-foreground bg-transparent placeholder:text-foreground/[0.38]"
                onFocus={() => navigate("/signup")}
              />
              <button
                onClick={() => navigate("/signup")}
                className="bg-primary text-white border-none px-6 text-[11px] tracking-[0.13em] uppercase font-bold font-sans cursor-pointer hover:bg-[#8d000d] transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>

            {/* Trust pills */}
            <div className="flex gap-7 mt-7 flex-wrap">
              {["Vetted Tradespeople", "No Spam", "Limited Quotes Only"].map((pill) => (
                <span key={pill} className="text-[11px] text-foreground/50 flex items-center gap-1.5 tracking-[0.04em]">
                  <span className="w-[5px] h-[5px] rounded-full bg-primary flex-shrink-0" />
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Right column — editorial tool visual */}
          <div className="hidden lg:block relative overflow-hidden">
            <img
              src={heroScrewdriver}
              alt="Luxury screwdriver — editorial tool image"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/10 to-transparent" />
            <p className="absolute bottom-9 left-12 text-[10px] tracking-[0.2em] uppercase text-white/70 z-10">
              Electricians — Find the Spark.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 3. REVIEW TICKER ════════════════════════════ */}
      <div className="bg-background border-y border-foreground/[0.07] py-4 overflow-hidden">
        <div className="flex items-center">
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-primary whitespace-nowrap flex-shrink-0 px-6 sm:px-10 lg:px-16 z-10 bg-background">Trusted Reviews</span>
          <div className="flex animate-marquee whitespace-nowrap">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5 mx-8 flex-shrink-0">
                <span className="text-primary text-[11px] tracking-[2px]">★★★★★</span>
                <span className="text-xs italic text-foreground/65">"{r.quote}"</span>
                <span className="text-[11px] text-foreground/[0.38]">— {r.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 4. BROWSE BY TRADE ══════════════════════════ */}
      <section id="trades">
        <div className="px-6 sm:px-10 lg:px-20 pt-20 lg:pt-24 pb-10 lg:pb-12">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">Browse by Trade</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight text-foreground">
            Every Home Project,<br />One Trusted Platform.
          </h2>
        </div>
        <div className="px-6 sm:px-10 lg:px-20 pb-20 lg:pb-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TRADES.map((t) => (
              <Link
                key={t.slug}
                to={`/trades/${t.slug}`}
                className="group aspect-[3/4] relative overflow-hidden flex flex-col justify-end p-5 sm:p-6 transition-transform duration-300 hover:scale-[1.025]"
              >
                {/* Background image */}
                <img src={t.img} alt={t.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.06]" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent z-[1]" />
                {/* Content */}
                <div className="relative z-[2]">
                  <p className="text-[9px] tracking-[0.18em] uppercase text-white/65 mb-1 font-sans">{t.tagline}</p>
                  <h3 className="font-display text-xl sm:text-[22px] text-white leading-none">{t.name}</h3>
                  <p className="text-[11px] text-white/[0.62] mt-1 leading-snug">{t.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5. HOW IT WORKS ═════════════════════════════ */}
      <section id="how-it-works" className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-24">
        <p className="text-[11px] tracking-[0.22em] uppercase text-trade-stone font-semibold mb-3.5">How It Works</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight text-white mb-14 lg:mb-16">
          Create a Job in<br />Under 2 Minutes.
        </h2>
        <div className="grid lg:grid-cols-3">
          {[
            { num: "01", title: "Post Your Job", copy: "Tell us what you need done, where and when. It takes under two minutes and there's no commitment required." },
            { num: "02", title: "Compare Trusted Trades", copy: "Receive a limited number of quotes from vetted, reviewed tradespeople. No spam. No endless follow-up calls." },
            { num: "03", title: "Book with Confidence", copy: "Review profiles, read verified local reviews, compare quotes — then book the right trade for your home." },
          ].map((step, i) => (
            <div
              key={step.num}
              className={`py-8 lg:py-0 ${i > 0 ? "lg:pl-12 border-t lg:border-t-0 lg:border-l" : ""} ${i < 2 ? "lg:pr-12 border-white/[0.1]" : ""}`}
            >
              <div className="font-display text-6xl lg:text-7xl text-primary leading-none mb-5 tracking-[-2px]">{step.num}</div>
              <h3 className="text-[11px] tracking-[0.16em] uppercase text-white font-bold mb-3 font-sans">{step.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 6. RECENT WORKS ═════════════════════════════ */}
      <section id="recent-works" className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-24">
        <div className="flex justify-between items-end mb-10 lg:mb-12">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">Recent Works</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight text-foreground">
              Beautiful Homes.<br />Skilled Hands.
            </h2>
          </div>
          <Link to="/signup" className="hidden sm:inline-block text-[11px] tracking-[0.13em] uppercase text-foreground/55 border-b border-current pb-0.5 font-semibold font-sans hover:opacity-100 transition-opacity">
            View All Projects →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr] gap-2.5">
          {WORKS.map((w, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden cursor-pointer ${i === 0 ? "sm:row-span-2" : ""}`}
            >
              {/* Project image */}
              <img src={w.img} alt={w.title.replace('\n', ' ')} className={`w-full object-cover transition-transform duration-400 group-hover:scale-[1.04] ${i === 0 ? "aspect-[3/4] h-full" : "aspect-square"}`} />
              {/* Overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-9 bg-gradient-to-t from-foreground/70 to-transparent">
                <span
                  className="inline-block text-[9px] tracking-[0.16em] uppercase border px-2 py-0.5 mb-1.5 font-sans"
                  style={{ borderColor: w.tagColor + "66", color: w.tagColor }}
                >
                  {w.tag}
                </span>
                <h3 className="font-display text-lg text-white leading-[1.4] whitespace-pre-line">{w.title}</h3>
                <p className="text-[11px] text-white/50 mt-1 font-sans">{w.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 7. WHY BOOKATRADE ═══════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 pb-20 lg:pb-24">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">Why BOOKaTRADE</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight text-foreground mb-10 lg:mb-12">
          Find Trusted.<br />Book Right.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-foreground/[0.09]">
          {[
            { title: "No Spam",          copy: "We limit the number of quotes per job so tradespeople compete on quality, not volume. No endless calls.",              barColor: "bg-primary" },
            { title: "Vetted Providers",  copy: "Every tradesperson on BOOKaTRADE is reviewed, checked and verified before they can quote on your job.",               barColor: "bg-trade-olive" },
            { title: "Local Reviews",     copy: "Real reviews from real homeowners in your area. Compare with confidence before you commit to anything.",               barColor: "bg-foreground" },
            { title: "Secure & Simple",   copy: "Post your job in under two minutes. Safe, straightforward, built around how homeowners actually work.",                barColor: "bg-trade-stone" },
          ].map((cell, i) => (
            <div key={i} className={`p-8 lg:p-10 ${i < 3 ? "border-b sm:border-b lg:border-b-0 lg:border-r border-foreground/[0.09]" : ""} ${i % 2 === 0 ? "sm:border-r lg:border-r" : "sm:border-r-0 lg:border-r"} ${i === 3 ? "lg:border-r-0" : ""}`}>
              <div className={`w-9 h-0.5 ${cell.barColor} mb-6`} />
              <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-foreground mb-2.5 font-sans">{cell.title}</h3>
              <p className="text-[13px] leading-relaxed text-foreground/[0.58]">{cell.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 8. CAMPAIGN BANNER — JOINERS ════════════════ */}
      <section className="relative overflow-hidden">
        <img src={campaignHammer} alt="Velvet hammer — joiner campaign visual" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="relative z-10 px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/55 font-semibold mb-4 font-sans">Joiners</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-[clamp(52px,5.5vw,86px)] text-white leading-[1.4] tracking-tight mb-5">
            MADE TO<br />MEASURE.
          </h2>
          <p className="text-[15px] leading-relaxed text-white/70 max-w-[360px] mb-10">
            The perfect fit starts with the right joiner. Bespoke furniture, fitted wardrobes, staircases and more.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/trades/joiners" className="inline-block bg-white text-foreground px-8 py-3.5 text-[11px] tracking-[0.14em] uppercase font-bold font-sans hover:bg-foreground hover:text-white transition-colors">
              Find a Joiner
            </Link>
            <Link to="/signup" className="inline-block bg-transparent text-white px-8 py-3 text-[11px] tracking-[0.14em] uppercase font-bold font-sans border-[1.5px] border-white/45 hover:border-white hover:bg-white/[0.08] transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 9. INSPIRATION GRID ═════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-24">
        <p className="text-[11px] tracking-[0.22em] uppercase text-trade-stone font-semibold">Inspiration</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight text-white mt-3.5 mb-10 lg:mb-12">
          From Vision<br />to Reality.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {[
            { type: "Landscaping",    title: "Bring the Outside to Life",    img: heroGarden },
            { type: "Kitchen Fitting", title: "Every Piece Has Its Place",   img: projectKitchenDark },
            { type: "Bathroom",       title: "Smooth Starts Here",           img: projectBathroomGreen },
          ].map((card, i) => (
            <div key={i} className="group relative overflow-hidden cursor-pointer">
              <img src={card.img} alt={card.title} className="w-full aspect-[4/5] object-cover transition-transform duration-400 group-hover:scale-[1.04]" />
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-12 bg-gradient-to-t from-black/[0.62] to-transparent">
                <p className="text-[9px] tracking-[0.18em] uppercase text-white/55 mb-1 font-sans">{card.type}</p>
                <p className="font-display text-xl text-white leading-[1.4]">{card.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 10. PROVIDER CTA ════════════════════════════ */}
      <section id="for-providers" className="relative overflow-hidden">
        <img src={brandTapeMeasure} alt="BOOKaTRADE branded tape measure" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/50 to-foreground/20" />
        <div className="relative z-10 px-6 sm:px-10 lg:px-20 py-20 lg:py-28 max-w-3xl">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-4 font-sans">For Trade Professionals</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-[clamp(40px,4.2vw,68px)] text-white leading-[1.4] tracking-tight mb-5">
            Better Jobs.<br />Better Customers.<br />Less Noise.
          </h2>
          <p className="text-[15px] leading-relaxed text-white/70 max-w-[400px] mb-9">
            Grow your pipeline without chasing dead leads. BOOKaTRADE connects you with homeowners who are ready to book — not just browsing.
          </p>
          <ul className="grid grid-cols-2 gap-3 mb-10 list-none">
            {["Quality local leads", "Verified reviews", "Limited quotes per job", "No cold canvassing", "Job management tools", "Payment confidence"].map((ben) => (
              <li key={ben} className="text-[13px] text-white/75 flex items-center gap-2">
                <span className="w-3.5 h-[1.5px] bg-white/40 flex-shrink-0" />
                {ben}
              </li>
            ))}
          </ul>
          <Link to="/signup" className="inline-block bg-white text-foreground px-8 py-3.5 text-[11px] tracking-[0.14em] uppercase font-bold font-sans hover:bg-foreground hover:text-white transition-colors">
            Join as a Trade
          </Link>
        </div>
      </section>

      {/* ═══ 11. SIGN UP CTA ═════════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-24 flex flex-col items-center text-center">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">Get Started Today</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(40px,4.5vw,72px)] text-foreground leading-[0.95] tracking-tight max-w-[640px] mt-3.5 mb-5">
          Beautiful Homes Need Skilled Hands.
        </h2>
        <p className="text-base text-foreground/[0.52] max-w-[420px] leading-relaxed mb-10">
          Post your first job free. Find trusted tradespeople without the guesswork.
        </p>
        <div className="flex max-w-[520px] w-full border-[1.5px] border-foreground/[0.13] shadow-[0_4px_24px_rgba(37,37,37,0.07)] overflow-hidden bg-white">
          <input
            type="email"
            placeholder="Enter your email address"
            className="flex-1 px-5 py-4 text-sm border-none outline-none font-sans bg-transparent"
            onFocus={() => navigate("/signup")}
          />
          <button
            onClick={() => navigate("/signup")}
            className="bg-foreground text-white border-none px-7 text-[11px] tracking-[0.14em] uppercase font-bold font-sans cursor-pointer hover:bg-primary transition-colors whitespace-nowrap"
          >
            Post a Job Free
          </button>
        </div>
        <p className="mt-3.5 text-[11px] text-foreground/30 tracking-[0.04em]">Free to post. No commitment. No spam.</p>
      </section>

      {/* ═══ 12. FOOTER ══════════════════════════════════ */}
      <footer className="bg-foreground px-6 sm:px-10 lg:px-20 pt-20 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-14 pb-14 border-b border-white/[0.09] mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="font-display text-xl text-white font-bold tracking-tight block mb-3.5">
              BOOK<span className="text-primary">a</span>TRADE
            </Link>
            <p className="text-[13px] leading-relaxed text-white/[0.42] max-w-[250px]">
              Connecting homes with trusted tradespeople across the UK. Find the right trade, first time.
            </p>
            <div className="flex gap-2.5 mt-5">
              {[{ label: "in" }, { label: "ig" }, { label: "fb" }].map((s) => (
                <a key={s.label} href="#" className="w-[34px] h-[34px] border border-white/[0.18] flex items-center justify-center text-[11px] text-white/45 font-sans hover:border-white/55 hover:text-white transition-colors">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          {/* Find a Trade */}
          <div>
            <h4 className="text-[10px] tracking-[0.16em] uppercase text-white/[0.35] font-semibold mb-5 font-sans">Find a Trade</h4>
            <ul className="space-y-2.5">
              {TRADES.map((t) => (
                <li key={t.slug}>
                  <Link to={`/trades/${t.slug}`} className="text-[13px] text-white/[0.58] hover:text-white transition-colors font-sans">{t.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Platform */}
          <div>
            <h4 className="text-[10px] tracking-[0.16em] uppercase text-white/[0.35] font-semibold mb-5 font-sans">Platform</h4>
            <ul className="space-y-2.5">
              {["How It Works", "Post a Job", "Recent Works", "Reviews", "Trust & Safety"].map((link) => (
                <li key={link}>
                  <Link to="/signup" className="text-[13px] text-white/[0.58] hover:text-white transition-colors font-sans">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
          {/* For Trades */}
          <div>
            <h4 className="text-[10px] tracking-[0.16em] uppercase text-white/[0.35] font-semibold mb-5 font-sans">For Trades</h4>
            <ul className="space-y-2.5">
              {["Join as a Provider", "How It Works", "Pricing", "Help Centre", "Contact Us"].map((link) => (
                <li key={link}>
                  <Link to="/signup" className="text-[13px] text-white/[0.58] hover:text-white transition-colors font-sans">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/[0.28]">
            © {new Date().getFullYear()} BOOKaTRADE Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-white/[0.28]">
            <Link to="/legal?audience=customer" className="hover:text-white/65 transition-colors">Privacy Policy</Link>
            <Link to="/legal?audience=customer" className="hover:text-white/65 transition-colors">Terms of Use</Link>
            <Link to="/login" className="hover:text-white/65 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

      {/* ═══ SIGN IN MODAL ═══════════════════════════════ */}
      {signInOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setSignInOpen(false)} />
          <div className="relative bg-card w-full max-w-md mx-4 p-8 shadow-2xl animate-fade-in">
            <button onClick={() => setSignInOpen(false)} className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-display text-2xl text-foreground mb-1">Welcome back</h2>
            <p className="text-sm text-foreground/50 mb-6">Enter your credentials to continue</p>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="modal-email" className="text-xs font-semibold">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="modal-email" type="email" placeholder="you@example.com" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} className="pl-9 h-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="modal-pw" className="text-xs font-semibold">Password</Label>
                  <Link to="/forgot-password" className="text-[11px] text-primary hover:underline font-semibold" onClick={() => setSignInOpen(false)}>
                    Forgotten password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="modal-pw" type="password" placeholder="••••••••" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} className="pl-9 h-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 font-bold" disabled={signInLoading}>
                {signInLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>
              <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleSignIn}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
              <p className="text-center text-sm text-foreground/50">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary font-bold hover:underline" onClick={() => setSignInOpen(false)}>Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
