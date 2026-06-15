import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, CheckCircle, Star, PhoneCall, Send, CircleArrowDown, Phone, Mail, Download, Zap, Award, Users, MailPlus, Repeat1, Paintbrush, BellRing, Infinity } from "lucide-react";
import heroImage from "@/assets/hero-trades.jpg";
import HomeAuthPanel from "@/components/HomeAuthPanel";
import trustImage from "@/assets/trust-handshake.jpg";
import qualityImage from "@/assets/quality-work.jpg";
import peaceImage from "@/assets/peace-of-mind.jpg";
import electricianImage from "@/assets/kitchen-electrics.jpg";
import logo from "@/assets/bookatrade-logo.png";
import trustedPartnershipImage from "@/assets/trusted-partnership.jpg";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-foreground/8 bg-background sticky top-0 z-50">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group min-w-0 flex-shrink">
            <img src={logo} alt="BookATrade logo" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 object-contain transition-transform duration-300 group-hover:rotate-6" />
            <span className="font-display text-base sm:text-xl font-extrabold text-foreground whitespace-nowrap tracking-tight">
              BOOK<span className="text-primary">a</span>TRADE
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">How It Works</a>
            <a href="#trades" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">Trades</a>
            <a href="#for-providers" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">For Providers</a>
            <Link to="/login" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-opacity">Sign In</Link>
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

      {/* Hero Section — Editorial 2-column */}
      <section className="bg-background">
        <div className="container py-16 md:py-0">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-0 items-center min-h-[75vh] lg:min-h-[88vh]">
            {/* Left column */}
            <div className="max-w-xl py-8 lg:py-20 animate-fade-in">
              <p className="eyebrow mb-5">Craftsmanship Starts Here</p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[5.5rem] font-extrabold tracking-tight text-foreground leading-[0.93] mb-7">
                Find the Right<br />
                Trade.<br />
                <span className="text-primary">First Time.</span>
              </h1>
              <p className="text-base text-foreground/60 leading-relaxed max-w-[380px] mb-10 animate-fade-in stagger-2 opacity-0">
                Connect with trusted, vetted tradespeople for every home project. From small fixes to full transformations.
              </p>

              {/* Search-like CTA bar */}
              <div className="flex max-w-[500px] border border-foreground/14 shadow-lg shadow-foreground/7 bg-card overflow-hidden animate-fade-in stagger-3 opacity-0">
                <input
                  type="text"
                  placeholder="What do you need done?"
                  className="flex-1 px-4 py-3.5 text-sm bg-transparent outline-none text-foreground placeholder:text-foreground/38"
                  readOnly
                  onClick={() => window.location.href = '/signup'}
                />
                <div className="w-px bg-foreground/10 my-3" />
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 text-[11px] uppercase tracking-[0.13em] font-bold h-auto">
                  <Link to="/signup">Search</Link>
                </Button>
              </div>

              {/* Trust pills */}
              <div className="flex flex-wrap gap-5 mt-6 animate-fade-in stagger-4 opacity-0">
                {["Vetted Tradespeople", "No Spam", "Limited Quotes Only"].map((pill) => (
                  <span key={pill} className="flex items-center gap-2 text-[11px] text-foreground/50 tracking-wide">
                    <span className="w-[5px] h-[5px] rounded-full bg-primary flex-shrink-0" />
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Right column — Auth Panel */}
            <div className="w-full lg:h-full lg:flex lg:items-center lg:justify-center lg:bg-accent/60 lg:py-16 animate-fade-in stagger-3 opacity-0">
              <div className="w-full max-w-md mx-auto lg:px-8">
                <HomeAuthPanel />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-foreground text-primary-foreground py-8 relative overflow-hidden border-y-4 border-primary/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(var(--primary) / 0.1) 20px, hsl(var(--primary) / 0.1) 21px)` }} />
        </div>
        <div className="container relative grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "13+", label: "Job Categories Available" },
            { value: "3", label: "Max Quotes Per Job" },
            { value: "100%", label: "Vetted Tradespeople" },
            { value: "24/7", label: "Support Available" },
          ].map((stat) => (
            <div key={stat.label} className="group">
              <div className="font-display text-3xl md:text-4xl font-extrabold text-primary drop-shadow-md group-hover:scale-110 transition-transform duration-300">{stat.value}</div>
              <div className="mt-1 text-sm font-medium text-primary-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why People Often Don't Trust A Trader */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <p className="eyebrow mb-5">The Problem</p>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Why People Often Don't Trust A Trader!
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                {"- Customers get let down by unreliable trades.\n- \u201CWe got scammed... But he had glowing reviews.\u201D\n- Jobs get sent to too many providers.\n- Customers get bombarded with calls and quotes.\n- Providers pay upfront for leads that go nowhere.\n\n"}
                <strong>We know exactly what keeps going wrong.{"\n"}That's why we built BookATrade:</strong>
                {"\n\n- Jobs are matched to a few local providers.\n- Your details are never shared unless you choose.\n- No more paying for leads, only guaranteed jobs.\n- Every provider is vetted before they can join, so no cowboys or time wasters.\n- Full transparency and oversight start to finish."}
              </p>
            </div>
            <div className="order-1 md:order-2 relative group">
              <img
                src={peaceImage}
                alt="Tradesperson discussing work with a happy homeowner"
                className="relative shadow-2xl shadow-foreground/15 w-full aspect-[4/3] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] border border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 bg-foreground text-primary-foreground">
        <div className="container">
          <div className="mb-16">
            <p className="eyebrow !text-secondary mb-4">How It Works</p>
            <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-[0.97]">
              Create a Job in<br />Under 2 Minutes.
            </h3>
          </div>
          <div className="grid md:grid-cols-3 max-w-5xl">
            {[
              {
                step: "01",
                icon: <MailPlus className="h-6 w-6" />,
                title: "Post Your Job Once",
                desc: "Describe what you need, add photos and/or videos, and we'll match you with the right tradespeople local to your area.",
              },
              {
                step: "02",
                icon: <Repeat1 className="h-6 w-6" />,
                title: "Tailored Job Matching",
                desc: "Each job receives quotes from a small number of highly trusted local providers. No spam for anyone.",
              },
              {
                step: "03",
                icon: <Infinity className="h-6 w-6" />,
                title: "Clear From Start To Finish",
                desc: "Jobs, quotes, communication, and payments all handled in one place.\nClear, simple, and under your control.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`group py-10 md:py-0 ${i < 2 ? "border-b md:border-b-0 md:border-r border-primary-foreground/10" : ""} ${i > 0 ? "md:pl-12" : ""} ${i < 2 ? "md:pr-12" : ""}`}
              >
                <div className="font-display text-6xl lg:text-7xl font-extrabold text-primary leading-none mb-5 tracking-tight">
                  {item.step}
                </div>
                <h4 className="text-[11px] uppercase tracking-[0.16em] font-bold text-primary-foreground mb-3">{item.title}</h4>
                <p className="text-sm text-primary-foreground/50 leading-relaxed whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="trades" className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="mb-16">
            <p className="eyebrow mb-4">Why BOOKaTRADE</p>
            <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-[0.97]">
              Need Work Done?<br />Why Us &amp; Why Now?
            </h3>
            <p className="mt-4 max-w-lg text-lg whitespace-pre-line text-muted-foreground">
              {"Most platforms are completely hit and miss with no guarantees.\nThey lack transparency and accountability.\nBookATrade is built to fix that."}
            </p>
          </div>
          <div className="grid md:grid-cols-3 max-w-5xl border border-foreground/9">
            {[
              {
                icon: <BellRing className="h-6 w-6" />,
                title: "No Spam",
                desc: "Your personal details are never shared.\nYou stay in control.\nNo bombardment or unwanted calls.",
                barColor: "bg-primary",
              },
              {
                icon: <Repeat1 className="h-6 w-6" />,
                title: "No Repeating Yourself",
                desc: "Post your job requirements once.\nAdd photos and videos.\nProviders know exactly what you need",
                barColor: "bg-trade-olive",
              },
              {
                icon: <CircleArrowDown className="h-6 w-6" />,
                title: "Less Competition",
                desc: "All providers excel in their field.\nSo we limit the numbers\nto avoid confusion and overwhelm.",
                barColor: "bg-foreground",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`group p-10 transition-all duration-300 hover-lift ${i < 2 ? "border-b md:border-b-0 md:border-r border-foreground/9" : ""}`}
              >
                <div className={`w-9 h-0.5 ${item.barColor} mb-6`} />
                <h4 className="text-xs uppercase tracking-[0.12em] font-bold text-foreground mb-2.5">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Features with Images */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container space-y-20 md:space-y-32">
          {/* Feature 1 - You Stay In Control */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <p className="eyebrow mb-5">For Customers</p>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                You Stay In Control The Whole Time
              </h3>
              <p className="mt-4 leading-relaxed font-sans text-muted-foreground text-lg whitespace-pre-line">
                <strong>Customers:</strong>
                {" \n- Your personal details are safe. We never share your information.\n- You choose who to speak to and work with.\n- You can ignore, accept, or decline any quote.\n- You can update or remove your job at any time.\n- No commitment until you're ready.\n- You only release payment when you're completely satisfied"}
              </p>
            </div>
            <div className="order-1 md:order-2 relative group">
              <img
                src={trustImage}
                alt="Customer greeting a trusted tradesperson"
                className="relative shadow-2xl shadow-foreground/15 w-full aspect-[4/3] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] border border-border/50"
              />
            </div>
          </div>

          {/* Feature 2 - Built For Jobs */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="relative group">
              <img
                src={qualityImage}
                alt="Professional roofer performing quality work on a residential roof"
                className="relative shadow-2xl shadow-foreground/15 w-full aspect-[4/3] object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] border border-border/50"
              />
            </div>
            <div>
              <p className="eyebrow mb-5">For Providers</p>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Built For Jobs, Not Leads
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                <strong>Providers:</strong>
                {"\n- No upfront or hidden costs.\n- No monthly fees.\n- No paying for job leads.\n- Jobs ONLY available to a few providers.\n- You don't start working until funds are in place.\n- No contracts tying you in."}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* For Tradespeople CTA — Red bg (editorial) */}
      <section id="for-providers" className="py-24 md:py-32 bg-primary">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="text-center md:text-left flex flex-col items-center md:items-start w-full">
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-primary-foreground/50 mb-5">For Trade Professionals</p>
              <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-[0.92]">
                Guaranteed,<br /><span className="text-primary-foreground">Local Jobs</span>
              </h3>
              <p className="mt-5 text-primary-foreground/65 leading-relaxed whitespace-pre-line text-base max-w-[400px] mb-8">
                {"Join today and see how we work. No upfront costs. No monthly fees.\nNo paying for job leads. No commitment. Only pay us when you get paid."}
              </p>
              {/* Benefits grid */}
              <ul className="grid grid-cols-2 gap-3 mb-10 w-full max-w-md">
                {["Quality local leads", "Verified reviews", "Limited quotes per job", "No cold canvassing", "Job management tools", "Payment confidence"].map((ben) => (
                  <li key={ben} className="text-sm text-primary-foreground/75 flex items-center gap-2">
                    <span className="w-3.5 h-px bg-primary-foreground/40 flex-shrink-0" />
                    {ben}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" variant="secondary" asChild className="text-sm font-bold h-12 px-8 uppercase tracking-[0.14em] transition-all duration-300 hover:scale-105">
                  <Link to="/signup">Join as a Trade</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-sm font-bold bg-transparent border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/60 h-12 px-8 uppercase tracking-[0.14em] transition-all duration-300 hover:scale-105">
                  <Link to="/signup">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Users className="h-6 w-6" />, label: "Real Local Jobs" },
                { icon: <Shield className="h-6 w-6" />, label: "Verified Badge" },
                { icon: <Star className="h-6 w-6" />, label: "Build Reviews" },
                { icon: <Zap className="h-6 w-6" />, label: "Full Transparency" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-3 bg-primary-foreground/5 border border-primary-foreground/15 p-6 text-center transition-all duration-300 hover:bg-primary-foreground/10 hover:border-primary-foreground/30 hover:-translate-y-1">
                  <div className="text-primary-foreground p-3 bg-primary-foreground/10 border border-primary-foreground/15">{item.icon}</div>
                  <span className="text-sm font-semibold text-primary-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Electrician Feature / Recommend Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container">
          <div className="relative overflow-hidden shadow-2xl border border-border/50">
            <img
              src={electricianImage}
              alt="Professional electrician working with customer supervision"
              className="w-full h-[28rem] sm:h-80 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 sm:via-foreground/40 to-foreground/40 sm:to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container">
                <div className="max-w-md">
                  <p className="eyebrow !text-secondary mb-4">Community</p>
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground leading-tight">
                    Had a great experience with a local provider? <span className="text-primary block whitespace-pre-line">Tell us about them!</span>
                  </h3>
                  <p className="mt-2 text-primary-foreground/80 text-sm whitespace-pre-line font-sans md:text-lg font-medium">
                    {"Have your say in which providers are on the platform.\nOnly trusted, recommended providers make it in.\nHelp out the community; have your say."}
                  </p>
                  <Button size="lg" asChild className="mt-6 text-sm font-bold h-12 px-8 uppercase tracking-[0.14em] shadow-2xl shadow-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/60">
                    <Link to="/signup" className="flex items-center justify-center gap-2">
                      <span>Recommend A Provider</span>
                      <ArrowRight className="h-5 w-5 flex-shrink-0" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — Red bg */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-background">
        <div className="container relative z-10 text-center flex flex-col items-center">
          <p className="eyebrow mb-4">Get Started Today</p>
          <h3 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl lg:text-6xl leading-[0.95] max-w-2xl">
            Beautiful Homes Need Skilled Hands.
          </h3>
          <p className="mt-5 max-w-md mx-auto text-base text-foreground/52 leading-relaxed">
            Post your first job free. Find trusted tradespeople without the guesswork.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:items-center">
            <Button size="lg" asChild className="text-sm font-bold h-12 px-10 uppercase tracking-[0.14em] shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <Link to="/signup" className="flex items-center justify-center gap-2">
                <span>See How It Works</span>
                <ArrowRight className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-sm font-bold border border-foreground/14 text-foreground hover:bg-foreground/5 h-12 px-10 uppercase tracking-[0.14em] transition-all duration-300 hover:scale-105">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
          <p className="mt-4 text-[11px] text-foreground/30 tracking-wide">Free to post. No commitment. No spam.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-primary-foreground py-16 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-primary-foreground/9 mb-10">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={logo} alt="BookATrade logo" className="h-10 w-10 object-contain" />
                <span className="font-display text-lg font-extrabold text-primary-foreground">
                  BOOK<span className="text-primary">a</span>TRADE
                </span>
              </Link>
              <p className="text-sm text-primary-foreground/42 leading-relaxed max-w-[250px]">
                Connecting homes with trusted tradespeople across the UK. Find the right trade, first time.
              </p>
            </div>
            {/* Find a Trade */}
            <div>
              <h4 className="text-[10px] tracking-[0.16em] uppercase text-primary-foreground/35 font-semibold mb-5">Find a Trade</h4>
              <ul className="space-y-2.5">
                {["Joiners", "Kitchen Fitters", "Electricians", "Painters", "Plumbers", "Roofers", "Landscapers", "Tilers"].map((trade) => (
                  <li key={trade}>
                    <Link to="/signup" className="text-sm text-primary-foreground/58 hover:text-primary-foreground transition-colors">{trade}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Platform */}
            <div>
              <h4 className="text-[10px] tracking-[0.16em] uppercase text-primary-foreground/35 font-semibold mb-5">Platform</h4>
              <ul className="space-y-2.5">
                {["How It Works", "Post a Job", "Reviews", "Trust & Safety"].map((link) => (
                  <li key={link}>
                    <Link to="/signup" className="text-sm text-primary-foreground/58 hover:text-primary-foreground transition-colors">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* For Trades */}
            <div>
              <h4 className="text-[10px] tracking-[0.16em] uppercase text-primary-foreground/35 font-semibold mb-5">For Trades</h4>
              <ul className="space-y-2.5">
                {["Join as a Provider", "How It Works", "Help Centre", "Contact Us"].map((link) => (
                  <li key={link}>
                    <Link to="/signup" className="text-sm text-primary-foreground/58 hover:text-primary-foreground transition-colors">{link}</Link>
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
              <Link to="/legal?audience=customer" className="hover:text-primary-foreground/65 transition-colors">Privacy Policy</Link>
              <Link to="/legal?audience=customer" className="hover:text-primary-foreground/65 transition-colors">Terms of Use</Link>
              <Link to="/login" className="hover:text-primary-foreground/65 transition-colors">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
