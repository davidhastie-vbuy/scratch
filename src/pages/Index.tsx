import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, CheckCircle, Star, ClipboardList, Zap, Award, MessageSquare, Users } from "lucide-react";
import heroImage from "@/assets/hero-trades.jpg";
import trustImage from "@/assets/trust-handshake.jpg";
import qualityImage from "@/assets/quality-work.jpg";
import peaceImage from "@/assets/peace-of-mind.jpg";
import logo from "@/assets/bookatrade-logo.png";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logo} alt="BookATrade logo" className="h-10 w-10 transition-transform duration-300 group-hover:rotate-6" />
            <span className="font-display text-xl font-extrabold text-foreground">
              Book<span className="text-primary">A</span>Trade
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="font-semibold">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="font-semibold shadow-md hover:shadow-lg transition-shadow">
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
        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary-foreground mb-6 animate-fade-in backdrop-blur-sm">
              <Award className="h-4 w-4" />
              Vetted &bull; Trusted &bull; Guaranteed
            </div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl xl:text-7xl animate-fade-in">
              Your home deserves
              <span className="block text-primary drop-shadow-sm">trusted hands.</span>
            </h2>
            <p className="mt-6 text-lg text-primary-foreground/80 leading-relaxed max-w-lg animate-fade-in stagger-2 opacity-0">
              Find vetted, reliable tradespeople for any job — big or small. Get up to 3 competitive quotes, compare with confidence, and enjoy peace of mind from start to finish.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row animate-fade-in stagger-3 opacity-0">
              <Button size="lg" asChild className="text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-12 px-8">
                <Link to="/signup">
                  Post a job free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base font-bold bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-sm h-12 px-8">
                <Link to="/signup">Join as a tradesperson</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium text-primary-foreground/70 animate-fade-in stagger-4 opacity-0">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Vetted professionals
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Up to 3 free quotes
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Guaranteed payments
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-foreground text-primary-foreground py-6 relative overflow-hidden">
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
            <div key={stat.label}>
              <div className="font-display text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</div>
              <div className="mt-1 text-sm text-primary-foreground/70 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 section-divider">
        <div className="container">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">Simple process</span>
            <h3 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              How BookATrade works
            </h3>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-lg">
              Simple, transparent, and built around your peace of mind.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                icon: <ClipboardList className="h-6 w-6" />,
                title: "Post your job",
                desc: "Describe what you need, add photos, and we'll match you with the right tradespeople in your area.",
              },
              {
                step: "2",
                icon: <MessageSquare className="h-6 w-6" />,
                title: "Compare quotes",
                desc: "Receive up to 3 quotes from vetted professionals. Compare prices, availability, and reviews.",
              },
              {
                step: "3",
                icon: <Zap className="h-6 w-6" />,
                title: "Hire with confidence",
                desc: "Choose your preferred tradesperson and enjoy quality work backed by real reviews and our support team.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border bg-card p-8 text-center transition-all duration-300 hover-lift"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg font-extrabold shadow-md group-hover:animate-pulse-glow transition-shadow">
                    {item.step}
                  </div>
                </div>
                <div className="mt-4 mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  {item.icon}
                </div>
                <h4 className="font-display text-lg font-bold text-foreground">{item.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Features with Images */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container space-y-20 md:space-y-32">
          {/* Feature 1 */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-5">
                <Shield className="h-3.5 w-3.5" />
                Vetted &amp; Approved
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Every tradesperson is vetted before they join
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
                No cowboys, no time wasters. Every professional on BookATrade goes through our approval process — verified qualifications, experience, and documentation — so you only deal with the best.
              </p>
              <ul className="mt-6 space-y-3">
                {["ID & qualification checks", "Admin-reviewed applications", "Ongoing quality monitoring"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 relative group">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={trustImage}
                alt="Customer greeting a trusted tradesperson"
                className="relative rounded-2xl shadow-xl w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="relative group">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-bl from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={qualityImage}
                alt="Professional tradesperson performing quality work"
                className="relative rounded-2xl shadow-xl w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-5">
                <Star className="h-3.5 w-3.5" />
                Quality Guaranteed
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Skilled professionals who take pride in their craft
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
                From plumbing and electrics to carpentry and landscaping — our tradespeople deliver exceptional workmanship across every trade. Real skills, real results.
              </p>
              <ul className="mt-6 space-y-3">
                {["13+ trade categories covered", "Experienced, qualified professionals", "Customer reviews after every job"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid gap-10 md:gap-16 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-5">
                <ClipboardList className="h-3.5 w-3.5" />
                Peace of Mind
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl leading-tight">
                Transparent quotes, no hidden surprises
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
                Get up to 3 quotes with clear pricing and timelines. Message your tradesperson directly, track job progress, and raise support if needed. We've got your back from start to finish.
              </p>
              <ul className="mt-6 space-y-3">
                {["Up to 3 competitive quotes per job", "Direct messaging with tradespeople", "Dedicated support team"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 relative group">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={peaceImage}
                alt="Homeowners reviewing a quote with their tradesperson"
                className="relative rounded-2xl shadow-xl w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Tradespeople CTA */}
      <section className="py-20 md:py-28 section-divider">
        <div className="container">
          <div className="rounded-3xl bg-foreground text-primary-foreground p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/5 translate-y-1/3 -translate-x-1/4" />
            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">For tradespeople</span>
                <h3 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
                  Grow your business with <span className="text-primary">guaranteed work</span>
                </h3>
                <p className="mt-4 text-primary-foreground/70 text-lg leading-relaxed">
                  Join our platform, get matched with local jobs, and build your reputation. We handle the vetting so customers trust you from day one.
                </p>
                <Button size="lg" asChild className="mt-8 font-bold h-12 px-8 shadow-lg">
                  <Link to="/signup">
                    Apply to join
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Users className="h-6 w-6" />, label: "Local job leads" },
                  { icon: <Shield className="h-6 w-6" />, label: "Verified badge" },
                  { icon: <Star className="h-6 w-6" />, label: "Build reviews" },
                  { icon: <Zap className="h-6 w-6" />, label: "Guaranteed payment" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-3 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 p-6 text-center transition-colors hover:bg-primary-foreground/10">
                    <div className="text-primary">{item.icon}</div>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                ))}
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
            <Button size="lg" variant="secondary" asChild className="text-base font-bold h-12 px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Link to="/signup">
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base font-bold bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/15 h-12 px-8">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-foreground text-primary-foreground py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BookATrade logo" className="h-10 w-10" />
              <div>
                <span className="font-display text-lg font-extrabold">
                  Book<span className="text-primary">A</span>Trade
                </span>
                <p className="text-xs text-primary-foreground/50">Vetted &bull; Trusted &bull; Guaranteed</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
              <Link to="/legal/terms-of-service?audience=customer" className="hover:text-primary transition-colors">Terms</Link>
              <Link to="/legal/privacy-policy?audience=customer" className="hover:text-primary transition-colors">Privacy</Link>
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
