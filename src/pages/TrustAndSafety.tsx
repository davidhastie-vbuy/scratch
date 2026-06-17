import { Link } from "react-router-dom";
import { Shield, Lock, CheckCircle2, Eye, Scale, UserCheck, ArrowRight, BadgeCheck, Clock, Banknote, ShieldCheck, Handshake } from "lucide-react";
import logo from "@/assets/bookatrade-logo-black.png";

/* ── Escrow flow steps ──────────────────────────────── */
const ESCROW_STEPS = [
  {
    num: "01",
    title: "Customer Pays Upfront",
    copy: "When you accept a quote, payment is taken securely and held in escrow. The tradesperson can see the funds are committed — but cannot access them yet.",
    icon: Lock,
  },
  {
    num: "02",
    title: "Work Is Completed",
    copy: "Your tradesperson completes the agreed work to the standard quoted. For larger jobs, milestone payments release funds stage by stage as each phase is finished.",
    icon: Shield,
  },
  {
    num: "03",
    title: "Customer Confirms Satisfaction",
    copy: "Only when you confirm you're completely happy does the payment release. You stay in control from the first pound to the last.",
    icon: CheckCircle2,
  },
];

/* ── Customer benefits ──────────────────────────────── */
const CUSTOMER_BENEFITS = [
  {
    title: "Your Money Is Safe",
    copy: "Every penny is held in a regulated escrow account — separate from BOOKaTRADE's own funds. It's ring-fenced and protected until you say otherwise.",
    icon: ShieldCheck,
  },
  {
    title: "You Don't Pay Until You're Happy",
    copy: "No upfront risk. The tradesperson only gets paid when you confirm the work meets your expectations. If something isn't right, the money stays put.",
    icon: Banknote,
  },
  {
    title: "Milestone Payments for Larger Jobs",
    copy: "Break bigger projects into stages. Pay as each phase is completed and approved — so you're never overcommitted and always in the driving seat.",
    icon: Clock,
  },
  {
    title: "Full Visibility at All Times",
    copy: "Track exactly where your money is at every stage. Real-time payment status, clear timelines, and no surprises. Total transparency, always.",
    icon: Eye,
  },
];

/* ── Provider benefits ──────────────────────────────── */
const PROVIDER_BENEFITS = [
  {
    title: "Guaranteed Payment",
    copy: "The money is already committed before you pick up a tool. No more chasing invoices, no more unpaid work, no more wasted time.",
  },
  {
    title: "No Chasing Invoices",
    copy: "Stop spending your evenings sending reminders. The customer has already paid into escrow — the funds are secured and waiting.",
  },
  {
    title: "Paid Within 2 Working Days",
    copy: "Once the customer approves the work, funds are released to your account within two working days. Fast, reliable, predictable cashflow.",
  },
  {
    title: "The Money Is Already There",
    copy: "Escrow means certainty. You can focus on doing great work — not worrying about whether you'll get paid for it.",
  },
];

/* ── Vetting checks ─────────────────────────────────── */
const VETTING_CHECKS = [
  {
    title: "Identity Verification",
    copy: "Every provider's identity is verified before they can appear on the platform. We confirm who they are — not just who they say they are.",
  },
  {
    title: "Qualifications & Certifications",
    copy: "Trade-specific qualifications are checked and validated. Electricians need Part P. Gas engineers need Gas Safe. We verify it all.",
  },
  {
    title: "Insurance Confirmed",
    copy: "Public liability insurance is mandatory. We check the policy is current and covers the work being quoted. No insurance, no listing.",
  },
  {
    title: "References & Track Record",
    copy: "We speak to previous clients and verify work history. A strong track record isn't optional — it's the entry requirement.",
  },
];

