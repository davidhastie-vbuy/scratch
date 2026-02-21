import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, Wrench, ArrowRight, CheckCircle, Star, ClipboardList } from "lucide-react";
import heroImage from "@/assets/hero-trades.jpg";
import trustImage from "@/assets/trust-handshake.jpg";
import qualityImage from "@/assets/quality-work.jpg";
import peaceImage from "@/assets/peace-of-mind.jpg";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">BookATrade</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Trusted tradespeople ready to help with your home projects"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your home deserves
              <span className="text-primary"> trusted hands</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Find vetted, reliable tradespeople for any job — big or small. Get up to 3 competitive quotes, compare with confidence, and enjoy peace of mind from start to finish.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="text-base">
                <Link to="/signup">
                  Post a job free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/signup">Join as a tradesperson</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                Vetted professionals
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                Up to 3 free quotes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-accent/30 py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl font-bold text-foreground">How BookATrade works</h3>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">Simple, transparent, and built around your peace of mind.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-bold">
                1
              </div>
              <h4 className="font-display text-lg font-semibold text-foreground">Post your job</h4>
              <p className="mt-2 text-sm text-muted-foreground">Describe what you need, add photos, and we'll match you with the right tradespeople in your area.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-bold">
                2
              </div>
              <h4 className="font-display text-lg font-semibold text-foreground">Compare quotes</h4>
              <p className="mt-2 text-sm text-muted-foreground">Receive up to 3 quotes from vetted professionals. Compare prices, availability, and reviews.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-bold">
                3
              </div>
              <h4 className="font-display text-lg font-semibold text-foreground">Hire with confidence</h4>
              <p className="mt-2 text-sm text-muted-foreground">Choose your preferred tradesperson and enjoy quality work backed by real reviews and our support team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features with Images */}
      <section className="py-16 md:py-24">
        <div className="container space-y-16 md:space-y-24">
          {/* Feature 1 */}
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground mb-4">
                <Shield className="h-3.5 w-3.5" />
                Vetted &amp; Approved
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Every tradesperson is vetted before they join
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                No cowboys, no time wasters. Every professional on BookATrade goes through our approval process — verified qualifications, experience, and documentation — so you only deal with the best.
              </p>
              <ul className="mt-4 space-y-2">
                {["ID & qualification checks", "Admin-reviewed applications", "Ongoing quality monitoring"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <img
                src={trustImage}
                alt="Customer greeting a trusted tradesperson"
                className="rounded-2xl shadow-lg w-full aspect-square object-cover"
              />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <img
                src={qualityImage}
                alt="Professional tradesperson performing quality work"
                className="rounded-2xl shadow-lg w-full aspect-square object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground mb-4">
                <Star className="h-3.5 w-3.5" />
                Quality Guaranteed
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Skilled professionals who take pride in their craft
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                From plumbing and electrics to carpentry and landscaping — our tradespeople deliver exceptional workmanship across every trade. Real skills, real results.
              </p>
              <ul className="mt-4 space-y-2">
                {["13+ trade categories covered", "Experienced, qualified professionals", "Customer reviews after every job"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground mb-4">
                <ClipboardList className="h-3.5 w-3.5" />
                Peace of Mind
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Transparent quotes, no hidden surprises
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Get up to 3 quotes with clear pricing and timelines. Message your tradesperson directly, track job progress, and raise support if needed. We've got your back from start to finish.
              </p>
              <ul className="mt-4 space-y-2">
                {["Up to 3 competitive quotes per job", "Direct messaging with tradespeople", "Dedicated support team"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <img
                src={peaceImage}
                alt="Homeowners reviewing a quote with their tradesperson"
                className="rounded-2xl shadow-lg w-full aspect-square object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container text-center">
          <h3 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to find your perfect tradesperson?
          </h3>
          <p className="mt-3 text-primary-foreground/80 max-w-md mx-auto">
            Join thousands of homeowners who trust BookATrade to connect them with reliable, vetted professionals.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base">
              <Link to="/signup">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base bg-transparent border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/15 focus:bg-primary-foreground/15">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <span className="font-display font-semibold text-foreground">BookATrade</span>
          <span>© {new Date().getFullYear()} BookATrade. All rights reserved. bookatrade.io</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
