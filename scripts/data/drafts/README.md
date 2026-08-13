# Draft board data

## Status

| Year | Source | File | Picks |
|------|--------|------|------:|
| 2025 | ESPN | `2025-espn.json` / `2025-espn.csv` | 160 |
| 2024 | Yahoo | *(not provided yet)* | 0 |
| 2023 | Yahoo | *(not provided yet)* | 0 |

## Load into Supabase

1. Run `supabase/migrate-draft-history.sql`
2. Run `supabase/seed-draft-history.sql` (years 2023–2025 + all 2025 picks)

Or use **Admin → Drafts** CSV import for a year.

## CSV format

```
round,pick_in_round,overall_pick,player_name,position,nfl_team,fantasy_owner_name
1,1,1,Saquon Barkley,RB,Phi,OleWhit
```
