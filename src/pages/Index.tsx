import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, CheckCircle, Star, Voicemail, Zap, Award, Repeat1, Users } from "lucide-react";
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
      <header className="border-b border-border/60 bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logo} alt="BookATrade logo" className="h-10 w-10 rounded-full bg-card shadow-md ring-2 ring-primary/20 transition-transform duration-300 group-hover:rotate-6 group-hover:ring-primary/40" />
            <span className="font-display text-xl font-extrabold text-foreground">
              Book<span className="text-primary">A</span>Trade
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="font-semibold border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 border-2 border-primary hover:border-primary/80 transition-all duration-300 hover:scale-105">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Trusted tradespeople ready to help with your home projects"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/30" />
        </div>
        <div className="container relative z-10 py-12 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary-foreground mb-6 animate-fade-in backdrop-blur-sm shadow-lg shadow-primary/10">
                <Award className="h-4 w-4 text-primary" />
                Local &bull; Recommended &bull; Trusted
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl lg:text-5xl xl:text-6xl animate-fade-in">
                Fed Up Of Being<br />
                <span className="block text-primary drop-shadow-lg">Let Down?</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed max-w-lg animate-fade-in stagger-2 opacity-0 text-primary-foreground font-normal">
                Customers: Find trusted local tradespeople in a few simple steps<br />
                Providers: No more paying for leads. Just real jobs with guaranteed payment
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-primary-foreground/70 animate-fade-in stagger-4 opacity-0">
                <span className="flex items-center gap-1.5 sm:gap-2 bg-primary-foreground/5 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-primary-foreground/10">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Local Recommendations
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-primary-foreground/5 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-primary-foreground/10">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Only The Best Trades
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-primary-foreground/5 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-primary-foreground/10">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Full Transparency
                </span>
              </div>
            </div>
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto animate-fade-in stagger-3 opacity-0">
              <HomeAuthPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-foreground text-primary-foreground py-8 relative overflow-hidden border-y-4 border-primary/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(25 95% 53% / 0.1) 20px, hsl(25 95% 53% / 0.1) 21px)' }} />
        </div>
        <div className="container relative grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "13+", label: "Trade categories" },
            { value: "3", label: "Max quotes per job" },
            { value: "100%", label: "Vetted tradespeople" },
            { value: "24/7", label: "Support available" },
          ].map((stat) => (
            <div key={stat.label} className="group">
              <div className="font-display text-3xl md:text-4xl font-extrabold text-primary drop-shadow-md group-hover:scale-110 transition-transform duration-300">{stat.value}</div>
              <div className="mt-1 text-sm font-medium text-primary-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 section-divider">
        <div className="container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-none shadow-none opacity-0"></span>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              How It Works
            </h3>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-lg whitespace-pre-line">
              {"Post your requirements. Detailed descriptions with images and video allow providers to quote with confidence, all in one place. \nWe never share externally.\n No mass-send. No hidden costs. No chasing."}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: <Voicemail className="h-6 w-6" />,
                title: "Post Your Job Once",
                desc: "Describe what you need, add photos and/or video, and we'll match you with the right tradespeople in your area.",
              },
              {
                step: "2",
                icon: <Repeat1 className="h-6 w-6" />,
                title: "Matched, But Not Sent To All",
                desc: "Each job allows receiving quotes from a small number of highly trusted local providers. No spam for anyone.",
              },
              {
                step: "3",
                icon: <Zap className="h-6 w-6" />,
                title: "Clear From Start To Finish",
                desc: "Jobs, quotes, communication, and payments all handled in one place.\nClear, simple, and under your control.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border-2 border-border/80 bg-card p-8 text-center transition-all duration-300 hover-lift hover:border-primary/40 shadow-md hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg font-extrabold shadow-lg shadow-primary/40 group-hover:animate-pulse-glow transition-shadow ring-4 ring-card">
                    {item.step}
                  </div>
                </div>
                <div className="mt-4 mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-primary border-2 border-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/30">
                  {item.icon}
                </div>
                <h4 className="font-display text-lg font-bold text-foreground">{item.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us - Duplicate */}
      <section className="py-20 md:py-28 section-divider bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-none shadow-none opacity-0"></span>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              Why Us & Why Now?
            </h3>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-lg whitespace-pre-line">
              {"Most platforms are hit and miss with no guarantees.\nThey lack transparency and accountability.\nBookATrade is built to fix that."}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: <Voicemail className="h-6 w-6" />,
                title: "No Spam",
                desc: "Your personal details are\nnever shared with any providers.\nYou stay in complete control.",
              },
              {
                step: "2",
                icon: <Repeat1 className="h-6 w-6" />,
                title: "No Repeating Yourself",
                desc: "Post your job requirements once.\nAdd photos and videos.\nProviders know exactly what you need",
              },
              {
                step: "3",
                icon: <Zap className="h-6 w-6" />,
                title: "Less Competition",
                desc: "All providers excel in their field.\nSo we limit the numbers\nand avoid confusion.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border-2 border-border/80 bg-card p-8 text-center transition-all duration-300 hover-lift hover:border-primary/40 shadow-md hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg font-extrabold shadow-lg shadow-primary/40 group-hover:animate-pulse-glow transition-shadow ring-4 ring-card">
                    {item.step}
                  </div>
                </div>
                <div className="mt-4 mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-primary border-2 border-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/30">
                  {item.icon}
                </div>
                <h4 className="font-display text-lg font-bold text-foreground">{item.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Features with Images */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container space-y-20 md:space-y-32">
          {/* Feature 1 - Vetting: Customer & electrician in hallway */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 py-1.5 text-xs uppercase tracking-wider mb-5 border-0 rounded-none shadow-none font-thin text-primary-foreground bg-muted px-0 border-muted">
                <Shield className="lucide lucide-shield bg-muted text-muted w-0 h-0" />
                
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                You Stay In Control The Whole Time
              </h3>
              <p className="mt-4 leading-relaxed font-sans text-muted-foreground text-lg whitespace-pre-line">
                {"Customers:\n- Your personal details are safe. We never share your information.\n- You choose who to speak to and work with.\n- You can ignore, accept, or decline any quote.\n- You can edit or remove your job at any time.\n- No commitment until you’re ready.\n- You only release payment when you’re completely satisfied"}
              </p>
              <ul className="mt-6 space-y-3">
                {["\n", "\n", "\n"].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <span className="flex h-6 w-6 items-center justify-center border-0 border-muted-foreground rounded-none shadow-none text-center bg-muted">
                      <CheckCircle className="lucide lucide-shield bg-muted text-muted w-0 h-0" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 relative group">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={trustImage}
                alt="Customer greeting a trusted tradesperson"
                className="relative rounded-2xl shadow-2xl shadow-foreground/15 w-full aspect-[4/3] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] border-2 border-border/50"
              />
            </div>
          </div>

          {/* Feature 2 - Quality: Roofer at work */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="relative group">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-bl from-primary/25 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={qualityImage}
                alt="Professional roofer performing quality work on a residential roof"
                className="relative rounded-2xl shadow-2xl shadow-foreground/15 w-full aspect-[4/3] object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] border-2 border-border/50"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 py-1.5 text-xs uppercase tracking-wider mb-5 border-muted border-0 rounded-none shadow-none font-thin px-0 bg-muted text-muted">
                <Star className="lucide lucide-circle-check-big w-0 h-0 bg-muted text-muted border-0 border-none border-muted" />
                
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Built For Jobs, Not Leads
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                {"Providers:\n- No upfront or hidden costs \n- No monthly fees. \n- No paying for leads. \n- Jobs ONLY available to a few providers. \n- You don’t work until you get paid. \n- No contracts tying you in"}
              </p>
              <ul className="mt-6 space-y-3">
                {["\n", "\n", "\n"].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <span className="flex h-6 w-6 items-center justify-center border-0 border-muted bg-muted text-xs font-thin rounded-none shadow-none">
                      <CheckCircle className="lucide lucide-circle-check-big h-4 w-4 text-primary w-0 h-0 bg-muted text-muted border-0 border-none border-muted" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3 - Peace of mind: Plasterer talking to customer */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 py-1.5 text-xs font-bold uppercase tracking-wider mb-5 border-muted border-0 px-0 bg-muted text-muted rounded-none shadow-none">
                <Shield className="lucide lucide-circle-check-big text-muted bg-muted h-0 w-0 border-muted" />
                
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Why People Often Don’t Trust A Trader! 
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                {"- Most platforms are completely hit and miss. \n- Jobs get sent to lots of tradespeople. \n- Customers get bombarded with quotes. \n- Providers pay for leads that go nowhere. \n- The trust is broken. \nWe do things differently: \n- Jobs are matched to a fewer local providers. \n- Your details are never shared unless you say so. \n- No more paying for leads. \n- Jobs & payments are handled clearly"}
              </p>
              <ul className="mt-6 space-y-3">
                {["\n", "\n", "\n"].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <span className="flex h-6 w-6 items-center justify-center border-0 border-muted bg-muted rounded-none shadow-none">
                      <CheckCircle className="lucide lucide-circle-check-big h-4 w-4 text-primary text-muted bg-muted h-0 w-0 border-muted" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 relative group">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={peaceImage}
                alt="Tradesperson discussing work with a happy homeowner"
                className="relative rounded-2xl shadow-2xl shadow-foreground/15 w-full aspect-[4/3] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] border-2 border-border/50"
              />
            </div>
          </div>

          {/* Feature 4 - Trusted Partnership */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="relative group">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-bl from-primary/25 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={trustedPartnershipImage}
                alt="Tradesperson and homeowner shaking hands outside a home"
                loading="lazy"
                width={1024}
                height={768}
                className="relative rounded-2xl shadow-2xl shadow-foreground/15 w-full aspect-[4/3] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] border-2 border-border/50"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 py-1.5 text-xs font-bold uppercase tracking-wider mb-5 border-muted border-0 px-0 bg-muted text-muted rounded-none shadow-none">
                <Shield className="lucide lucide-circle-check-big text-muted bg-muted h-0 w-0 border-muted" />
                
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Elsewhere...
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
                {"- “Spent £3000 for 0 calls!”\n- “They don’t vet anyone properly.”\n- “Paid for leads… got nothing back.”\n- “We got scammed... But he had glowing reviews.”\n- “Leads get sent to 10 or 12 tradespeople at the same time.”\n- “It’s complete pot luck!”\n- “Cancellation was not possible due to the 12-month contract.”\n\nThis is why we built BookATrade."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Tradespeople CTA */}
      <section className="py-20 md:py-28 section-divider">
        <div className="container">
          <div className="rounded-3xl bg-foreground text-primary-foreground p-10 md:p-16 relative overflow-hidden border-2 border-primary/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/5 translate-y-1/3 -translate-x-1/4" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2" />
            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">For tradespeople</span>
                <h3 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
                  Guaranteed,&nbsp;<span className="text-primary drop-shadow-md">Local Jobs</span>
                </h3>
                <p className="mt-4 text-primary-foreground/70 text-lg leading-relaxed whitespace-pre-line">
                  {"Join today and see how we work. No upfront costs. No monthly fees.\nNo paying for leads. No commitment. Only pay us when you get paid."}
                </p>
                <Button size="lg" asChild className="mt-8 text-lg font-extrabold h-16 px-12 shadow-2xl shadow-primary/50 hover:shadow-2xl hover:shadow-primary/60 border-2 border-primary-foreground/20 rounded-2xl transition-all duration-300 hover:scale-110 text-center">
                  <Link to="/signup">
                    {"Explore How\nBookATrade Works"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Users className="h-6 w-6" />, label: "Real Local Jobs" },
                  { icon: <Shield className="h-6 w-6" />, label: "Verified Badge" },
                  { icon: <Star className="h-6 w-6" />, label: "Build Reviews" },
                  { icon: <Zap className="h-6 w-6" />, label: "Full Transparency" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-3 rounded-2xl bg-primary-foreground/5 border-2 border-primary-foreground/15 p-6 text-center transition-all duration-300 hover:bg-primary-foreground/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                    <div className="text-primary p-3 rounded-xl bg-primary/10 border border-primary/20">{item.icon}</div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Electrician Feature Image Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-border/50">
            <img
              src={electricianImage}
              alt="Professional electrician working with customer supervision"
              className="w-full h-64 md:h-80 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container">
                <div className="max-w-md">
                  <h3 className="font-display text-2xl md:text-3xl font-extrabold text-primary-foreground leading-tight">
                    Real professionals, <span className="text-primary">real results.</span>
                  </h3>
                  <p className="mt-2 text-primary-foreground/80 text-sm md:text-base">
                    Every tradesperson on BookATrade is vetted, qualified, and ready to deliver quality work.
                  </p>
                  <Button size="lg" asChild className="mt-6 text-lg font-extrabold h-16 px-12 shadow-2xl shadow-primary/50 border-2 border-primary-foreground/20 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-primary/60">
                    <Link to="/signup">
                      Find a tradesperson
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container relative z-10 text-center">
          <h3 className="font-display text-3xl font-extrabold text-primary-foreground sm:text-4xl md:text-5xl">
            Ready to find your perfect tradesperson?
          </h3>
          <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto text-lg">
            Join thousands of homeowners who trust BookATrade to connect them with reliable, vetted professionals.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg font-extrabold h-16 px-12 shadow-2xl hover:shadow-2xl transition-all hover:scale-110 rounded-2xl border-2 border-foreground/10">
              <Link to="/signup">
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base font-bold bg-transparent border-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/15 hover:border-primary-foreground/60 h-13 px-10 rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-primary/20 bg-foreground text-primary-foreground py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BookATrade logo" className="h-10 w-10 rounded-full shadow-md ring-2 ring-primary/30" />
              <div>
                <span className="font-display text-lg font-extrabold">
                  Book<span className="text-primary">A</span>Trade
                </span>
                <p className="text-xs text-primary-foreground/50">Local &bull; Recommended &bull; Trusted</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
              <Link to="/legal?audience=customer" className="hover:text-primary transition-colors">Terms & Conditions</Link>
              <Link to="/login" className="hover:text-primary transition-colors">Sign in</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} BookATrade. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
