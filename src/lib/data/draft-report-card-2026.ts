/**
 * UFD 2026 Draft Report Card — fixed copy (do not invent picks).
 * Owner labels are site display names.
 */

export type DraftReportCardOwner = {
  name: string;
  grade: string;
  picks: string;
  best: string;
  reach: string;
  value?: string;
  gap?: string;
  risk?: string;
  hole?: string;
};

export type DraftReportCardAward = {
  label: string;
  detail: string;
};

export const DRAFT_REPORT_CARD_2026 = {
  title: "UFD 2026 Draft Report Card",
  subtitle: "Half-PPR · 1 QB · 10 teams · Sleeper board Aug 30, 2026",
  intro: [
    "Grades are preseason value in this room, not official ESPN.",
    "Round 1 went RB-heavy (Gibbs, Bijan, CMC, Cook, JT, Saquon). Ja'Marr Chase slid to 6. First QB was Josh Allen at 30. Kickers and DST waited until the teens — correct.",
  ],
  owners: [
    {
      name: "Chad",
      grade: "A-",
      picks:
        "1.01 Gibbs, 2.10 Nico Collins, 3.01 Javonte Williams, 4.10 Ladd McConkey, 5.01 Garrett Wilson, 8.10 Marvin Harrison Jr., 9.01 Justin Herbert.",
      best: "Nico at 20.",
      reach:
        "Javonte at 21 with Bowers / AJ Brown / Kyren still on the board.",
      value: "Ladd + Wilson back-to-back; MHJ at 80 is a real dart.",
    },
    {
      name: "Len",
      grade: "B+",
      picks:
        "1.02 Bijan, 2.09 Kyren Williams, 3.02 Bucky Irving, 4.09 Tetairoa McMillan, 5.02 Zay Flowers.",
      best: "Bucky at 22. Best RB room in the league.",
      reach: "none early.",
      gap: "no WR until pick 39. Hero-RB — you'll live on waivers for a WR2.",
    },
    {
      name: "Sco",
      grade: "B+",
      picks:
        "1.03 CMC, 2.08 Kenneth Walker, 3.03 Brock Bowers, 4.08 Drake London, 7.03 Joe Burrow.",
      best: "Bowers at 23 (TE crown). London at 38. Burrow at 63.",
      reach: "CMC at 3 is the volatility pick of round 1.",
      risk: "KW3 in a new KC committee; Brooks in the 9th is a flyer.",
    },
    {
      name: "Whit",
      grade: "B+",
      picks:
        "1.04 Puka Nacua, 2.07 Omarion Hampton, 3.04 A.J. Brown, 4.07 Cam Skattebo, 5.04 Colston Loveland, 7.04 Jayden Daniels.",
      best: "Puka while the room chased RBs. Hampton before the other rookie RBs.",
      reach: "Skattebo 37 and Loveland 44 stacked youth.",
      value: "Daniels at 64 is the right QB range.",
    },
    {
      name: "Dan",
      grade: "B",
      picks:
        "1.05 James Cook, 2.06 Ashton Jeanty, 3.05 Trey McBride, 5.05 Josh Jacobs, 6.06 Davante Adams, 13.05 Patrick Mahomes.",
      best: "McBride at 25. Jacobs at 45. Mahomes in the 13th as QB1.",
      reach:
        "Jeanty at 16 over Jefferson / Nico / Kyren. Cook at 5 was a hair early with Chase still up.",
    },
    {
      name: "Mase",
      grade: "A",
      picks:
        "1.06 Ja'Marr Chase, 2.05 Justin Jefferson, 3.06 Jeremiyah Love, 4.05 Lamar Jackson, 7.06 Sam LaPorta.",
      best: "Jefferson at 15 — two WR1s before anyone else had one.",
      reach: "Love at 26 as the RB1.",
      value: "LaPorta at 66. WR room of the draft.",
    },
    {
      name: "Reese",
      grade: "A-",
      picks:
        "1.07 Jonathan Taylor, 2.04 De'Von Achane, 3.07 George Pickens, 4.04 DeVonta Smith, 5.07 Drake Maye.",
      best: "Achane at 14. Cleanest two-RB start after Len.",
      reach: "Harold Fannin at 54 (later Andrews makes it survivable).",
      value: "Smitty at 34. Maye at 47.",
    },
    {
      name: "Zack",
      grade: "B",
      picks:
        "1.08 Jaxon Smith-Njigba, 2.03 Chase Brown, 3.08 Rashee Rice, 4.03 Travis Etienne, 5.08 Tyler Warren, 8.03 Rome Odunze, 9.08 Dak Prescott.",
      best: "Rice at 28. Odunze at 73.",
      reach:
        "ETN at 33 and Jadarian Price at 53 as the RB plan next to Chase Brown.",
      value: "Dak at 88 is late enough.",
    },
    {
      name: "Brown",
      grade: "A-",
      picks:
        "1.09 Saquon Barkley, 2.02 CeeDee Lamb, 3.09 Breece Hall, 4.02 Emeka Egbuka, 5.09 Jalen Hurts, 8.02 DK Metcalf.",
      best: "CeeDee at 12. Best turn in the draft (9 and 12).",
      reach: "Egbuka at 32 as WR2 before more proven names.",
      value: "Hurts at 49 next to Saquon. DK at 72.",
    },
    {
      name: "Hamie",
      grade: "A",
      picks:
        "1.10 Amon-Ra St. Brown, 2.01 Derrick Henry, 3.10 Josh Allen, 4.01 Malik Nabers, 7.10 George Kittle.",
      best: "Henry falling to 11. Allen as first QB off the board.",
      reach: "none in the stars.",
      hole: "RB2 is Tuten / MarShawn Lloyd / JCM. If Henry sits, the room thins fast.",
    },
  ] satisfies DraftReportCardOwner[],
  awards: [
    { label: "Best pick", detail: "Mase, Justin Jefferson at 15" },
    { label: "Best value", detail: "Chad, Nico Collins at 20" },
    { label: "Best turn", detail: "Brown, Saquon + CeeDee" },
    { label: "Biggest reach", detail: "Dan, Ashton Jeanty at 16" },
    { label: "Hero-RB", detail: "Len (three RBs before a WR)" },
    { label: "Zero-RB bet", detail: "Mase (two WR1s, then a rookie RB)" },
    { label: "First-QB prize", detail: "Hamie, Josh Allen at 30" },
  ] satisfies DraftReportCardAward[],
  outro: "These grades can look stupid by Week 6. That's the point.",
} as const;

/** Plain-text body for email (site display names). */
export function draftReportCard2026PlainText(): string {
  const c = DRAFT_REPORT_CARD_2026;
  const lines: string[] = [
    c.title,
    "",
    c.subtitle,
    "",
    ...c.intro,
    "",
  ];
  for (const o of c.owners) {
    lines.push(`${o.name} — ${o.grade}`);
    lines.push("");
    lines.push(o.picks);
    lines.push("");
    lines.push(`Best: ${o.best}`);
    lines.push("");
    lines.push(`Reach: ${o.reach}`);
    if (o.value) {
      lines.push("");
      lines.push(`Value: ${o.value}`);
    }
    if (o.gap) {
      lines.push("");
      lines.push(`Gap: ${o.gap}`);
    }
    if (o.risk) {
      lines.push("");
      lines.push(`Risk: ${o.risk}`);
    }
    if (o.hole) {
      lines.push("");
      lines.push(`Hole: ${o.hole}`);
    }
    lines.push("");
  }
  lines.push("Awards");
  lines.push("");
  for (const a of c.awards) {
    lines.push(`${a.label} — ${a.detail}`);
    lines.push("");
  }
  lines.push(c.outro);
  return lines.join("\n").trim() + "\n";
}
