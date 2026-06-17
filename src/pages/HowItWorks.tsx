import { Link } from "react-router-dom";
import logo from "@/assets/bookatrade-logo-black.png";
import {
  FileText,
  MessageSquare,
  ShieldCheck,
  Star,
  Wallet,
  Users,
  Camera,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Lock,
  Landmark,
  BadgeCheck,
} from "lucide-react";

/* ── Step data ───────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    label: "POST YOUR JOB",
    title: "Describe What\nYou Need Done.",
    paragraphs: [
      "Start by telling us about your project. What trade do you need? Where is the job? When would you like it completed? The more detail you provide, the more accurate the quotes you'll receive — and the faster you'll find the right tradesperson.",
      "You can add photos and videos of the work area so tradespeople can assess the job before quoting. Whether it's a leaking tap, a full kitchen renovation, or a garden redesign — describe it clearly, and the right professionals will respond.",
    ],
    details: [
      { icon: FileText, text: "Describe the job in your own words — no jargon needed" },
      { icon: MapPin, text: "Set your location so only local tradespeople respond" },
      { icon: Clock, text: "Choose your preferred timeframe — urgent or flexible" },
      { icon: Camera, text: "Upload photos and videos to help trades quote accurately" },
    ],
    accent: "bg-primary",
  },
  {
    num: "02",
    label: "RECEIVE & COMPARE QUOTES",
    title: "Vetted Trades.\nNo Spam.",
    paragraphs: [
      "Once your job is live, a limited number of vetted, locally reviewed tradespeople will send you quotes. We deliberately cap the number of responses to keep quality high and prevent the spam you'd experience elsewhere.",
      "Each quote includes a breakdown of costs and the tradesperson's profile. You can message any tradesperson directly to ask questions, request more detail, or clarify scope before making a decision. There is no commitment at this stage — take your time.",
    ],
    details: [
      { icon: ShieldCheck, text: "Every tradesperson is vetted before they can quote" },
      { icon: Users, text: "Limited quotes per job — quality over quantity, always" },
      { icon: MessageSquare, text: "Ask questions, discuss scope, and request more detail" },
      { icon: BadgeCheck, text: "No cold calls, no data sharing, no pressure" },
    ],
    accent: "bg-[#6B7F5E]",
  },
  {
    num: "03",
    label: "ACCEPT A QUOTE & BOOK",
    title: "Choose the Right\nTradesperson.",
    paragraphs: [
      "Review each tradesperson's profile carefully. Read verified reviews from other homeowners in your area. Compare pricing, qualifications, previous work, and availability. Every review on BOOKaTRADE is from a real completed job — nothing fabricated.",
      "When you've found the right fit, accept their quote. This creates a formal agreement between you and the tradesperson, with clear scope, pricing, and timeline. No ambiguity, no surprises.",
    ],
    details: [
      { icon: Star, text: "Verified local reviews from real completed jobs" },
      { icon: CheckCircle2, text: "Compare pricing, qualifications, and availability" },
      { icon: FileText, text: "Clear scope and pricing agreed before any work begins" },
      { icon: Lock, text: "Formal agreement protects both you and the tradesperson" },
    ],
    accent: "bg-foreground",
  },
  {
    num: "04",
    label: "COMMUNICATE WITH YOUR TRADESPERSON",
    title: "Stay Connected.\nStay Informed.",
    paragraphs: [
      "Once you've booked, use in-app messaging to stay in touch with your tradesperson throughout the project. Discuss timelines, share updates, ask about materials — everything is in one place.",
      "No more chasing texts across multiple apps. Your full conversation history, shared photos, and project details are always accessible in your BOOKaTRADE account. If anything changes, both parties can update the scope directly within the platform.",
    ],
    details: [
      { icon: MessageSquare, text: "In-app messaging — your full history in one place" },
      { icon: Camera, text: "Share progress photos and updates throughout the job" },
      { icon: Clock, text: "Discuss and adjust timelines as the project evolves" },
      { icon: FileText, text: "All project details and agreements accessible anytime" },
    ],
    accent: "bg-[#80DDE5]",
  },
  {
    num: "05",
    label: "PAYMENT & MILESTONES",
    title: "Your Money.\nHeld Securely.",
    paragraphs: [
      "BOOKaTRADE uses a secure escrow system to protect your payment. When you accept a quote, you pay the agreed amount upfront — but the money is held securely by BOOKaTRADE, not released to the tradesperson until you confirm you're satisfied with the work.",
      "For larger projects, payments are split into milestones. Each milestone represents a phase of work (for example: 'Strip existing kitchen', 'Install units', 'Final snagging'). You release payment for each milestone only when that phase is complete to your satisfaction. This keeps everyone accountable and protects your investment.",
    ],
    details: [
      { icon: Lock, text: "Funds held in secure escrow — not released until you approve" },
      { icon: Landmark, text: "Milestone payments for larger jobs — pay in stages" },
      { icon: ShieldCheck, text: "Full buyer protection throughout the project" },
      { icon: Wallet, text: "Transparent fees — no hidden costs, ever" },
    ],
    accent: "bg-primary",
  },
  {
    num: "06",
    label: "REVIEW & RECOMMEND",
    title: "Build Your\nCommunity.",
    paragraphs: [
      "Once the job is complete, leave an honest review of your tradesperson. Your review helps other homeowners in your area make better decisions — and rewards tradespeople who deliver excellent work.",
      "Found someone brilliant? Recommend them to your neighbours and friends directly through BOOKaTRADE. The best tradespeople are built on reputation, and your recommendation helps local professionals grow their business while helping your community find trusted help.",
    ],
    details: [
      { icon: Star, text: "Leave a verified review tied to a real completed job" },
      { icon: Users, text: "Recommend tradespeople to neighbours and friends" },
      { icon: BadgeCheck, text: "Help trusted trades grow their local reputation" },
      { icon: CheckCircle2, text: "Your review helps the next homeowner choose right" },
    ],
    accent: "bg-[#6B7F5E]",
  },
];

/* ── Escrow flow steps ───────────────────────────────── */
const ESCROW_FLOW = [
  { step: "You accept a quote", desc: "Agree on scope, price, and timeline" },
  { step: "Payment is taken", desc: "Your payment is held securely in escrow" },
  { step: "Work is completed", desc: "Your tradesperson completes the job" },
  { step: "You confirm satisfaction", desc: "Review the work and approve the result" },
  { step: "Funds are released", desc: "Payment is released to the tradesperson" },
];

