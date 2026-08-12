#!/usr/bin/env node
/**
 * ONE-TIME SEED: Upper Deckcers owners + league name
 * -----------------------------------------------------------------
 * DESTRUCTIVE: deletes all owners (and related matchups/standings/
 * dues/polls/trash talk), then inserts the 10 Yahoo teams.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 * Never commit the service role key. Never expose it as NEXT_PUBLIC_*.
 *
 * Usage:
 *   1. Add to .env.local:
 *        SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *   2. From project root:
 *        npm run seed:upper-deckers
 *
 * Prefer the SQL Editor method if you don't want to use the service role:
 *   supabase/seed-upper-deckers.sql
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local manually (no dotenv dependency)
function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const TEAMS = [
  "Len",
  "BIGBROWNSTAIN",
  "Big Lloyd",
  "WhitsTits",
  "HAM BONE",
  "Playoff lock mase",
  "yo mama",
  "Lens daddy",
  "Starvin Marvin",
  "Benny Backshots",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error(`
Missing env vars.

Add to .env.local:
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

Get the service role key from:
  Supabase Dashboard → Project Settings → API → service_role (secret)

Then run:
  npm run seed:upper-deckers

Or skip the key and run the SQL file in the Supabase SQL Editor:
  supabase/seed-upper-deckers.sql
`);
  process.exit(1);
}

if (serviceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY must not be the anon key.");
  process.exit(1);
}

const confirm = process.argv.includes("--confirm");
if (!confirm) {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  ONE-TIME SEED — Upper Deckcers (DESTRUCTIVE)            ║
╠══════════════════════════════════════════════════════════╣
║  This will:                                              ║
║   • Set league name to "Upper Deckcers"                    ║
║   • DELETE all owners (+ matchups, dues, polls, etc.)    ║
║   • INSERT 10 teams with 0-0-0, $0, no badges            ║
║   • draft_slot 1–10, is_admin = false                    ║
║                                                          ║
║  Re-run with:                                            ║
║    npm run seed:upper-deckers -- --confirm               ║
╚══════════════════════════════════════════════════════════╝
`);
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function deleteAll(table) {
  // Service role bypasses RLS. Filter required by PostgREST; match all non-null ids.
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  console.log("Seeding Upper Deckcers…\n");

  // 1) League settings
  const { error: settingsErr } = await supabase.from("league_settings").upsert(
    {
      id: 1,
      name: "Upper Deckcers",
      tagline: "Fantasy Football League",
      rules_summary: "Draft: Sunday, August 30, 2026 · 3:45 PM EDT",
      season_year: 2026,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (settingsErr) throw new Error(`league_settings: ${settingsErr.message}`);
  console.log('✓ league_settings.name = "Upper Deckcers"');

  // 2) Clear dependent tables then owners
  const tables = [
    "trash_talk_posts",
    "poll_votes",
    "polls",
    "due_payments",
    "matchups",
    "standings",
    "owners",
  ];
  for (const t of tables) {
    await deleteAll(t);
    console.log(`✓ cleared ${t}`);
  }

  // 3) Insert owners
  const rows = TEAMS.map((name, i) => ({
    display_name: name,
    team_name: name,
    wins: 0,
    losses: 0,
    ties: 0,
    prize_money: 0,
    badges: [],
    is_admin: false,
    draft_slot: i + 1,
    sort_order: i + 1,
    user_id: null,
    avatar_url: null,
    email: null,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("owners")
    .insert(rows)
    .select("draft_slot, display_name, wins, losses, prize_money, is_admin");

  if (insertErr) throw new Error(`owners insert: ${insertErr.message}`);

  console.log("\n✓ Inserted owners:\n");
  console.table(
    (inserted ?? []).sort((a, b) => a.draft_slot - b.draft_slot)
  );
  console.log("\nDone. Refresh the homepage to see Upper Deckcers.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
