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
      <header className="border-b border-border/60 bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group min-w-0 flex-shrink">
            <img src={logo} alt="BookATrade logo" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 object-contain transition-transform duration-300 group-hover:rotate-6" />
            <span className="font-display text-sm sm:text-xl font-extrabold text-foreground whitespace-nowrap">
              Book<span className="text-primary">A</span>Trade
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Button variant="ghost" size="sm" asChild className="font-semibold border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all px-2.5 sm:px-4 sm:h-10">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 border-2 border-primary hover:border-primary/80 transition-all duration-300 hover:scale-105 px-2.5 sm:px-4 sm:h-10">
              <Link to="/signup">Get Started</Link>
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
              <p className="mt-6 leading-relaxed max-w-lg animate-fade-in stagger-2 opacity-0 text-lg text-primary-foreground" data-section="hero-intro">
                <span className="block"><b data-label="hero-customers">Customers:</b> Find trusted local tradespeople in a few simple steps.</span>
                <span className="block"><b data-label="hero-providers">Providers:</b> No more paying for leads. Just real jobs with guarateed payment.</span>
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-primary-foreground/70 animate-fade-in stagger-4 opacity-0">
                <span className="flex items-center gap-1.5 sm:gap-2 bg-primary-foreground/5 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-primary-foreground/10">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Vetted Providers Only
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-primary-foreground/5 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-primary-foreground/10">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  No Hidden Costs
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-primary-foreground/5 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-primary-foreground/10">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  You Stay In Control
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
      <section className="py-20 md:py-28 section-divider bg-gradient-to-br from-accent/40 via-background to-accent/30">

        <div className="container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-none shadow-none opacity-0"></span>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              How It Works
            </h3>
            <p className="mt-3 max-w-lg mx-auto text-lg whitespace-pre-line text-secondary-foreground">
              {"Post your requirements. Detailed descriptions with images and video allow providers to quote with confidence, all in one place. \nWe never share externally.\n No mass-send. No hidden costs. No chasing."}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: <MailPlus className="h-6 w-6" />,
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
                icon: <Infinity className="h-6 w-6" />,
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
      <section className="py-20 md:py-28 section-divider bg-gradient-to-bl from-primary/10 via-accent/30 to-primary/5">
        <div className="container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-none shadow-none opacity-0"></span>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              Why Us & Why Now?
            </h3>
            <p className="mt-3 max-w-lg mx-auto text-lg whitespace-pre-line text-secondary-foreground">
              {"Most platforms are hit and miss with no guarantees.\nThey lack transparency and accountability.\nBookATrade is built to fix that."}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: <BellRing className="h-6 w-6" />,
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
                icon: <CircleArrowDown className="h-6 w-6" />,
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
      <section className="py-16 md:py-24 bg-gradient-to-br from-accent/35 via-background to-primary/10">
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
                <strong>Customers:</strong>{"\n- Your personal details are safe. We never share your information.\n- You choose who to speak to and work with.\n- You can ignore, accept, or decline any quote.\n- You can edit or remove your job at any time.\n- No commitment until you’re ready.\n- You only release payment when you’re completely satisfied"}
              </p>
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
                <strong>Providers:</strong>{"\n- No upfront or hidden costs\n- No monthly fees.\n- No paying for leads.\n- Jobs ONLY available to a few providers.\n- You don’t work until you get paid.\n- No contracts tying you in"}
              </p>
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
                {"- Most platforms are completely hit and miss. \n- Jobs get sent to lots of tradespeople. \n- Customers get bombarded with quotes. \n- Providers pay for leads that go nowhere. \n- The trust is broken. \n"}<strong>We built something around fixing that:</strong>{" \n- Jobs are matched to a fewer local providers. \n- Your details are never shared unless you say so. \n- No more paying for leads. \n- Jobs & payments are handled clearly"}
              </p>
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
                {"- “Spent £3000 for 0 calls!”\n- “They don’t vet anyone properly.”\n- “Paid for leads… got nothing back.”\n- “We got scammed... But he had glowing reviews.”\n- “Leads get sent to 10 or 12 tradespeople at the same time.”\n- “It’s complete pot luck!”\n- “Cancellation was not possible due to the 12-month contract.”\n\n"}<strong>This is why we built BookATrade.</strong>{""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Tradespeople CTA */}
      <section className="py-20 md:py-28 section-divider">
        <div className="container">
          <div className="rounded-3xl bg-foreground text-primary-foreground p-6 sm:p-10 md:p-16 relative overflow-hidden border-2 border-primary/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/5 translate-y-1/3 -translate-x-1/4" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2" />
            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div className="text-center md:text-left flex flex-col items-center md:items-start w-full">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">For tradespeople</span>
                <h3 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
                  Guaranteed, <span className="text-primary drop-shadow-md">Local Jobs</span>
                </h3>
                <p className="mt-4 text-primary-foreground/70 leading-relaxed whitespace-pre-line text-lg font-medium">
                  {"Join today and see how we work. No upfront costs. No monthly fees.\nNo paying for leads. No commitment. Only pay us when you get paid."}
                </p>
                <Button size="lg" asChild className="mt-8 text-base sm:text-lg font-extrabold h-auto min-h-14 sm:min-h-16 py-3 px-6 sm:px-12 w-full sm:w-auto max-w-full shadow-2xl shadow-primary/50 hover:shadow-2xl hover:shadow-primary/60 border-2 border-primary-foreground/20 rounded-2xl transition-all duration-300 hover:scale-105 text-center whitespace-normal">
                  <Link to="/signup" className="flex items-center justify-center gap-2">
                    <span className="whitespace-pre-line">{"Explore How\nBookATrade Works"}</span>
                    <ArrowRight className="h-5 w-5 flex-shrink-0" />
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
              className="w-full h-[28rem] sm:h-80 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 sm:via-foreground/40 to-foreground/40 sm:to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container">
                <div className="max-w-md">
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-primary-foreground leading-tight">
                    Had a great experience with a local provider? <span className="text-primary block whitespace-pre-line">Tell us about them!</span>
                  </h3>
                  <p className="mt-2 text-primary-foreground/80 text-sm whitespace-pre-line font-sans md:text-lg font-medium">
                    {"Have your say in which providers are on the platform.\nOnly trusted, recommended providers make it in.\nHelp out the community; have your say."}
                  </p>
                  <Button size="lg" asChild className="mt-6 text-base sm:text-lg font-extrabold h-auto min-h-14 sm:min-h-16 py-3 px-6 sm:px-12 w-full sm:w-auto max-w-full shadow-2xl shadow-primary/50 border-2 border-primary-foreground/20 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/60 whitespace-normal">
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

      {/* CTA */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container relative z-10 text-center">
          <h3 className="font-display text-3xl font-extrabold text-primary-foreground sm:text-4xl md:text-5xl">
            See How It Works For Yourself
          </h3>
          <p className="mt-4 max-w-lg mx-auto text-lg text-secondary-foreground">
            <strong>Built around what homeowners & trades actually asked for.</strong>
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:items-center">
            <Button size="lg" variant="secondary" asChild className="text-base sm:text-lg font-extrabold h-auto min-h-14 sm:min-h-16 py-3 px-6 sm:px-12 w-full sm:w-auto shadow-2xl hover:shadow-2xl transition-all hover:scale-105 rounded-2xl border-2 border-foreground/10 whitespace-normal">
              <Link to="/signup" className="flex items-center justify-center gap-2">
                <span>Get Started Free Today</span>
                <ArrowRight className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base font-bold bg-transparent border-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/15 hover:border-primary-foreground/60 h-12 sm:h-13 px-6 sm:px-10 w-full sm:w-auto rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-primary/20 bg-foreground text-primary-foreground py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BookATrade logo" className="h-10 w-10 object-contain" />
              <div>
                <span className="font-display text-lg font-extrabold">
                  Book<span className="text-primary">A</span>Trade
                </span>
                <p className="text-xs text-primary-foreground/50">Local &bull; Recommended &bull; Trusted</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
              <Link to="/legal?audience=customer" className="hover:text-primary transition-colors">Terms & Conditions</Link>
              <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
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