const HowItWorks = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ═══ HEADER ══════════════════════════════════════ */}
      <header className="border-b border-foreground/[0.07] bg-background sticky top-0 z-50">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="BOOKaTRADE" className="h-7 sm:h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors hidden sm:inline-block"
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

      {/* ═══ HERO ════════════════════════════════════════ */}
      <section className="bg-foreground">
        <div className="px-6 sm:px-10 lg:px-20 py-24 lg:py-32">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-5">
            HOW IT WORKS
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[clamp(48px,5vw,80px)] tracking-tight text-white leading-[1.15] mb-6 max-w-[700px]">
            How BOOKaTRADE Works.
          </h1>
          <p className="text-[17px] sm:text-lg leading-relaxed text-white/55 max-w-[540px] mb-10">
            Your step-by-step guide to finding and booking trusted
            tradespeople — from posting your first job to leaving a
            five&#8209;star review.
          </p>
          <div className="flex flex-wrap gap-8">
            {["Post a Job", "Compare Quotes", "Book & Pay Securely"].map(
              (pill) => (
                <span
                  key={pill}
                  className="text-[11px] text-white/45 flex items-center gap-2 tracking-[0.06em]"
                >
                  <span className="w-[5px] h-[5px] bg-primary flex-shrink-0" />
                  {pill}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ═══ OVERVIEW STRIP ═════════════════════════════ */}
      <section className="bg-background border-b border-foreground/[0.09]">
        <div className="px-6 sm:px-10 lg:px-20 py-14 lg:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14">
            {[
              {
                title: "Free to Post",
                copy: "Creating a job is completely free. There's no commitment, no credit card required, and you can cancel at any time.",
              },
              {
                title: "Vetted Tradespeople Only",
                copy: "Every tradesperson on BOOKaTRADE is reviewed, verified, and locally recommended before they can quote on your job.",
              },
              {
                title: "Secure Escrow Payments",
                copy: "Your money is held safely until you confirm you're satisfied with the work. Full buyer protection on every job.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5">
                <div className="w-9 h-0.5 bg-primary mt-3 flex-shrink-0" />
                <div>
                  <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-foreground mb-2 font-sans">
                    {item.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-foreground/[0.55]">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STEPS ══════════════════════════════════════ */}
      {STEPS.map((step, i) => {
        const isDark = i % 2 === 1;
        return (
          <section
            key={step.num}
            className={isDark ? "bg-foreground" : "bg-background"}
          >
            <div className="px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
              {/* Step number + label */}
              <div className="mb-10 lg:mb-14">
                <div
                  className={`font-display text-[80px] sm:text-[100px] lg:text-[120px] leading-none tracking-[-4px] mb-3 ${
                    isDark ? "text-white/[0.07]" : "text-foreground/[0.06]"
                  }`}
                >
                  {step.num}
                </div>
                <p
                  className={`text-[11px] tracking-[0.22em] uppercase font-semibold ${
                    isDark ? "text-primary" : "text-primary"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Two-column layout */}
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Left — title + copy */}
                <div>
                  <h2
                    className={`font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight mb-8 whitespace-pre-line ${
                      isDark ? "text-white" : "text-foreground"
                    }`}
                  >
                    {step.title}
                  </h2>
                  <div className="space-y-5">
                    {step.paragraphs.map((p, pi) => (
                      <p
                        key={pi}
                        className={`text-[15px] leading-relaxed max-w-[480px] ${
                          isDark ? "text-white/55" : "text-foreground/60"
                        }`}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Right — detail cards */}
                <div className="space-y-0">
                  {step.details.map((d, di) => {
                    const Icon = d.icon;
                    return (
                      <div
                        key={di}
                        className={`flex items-start gap-5 py-5 ${
                          di < step.details.length - 1
                            ? isDark
                              ? "border-b border-white/[0.08]"
                              : "border-b border-foreground/[0.09]"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                            isDark
                              ? "bg-white/[0.06]"
                              : "bg-foreground/[0.04]"
                          }`}
                        >
                          <Icon
                            className={`w-[18px] h-[18px] ${
                              isDark ? "text-white/50" : "text-foreground/45"
                            }`}
                            strokeWidth={1.5}
                          />
                        </div>
                        <p
                          className={`text-[14px] leading-relaxed pt-2.5 ${
                            isDark ? "text-white/60" : "text-foreground/65"
                          }`}
                        >
                          {d.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Escrow visual — only on Step 05 ────────── */}
              {step.num === "05" && (
                <div className="mt-16 lg:mt-20">
                  <h3
                    className={`text-xs tracking-[0.14em] uppercase font-bold mb-8 font-sans ${
                      isDark ? "text-white" : "text-foreground"
                    }`}
                  >
                    How Escrow Works
                  </h3>
                  <div className="grid sm:grid-cols-5 gap-0">
                    {ESCROW_FLOW.map((ef, ei) => (
                      <div key={ei} className="flex sm:flex-col items-start gap-4 sm:gap-0">
                        {/* Connector + circle */}
                        <div className="flex sm:flex-row items-center sm:w-full">
                          <div
                            className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                              isDark ? "bg-primary" : "bg-primary"
                            }`}
                          >
                            <span className="text-white text-[11px] font-bold font-sans">
                              {ei + 1}
                            </span>
                          </div>
                          {ei < ESCROW_FLOW.length - 1 && (
                            <div
                              className={`hidden sm:block flex-1 h-px ${
                                isDark
                                  ? "bg-white/[0.12]"
                                  : "bg-foreground/[0.12]"
                              }`}
                            />
                          )}
                        </div>
                        {/* Text */}
                        <div className="sm:mt-4 sm:pr-6">
                          <p
                            className={`text-[13px] font-bold font-sans mb-1 ${
                              isDark ? "text-white" : "text-foreground"
                            }`}
                          >
                            {ef.step}
                          </p>
                          <p
                            className={`text-[12px] leading-relaxed ${
                              isDark ? "text-white/45" : "text-foreground/50"
                            }`}
                          >
                            {ef.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Milestone callout */}
                  <div
                    className={`mt-12 p-8 lg:p-10 border ${
                      isDark
                        ? "border-white/[0.08] bg-white/[0.03]"
                        : "border-foreground/[0.09] bg-foreground/[0.02]"
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Landmark className="w-5 h-5 text-primary" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4
                          className={`text-xs tracking-[0.12em] uppercase font-bold mb-2 font-sans ${
                            isDark ? "text-white" : "text-foreground"
                          }`}
                        >
                          Milestone Payments for Larger Jobs
                        </h4>
                        <p
                          className={`text-[14px] leading-relaxed max-w-[560px] ${
                            isDark ? "text-white/55" : "text-foreground/55"
                          }`}
                        >
                          For bigger projects like kitchen installations or bathroom renovations, the total payment is
                          split into clearly defined milestones. Each milestone represents a phase of work — and you
                          only release payment for each phase once you've reviewed and approved it. This structure keeps
                          your tradesperson accountable, gives you control over your budget, and ensures the project
                          stays on track from start to finish.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* ═══ TRUST BANNER ═══════════════════════════════ */}
      <section className="bg-foreground border-t border-white/[0.06]">
        <div className="px-6 sm:px-10 lg:px-20 py-16 lg:py-20">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">
            YOUR PROTECTION
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight text-white mb-10 lg:mb-14 max-w-[520px]">
            Built on Trust.{"\n"}Every Step.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-white/[0.08]">
            {[
              {
                title: "Vetted Trades",
                copy: "Every tradesperson is identity-checked, reviewed, and locally recommended before joining.",
                bar: "bg-primary",
              },
              {
                title: "Escrow Protection",
                copy: "Your money is held securely and only released when you confirm you're satisfied with the work.",
                bar: "bg-[#6B7F5E]",
              },
              {
                title: "No Hidden Fees",
                copy: "Transparent pricing with no surprises. The price you agree is the price you pay.",
                bar: "bg-[#80DDE5]",
              },
              {
                title: "Real Reviews",
                copy: "Every review is tied to a verified completed job. No fake reviews, no inflated ratings.",
                bar: "bg-white",
              },
            ].map((cell, ci) => (
              <div
                key={ci}
                className={`p-8 lg:p-10 ${
                  ci < 3 ? "border-b sm:border-b lg:border-b-0 lg:border-r border-white/[0.08]" : ""
                } ${ci % 2 === 0 && ci < 3 ? "sm:border-r" : ci % 2 === 1 ? "sm:border-r-0 lg:border-r" : ""}`}
              >
                <div className={`w-9 h-0.5 ${cell.bar} mb-6`} />
                <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-white mb-2.5 font-sans">
                  {cell.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-white/[0.45]">
                  {cell.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-24 lg:py-32 flex flex-col items-center text-center">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
          GET STARTED
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(40px,4.5vw,72px)] text-foreground leading-[1.1] tracking-tight max-w-[600px] mt-4 mb-5">
          Ready to Get Started?
        </h2>
        <p className="text-base text-foreground/[0.52] max-w-[440px] leading-relaxed mb-10">
          Post your first job for free and connect with trusted, local
          tradespeople in minutes. No commitment, no spam, no guesswork.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-white px-10 py-4 text-[11px] tracking-[0.14em] uppercase font-bold font-sans hover:bg-primary transition-colors"
          >
            Post a Job Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/signup?role=provider"
            className="inline-flex items-center justify-center gap-2 bg-transparent text-foreground px-10 py-4 text-[11px] tracking-[0.14em] uppercase font-bold font-sans border-[1.5px] border-foreground/[0.18] hover:border-foreground/50 transition-colors"
          >
            Join as a Tradesperson
          </Link>
        </div>
        <p className="mt-5 text-[11px] text-foreground/30 tracking-[0.04em]">
          Free to post. No credit card required.
        </p>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════ */}
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
};

export default HowItWorks;
