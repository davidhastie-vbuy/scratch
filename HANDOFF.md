# BOOKaTRADE — Project Handoff & Memory File

> Last updated: 2026-06-17 by Gemini session `928563cd`

## What Is BOOKaTRADE?

A UK-focused marketplace connecting homeowners with vetted, locally recommended tradespeople. Homeowners post jobs, receive limited quotes from verified local providers, and pay through an escrow system. Providers get guaranteed payment with no upfront costs — BOOKaTRADE takes a small percentage on completion only.

**Live site**: https://bookatrade.io
**Repo**: https://github.com/davidhastie-vbuy/scratch (private)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | shadcn/ui, Radix UI, TailwindCSS |
| Styling | CSS variables in `src/index.css`, Tailwind config in `tailwind.config.ts` |
| Fonts | Bauhaus (display headings), Helvetica Neue (body) — self-hosted in `src/fonts/` |
| Backend | Supabase (Postgres, Auth, Edge Functions, Storage, RLS) |
| Payments | Stripe (escrow model) |
| Email | Resend (via Supabase Edge Functions, auth hook at `supabase/functions/auth-email-hook/`) |
| Hosting | Docker → Google Cloud Run (project: `bookatrade-497811`) |
| CI/CD | Push to `main` branch → manual Cloud Run deploy |
| GCP Account | `support@bookatrade.io` (may need `gcloud auth login` to refresh tokens) |

---

## Design System

### Brand Identity
- **Aesthetic**: Bauhaus-editorial. Sharp edges (border-radius: 0), strong typography, alternating light/dark sections
- **Primary color**: Sage green `#6B7F5E` / HSL `138 15% 43%` — used for buttons, links, focus rings, accents
- **Background**: Warm parchment `#F7F4EF`
- **Foreground**: Charcoal `#252525`
- **Destructive**: Red (only for errors, never for UI accents)
- **Logo**: `src/assets/bookatrade-logo-black.png` — used across all 14+ pages
- **Unused logos**: `bookatrade-logo.png` and `bookatrade-logo-dark.jpeg` exist but are NOT imported anywhere (cleanup candidates)

### CSS Variables (src/index.css)
```
--primary: 138 15% 43%        /* sage green */
--ring: 138 15% 43%           /* focus rings — sage green */
--accent: 138 15% 94%         /* green-tinted accent */
--destructive: 0 72% 51%      /* red — errors only */
--background: 36 33% 95%      /* warm parchment */
--foreground: 0 0% 15%        /* charcoal */
--radius: 0rem                /* square edges */
```

### Trade Category Colors
Each trade has a unique accent color (used for badges, cards, monograms):
- Joiners: olive | Kitchen Fitters: orange | Electricians: lilac | Painters: cobalt
- Plumbers: aqua | Roofers: slate | Landscapers: forest | Tilers: stone
- Gas Engineers: copper

### ⚠️ CRITICAL: Bauhaus Font Line-Height Bug

The Bauhaus font (`src/fonts/BauhausRegular.ttf`, `BauhausBold.ttf`) has extreme vertical metrics baked into the font file. **CSS `line-height` has NO visual effect** on reducing spacing between lines — not via Tailwind `leading-*` classes, not via inline `style={{ lineHeight }}`, not via `!important`. The font's internal ascent/descent values create a minimum spacing floor.

**Solution**: Use `display: block` spans with **negative margin-top** to control line spacing:
```tsx
<h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">
  <span className="block">Line One</span>
  <span className="block -mt-3 sm:-mt-4 lg:-mt-5 xl:-mt-7">Line Two</span>
</h1>
```

Additionally, Tailwind's responsive `text-*` utilities (e.g. `sm:text-5xl`) include built-in `line-height` that overrides standalone `leading-*` classes at responsive breakpoints.

---

## Project Structure

```
src/
├── assets/          # Images, logos
├── components/
│   ├── admin/       # AdminFAQs, AdminProviderList, AdminCategoryList, etc.
│   ├── layouts/     # DashboardLayout (sidebar + header)
│   ├── messaging/   # Chat, attachments, quote banners
│   ├── provider-signup/ # Multi-step provider registration
│   ├── reviews/     # ReviewDialog
│   └── ui/          # shadcn/ui components
├── contexts/        # AuthContext
├── fonts/           # Bauhaus TTF files
├── hooks/           # use-toast, use-trade-categories, etc.
├── integrations/
│   └── supabase/    # Client config + generated types
├── lib/             # Utilities (cn, etc.)
├── pages/
│   ├── customer/    # CustomerHome, PostJob, JobDetail, Messages, Favourites
│   ├── provider/    # ProviderHome, AvailableJobs, ProviderJobDetail, Messages, Calendar, Portfolio
│   ├── shared/      # SupportPage
│   └── *.tsx        # Public pages + auth pages
└── index.css        # Global styles + CSS variables
```

---

## Pages & Routes

