import { Link } from "react-router-dom";
import {
  Search,
  MessageSquare,
  CheckCircle2,
  CalendarDays,
  Milestone,
  Banknote,
  Star,
  ArrowRight,
  ShieldCheck,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import logo from "@/assets/bookatrade-logo-black.png";

/* ── Step data ──────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    label: "Quote for Jobs",
    headline: "Win Work on\nYour Terms.",
    icon: Search,
    paragraphs: [
      "When a homeowner posts a job in your area and trade category, it appears in your dashboard. Every job includes a clear description, photos where relevant, location and the customer's preferred timeline.",
      "You'll only ever compete against a small, capped number of other local tradespeople — never a free-for-all. That means every quote you submit has a genuine chance of being accepted.",
      "Submit a competitive, itemised quote directly through the platform. Add notes, highlight your experience and explain your approach. The customer sees your profile, reviews and portfolio alongside your price — so quality always matters as much as cost.",
    ],
    bullets: [
      "Jobs matched to your trade & postcode radius",
      "Limited competition — max 4 quotes per job",
      "Free to browse — you only pay when you win work",
    ],
  },
  {
    num: "02",
    label: "Discuss & Clarify",
    headline: "Build Trust\nBefore You Start.",
    icon: MessageSquare,
    paragraphs: [
      "Once you've submitted a quote, a direct messaging thread opens between you and the customer. This is your chance to ask follow-up questions, request additional photos or measurements and refine the scope.",
      "You can update your quote at any time during the discussion — add line items, adjust pricing or provide alternatives. Customers appreciate transparency and flexibility, and it increases your acceptance rate.",
      "Use this stage to build rapport. Homeowners want to feel confident in who they're letting into their home. A responsive, professional exchange goes a long way.",
    ],
    bullets: [
      "In-app messaging — no phone tag",
      "Request more info or photos from the customer",
      "Update your quote as scope evolves",
    ],
  },
  {
    num: "03",
    label: "Confirm Acceptance",
    headline: "Get the\nGreen Light.",
    icon: CheckCircle2,
    paragraphs: [
      "When the customer chooses your quote, you'll receive an instant notification. The job card moves to your 'Accepted' pipeline and you'll see the full confirmed scope, agreed price and customer contact details.",
      "Confirm the job from your end, agree on start dates and any access arrangements. Both you and the customer sign off on the scope before work begins — so there are no surprises.",
      "If anything changes before you start, both parties can discuss amendments through the platform. Everything is documented, giving you a clear audit trail if questions arise later.",
    ],
    bullets: [
      "Instant acceptance notification",
      "Mutual scope agreement — both sides confirm",
      "Full audit trail of every change",
    ],
  },
  {
    num: "04",
    label: "Communicate & Schedule",
    headline: "Stay Organised.\nStay Professional.",
    icon: CalendarDays,
    paragraphs: [
      "Manage your entire schedule from within BOOKaTRADE. Set your availability, block out holidays and mark travel time. The calendar syncs across all your active jobs so you never double-book.",
      "Send the customer progress updates, schedule reminders or flag any delays — all through the built-in messaging system. No more hunting through texts, emails and voicemails.",
      "As your reputation grows, you'll be managing multiple jobs simultaneously. The dashboard gives you a single view of every active project, upcoming start dates and outstanding actions.",
    ],
    bullets: [
      "Built-in calendar & availability management",
      "Progress updates keep customers informed",
      "Single dashboard for all active jobs",
    ],
  },
  {
    num: "05",
    label: "Set Up Milestones",
    headline: "Break It Down.\nGet Paid as You Go.",
    icon: Milestone,
    paragraphs: [
      "For larger projects, you can split the work into milestones — for example, 'Strip existing kitchen', 'First fix plumbing & electrics', 'Install units', 'Final snag & sign-off'. Each milestone has its own description and value.",
      "When you complete a milestone, mark it as done in the app. The customer reviews the work and approves the milestone. Once approved, the corresponding payment is released from escrow automatically.",
      "Milestones protect you and the customer equally. You get paid progressively as you deliver, and the customer only releases funds once they're satisfied with each stage. It builds trust and reduces disputes.",
    ],
    bullets: [
      "Define milestones with clear descriptions & values",
      "Customer approves each stage before payment releases",
      "Reduces disputes and builds trust",
    ],
  },
  {
    num: "06",
    label: "Getting Paid",
    headline: "No Upfront Fees.\nNo Monthly Costs.",
    icon: Banknote,
    paragraphs: [
      "BOOKaTRADE operates on a simple, fair model: we charge a small percentage of the job value only when you successfully complete work and get paid. There are no sign-up fees, no monthly subscriptions and no listing charges.",
      "When the customer approves a milestone or the final job, funds are released from our secure escrow account. You'll receive payment by bank transfer within 2 working days. No chasing invoices. No awkward payment conversations.",
      "We get paid when you get paid. That alignment of incentives means we're motivated to send you quality leads, help you win work and ensure smooth transactions. If you don't earn, neither do we.",
    ],
    bullets: [
      "Small % fee — only on completed work",
      "Payment by bank transfer within 2 working days",
      "Secure escrow — funds held safely until approval",
      "Zero monthly fees, zero listing fees, zero risk",
    ],
  },
  {
    num: "07",
    label: "Review the Customer",
    headline: "Build Your\nReputation.",
    icon: Star,
    paragraphs: [
      "After the job is complete, you can leave a review for the customer. Was the property well-prepared? Were they communicative and reasonable? Did they pay promptly? Your feedback helps other tradespeople make informed decisions.",
      "In return, the customer leaves a review for you. Positive reviews build your public profile, push you higher in search results and make future customers more likely to accept your quotes.",
      "Your BOOKaTRADE profile becomes your professional portfolio — a growing record of completed work, verified reviews and customer testimonials that you can share anywhere.",
    ],
    bullets: [
      "Two-way reviews — both sides have a voice",
      "Strong profiles rank higher in search",
      "Your portfolio grows with every completed job",
    ],
  },
];

/* ── Value props for the 'Why' grid ─────────────────── */
const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Payment Protection",
    copy: "Customer funds are held in escrow before work begins. You'll never chase an invoice again.",
    barColor: "bg-primary",
  },
  {
    icon: Zap,
    title: "Quality Leads, Not Spam",
    copy: "Every lead is a real job from a verified customer. No data selling, no cold calls, no wasted time.",
    barColor: "bg-[#6B7F5E]",
  },
  {
    icon: Clock,
    title: "Less Admin, More Trade",
    copy: "Quotes, messaging, scheduling and payments — all in one place. Focus on the work, not the paperwork.",
    barColor: "bg-foreground",
  },
  {
    icon: TrendingUp,
    title: "Grow on Your Terms",
    copy: "No contracts, no lock-in. Scale up when you're busy, dial back when you're not. Complete flexibility.",
    barColor: "bg-trade-stone",
  },
];

