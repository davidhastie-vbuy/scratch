# Bookatrade

A UK-focused marketplace connecting homeowners with vetted local tradespeople.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Radix UI, TailwindCSS
- **Backend**: Supabase (Postgres, Auth, Edge Functions, Storage)
- **Payments**: Stripe (escrow model)
- **Email**: Resend
- **Hosting**: Google Cloud Run

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

The app is containerized with Docker and deployed to Google Cloud Run.

```bash
docker build -t bookatrade .
docker run -p 8080:8080 bookatrade
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SITE_URL` | Production site URL (e.g. `https://bookatrade.io`) |
