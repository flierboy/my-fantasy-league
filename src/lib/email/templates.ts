import { getSiteUrl } from "./config";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseLayout(opts: {
  leagueName: string;
  preheader?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
}): string {
  const site = getSiteUrl();
  const league = escapeHtml(opts.leagueName);
  const pre = opts.preheader ? escapeHtml(opts.preheader) : "";
  const ctaLabel = opts.ctaLabel ?? "Open the league site";
  const ctaHref = opts.ctaHref ?? site;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${league}</title>
  <!--[if !mso]><!-->
  <style>
    body { margin: 0; padding: 0; background: #f4f2ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; }
    a { color: #1a1a1a; }
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f2ef;">
  ${pre ? `<div style="display:none;max-height:0;overflow:hidden;">${pre}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:2px solid #1a1a1a;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#1a1a1a;color:#f5e6c8;padding:16px 20px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
              ${league}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 20px 8px;font-size:15px;line-height:1.55;color:#1a1a1a;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px 28px;" align="center">
              <a href="${escapeHtml(ctaHref)}"
                 style="display:inline-block;background:#1a1a1a;color:#f5e6c8;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;padding:12px 22px;border-radius:8px;">
                ${escapeHtml(ctaLabel)}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 20px 18px;border-top:1px solid #e8e4df;font-size:11px;color:#6b6560;text-align:center;">
              You’re receiving this because you’re an owner in ${league}.
              <br />
              <a href="${escapeHtml(site)}" style="color:#6b6560;">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function pollEmailHtml(opts: {
  leagueName: string;
  title: string;
  description?: string | null;
  options: string[];
}): { subject: string; html: string; text: string } {
  const site = getSiteUrl();
  const pollsUrl = `${site}/polls`;
  const title = opts.title;
  const desc = opts.description?.trim();
  const optsList = opts.options.map((o) => `• ${o}`).join("\n");

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b6560;">New poll</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${escapeHtml(title)}</h1>
    ${desc ? `<p style="margin:0 0 16px;color:#3d3a36;">${escapeHtml(desc)}</p>` : ""}
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;color:#6b6560;">Options</p>
    <ul style="margin:0 0 8px;padding-left:18px;">
      ${opts.options.map((o) => `<li style="margin:4px 0;">${escapeHtml(o)}</li>`).join("")}
    </ul>
    <p style="margin:16px 0 0;color:#3d3a36;">Cast your vote on the league site.</p>
  `;

  return {
    subject: `[${opts.leagueName}] New poll: ${title}`,
    html: baseLayout({
      leagueName: opts.leagueName,
      preheader: `New poll: ${title}`,
      bodyHtml,
      ctaLabel: "Vote now",
      ctaHref: pollsUrl,
    }),
    text: [
      `${opts.leagueName} — New poll`,
      title,
      desc || "",
      "",
      "Options:",
      optsList,
      "",
      `Vote: ${pollsUrl}`,
    ]
      .filter((l) => l !== undefined)
      .join("\n"),
  };
}

export function announcementEmailHtml(opts: {
  leagueName: string;
  title: string;
  body: string;
}): { subject: string; html: string; text: string } {
  const site = getSiteUrl();
  const dashUrl = `${site}/dashboard`;
  const paragraphs = opts.body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b6560;">Announcement</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${escapeHtml(opts.title)}</h1>
    ${paragraphs
      .map(
        (p) =>
          `<p style="margin:0 0 12px;color:#3d3a36;white-space:pre-wrap;">${escapeHtml(p)}</p>`
      )
      .join("")}
  `;

  return {
    subject: `[${opts.leagueName}] ${opts.title}`,
    html: baseLayout({
      leagueName: opts.leagueName,
      preheader: opts.title,
      bodyHtml,
      ctaLabel: "Open dashboard",
      ctaHref: dashUrl,
    }),
    text: [
      `${opts.leagueName} — Announcement`,
      opts.title,
      "",
      opts.body,
      "",
      dashUrl,
    ].join("\n"),
  };
}

export type WeeklyMatchupLine = {
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type WeeklyStandingLine = {
  rank: number;
  name: string;
  record: string;
  pointsFor: number;
};

export type WeeklyWaiverLine = {
  teamName: string;
  summary: string;
};

export function weeklyResultsEmailHtml(opts: {
  leagueName: string;
  week: number;
  season: number;
  matchups: WeeklyMatchupLine[];
  standings: WeeklyStandingLine[];
  waivers: WeeklyWaiverLine[];
}): { subject: string; html: string; text: string } {
  const site = getSiteUrl();
  const matchupsUrl = `${site}/matchups`;
  const weekLabel = `Week ${opts.week}`;

  const matchupRows =
    opts.matchups.length === 0
      ? `<p style="margin:0;color:#6b6560;">No matchup scores available yet for this week.</p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          ${opts.matchups
            .map((m) => {
              const hs =
                m.homeScore != null ? m.homeScore.toFixed(1) : "—";
              const as =
                m.awayScore != null ? m.awayScore.toFixed(1) : "—";
              return `<tr>
                <td style="padding:8px 0;border-bottom:1px solid #e8e4df;">
                  <strong>${escapeHtml(m.awayName)}</strong>
                  <span style="color:#6b6560;"> ${as}</span>
                  <span style="color:#6b6560;"> vs </span>
                  <strong>${escapeHtml(m.homeName)}</strong>
                  <span style="color:#6b6560;"> ${hs}</span>
                </td>
              </tr>`;
            })
            .join("")}
        </table>`;

  const standingsRows =
    opts.standings.length === 0
      ? `<p style="margin:0;color:#6b6560;">Standings not available.</p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          <tr style="color:#6b6560;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">
            <td style="padding:4px 8px 8px 0;">#</td>
            <td style="padding:4px 8px 8px 0;">Team</td>
            <td style="padding:4px 8px 8px 0;">W-L-T</td>
            <td style="padding:4px 0 8px;text-align:right;">PF</td>
          </tr>
          ${opts.standings
            .map(
              (s) => `<tr>
              <td style="padding:6px 8px 6px 0;border-bottom:1px solid #e8e4df;color:#6b6560;">${s.rank}</td>
              <td style="padding:6px 8px 6px 0;border-bottom:1px solid #e8e4df;font-weight:600;">${escapeHtml(s.name)}</td>
              <td style="padding:6px 8px 6px 0;border-bottom:1px solid #e8e4df;font-family:ui-monospace,monospace;font-size:12px;">${escapeHtml(s.record)}</td>
              <td style="padding:6px 0;border-bottom:1px solid #e8e4df;text-align:right;font-family:ui-monospace,monospace;font-size:12px;">${s.pointsFor.toFixed(1)}</td>
            </tr>`
            )
            .join("")}
        </table>`;

  const waiverRows =
    opts.waivers.length === 0
      ? `<p style="margin:0;color:#6b6560;">No waiver activity recorded for this week (or data not available yet).</p>`
      : `<ul style="margin:0;padding-left:18px;">
          ${opts.waivers
            .map(
              (w) =>
                `<li style="margin:6px 0;"><strong>${escapeHtml(w.teamName)}</strong> — ${escapeHtml(w.summary)}</li>`
            )
            .join("")}
        </ul>`;

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b6560;">${opts.season} season</p>
    <h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;">${weekLabel} Results</h1>

    <h2 style="margin:0 0 10px;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;">Matchups</h2>
    <div style="margin:0 0 22px;">${matchupRows}</div>

    <h2 style="margin:0 0 10px;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;">Standings</h2>
    <div style="margin:0 0 22px;">${standingsRows}</div>

    <h2 style="margin:0 0 10px;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;">Waivers</h2>
    <div style="margin:0 0 8px;">${waiverRows}</div>
  `;

  const textMatchups =
    opts.matchups.length === 0
      ? "No matchup scores yet."
      : opts.matchups
          .map(
            (m) =>
              `${m.awayName} ${m.awayScore ?? "—"} vs ${m.homeName} ${m.homeScore ?? "—"}`
          )
          .join("\n");

  const textStandings =
    opts.standings.length === 0
      ? "Standings N/A"
      : opts.standings
          .map(
            (s) =>
              `${s.rank}. ${s.name} ${s.record} PF ${s.pointsFor.toFixed(1)}`
          )
          .join("\n");

  const textWaivers =
    opts.waivers.length === 0
      ? "No waiver activity."
      : opts.waivers.map((w) => `${w.teamName}: ${w.summary}`).join("\n");

  return {
    subject: `[${opts.leagueName}] ${weekLabel} Results`,
    html: baseLayout({
      leagueName: opts.leagueName,
      preheader: `${weekLabel} results, standings, and waivers`,
      bodyHtml,
      ctaLabel: "View matchups",
      ctaHref: matchupsUrl,
    }),
    text: [
      `${opts.leagueName} — ${weekLabel} Results (${opts.season})`,
      "",
      "MATCHUPS",
      textMatchups,
      "",
      "STANDINGS",
      textStandings,
      "",
      "WAIVERS",
      textWaivers,
      "",
      matchupsUrl,
    ].join("\n"),
  };
}
