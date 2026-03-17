# Database Setup Guide

The app uses **Supabase** as its database. You need a running Supabase instance and valid credentials in `.env.local` before the app can save or load any data.

---

## Option A — Supabase Cloud (Recommended, no Docker required)

1. Go to **https://supabase.com** and create a free account / project.

2. In your project dashboard, open the **SQL Editor** and run the contents of:
   - `supabase/migrations/20240101000000_initial.sql` — creates all tables
   - `supabase/seed.sql` — inserts default employee types and sample shifts/employees

3. Open **Project Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon / public key** (the `anon` key under "Project API keys")

4. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Restart the dev server:
```bash
npm run dev
```

---

## Option B — Local Supabase (requires Docker Desktop)

1. Install **Docker Desktop** from https://www.docker.com/products/docker-desktop/ and start it.

2. In this project directory, start Supabase locally:
```bash
npx supabase start
```
This will pull Docker images and start all Supabase services. First run takes a few minutes.

3. After it starts, run:
```bash
npx supabase status
```
Copy the **API URL** and **anon key** from the output.

4. Update `.env.local` with those values:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
```

5. Apply the schema and seed data:
```bash
npx supabase db reset
```
This runs all migrations and the seed file automatically.

6. Start the dev server:
```bash
npm run dev
```

---

## Verifying the connection works

Open http://localhost:3000/settings — you should see 3 employee types listed (Permanent, Part-Time, Federal Work Study). If you see them, the database is connected correctly.

If you see an error banner or "No employee types configured", check:
- `.env.local` has correct URL and key (no placeholder text)
- The dev server was restarted after editing `.env.local`
- The SQL migration and seed were run in Supabase

---

## Row Level Security (RLS)

The migrations do not enable RLS, so all tables are accessible with the `anon` key by default. This is fine for local development. For production, you should add RLS policies before deploying.
