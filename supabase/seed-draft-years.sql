-- Seed the three historical draft years (no picks — import picks via Admin → Drafts CSV)
-- Safe to re-run

insert into public.draft_years (season_year, source, notes, sort_order)
values
  (2023, 'yahoo', '2023 Yahoo draft — import picks via Admin → Drafts', 0),
  (2024, 'yahoo', '2024 Yahoo draft — import picks via Admin → Drafts', 0),
  (2025, 'espn', '2025 ESPN draft (16 rounds) — import picks via Admin → Drafts', 0)
on conflict (season_year) do update set
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();

select season_year, source, notes from public.draft_years order by season_year;