### Public Pages
| Route | Page | Notes |
|-------|------|-------|
| `/` | Index.tsx (homepage) | HomeRedirect checks auth state |
| `/login` | Login.tsx | Split-screen, Google OAuth |
| `/signup` | Signup.tsx | Accepts `?role=provider`, `?context=`, `?email=`, `?postcode=`, `?area=` params |
| `/forgot-password` | ForgotPassword.tsx | |
| `/reset-password` | ResetPassword.tsx | |
| `/auth/confirm` | AuthConfirm.tsx | Email verification OTP handler |
| `/trades/:slug` | TradeCategory.tsx | 8 trades, test data for featured providers |
| `/how-it-works` | HowItWorks.tsx | Customer guide (6 steps) |
| `/how-it-works-provider` | HowItWorksProvider.tsx | Provider guide (7 steps) |
| `/trust-and-safety` | TrustAndSafety.tsx | Escrow, disputes, vetting |
| `/pricing` | Pricing.tsx | Provider pricing (no upfront fees) |
| `/help-centre` | HelpCentre.tsx | FAQ with Supabase `faqs` table |
| `/contact` | Contact.tsx | 20 Wenlock Road, London N1 7GU |
| `/legal` | LegalPage.tsx | `?audience=customer` or `?audience=provider` |

### Authenticated Pages
| Route | Role | Page |
|-------|------|------|
| `/customer/*` | Customer | Home, PostJob, JobDetail, Messages, Favourites |
| `/provider/*` | Provider | Home, AvailableJobs, JobDetail, Messages, Calendar, Portfolio |
| `/admin` | Admin | AdminDashboard (tabs: Providers, Customers, Categories, Support, Admins, Recommendations, Disputes, Payouts, Legal, Slots, FAQs) |

---

## Database (Supabase)

### Key Tables
- `profiles` — User profiles (linked to auth.users)
- `user_roles` — Role assignments (customer, provider, admin)
- `trade_categories` — Trade types (slug, name, description, icon)
- `provider_profiles` — Provider business info, logo, banner, verification status
- `public_provider_profiles` — Public view of verified providers
- `jobs` — Customer job postings
- `quotes` — Provider quotes on jobs
- `conversations` / `messages` — In-app messaging
- `reviews` — Ratings and reviews
- `faqs` — Help Centre content (admin-editable, `is_published`, `sort_order`)
- `legal_pages` — Terms, Privacy (admin-editable)
- `featured_provider_slots` — Featured provider display slots
- `support_tickets` — Customer/provider support requests
- `provider_status_history` — Verification audit trail
- `disputes` — Job disputes
- `milestones` — Payment milestones for jobs
- `provider_postcodes` — Provider service areas
- `recommendations` — Provider recommendations

### RLS Patterns
- Public tables: `faqs` (read), `trade_categories` (read)
- Admin-only: Uses `is_admin()` function for CRUD policies
- User-scoped: Most tables use `auth.uid() = user_id` patterns

### Recent Migrations
- `20260616000000_add_featured_providers.sql` — Featured provider slots
- `20260617000000_add_faqs.sql` — FAQ table with 12 seeded Q&As

---

## Signup Flow

### Customer
1. Select "Customer" role → enter email, password, full name, postcode → email verification

### Provider (4 steps)
1. **Business Details**: Business name, trade category (dropdown from DB), years experience, description
2. **Documents**: Upload certifications, insurance, qualifications
3. **Areas You Operate**: Add postcode districts (e.g., CW2, G12, EH16)
4. **Review & Submit**: Summary → submit for admin verification

### URL Parameters
- `?role=provider` — Pre-selects Provider tab
- `?email=x` — Pre-fills email field
- `?postcode=x` — Pre-fills postcode field
- `?area=X` — Shows "We have X vetted providers in [area]" banner
- `?context=projects` — Shows "register to view work" banner

---

## Homepage Sections (Index.tsx)

1. **Hero** — "TRUST STARTS HERE" / "Find the Right Tradesperson. First Time."
2. **Trust Pills** — "Vetted Tradespeople · No Hidden Costs · You Stay in Full Control"
3. **Search Bar** — Category dropdown + postcode input → personalized signup
4. **Review Ticker** — Scrolling customer testimonials
5. **Browse by Trade** — 7 trade tiles (Joiners removed from grid, still has a standalone campaign section below)
6. **How It Works** — 4-step numbered flow
7. **Recent Works** — Project showcase cards
8. **Joiners Campaign** — Standalone "Made to Measure" editorial banner (kept for future use)
9. **Why BOOKaTRADE** — 4-column value props
10. **For Trade Professionals** — "Stop Paying for Leads. Real Jobs. Guaranteed Payment."
11. **Get Started CTA** — Email capture → prepopulated signup
12. **Footer** — Social links (Instagram, Facebook), Platform links, For Trades links

---

## Known Items / Future Work

- **Joiners trade page** (`/trades/joiners`) still exists and works — the section was removed from the homepage grid but kept as a standalone campaign banner for later use
- **Trust Pilot integration** — Reviews link in footer reserved for when platform reviews accumulate
- **Old logo assets** — `bookatrade-logo.png` (1.1MB) and `bookatrade-logo-dark.jpeg` (1.1MB) are unused and can be deleted
- **Cloud Run deployment** — Requires `gcloud auth login support@bookatrade.io` if tokens expire
- **Code splitting** — Build warns about chunk size (1.3MB JS). Consider `React.lazy()` for route-level splitting

---

## Company Details (Contact Page)

- **Company**: BOOKaTRADE Ltd.
- **Registered in**: England
- **Address**: 20 Wenlock Road, London, N1 7GU, United Kingdom
- **Email**: hello@bookatrade.com
- **Instagram**: https://www.instagram.com/bookatrade
- **Facebook**: https://www.facebook.com/profile.php?id=61589269814365
