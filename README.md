# Yahoo Keepers League

Private 10-team Yahoo fantasy football league site — public homepage + member dashboard.

Design inspired by [Fake Football 2k26](https://fakefootball.thebaseballdad.com/).

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** + shadcn-style UI primitives
- **Supabase** (Auth, Postgres, Realtime for trash talk)
- Deploy-ready for **Vercel**

## Features

### Public homepage
- League name + short rules summary (from `league_settings`)
- Championship trophy section
- Owners grid: name, all-time W-L, prize money, badges
- Snake draft order (`owners.draft_slot`)
- Live Supabase data with automatic fallback to placeholders if tables are empty

### Private area (login required)
- Dashboard hub with live summary stats
- Weekly matchups & standings
- Dues / prize money tracker
- Polls (vote + results)
- Trash talk wall (insert + Realtime refresh)
- **Admin console** (requires `owners.is_admin = true`):
  - Owners (W-L, badges, draft, link/unlink auth users)
  - League settings
  - Matchups & standings
  - Dues paid/unpaid
  - Poll create / open / close (+ optional email to owners)
  - Announcements (+ optional email to owners)
  - Sleeper sync + weekly results email
  - Trash talk moderation

### Auth
- Email/password via Supabase Auth
- **No public sign-up** — create users in the Supabase dashboard only
- Middleware protects `/dashboard`, `/matchups`, `/dues`, `/polls`, `/trash-talk`, `/admin`

---

## Quick start

```bash
cd my-fantasy-league
npm install
cp .env.local.example .env.local
# Add Supabase URL + anon key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The homepage works **without** Supabase using placeholders in  
`src/lib/data/placeholder.ts`. With env keys + schema applied, it reads live data.

---

## Supabase setup

### 1. Create project & run schema

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste and run `supabase/schema.sql`.
3. Confirm tables exist: `owners`, `league_settings`, `standings`, `matchups`, `due_payments`, `polls`, `poll_votes`, `trash_talk_posts`.

### 2. Environment variables

In `.env.local` (and Vercel project settings for deploy):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Email (Resend) — optional until you send polls / weekly results
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=Upper Deckcers <onboarding@resend.dev>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Find Supabase keys under **Project Settings → API**.  
Resend: [resend.com](https://resend.com) → API Keys. Use `onboarding@resend.dev` for testing; verify your domain for production.

Also run `supabase/migrate-email.sql` for announcements + `owners.email_opt_out`.

### 3. Disable public sign-ups

1. **Authentication → Providers → Email**
2. Keep email/password enabled
3. Turn **off** public sign-ups / self-registration  
   (or use the Auth settings that prevent open registration — only admins create users)

---

## Create the first admin user (important)

Accounts are **invite-only**. There is no sign-up page.

### Step A — Create the Auth user

1. Supabase Dashboard → **Authentication → Users**
2. Click **Add user** → **Create new user**
3. Enter email + password (share the password securely with the commissioner)
4. **Copy the user UUID** (shown on the user detail page)

### Step B — Link Auth user → owner row

1. **Table Editor → `owners`**
2. Open the franchise row that should own this login (e.g. Casey / commissioner)
3. Set:
   - `user_id` = the UUID from Step A
   - `is_admin` = `true` (for commissioner tools / write policies)
   - optional: `email` = same email for reference
4. Save

### Step C — Sign in on the site

1. Restart the Next.js dev server so env vars are loaded:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000/login](http://localhost:3000/login)
3. Sign in with the email/password from Step A
4. You should land on `/dashboard`

### Step D — Link the rest of the league

Repeat Step A + B for each owner (set `is_admin = false` for non-commissioners).

Until `owners.user_id` is set, a user can log in but **cannot**:

- Post trash talk
- Vote in polls  

The dashboard shows a banner: *“Your account is not linked to an owner yet.”*

### Verify with SQL (optional)

```sql
-- Who is linked?
select display_name, email, is_admin, user_id
from public.owners
order by sort_order;

-- Link by email if you already set owners.email
-- (replace the auth uuid)
-- update public.owners
-- set user_id = 'AUTH-USER-UUID-HERE', is_admin = true
-- where display_name = 'Casey';
```

---

## What each page reads/writes

| Page | Tables | Notes |
|------|--------|--------|
| Homepage | `league_settings`, `owners` | Public read (RLS) |
| Matchups | `matchups`, `standings`, `owners` | Empty matchups OK; standings fall back to all-time W-L |
| Dues | `due_payments`, `owners`, `league_settings` | Missing dues rows show as unpaid |
| Polls | `polls`, `poll_votes` | Vote requires linked owner |
| Trash talk | `trash_talk_posts` | Post requires linked owner; Realtime on INSERT |
| Admin | `owners` | View roster; writes via Supabase until in-app forms ship |

### Seed sample data (optional)

In **SQL Editor**, after owners exist:

```sql
-- Example poll
insert into public.polls (title, description, options, is_active)
values (
  'Draft day snacks?',
  'Commissioner needs a headcount.',
  array['Beer', 'Pizza', 'Both'],
  true
);

-- Example dues for current season (adjust owner ids)
insert into public.due_payments (owner_id, season, amount_due, amount_paid, paid_at)
select id, 2026, 250, 0, null from public.owners;
```

---

## Project structure

```
src/
  app/
    page.tsx                 # Public homepage (live Supabase)
    login/                   # Sign in
    auth/callback/           # OAuth / code exchange
    auth/signout/            # Sign out
    (dashboard)/             # Protected shell
      dashboard/
      matchups/
      dues/
      polls/
      trash-talk/
      admin/
  components/
    home/                    # Hero, trophy, owners, draft
    layout/                  # Header, footer
    dashboard/               # Nav, polls, trash talk
    auth/                    # Login + sign out
    ui/
  lib/
    data/league.ts           # Public homepage queries
    data/dashboard.ts        # Private page queries
    data/mappers.ts          # DB row → TypeScript types
    data/placeholder.ts      # Offline fallback
    auth/session.ts          # getAuthUser / getCurrentOwner
    actions/                 # Server actions (vote, post)
    supabase/                # Browser + server + middleware clients
supabase/
  schema.sql                 # Full DB + RLS + seed
```

## Customize

| What | Where |
|------|--------|
| League name / rules copy | Supabase `league_settings` (or placeholder file) |
| Owner names / W-L / badges | Supabase `owners` |
| Colors & stripes | `src/app/globals.css` |
| Logo / trophy image | `public/` + hero/trophy components |

## Production deployment (Vercel)

### Required environment variables

| Name | Required | Notes |
|------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase **anon / public** key (safe for browser; RLS enforces access) |

Optional (not used by the app today):

| Name | Required | Notes |
|------|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | No | **Never** set as `NEXT_PUBLIC_*`. Only for offline admin scripts. |

Get values from: **Supabase → Project Settings → API**.

> `.env.local` is gitignored. Never commit real keys. Use `.env.local.example` / `.env.example` as templates only.

### Deploy steps

1. **Push the repo** to GitHub/GitLab/Bitbucket (without `.env.local`).
2. **Import** the project in [Vercel](https://vercel.com) → New Project → select the repo.
3. **Framework preset:** Next.js (auto-detected).  
   **Build command:** `npm run build`  
   **Output:** default (no change needed).  
   **Node:** 20+ recommended.
4. **Environment variables** (Project → Settings → Environment Variables):
   - Add `NEXT_PUBLIC_SUPABASE_URL` → Production **and** Preview
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Production **and** Preview
5. **Deploy.** After the first deploy, open the production URL and confirm:
   - Homepage loads owners from Supabase
   - `/login` works
   - Protected routes redirect to login when signed out
6. **Supabase Auth URL config** (so cookies / redirects work on your domain):
   - Supabase → **Authentication → URL Configuration**
   - **Site URL:** `https://your-app.vercel.app` (or custom domain)
   - **Redirect URLs:** include `https://your-app.vercel.app/**` and local `http://localhost:3000/**` if you still develop locally
7. **Custom domain (optional):** Vercel → Domains → add DNS, then update Supabase Site URL to match.

### Local production smoke test

```bash
cp .env.local.example .env.local   # if needed
# fill real keys in .env.local
npm run build
npm run start
# open http://localhost:3000
```

### Security checklist

- [ ] Public sign-up disabled in Supabase Auth
- [ ] Only the **anon** key is in Vercel (`NEXT_PUBLIC_*`); service role is not
- [ ] `.env.local` is not committed (`git status` clean of secrets)
- [ ] First admin linked via `owners.user_id` + `is_admin = true`
- [ ] RLS policies applied (`supabase/schema.sql` run on the project)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (standard Next.js build for Vercel) |
| `npm run start` | Serve production build locally |
| `npm run lint` | ESLint |

## Admin console

After linking an admin user (see above), open **/admin**:

| Path | What you manage |
|------|------------------|
| `/admin` | Overview + shortcuts |
| `/admin/owners` | Create/edit owners, badges, draft, user_id, is_admin |
| `/admin/settings` | League name, rules, season, trophy text, dues amount |
| `/admin/matchups` | Weekly matchups, scores, season standings |
| `/admin/dues` | Per-owner paid amounts + bulk mark paid |
| `/admin/polls` | Create polls, open/close, view results |
| `/admin/trash-talk` | Delete posts |

All writes go through **server actions** + Supabase RLS (`is_admin()`).

## Next iterations

- [x] In-app admin forms (owners, settings, matchups, dues, polls, moderation)
- [ ] Avatar uploads (Supabase Storage)
- [ ] Yahoo / ESPN import helpers
