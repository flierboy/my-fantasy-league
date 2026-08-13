-- Seed draft years 2023/2024/2025 + full 2025 ESPN picks
-- Safe to re-run (upsert years, replace 2025 picks)

insert into public.draft_years (season_year, source, notes, sort_order)
values
  (2023, 'yahoo', '2023 Yahoo draft — pick data not yet provided', 0),
  (2024, 'yahoo', '2024 Yahoo draft — pick data not yet provided', 0),
  (2025, 'espn', '2025 ESPN draft (16 rounds)', 0)
on conflict (season_year) do update set
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();

-- Replace 2025 picks
delete from public.draft_picks where season_year = 2025;

insert into public.draft_picks (
  draft_year_id, season_year, round, pick_in_round, overall_pick,
  player_name, position, nfl_team, fantasy_owner_name, owner_id
)
select
  dy.id,
  v.season_year,
  v.round,
  v.pick_in_round,
  v.overall_pick,
  v.player_name,
  v.position,
  v.nfl_team,
  v.fantasy_owner_name,
  (
    select o.id from public.owners o
    where
      lower(regexp_replace(coalesce(o.display_name,''), '[^a-z0-9]+', '', 'g'))
        = lower(regexp_replace(v.fantasy_owner_name, '[^a-z0-9]+', '', 'g'))
      or lower(regexp_replace(coalesce(o.team_name,''), '[^a-z0-9]+', '', 'g'))
        = lower(regexp_replace(v.fantasy_owner_name, '[^a-z0-9]+', '', 'g'))
      or (
        case lower(regexp_replace(v.fantasy_owner_name, '[^a-z0-9]+', '', 'g'))
          when 'olewhit' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('whitstits')
          when 'thickylen' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('len')
          when 'yomama' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('yomama')
          when 'hamie' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('hambone')
          when 'teamhamie' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('hambone')
          when 'reesee' then lower(o.display_name) like '%reese%' or lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) like '%reese%'
          when 'maisonsmagnificentteam' then lower(o.display_name) like '%mase%'
          when 'zackshonorableteam' then lower(o.display_name) like '%zack%'
          when 'davidsdangerousteam' then lower(o.display_name) like '%david%' or lower(o.display_name) like '%lloyd%'
          when 'bennybackshots' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('bennybackshots')
          when 'bigbrownstain' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('bigbrownstain')
          when 'leonidaslen' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('len')
          when 'lensdaddy' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('lensdaddy')
          when 'playofflockmase' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('playofflockmase')
          when 'whitstits' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('whitstits')
          when 'biglloyd' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('biglloyd')
          when 'starvinmarvin' then lower(regexp_replace(o.display_name, '[^a-z0-9]+', '', 'g')) in ('starvinmarvin')
          else false
        end
      )
    order by o.sort_order
    limit 1
  )
