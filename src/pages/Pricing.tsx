import { Link } from "react-router-dom";
import { Shield, Bell, Star, MessageSquare, CalendarDays, CreditCard, ArrowRight, Check, X as XIcon } from "lucide-react";
import logo from "@/assets/bookatrade-logo-black.png";

const Pricing = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <header className="border-b border-foreground/[0.07] bg-background sticky top-0 z-50">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="BOOKaTRADE" className="h-7 sm:h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/signup?role=provider" className="bg-foreground text-background px-6 py-2.5 text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-foreground/90 transition-colors">Join Free</Link>
          </div>
        </div>
      </header>

      {/* ═══ 1. HERO ══════════════════════════════════════ */}
      <section className="bg-background">
        <div className="px-6 sm:px-10 lg:px-20 pt-24 lg:pt-32 pb-20 lg:pb-24 max-w-4xl">
          <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-5">Pricing for Tradespeople</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[clamp(48px,5vw,76px)] tracking-tight text-foreground leading-[1.15] mb-7">
            Simple, Fair<br />Pricing.
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed text-foreground/55 max-w-[520px]">
            We only get paid when you do. No upfront costs. No monthly subscriptions. No hidden fees. Ever.
          </p>
        </div>
      </section>

      {/* ═══ 2. THE MODEL ═════════════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">The Model</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight text-white mb-14 lg:mb-16 max-w-[600px]">
          Zero Risk.<br />You Keep What You Earn.
        </h2>

        <div className="grid md:grid-cols-3 gap-px bg-white/[0.08]">
          {[
            {
              headline: "No Upfront Fees",
              detail: "Joining BOOKaTRADE is completely free. Create your profile, upload your portfolio and start receiving job alerts without paying a penny.",
            },
            {
              headline: "No Monthly Subscription",
              detail: "We don't charge monthly fees, annual plans or lock-in contracts. Your overheads stay exactly where they are.",
            },
            {
              headline: "No Hidden Costs",
              detail: "No charge to view jobs. No charge to send quotes. No charge for messages, reviews or tools. The only fee is a small percentage of the completed job value — and you'll always know what it is before you accept.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-foreground p-8 lg:p-12">
              <div className="w-10 h-0.5 bg-primary mb-7" />
              <h3 className="font-display text-2xl sm:text-[28px] text-white leading-tight mb-4">{item.headline}</h3>
              <p className="text-[15px] leading-relaxed text-white/50">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 lg:mt-20 border border-white/[0.09] p-8 sm:p-10 lg:p-14 max-w-3xl">
          <p className="text-[11px] tracking-[0.22em] uppercase text-white/40 font-semibold mb-4">How It Works</p>
          <p className="font-display text-2xl sm:text-3xl lg:text-4xl text-white leading-[1.3] tracking-tight mb-5">
            BOOKaTRADE charges a small percentage of the job value — taken only when a job is completed and payment is released.
          </p>
          <p className="text-[15px] leading-relaxed text-white/45 max-w-[520px]">
            That's it. You see the fee upfront when you quote. You know exactly what you'll take home. No surprises, no invoices from us, no chasing. The fee is deducted automatically before funds hit your account.
          </p>
        </div>
      </section>

      {/* ═══ 3. HOW PAYMENT WORKS ═════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">Payment Flow</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight text-foreground mb-14 lg:mb-16 max-w-[640px]">
          Get Paid with<br />Confidence. Every Time.
        </h2>

        <div className="grid lg:grid-cols-4">
          {[
            {
              num: "01",
              title: "Customer Pays Upfront",
              copy: "When a customer accepts your quote, they pay the agreed amount upfront — or per milestone on larger projects. The money leaves their account before you pick up a tool.",
            },
            {
              num: "02",
              title: "Funds Held in Escrow",
              copy: "The payment is held securely by BOOKaTRADE in an independent escrow account. It's ring-fenced and protected — neither party can touch it until the work is reviewed.",
            },
            {
              num: "03",
              title: "Customer Confirms",
              copy: "Once the job is complete, the customer confirms they're satisfied. If there's a dispute, our resolution team steps in to mediate fairly for both sides.",
            },
            {
              num: "04",
              title: "You Get Paid",
              copy: "Payment is released to your bank account within 2 working days, minus the BOOKaTRADE fee. No invoicing the customer. No chasing. No uncertainty.",
            },
          ].map((step, i) => (
            <div
              key={step.num}
              className={`py-8 lg:py-0 ${i > 0 ? "lg:pl-10 border-t lg:border-t-0 lg:border-l" : ""} ${i < 3 ? "lg:pr-10 border-foreground/[0.09]" : ""}`}
            >
              <div className="font-display text-6xl lg:text-7xl text-primary leading-none mb-5 tracking-[-2px]">{step.num}</div>
              <h3 className="text-[11px] tracking-[0.16em] uppercase text-foreground font-bold mb-2.5 font-sans">{step.title}</h3>
              <p className="text-[14px] leading-relaxed text-foreground/50">{step.copy}</p>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap gap-8 mt-14 lg:mt-16 pt-10 border-t border-foreground/[0.09]">
          {[
            "Funds secured in escrow before work begins",
            "Paid within 2 working days by bank transfer",
            "Dispute resolution included as standard",
          ].map((point) => (
            <span key={point} className="text-[12px] text-foreground/45 flex items-center gap-2 tracking-[0.02em]">
              <span className="w-[5px] h-[5px] bg-primary flex-shrink-0" />
              {point}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ 4. COMPARISON ════════════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">The Difference</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight text-white mb-14 lg:mb-16 max-w-[640px]">
          Stop Paying for Leads<br />That Go Nowhere.
        </h2>

        <div className="grid lg:grid-cols-2 gap-px bg-white/[0.08]">
          {/* Traditional */}
          <div className="bg-foreground p-8 sm:p-10 lg:p-14">
            <div className="text-[11px] tracking-[0.22em] uppercase text-white/30 font-semibold mb-8">Traditional Lead-Gen Sites</div>
            <ul className="space-y-5">
              {[
                "Pay per lead — whether they answer or not",
                "Monthly subscription fees from day one",
                "No guarantee any lead converts to work",
                "Shared leads sent to 5–10 other tradespeople",
                "You chase the customer, not the other way around",
                "No payment protection if the customer doesn't pay",
                "Reviews spread across multiple platforms",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <XIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-[14px] leading-relaxed text-white/50">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* BOOKaTRADE */}
          <div className="bg-foreground p-8 sm:p-10 lg:p-14 border-l-0 lg:border-l-2 border-primary/40">
            <div className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-8">BOOKaTRADE</div>
            <ul className="space-y-5">
              {[
                "Free to join — no sign-up fee, ever",
                "Free to quote — no charge until you're paid",
                "Only pay on completion — a small % of the job value",
                "Limited quotes per job — less competition, better odds",
                "Customers come to you with a clear brief",
                "Escrow-backed payment protection on every job",
                "Verified reviews on your BOOKaTRADE profile",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#6B7F5E] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-[14px] leading-relaxed text-white/70">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ 5. WHAT'S INCLUDED ═══════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">What's Included</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(36px,3.6vw,58px)] leading-[1.15] tracking-tight text-foreground mb-5 max-w-[600px]">
          Everything You Need.<br />Nothing You Don't.
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground/50 max-w-[480px] mb-14 lg:mb-16">
          Every feature below is included free of charge. No tiered plans. No premium upgrades. Every tradesperson gets the full toolkit from day one.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 border border-foreground/[0.09]">
          {[
            {
              icon: Shield,
              title: "Free Professional Profile",
              copy: "Showcase your trade, experience, service area and portfolio. Your profile is your shopfront — built to convert browsers into customers.",
              barColor: "bg-primary",
            },
            {
              icon: Bell,
              title: "Free Job Alerts",
              copy: "Receive instant notifications for new jobs in your area that match your trade and availability. No algorithms — just relevant work.",
              barColor: "bg-trade-olive",
            },
            {
              icon: Star,
              title: "Verified Reviews",
              copy: "Every review on BOOKaTRADE is linked to a completed, paid job. No fake reviews. No purchased ratings. Genuine feedback that builds your reputation.",
              barColor: "bg-foreground",
            },
            {
              icon: MessageSquare,
              title: "In-App Messaging",
              copy: "Communicate directly with customers through our secure messaging system. Share photos, clarify details and agree scope — all in one thread.",
              barColor: "bg-trade-stone",
            },
            {
              icon: CalendarDays,
              title: "Calendar & Job Management",
              copy: "Track your active jobs, upcoming appointments and completed work in a single dashboard. Stay organised without the spreadsheet.",
              barColor: "bg-trade-cobalt",
            },
            {
              icon: CreditCard,
              title: "Payment Protection",
              copy: "Every payment is secured through escrow before work begins. You'll never chase an invoice again. Do the work, get paid. Simple.",
              barColor: "bg-trade-aqua",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`p-8 lg:p-10 border-foreground/[0.09] ${
                i < 3 ? "border-b" : ""
              } ${
                i % 3 !== 2 ? "lg:border-r" : ""
              } ${
                i % 2 === 0 ? "sm:border-r lg:border-r" : "sm:border-r-0"
              } ${
                i % 3 === 2 ? "lg:border-r-0" : ""
              } ${
                i < 4 ? "sm:border-b" : "sm:border-b-0"
              }`}
            >
              <div className={`w-9 h-0.5 ${feature.barColor} mb-6`} />
              <feature.icon className="w-5 h-5 text-foreground/30 mb-4" strokeWidth={1.5} />
              <h3 className="text-xs tracking-[0.12em] uppercase font-bold text-foreground mb-2.5 font-sans">{feature.title}</h3>
              <p className="text-[13px] leading-relaxed text-foreground/[0.55]">{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 6. FAQ STRIP ═════════════════════════════════ */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-20">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-3.5">Common Questions</p>
            <h2 className="font-display text-3xl sm:text-4xl leading-[1.15] tracking-tight text-white">
              Straight<br />Answers.
            </h2>
          </div>
          <div className="space-y-px">
            {[
              {
                q: "What exactly is the BOOKaTRADE fee?",
                a: "A small percentage of the completed job value. You'll see the exact amount before you submit any quote, so there are never surprises. The fee is deducted automatically when payment is released to your account.",
              },
              {
                q: "When do I get paid?",
                a: "Within 2 working days of the customer confirming the job is complete. Funds are transferred directly to your registered bank account. No invoicing required.",
              },
              {
                q: "What happens if a customer disputes the work?",
                a: "Our resolution team reviews the evidence from both sides and mediates a fair outcome. Funds remain in escrow until the dispute is settled. We're here to protect both parties.",
              },
              {
                q: "Is there a minimum or maximum job value?",
                a: "No. BOOKaTRADE works for jobs of all sizes — from a quick repair to a full renovation. The same pricing model applies regardless of job value.",
              },
              {
                q: "Can I cancel my account at any time?",
                a: "Yes. There's no contract, no lock-in and no cancellation fee. You can deactivate your profile whenever you choose. Any outstanding payments will still be processed.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-t border-white/[0.09] py-6">
                <h3 className="text-[13px] font-bold text-white mb-2 font-sans">{faq.q}</h3>
                <p className="text-[13px] leading-relaxed text-white/45">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. CTA ═══════════════════════════════════════ */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-24 lg:py-32 flex flex-col items-center text-center">
        <p className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold mb-4">Ready?</p>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(40px,4.5vw,72px)] text-foreground leading-[1.1] tracking-tight max-w-[640px] mb-5">
          Start Getting Paid<br />Properly.
        </h2>
        <p className="text-base text-foreground/[0.50] max-w-[440px] leading-relaxed mb-10">
          Join BOOKaTRADE free. Build your profile, receive job alerts and only pay when you complete a job. No risk. No fees. No catch.
        </p>
        <Link
          to="/signup?role=provider"
          className="group inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 text-[11px] uppercase tracking-[0.14em] font-bold font-sans hover:bg-primary transition-colors"
        >
          Join as a Tradesperson
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <p className="mt-4 text-[11px] text-foreground/30 tracking-[0.04em]">Free forever. Only pay on completion.</p>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════ */}
      <footer className="bg-foreground px-6 sm:px-10 lg:px-20 pt-16 pb-8">
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

export default Pricing;