const TrustAndSafety = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ═══ HEADER ═════════════════════════════════════════ */}
      <header className="border-b border-foreground/[0.07] bg-background sticky top-0 z-50">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="BOOKaTRADE" className="h-7 sm:h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors hidden sm:inline-block">Sign In</Link>
            <Link to="/signup" className="bg-foreground text-background px-6 py-2.5 text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-foreground/90 transition-colors">Sign Up Free</Link>
          </div>
        </div>
      </header>

      {/* ═══ 1. HERO ═══════════════════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 border border-white/[0.18] flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">Trust & Safety</p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[clamp(48px,5vw,76px)] leading-[1.08] tracking-tight text-white mb-6">
            Your Money Is Safe.<br />Your Work Is Protected.
          </h1>
          <p className="text-[15px] sm:text-base leading-relaxed text-white/55 max-w-[520px]">
            How BOOKaTRADE protects customers and tradespeople — from the first quote to the final payment.
          </p>
        </div>
      </section>

      {/* ═══ 2. ESCROW PAYMENT PROTECTION ══════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">Escrow Payment Protection</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.08] tracking-tight text-foreground mb-4 max-w-3xl">
          Payment Held in Escrow.<br />Released Only When You're Happy.
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground/55 max-w-[560px] mb-14 lg:mb-18">
          Every BOOKaTRADE payment is taken upfront and held securely in escrow. The tradesperson knows the money is committed.
          The customer knows it won't be released until the work is done right. Both sides are protected. Both sides benefit.
        </p>

        {/* Escrow flow — 3 numbered steps */}
        <div className="grid lg:grid-cols-3">
          {ESCROW_STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`py-8 lg:py-0 ${i > 0 ? "lg:pl-12 border-t lg:border-t-0 lg:border-l" : ""} ${i < 2 ? "lg:pr-12 border-foreground/[0.09]" : ""}`}
            >
              <div className="font-display text-6xl lg:text-7xl text-primary leading-none mb-5 tracking-[-2px]">{step.num}</div>
              <div className="flex items-center gap-2.5 mb-3">
                <step.icon className="w-4 h-4 text-foreground/40" />
                <h3 className="text-[11px] tracking-[0.16em] uppercase text-foreground font-bold font-sans">{step.title}</h3>
              </div>
              <p className="text-[14px] leading-relaxed text-foreground/[0.52]">{step.copy}</p>
            </div>
          ))}
        </div>

        {/* Visual separator — the escrow guarantee badge */}
        <div className="mt-16 lg:mt-20 border border-foreground/[0.09] p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-14 h-14 bg-foreground flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-foreground mb-1.5 font-sans">The BOOKaTRADE Guarantee</h3>
            <p className="text-[14px] leading-relaxed text-foreground/[0.52] max-w-xl">
              If you're not satisfied with the completed work, your money stays in escrow. Our dispute resolution team — made up of independent trade
              professionals — will review the case and ensure a fair outcome. Your payment is never at risk.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 3. FOR CUSTOMERS ══════════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <p className="text-[11px] tracking-[0.22em] uppercase text-trade-stone font-semibold mb-3.5">For Customers</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.08] tracking-tight text-white mb-4 max-w-2xl">
          Your Money Is Safe.<br />You're in Control.
        </h2>
        <p className="text-[15px] leading-relaxed text-white/50 max-w-[520px] mb-14">
          BOOKaTRADE exists to make hiring a tradesperson safe and stress-free. You should never feel exposed, rushed or uncertain about where your money is.
        </p>

        <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06]">
          {CUSTOMER_BENEFITS.map((item, i) => (
            <div key={i} className="bg-foreground p-8 lg:p-10">
              <item.icon className="w-5 h-5 text-primary mb-5" />
              <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-white mb-2.5 font-sans">{item.title}</h3>
              <p className="text-[13px] leading-relaxed text-white/[0.48]">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 4. FOR PROVIDERS ══════════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">For Tradespeople</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.08] tracking-tight text-foreground mb-4 max-w-3xl">
          Do Great Work.<br />Get Paid for It. Every Time.
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground/55 max-w-[540px] mb-14">
          Escrow doesn't just protect customers — it protects you too. The money is committed before you start.
          No more late payments, no more excuses, no more risk.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-foreground/[0.09]">
          {PROVIDER_BENEFITS.map((item, i) => (
            <div
              key={i}
              className={`p-8 lg:p-10 ${i < 3 ? "border-b sm:border-b lg:border-b-0 lg:border-r border-foreground/[0.09]" : ""} ${i % 2 === 0 && i < 2 ? "sm:border-r border-foreground/[0.09]" : ""} ${i === 1 ? "sm:border-r-0 lg:border-r border-foreground/[0.09]" : ""}`}
            >
              <div className="font-display text-5xl text-primary/20 leading-none mb-4 tracking-[-1px]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-foreground mb-2.5 font-sans">{item.title}</h3>
              <p className="text-[13px] leading-relaxed text-foreground/[0.52]">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 5. DISPUTE RESOLUTION ═════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-5 h-5 text-primary" />
            <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">Dispute Resolution</p>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.08] tracking-tight text-white mb-4">
            Resolved by Tradespeople.<br />Not by Us.
          </h2>
          <p className="text-[15px] leading-relaxed text-white/50 max-w-[580px] mb-14">
            If something goes wrong, your dispute isn't handled by a call centre or a customer support script.
            It's reviewed by independent, experienced trade professionals who understand the work.
          </p>

          <div className="grid md:grid-cols-2 gap-px bg-white/[0.06]">
            {/* Left — how it works */}
            <div className="bg-foreground p-8 lg:p-10">
              <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-white mb-6 font-sans">How It Works</h3>
              <ol className="space-y-6">
                {[
                  "Either party raises a dispute through the platform. The payment remains held in escrow throughout.",
                  "An independent trade professional — not BOOKaTRADE staff — is assigned to review the case. They assess the work, the agreement, and the evidence.",
                  "Both sides are heard. Evidence is reviewed: photos, messages, the original quote, and any milestone records.",
                  "A fair resolution is reached. This might mean releasing funds, arranging remedial work, or agreeing a partial payment.",
                ].map((text, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-display text-2xl text-primary leading-none mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-[13px] leading-relaxed text-white/[0.52]">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            {/* Right — principles */}
            <div className="bg-foreground p-8 lg:p-10">
              <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-white mb-6 font-sans">Our Principles</h3>
              <div className="space-y-8">
                {[
                  {
                    title: "Independent & Impartial",
                    copy: "Disputes are mediated by experienced tradespeople who have no connection to either party. They understand the standards, the timelines, and the realities of the work.",
                    icon: Handshake,
                  },
                  {
                    title: "Fair to Both Sides",
                    copy: "We're not here to take sides. The goal is a resolution that's fair and reasonable — for the customer and the tradesperson. The money stays in escrow until it's resolved.",
                    icon: Scale,
                  },
                  {
                    title: "Everyone Leaves Whole",
                    copy: "The best disputes are the ones that end with both sides feeling heard. Our resolution process is designed to protect relationships, not just transactions.",
                    icon: ShieldCheck,
                  },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <item.icon className="w-4 h-4 text-white/40" />
                      <h4 className="text-xs tracking-[0.12em] uppercase font-bold text-white font-sans">{item.title}</h4>
                    </div>
                    <p className="text-[13px] leading-relaxed text-white/[0.48]">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. VETTING & VERIFICATION ═════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <div className="flex items-center gap-3 mb-6">
          <BadgeCheck className="w-5 h-5 text-primary" />
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">Vetting & Verification</p>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.08] tracking-tight text-foreground mb-4 max-w-3xl">
          Every Provider Is Verified<br />Before They Can Quote.
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground/55 max-w-[560px] mb-14">
          You shouldn't have to wonder whether a tradesperson is qualified, insured or who they say they are.
          We check all of that before they ever appear on the platform.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px border border-foreground/[0.09]">
          {VETTING_CHECKS.map((item, i) => (
            <div key={i} className={`p-8 lg:p-10 ${i < 3 ? "border-b sm:border-b lg:border-b-0 lg:border-r border-foreground/[0.09]" : ""} ${i === 0 || i === 2 ? "sm:border-r border-foreground/[0.09]" : ""} ${i === 2 ? "sm:border-b-0 lg:border-b-0" : ""}`}>
              <div className="w-9 h-0.5 bg-primary mb-6" />
              <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-foreground mb-2.5 font-sans">{item.title}</h3>
              <p className="text-[13px] leading-relaxed text-foreground/[0.52]">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* Continuous monitoring note */}
        <div className="mt-10 flex items-start gap-4 max-w-2xl">
          <div className="w-1 h-12 bg-foreground/[0.09] flex-shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed text-foreground/[0.42]">
            Verification isn't a one-time check. We continuously monitor insurance expiry dates, qualification renewals, and review patterns.
            If a provider's credentials lapse, they're removed from the platform until they're back in order.
          </p>
        </div>
      </section>

      {/* ═══ 7. CTA — Protected from Start to Finish ══════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-28 flex flex-col items-center text-center">
        <div className="w-16 h-16 border border-white/[0.15] flex items-center justify-center mb-8">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3">Protected From Start to Finish</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(40px,4.5vw,68px)] text-white leading-[1.08] tracking-tight max-w-[640px] mb-5">
          Your Project.<br />Your Money.<br />Your Terms.
        </h2>
        <p className="text-[15px] leading-relaxed text-white/50 max-w-[440px] mb-10">
          Escrow protection, vetted tradespeople, and independent dispute resolution.
          Everything you need to hire with complete confidence.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-3.5 text-[11px] tracking-[0.14em] uppercase font-bold font-sans hover:bg-primary hover:text-white transition-colors"
          >
            Sign Up Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/signup?role=provider"
            className="inline-flex items-center gap-2 bg-transparent text-white px-8 py-3 text-[11px] tracking-[0.14em] uppercase font-bold font-sans border-[1.5px] border-white/40 hover:border-white hover:bg-white/[0.06] transition-all"
          >
            Join as a Tradesperson
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════ */}
      <footer className="bg-foreground border-t border-white/[0.06] px-6 sm:px-10 lg:px-20 pt-16 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/">
            <img src={logo} alt="BOOKaTRADE" className="h-7 brightness-0 invert" />
          </Link>
          <p className="text-[11px] text-white/[0.28]">
            © {new Date().getFullYear()} BOOKaTRADE Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-white/[0.28]">
            <Link to="/legal?audience=customer" className="hover:text-white/65 transition-colors">Privacy Policy</Link>
            <Link to="/legal?audience=customer" className="hover:text-white/65 transition-colors">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TrustAndSafety;
