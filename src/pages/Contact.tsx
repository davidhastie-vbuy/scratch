import { Link } from "react-router-dom";
import { Mail, MapPin, Building2, ArrowRight, HelpCircle, ShieldCheck, UserPlus } from "lucide-react";
import logo from "@/assets/bookatrade-logo-black.png";

const contactDetails = [
  {
    icon: Building2,
    label: "Company",
    value: "BOOKaTRADE Ltd.",
    sublabel: "Registered in England",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@bookatrade.com",
    href: "mailto:hello@bookatrade.com",
    sublabel: "We aim to respond within 24 hours",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "20 Wenlock Road, London",
    sublabel: "N1 7GU, United Kingdom",
  },
];

const quickLinks = [
  {
    icon: HelpCircle,
    title: "Help Centre",
    description:
      "Browse answers to common questions about bookings, payments, and account management.",
    to: "/help-centre",
    cta: "Visit Help Centre",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Safety",
    description:
      "Learn how we protect our community with verified reviews, secure payments, and dispute resolution.",
    to: "/trust-and-safety",
    cta: "Learn More",
  },
  {
    icon: UserPlus,
    title: "Join BOOKaTRADE",
    description:
      "Create a free account to book trusted tradespeople or list your trade services today.",
    to: "/signup",
    cta: "Sign Up Free",
  },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ─── */}
      <header className="border-b border-foreground/[0.07] bg-background sticky top-0 z-50">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="BOOKaTRADE"
              className="h-7 sm:h-9 object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-foreground text-background px-6 py-2.5 text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-foreground/90 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="bg-foreground text-white">
        <div className="container px-6 sm:px-10 lg:px-20 py-24 sm:py-32 lg:py-40">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-5">
            Contact Us
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[clamp(42px,4.2vw,68px)] leading-[1.15] tracking-tight max-w-2xl">
            Get in Touch
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-white/50 max-w-lg">
            We'd love to hear from you. Whether you have a question about our
            platform, need help with your account, or want to share feedback —
            our team is here to help.
          </p>
        </div>
      </section>

      {/* ─── Contact Information ─── */}
      <section className="bg-background">
        <div className="container px-6 sm:px-10 lg:px-20 py-20 sm:py-28">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-4">
            Reach&nbsp;Us
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight mb-16">
            How to Contact Us
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-foreground/[0.09]">
            {contactDetails.map(({ icon: Icon, label, value, sublabel, href }) => (
              <div
                key={label}
                className="bg-background p-8 sm:p-10 flex flex-col items-start"
              >
                <div className="w-12 h-12 bg-foreground flex items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-foreground/40 font-semibold mb-2">
                  {label}
                </p>
                {href ? (
                  <a
                    href={href}
                    className="text-lg font-display tracking-tight text-foreground hover:text-primary transition-colors"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="text-lg font-display tracking-tight text-foreground">
                    {value}
                  </p>
                )}
                <p className="mt-1.5 text-[13px] text-foreground/45 leading-relaxed">
                  {sublabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Map ─── */}
      <section className="bg-foreground">
        <div className="container px-6 sm:px-10 lg:px-20 py-20 sm:py-28">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-4">
                Location
              </p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight text-white">
                Find Us in London
              </h2>
            </div>
            <p className="text-[15px] leading-relaxed text-white/40 max-w-sm">
              Based in the heart of London — connecting tradespeople and
              homeowners across the UK.
            </p>
          </div>

          <div className="relative w-full aspect-[16/7] min-h-[320px] bg-foreground/80 border border-white/[0.06] overflow-hidden">
            <iframe
              title="BOOKaTRADE — London, United Kingdom"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.4!2d-0.0935!3d51.5309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761b5e3b5e3b5e%3A0x1234567890abcdef!2s20%20Wenlock%20Rd%2C%20London%20N1%207GU!5e0!3m2!1sen!2suk!4v1700000000000"
              className="absolute inset-0 w-full h-full border-0 grayscale contrast-[1.1] opacity-90"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ─── Quick Links ─── */}
      <section className="bg-background">
        <div className="container px-6 sm:px-10 lg:px-20 py-20 sm:py-28">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-4">
            Resources
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.4] tracking-tight mb-16">
            Quick Links
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-foreground/[0.09]">
            {quickLinks.map(({ icon: Icon, title, description, to, cta }) => (
              <Link
                key={title}
                to={to}
                className="group bg-background p-8 sm:p-10 flex flex-col items-start hover:bg-foreground/[0.02] transition-colors"
              >
                <div className="w-12 h-12 border border-foreground/[0.09] flex items-center justify-center mb-6 group-hover:border-primary/30 transition-colors">
                  <Icon
                    className="w-5 h-5 text-foreground/50 group-hover:text-primary transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-display text-lg tracking-tight mb-2">
                  {title}
                </h3>
                <p className="text-[15px] leading-relaxed text-foreground/50 mb-6 flex-1">
                  {description}
                </p>
                <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase font-semibold text-foreground/60 group-hover:text-primary transition-colors">
                  {cta}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-foreground px-6 sm:px-10 lg:px-20 pt-16 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/">
            <img
              src={logo}
              alt="BOOKaTRADE"
              className="h-7 brightness-0 invert"
            />
          </Link>
          <p className="text-[11px] text-white/[0.28]">
            © {new Date().getFullYear()} BOOKaTRADE Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-white/[0.28]">
            <Link
              to="/legal?audience=customer"
              className="hover:text-white/65 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/legal?audience=customer"
              className="hover:text-white/65 transition-colors"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