from public.draft_years dy
cross join (values
  (2025, 1, 1, 1, 'Saquon Barkley', 'RB', 'Phi', 'OleWhit'),
  (2025, 1, 2, 2, 'Ja''Marr Chase', 'WR', 'Cin', 'David''s Dangerous Team'),
  (2025, 1, 3, 3, 'Bijan Robinson', 'RB', 'Atl', 'BIGBROWNSTAIN'),
  (2025, 1, 4, 4, 'Christian McCaffrey', 'RB', 'SF', 'THICKY LEN'),
  (2025, 1, 5, 5, 'Jahmyr Gibbs', 'RB', 'Det', 'Yo mama'),
  (2025, 1, 6, 6, 'CeeDee Lamb', 'WR', 'Dal', 'Reesee'),
  (2025, 1, 7, 7, 'Justin Jefferson', 'WR', 'Min', 'Maison''s Magnificent Team'),
  (2025, 1, 8, 8, 'Malik Nabers', 'WR', 'NYG', 'HAMIE'),
  (2025, 1, 9, 9, 'Amon-Ra St. Brown', 'WR', 'Det', 'Zack''s Honorable Team'),
  (2025, 1, 10, 10, 'Puka Nacua', 'WR', 'LAR', 'Benny Backshots'),
  (2025, 2, 1, 11, 'Ashton Jeanty', 'RB', 'LV', 'Benny Backshots'),
  (2025, 2, 2, 12, 'Nico Collins', 'WR', 'Hou', 'Zack''s Honorable Team'),
  (2025, 2, 3, 13, 'Derrick Henry', 'RB', 'Bal', 'HAMIE'),
  (2025, 2, 4, 14, 'Brian Thomas Jr.', 'WR', 'Jax', 'Maison''s Magnificent Team'),
  (2025, 2, 5, 15, 'Jonathan Taylor', 'RB', 'Ind', 'Reesee'),
  (2025, 2, 6, 16, 'Bucky Irving', 'RB', 'TB', 'Yo mama'),
  (2025, 2, 7, 17, 'Josh Jacobs', 'RB', 'GB', 'THICKY LEN'),
  (2025, 2, 8, 18, 'Tyreek Hill', 'WR', 'FA', 'BIGBROWNSTAIN'),
  (2025, 2, 9, 19, 'Brock Bowers', 'TE', 'LV', 'David''s Dangerous Team'),
  (2025, 2, 10, 20, 'A.J. Brown', 'WR', 'Phi', 'OleWhit'),
  (2025, 3, 1, 21, 'Ladd McConkey', 'WR', 'LAC', 'OleWhit'),
  (2025, 3, 2, 22, 'Chase Brown', 'RB', 'Cin', 'David''s Dangerous Team'),
  (2025, 3, 3, 23, 'Alvin Kamara', 'RB', 'NO', 'BIGBROWNSTAIN'),
  (2025, 3, 4, 24, 'Trey McBride', 'TE', 'Ari', 'THICKY LEN'),
  (2025, 3, 5, 25, 'Drake London', 'WR', 'Atl', 'Yo mama'),
  (2025, 3, 6, 26, 'Tee Higgins', 'WR', 'Cin', 'Reesee'),
  (2025, 3, 7, 27, 'De''Von Achane', 'RB', 'Mia', 'Maison''s Magnificent Team'),
  (2025, 3, 8, 28, 'Lamar Jackson', 'QB', 'Bal', 'HAMIE'),
  (2025, 3, 9, 29, 'Jaxon Smith-Njigba', 'WR', 'Sea', 'Zack''s Honorable Team'),
  (2025, 3, 10, 30, 'Josh Allen', 'QB', 'Buf', 'Benny Backshots'),
  (2025, 4, 1, 31, 'Kyren Williams', 'RB', 'LAR', 'Benny Backshots'),
  (2025, 4, 2, 32, 'Omarion Hampton', 'RB', 'LAC', 'Zack''s Honorable Team'),
  (2025, 4, 3, 33, 'Garrett Wilson', 'WR', 'NYJ', 'HAMIE'),
  (2025, 4, 4, 34, 'George Kittle', 'TE', 'SF', 'Maison''s Magnificent Team'),
  (2025, 4, 5, 35, 'T.J. Hockenson', 'TE', 'Min', 'Reesee'),
  (2025, 4, 6, 36, 'Joe Burrow', 'QB', 'Cin', 'Yo mama'),
  (2025, 4, 7, 37, 'Jayden Daniels', 'QB', 'Wsh', 'THICKY LEN'),
  (2025, 4, 8, 38, 'Terry McLaurin', 'WR', 'Wsh', 'BIGBROWNSTAIN'),
  (2025, 4, 9, 39, 'James Cook III', 'RB', 'Buf', 'David''s Dangerous Team'),
  (2025, 4, 10, 40, 'Marvin Harrison Jr.', 'WR', 'Ari', 'OleWhit'),
  (2025, 5, 1, 41, 'Sam LaPorta', 'TE', 'Det', 'OleWhit'),
  (2025, 5, 2, 42, 'Kenneth Walker III', 'RB', 'Sea', 'David''s Dangerous Team'),
  (2025, 5, 3, 43, 'Travis Kelce', 'TE', 'KC', 'BIGBROWNSTAIN'),
  (2025, 5, 4, 44, 'DK Metcalf', 'WR', 'Pit', 'THICKY LEN'),
  (2025, 5, 5, 45, 'Davante Adams', 'WR', 'LAR', 'Yo mama'),
  (2025, 5, 6, 46, 'Jalen Hurts', 'QB', 'Phi', 'Reesee'),
  (2025, 5, 7, 47, 'Breece Hall', 'RB', 'NYJ', 'Maison''s Magnificent Team'),
  (2025, 5, 8, 48, 'James Conner', 'RB', 'Ari', 'HAMIE'),
  (2025, 5, 9, 49, 'Mike Evans', 'WR', 'TB', 'Zack''s Honorable Team'),
  (2025, 5, 10, 50, 'Chuba Hubbard', 'RB', 'Car', 'Benny Backshots'),
  (2025, 6, 1, 51, 'Xavier Worthy', 'WR', 'KC', 'Benny Backshots'),
  (2025, 6, 2, 52, 'D''Andre Swift', 'RB', 'Chi', 'Zack''s Honorable Team'),
  (2025, 6, 3, 53, 'Courtland Sutton', 'WR', 'Den', 'HAMIE'),
  (2025, 6, 4, 54, 'DJ Moore', 'WR', 'Chi', 'Maison''s Magnificent Team'),
  (2025, 6, 5, 55, 'TreVeyon Henderson', 'RB', 'NE', 'Reesee'),
  (2025, 6, 6, 56, 'Zay Flowers', 'WR', 'Bal', 'Yo mama'),
  (2025, 6, 7, 57, 'Calvin Ridley', 'WR', 'Ten', 'THICKY LEN'),
  (2025, 6, 8, 58, 'Jameson Williams', 'WR', 'Det', 'BIGBROWNSTAIN'),
  (2025, 6, 9, 59, 'Tetairoa McMillan', 'WR', 'Car', 'David''s Dangerous Team'),
  (2025, 6, 10, 60, 'Tyrone Tracy Jr.', 'RB', 'NYG', 'OleWhit'),
  (2025, 7, 1, 61, 'Patrick Mahomes', 'QB', 'KC', 'OleWhit'),
  (2025, 7, 2, 62, 'Rashee Rice', 'WR', 'KC', 'David''s Dangerous Team'),
  (2025, 7, 3, 63, 'Baker Mayfield', 'QB', 'TB', 'BIGBROWNSTAIN'),
  (2025, 7, 4, 64, 'Isiah Pacheco', 'RB', 'KC', 'THICKY LEN'),
  (2025, 7, 5, 65, 'RJ Harvey', 'RB', 'Den', 'Yo mama'),
  (2025, 7, 6, 66, 'Jaylen Waddle', 'WR', 'Mia', 'Reesee'),
  (2025, 7, 7, 67, 'Bo Nix', 'QB', 'Den', 'Maison''s Magnificent Team'),
  (2025, 7, 8, 68, 'George Pickens', 'WR', 'Dal', 'HAMIE'),
  (2025, 7, 9, 69, 'Tony Pollard', 'RB', 'Ten', 'Zack''s Honorable Team'),
  (2025, 7, 10, 70, 'DeVonta Smith', 'WR', 'Phi', 'Benny Backshots'),
  (2025, 8, 1, 71, 'Jerry Jeudy', 'WR', 'Cle', 'Benny Backshots'),
  (2025, 8, 2, 72, 'David Njoku', 'TE', 'Cle', 'Zack''s Honorable Team'),
  (2025, 8, 3, 73, 'David Montgomery', 'RB', 'Hou', 'HAMIE'),
  (2025, 8, 4, 74, 'Aaron Jones Sr.', 'RB', 'Min', 'Maison''s Magnificent Team'),
  (2025, 8, 5, 75, 'J.K. Dobbins', 'RB', 'Den', 'Reesee'),
  (2025, 8, 6, 76, 'Jacory Croskey-Merritt', 'RB', 'Wsh', 'Yo mama'),
  (2025, 8, 7, 77, 'Chris Olave', 'WR', 'NO', 'THICKY LEN'),
  (2025, 8, 8, 78, 'Travis Hunter', 'WR', 'Jax', 'BIGBROWNSTAIN'),
  (2025, 8, 9, 79, 'Matthew Golden', 'WR', 'GB', 'David''s Dangerous Team'),
  (2025, 8, 10, 80, 'Rome Odunze', 'WR', 'Chi', 'OleWhit'),
  (2025, 9, 1, 81, 'Keon Coleman', 'WR', 'Buf', 'OleWhit'),
  (2025, 9, 2, 82, 'Jakobi Meyers', 'WR', 'Jax', 'David''s Dangerous Team'),
  (2025, 9, 3, 83, 'Jordan Mason', 'RB', 'Min', 'BIGBROWNSTAIN'),
  (2025, 9, 4, 84, 'Stefon Diggs', 'WR', 'NE', 'THICKY LEN'),
  (2025, 9, 5, 85, 'Emeka Egbuka', 'WR', 'TB', 'Yo mama'),
  (2025, 9, 6, 86, 'Michael Pittman Jr.', 'WR', 'Ind', 'Reesee'),
  (2025, 9, 7, 87, 'Kaleb Johnson', 'RB', 'Pit', 'Maison''s Magnificent Team'),
  (2025, 9, 8, 88, 'Mark Andrews', 'TE', 'Bal', 'HAMIE'),
  (2025, 9, 9, 89, 'Evan Engram', 'TE', 'Den', 'Zack''s Honorable Team'),
  (2025, 9, 10, 90, 'Rhamondre Stevenson', 'RB', 'NE', 'Benny Backshots'),
  (2025, 10, 1, 91, 'Tyler Warren', 'TE', 'Ind', 'Benny Backshots'),
  (2025, 10, 2, 92, 'Travis Etienne Jr.', 'RB', 'Jax', 'Zack''s Honorable Team'),
  (2025, 10, 3, 93, 'Jaylen Warren', 'RB', 'Pit', 'HAMIE'),
  (2025, 10, 4, 94, 'Ricky Pearsall', 'WR', 'SF', 'Maison''s Magnificent Team'),
  (2025, 10, 5, 95, 'Cooper Kupp', 'WR', 'Sea', 'Reesee'),
  (2025, 10, 6, 96, 'Kyler Murray', 'QB', 'Ari', 'Yo mama'),
  (2025, 10, 7, 97, 'Javonte Williams', 'RB', 'Dal', 'THICKY LEN'),
  (2025, 10, 8, 98, 'Zach Charbonnet', 'RB', 'Sea', 'BIGBROWNSTAIN'),
  (2025, 10, 9, 99, 'Jordan Addison', 'WR', 'Min', 'David''s Dangerous Team'),
  (2025, 10, 10, 100, 'Cam Skattebo', 'RB', 'NYG', 'OleWhit'),
  (2025, 11, 1, 101, 'Deebo Samuel', 'WR', 'Wsh', 'OleWhit'),
  (2025, 11, 2, 102, 'Tank Bigsby', 'RB', 'Phi', 'David''s Dangerous Team'),
  (2025, 11, 3, 103, 'Jerome Ford', 'RB', 'Cle', 'BIGBROWNSTAIN'),
  (2025, 11, 4, 104, 'Rachaad White', 'RB', 'TB', 'THICKY LEN'),
  (2025, 11, 5, 105, 'Tucker Kraft', 'TE', 'GB', 'Yo mama'),
  (2025, 11, 6, 106, 'Brock Purdy', 'QB', 'SF', 'Reesee'),
  (2025, 11, 7, 107, 'Chris Godwin Jr.', 'WR', 'TB', 'Maison''s Magnificent Team'),
  (2025, 11, 8, 108, 'Khalil Shakir', 'WR', 'Buf', 'HAMIE'),
  (2025, 11, 9, 109, 'Dak Prescott', 'QB', 'Dal', 'Zack''s Honorable Team'),
  (2025, 11, 10, 110, 'Jauan Jennings', 'WR', 'SF', 'Benny Backshots'),
  (2025, 12, 1, 111, 'Austin Ekeler', 'RB', 'Wsh', 'Benny Backshots'),
  (2025, 12, 2, 112, 'Joe Mixon', 'RB', 'Hou', 'Zack''s Honorable Team'),
  (2025, 12, 3, 113, 'Josh Downs', 'WR', 'Ind', 'HAMIE'),
  (2025, 12, 4, 114, 'Brandon Aubrey', 'K', 'Dal', 'Maison''s Magnificent Team'),
  (2025, 12, 5, 115, 'Jake Bates', 'K', 'Det', 'Reesee'),
  (2025, 12, 6, 116, 'Broncos D/ST', 'D/ST', 'Den', 'Yo mama'),
  (2025, 12, 7, 117, 'Colston Loveland', 'TE', 'Chi', 'THICKY LEN'),
  (2025, 12, 8, 118, 'Rashid Shaheed', 'WR', 'Sea', 'BIGBROWNSTAIN'),
  (2025, 12, 9, 119, 'Justin Fields', 'QB', 'NYJ', 'David''s Dangerous Team'),
  (2025, 12, 10, 120, 'Xavier Legette', 'WR', 'Car', 'OleWhit'),
  (2025, 13, 1, 121, 'Justin Herbert', 'QB', 'LAC', 'OleWhit'),
  (2025, 13, 2, 122, 'Jordan Love', 'QB', 'GB', 'David''s Dangerous Team'),
  (2025, 13, 3, 123, 'Nick Chubb', 'RB', 'Hou', 'BIGBROWNSTAIN'),
  (2025, 13, 4, 124, 'Steelers D/ST', 'D/ST', 'Pit', 'THICKY LEN'),
  (2025, 13, 5, 125, 'Dylan Sampson', 'RB', 'Cle', 'Yo mama'),
  (2025, 13, 6, 126, 'Ravens D/ST', 'D/ST', 'Bal', 'Reesee'),
  (2025, 13, 7, 127, 'Eagles D/ST', 'D/ST', 'Phi', 'Maison''s Magnificent Team'),
  (2025, 13, 8, 128, 'Darnell Mooney', 'WR', 'Atl', 'HAMIE'),
  (2025, 13, 9, 129, 'Brandon Aiyuk', 'WR', 'SF', 'Zack''s Honorable Team'),
  (2025, 13, 10, 130, 'Texans D/ST', 'D/ST', 'Hou', 'Benny Backshots'),
  (2025, 14, 1, 131, 'Dalton Kincaid', 'TE', 'Buf', 'Benny Backshots'),
  (2025, 14, 2, 132, 'Tyler Bass', 'K', 'Buf', 'Zack''s Honorable Team'),
  (2025, 14, 3, 133, 'Drake Maye', 'QB', 'NE', 'HAMIE'),
  (2025, 14, 4, 134, 'Braelon Allen', 'RB', 'NYJ', 'Maison''s Magnificent Team'),
  (2025, 14, 5, 135, 'Keenan Allen', 'WR', 'LAC', 'Reesee'),
  (2025, 14, 6, 136, 'Jayden Reed', 'WR', 'GB', 'Yo mama'),
  (2025, 14, 7, 137, 'Trey Benson', 'RB', 'Ari', 'THICKY LEN'),
  (2025, 14, 8, 138, 'Lions D/ST', 'D/ST', 'Det', 'BIGBROWNSTAIN'),
  (2025, 14, 9, 139, 'Vikings D/ST', 'D/ST', 'Min', 'David''s Dangerous Team'),
  (2025, 14, 10, 140, 'Najee Harris', 'RB', 'LAC', 'OleWhit'),
  (2025, 15, 1, 141, 'Patriots D/ST', 'D/ST', 'NE', 'OleWhit'),
  (2025, 15, 2, 142, 'Chase McLaughlin', 'K', 'TB', 'David''s Dangerous Team'),
  (2025, 15, 3, 143, 'Quinshon Judkins', 'RB', 'Cle', 'BIGBROWNSTAIN'),
  (2025, 15, 4, 144, 'Wan''Dale Robinson', 'WR', 'NYG', 'THICKY LEN'),
  (2025, 15, 5, 145, 'Packers D/ST', 'D/ST', 'GB', 'Yo mama'),
  (2025, 15, 6, 146, 'Zach Ertz', 'TE', 'Wsh', 'Reesee'),
  (2025, 15, 7, 147, 'Bhayshul Tuten', 'RB', 'Jax', 'Maison''s Magnificent Team'),
  (2025, 15, 8, 148, 'Cameron Dicker', 'K', 'LAC', 'HAMIE'),
  (2025, 15, 9, 149, 'Caleb Williams', 'QB', 'Chi', 'Zack''s Honorable Team'),
  (2025, 15, 10, 150, 'Jake Elliott', 'K', 'Phi', 'Benny Backshots'),
  (2025, 16, 1, 151, 'J.J. McCarthy', 'QB', 'Min', 'Benny Backshots'),
  (2025, 16, 2, 152, 'Seahawks D/ST', 'D/ST', 'Sea', 'Zack''s Honorable Team'),
  (2025, 16, 3, 153, 'Colts D/ST', 'D/ST', 'Ind', 'HAMIE'),
  (2025, 16, 4, 154, 'Romeo Doubs', 'WR', 'GB', 'Maison''s Magnificent Team'),
  (2025, 16, 5, 155, 'Rashod Bateman', 'WR', 'Bal', 'Reesee'),
  (2025, 16, 6, 156, 'Joshua Karty', 'K', 'Ari', 'Yo mama'),
  (2025, 16, 7, 157, 'Evan McPherson', 'K', 'Cin', 'THICKY LEN'),
  (2025, 16, 8, 158, 'Chris Boswell', 'K', 'Pit', 'BIGBROWNSTAIN'),
  (2025, 16, 9, 159, 'Kyle Pitts Sr.', 'TE', 'Atl', 'David''s Dangerous Team'),
  (2025, 16, 10, 160, 'Harrison Butker', 'K', 'KC', 'OleWhit')
) as v(season_year, round, pick_in_round, overall_pick, player_name, position, nfl_team, fantasy_owner_name)
where dy.season_year = 2025;

-- Summary
select dy.season_year, dy.source, count(dp.id) as picks,
  count(dp.owner_id) as matched_owners
from public.draft_years dy
left join public.draft_picks dp on dp.draft_year_id = dy.id
group by dy.season_year, dy.source
order by dy.season_year;