const HowItWorksProvider = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ═══ HEADER ═══════════════════════════════════════ */}
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
              to="/signup?role=provider"
              className="bg-foreground text-background px-6 py-2.5 text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-foreground/90 transition-colors"
            >
              Join as a Tradesperson
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═════════════════════════════════════════ */}
      <section className="bg-foreground">
        <div className="px-6 sm:px-10 lg:px-20 py-20 lg:py-28 max-w-4xl">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-5">
            For Trade Professionals
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[clamp(44px,4.8vw,76px)] tracking-tight text-white leading-[1.15] mb-6">
            How BOOKaTRADE
            <br />
            Works for
            <br />
            Tradespeople.
          </h1>
          <p className="text-[15px] sm:text-base leading-relaxed text-white/60 max-w-[480px] mb-10">
            Your guide to winning jobs, getting paid and growing your business —
            without chasing leads, haggling on price or waiting for invoices to
            clear.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup?role=provider"
              className="inline-block bg-white text-foreground px-8 py-3.5 text-[11px] tracking-[0.14em] uppercase font-bold font-sans hover:bg-primary hover:text-white transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="#step-01"
              className="inline-block bg-transparent text-white px-8 py-3 text-[11px] tracking-[0.14em] uppercase font-bold font-sans border-[1.5px] border-white/30 hover:border-white hover:bg-white/[0.06] transition-all"
            >
              See How It Works
            </a>
          </div>
          {/* Trust pills */}
          <div className="flex gap-7 mt-10 flex-wrap">
            {[
              "No Upfront Fees",
              "Escrow-Protected Payments",
              "Limited Competition per Job",
            ].map((pill) => (
              <span
                key={pill}
                className="text-[11px] text-white/40 flex items-center gap-1.5 tracking-[0.04em]"
              >
                <span className="w-[5px] h-[5px] rounded-full bg-primary flex-shrink-0" />
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STEP SECTIONS ════════════════════════════════ */}
      {STEPS.map((step, idx) => {
        const isDark = idx % 2 === 1;
        const Icon = step.icon;

        return (
          <section
            key={step.num}
            id={`step-${step.num}`}
            className={isDark ? "bg-foreground" : "bg-background"}
          >
            <div className="px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
              {/* Step header */}
              <div className="flex items-start gap-5 sm:gap-8 mb-10 lg:mb-14">
                <div
                  className={`font-display text-7xl sm:text-8xl lg:text-[120px] leading-none tracking-[-4px] ${
                    isDark ? "text-primary" : "text-primary"
                  }`}
                >
                  {step.num}
                </div>
                <div className="pt-2 sm:pt-4 lg:pt-6">
                  <p
                    className={`text-[11px] tracking-[0.22em] uppercase font-semibold mb-2 ${
                      isDark ? "text-[#6B7F5E]" : "text-primary"
                    }`}
                  >
                    Step {step.num} — {step.label}
                  </p>
                  <h2
                    className={`font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight whitespace-pre-line ${
                      isDark ? "text-white" : "text-foreground"
                    }`}
                  >
                    {step.headline}
                  </h2>
                </div>
              </div>

              {/* Content grid */}
              <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-20">
                {/* Left — body copy */}
                <div className="space-y-5">
                  {step.paragraphs.map((p, pi) => (
                    <p
                      key={pi}
                      className={`text-[15px] leading-relaxed ${
                        isDark ? "text-white/55" : "text-foreground/60"
                      }`}
                    >
                      {p}
                    </p>
                  ))}
                </div>

                {/* Right — icon card + bullets */}
                <div>
                  {/* Icon panel */}
                  <div
                    className={`p-8 lg:p-10 mb-6 ${
                      isDark
                        ? "bg-white/[0.04] border border-white/[0.08]"
                        : "bg-foreground/[0.03] border border-foreground/[0.08]"
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 mb-6 ${
                        isDark ? "text-[#6B7F5E]" : "text-primary"
                      }`}
                      strokeWidth={1.5}
                    />
                    <ul className="space-y-3.5">
                      {step.bullets.map((b, bi) => (
                        <li
                          key={bi}
                          className={`text-[13px] leading-snug flex items-start gap-3 ${
                            isDark ? "text-white/70" : "text-foreground/70"
                          }`}
                        >
                          <span
                            className={`w-4 h-[1.5px] mt-[9px] flex-shrink-0 ${
                              isDark ? "bg-white/25" : "bg-foreground/20"
                            }`}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {STEPS.map((_, si) => (
                        <div
                          key={si}
                          className={`h-[3px] transition-all ${
                            si <= idx ? "w-6" : "w-2"
                          } ${
                            si <= idx
                              ? "bg-primary"
                              : isDark
                              ? "bg-white/15"
                              : "bg-foreground/10"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[11px] tracking-[0.06em] ${
                        isDark ? "text-white/30" : "text-foreground/30"
                      }`}
                    >
                      {idx + 1} of {STEPS.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ═══ WHY BOOKaTRADE GRID ══════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-24">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">
          Why BOOKaTRADE
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight text-foreground mb-10 lg:mb-14">
          Built for Tradespeople
          <br />
          Who Take Pride in Their Work.
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-foreground/[0.09]">
          {VALUE_PROPS.map((cell, i) => {
            const CellIcon = cell.icon;
            return (
              <div
                key={i}
                className={`p-8 lg:p-10 ${
                  i < 3
                    ? "border-b sm:border-b lg:border-b-0 lg:border-r border-foreground/[0.09]"
                    : ""
                } ${
                  i % 2 === 0
                    ? "sm:border-r lg:border-r"
                    : "sm:border-r-0 lg:border-r"
                } ${i === 3 ? "lg:border-r-0" : ""}`}
              >
                <div className={`w-9 h-0.5 ${cell.barColor} mb-6`} />
                <CellIcon
                  className="w-5 h-5 text-foreground/40 mb-4"
                  strokeWidth={1.5}
                />
                <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-foreground mb-2.5 font-sans">
                  {cell.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-foreground/[0.58]">
                  {cell.copy}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ PRICING SUMMARY ══════════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-24">
        <div className="max-w-4xl">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#6B7F5E] font-semibold mb-3.5">
            Transparent Pricing
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight text-white mb-6">
            We Get Paid
            <br />
            When You Get Paid.
          </h2>
          <p className="text-[15px] leading-relaxed text-white/55 max-w-[560px] mb-12">
            No sign-up fees. No monthly subscriptions. No listing charges. We
            take a small percentage of the job value only when work is completed
            and the customer is satisfied.
          </p>

          <div className="grid sm:grid-cols-3 gap-px bg-white/[0.08]">
            {[
              {
                figure: "£0",
                label: "To Sign Up",
                detail: "Create your profile, browse jobs and submit quotes — completely free.",
              },
              {
                figure: "£0",
                label: "Monthly Fee",
                detail: "No subscriptions, no hidden charges, no lock-in contracts. Ever.",
              },
              {
                figure: "2 Days",
                label: "Payment Speed",
                detail: "Approved funds land in your bank account within 2 working days.",
              },
            ].map((card, i) => (
              <div key={i} className="bg-foreground p-8 lg:p-10">
                <div className="font-display text-4xl sm:text-5xl text-primary leading-none mb-2 tracking-[-1px]">
                  {card.figure}
                </div>
                <h3 className="text-[11px] tracking-[0.16em] uppercase text-white font-bold mb-3 font-sans">
                  {card.label}
                </h3>
                <p className="text-[13px] leading-relaxed text-white/45">
                  {card.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ════════════════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-24 lg:py-32 flex flex-col items-center text-center">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
          Ready to Get Started?
        </p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(40px,4.5vw,72px)] text-foreground leading-[1.1] tracking-tight max-w-[680px] mt-3.5 mb-5">
          Ready to Grow
          <br />
          Your Business?
        </h2>
        <p className="text-base text-foreground/[0.52] max-w-[440px] leading-relaxed mb-10">
          Join hundreds of tradespeople already winning work, getting paid on
          time and building their reputation on BOOKaTRADE.
        </p>
        <Link
          to="/signup?role=provider"
          className="inline-flex items-center gap-2.5 bg-foreground text-white px-10 py-4 text-[11px] tracking-[0.14em] uppercase font-bold font-sans hover:bg-primary transition-colors group"
        >
          Join as a Tradesperson
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <p className="mt-4 text-[11px] text-foreground/30 tracking-[0.04em]">
          Free to join. No commitment. No monthly fees.
        </p>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════ */}
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

export default HowItWorksProvider;
