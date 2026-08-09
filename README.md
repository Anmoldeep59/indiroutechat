# IndiRoute

IndiRoute is a global parcel-forwarding and assisted-purchase platform.

Customers receive an Indian warehouse/locker address, shop from Indian stores, consolidate parcels, and ship worldwide.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Firebase Authentication (email/password + Google)
- Supabase PostgreSQL (application data)
- Resend (transactional email — configured, not fully wired yet)
- Stripe (payments — configured, not fully wired yet)

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in Firebase and Supabase values in `.env.local`.

4. In Supabase SQL Editor, run migrations in order:

- `supabase/migrations/001_create_profiles.sql`
- `supabase/migrations/002_create_core_schema.sql`
- `supabase/migrations/003_rls_shipping_rates_and_profiles.sql`

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Important routes

- `/` — public marketing homepage
- `/signup` — create account
- `/login` — sign in
- `/forgot-password` — password reset
- `/dashboard` — customer dashboard (auth required)
- `/admin` — admin panel (auth + `profiles.role = admin`)

## Making an admin user

1. Sign up normally.
2. In Supabase Table Editor → `profiles`, set that user’s `role` to `admin`.
3. Optionally insert a matching row in `admin_users`.
4. Visit `/admin`.

## Profile sync

Signup/login call `/api/profiles/sync`, which:

1. Verifies the Firebase ID token with Firebase Admin
2. Upserts a `profiles` row in Supabase using the service role key

Required server env vars:

- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Logo

Place a transparent PNG/SVG at `public/logo.svg` (or `logo.png`) and set `USE_IMAGE_LOGO = true` in `src/components/Logo.tsx`.

## Scripts

```bash
npm run lint
npm run build
npm run dev
```

## What is intentionally not finished yet

- Live locker assignment / parcel ingestion
- Stripe Checkout + webhook fulfillment
- Resend email templates/sending flows
- Full admin CRUD for every entity
- Server middleware hardening beyond current gates
