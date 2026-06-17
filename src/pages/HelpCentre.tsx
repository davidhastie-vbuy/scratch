import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, HelpCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/bookatrade-logo-black.png";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpCentre = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchFaqs = async () => {
      const { data } = await supabase
        .from("faqs")
        .select("id, question, answer, category")
        .eq("is_published", true)
        .order("sort_order");
      setFaqs((data as FAQ[]) ?? []);
      setLoading(false);
    };
    fetchFaqs();
  }, []);

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filtered = faqs.filter((f) => {
    const matchesCategory = activeCategory === "All" || f.category === activeCategory;
    const matchesSearch =
      !searchTerm ||
      f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-foreground/[0.07] bg-background sticky top-0 z-50">
        <div className="container flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="BOOKaTRADE" className="h-7 sm:h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground/60 hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/signup" className="bg-foreground text-background px-6 py-2.5 text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-foreground/90 transition-colors">Sign Up Free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-16 lg:py-20">
        <p className="text-[11px] tracking-[0.22em] uppercase text-trade-stone font-semibold mb-3.5">Help Centre</p>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[clamp(40px,4.5vw,64px)] leading-[1.2] tracking-tight text-white mb-5">
          Frequently Asked<br />Questions.
        </h1>
        <p className="text-[15px] leading-relaxed text-white/55 max-w-[480px]">
          Find answers to common questions about posting jobs, getting quotes, payments, and more.
        </p>
      </section>

      {/* Search & Filter */}
      <section className="bg-background px-6 sm:px-10 lg:px-20 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Search bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-sm border border-foreground/[0.12] bg-transparent outline-none font-sans placeholder:text-foreground/30 focus:border-foreground/30 transition-colors"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-[11px] tracking-[0.08em] uppercase font-bold font-sans transition-colors ${
                  activeCategory === cat
                    ? "bg-foreground text-white"
                    : "border border-foreground/[0.12] text-foreground/50 hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          {loading ? (
            <div className="py-20 text-center text-foreground/30 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <HelpCircle className="h-10 w-10 text-foreground/15 mx-auto mb-4" />
              <p className="text-foreground/40 text-sm">No questions found matching your search.</p>
            </div>
          ) : (
            <div className="border-t border-foreground/[0.09]">
              {filtered.map((faq) => (
                <div key={faq.id} className="border-b border-foreground/[0.09]">
                  <button
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between py-5 text-left group"
                  >
                    <span className="text-sm sm:text-[15px] font-semibold text-foreground pr-4 leading-snug">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-foreground/30 flex-shrink-0 transition-transform duration-200 ${
                        openId === faq.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openId === faq.id && (
                    <div className="pb-5 pr-8">
                      <span className="inline-block text-[9px] tracking-[0.14em] uppercase text-primary/60 font-bold mb-2">{faq.category}</span>
                      <p className="text-sm leading-relaxed text-foreground/55">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground px-6 sm:px-10 lg:px-20 py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.22em] uppercase text-trade-stone font-semibold mb-3.5">Still Have Questions?</p>
          <h2 className="font-display text-2xl sm:text-3xl text-white leading-[1.3] tracking-tight mb-5">
            We're Here to Help.
          </h2>
          <p className="text-[15px] text-white/50 mb-8 max-w-md mx-auto">
            Can't find what you're looking for? Get in touch and we'll point you in the right direction.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-foreground px-8 py-3.5 text-[11px] tracking-[0.14em] uppercase font-bold font-sans hover:bg-foreground hover:text-white transition-colors"
            >
              Contact Us
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground px-6 sm:px-10 lg:px-20 pt-16 pb-8 border-t border-white/[0.06]">
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

export default HelpCentre;
