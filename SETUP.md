# Smart Schedule — Setup Guide

## Prerequisites
- Node.js 18+
- Docker Desktop (for Supabase local dev)

## First-time Setup

### 1. Install Docker Desktop
Download from https://www.docker.com/products/docker-desktop/
- Install and restart your computer
- Open Docker Desktop and wait for it to say "Docker Desktop is running"

### 2. Start Supabase Local Dev
```bash
cd smart-schedule
npx supabase start
```
This will download and start PostgreSQL, Auth, and Studio locally.
Wait for it to complete (first run may take a few minutes).

### 3. Get your local credentials
```bash
npx supabase status
```
Copy the `API URL` and `anon key` values.

### 4. Update .env.local
Replace the placeholder values in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-step-3>
```

### 5. Run database migrations
```bash
npx supabase db push
```
Or manually run the SQL in `supabase/migrations/20240101000000_initial.sql`
in the Supabase Studio at http://127.0.0.1:54323

### 6. Load seed data
In Supabase Studio (http://127.0.0.1:54323), open the SQL Editor and run the contents of `supabase/seed.sql`.

Or from the terminal:
```bash
npx supabase db seed
```

### 7. Start the app
```bash
npm run dev
```
Open http://localhost:3000

---

## Daily Usage (after setup)

```bash
# Start Supabase (if not running)
npx supabase start

# Start the app
npm run dev
```

## Stop Supabase
```bash
npx supabase stop
```

## View Supabase Studio (database GUI)
http://127.0.0.1:54323

---

## Application Pages

| URL | Page |
|-----|------|
| http://localhost:3000 | Dashboard |
| http://localhost:3000/schedule | Weekly Schedule Grid |
| http://localhost:3000/employees | Employee Management |
| http://localhost:3000/settings | Shifts & Employee Type Config |
