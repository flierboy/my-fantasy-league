import {
  DRAFT_REPORT_CARD_2026,
  type DraftReportCardOwner,
} from "@/lib/data/draft-report-card-2026";

export function DraftReportCard2026() {
  const card = DRAFT_REPORT_CARD_2026;

  return (
    <section className="space-y-6">
      <div>
        <p className="ff-ribbon text-[10px] !px-3 !py-1">Grades</p>
        <h2 className="ff-display mt-2 text-2xl tracking-tight">
          Report card
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>
      </div>

      <div className="ff-card space-y-3 p-5 sm:p-6">
        {card.intro.map((p) => (
          <p key={p} className="text-sm leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {card.owners.map((o) => (
          <OwnerGradeCard key={o.name} owner={o} />
        ))}
      </div>

      <div className="ff-card overflow-hidden">
        <div className="ff-top-stripe" />
        <div className="p-5 sm:p-6">
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Hardware</p>
          <h3 className="ff-display mt-2 text-xl">Awards</h3>
          <ul className="mt-4 space-y-2">
            {card.awards.map((a) => (
              <li key={a.label} className="text-sm">
                <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  {a.label}
                </span>
                <p className="ff-display mt-0.5 text-base tracking-wide">
                  {a.detail}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm italic text-muted-foreground">
            {card.outro}
          </p>
        </div>
      </div>
    </section>
  );
}

function OwnerGradeCard({ owner }: { owner: DraftReportCardOwner }) {
  return (
    <article className="ff-card flex flex-col p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="ff-display text-lg tracking-wide">{owner.name}</h3>
        <span className="ff-display text-2xl text-[var(--accent-field)]">
          {owner.grade}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {owner.picks}
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <Line label="Best" text={owner.best} />
        <Line label="Reach" text={owner.reach} />
        {owner.value && <Line label="Value" text={owner.value} />}
        {owner.gap && <Line label="Gap" text={owner.gap} />}
        {owner.risk && <Line label="Risk" text={owner.risk} />}
        {owner.hole && <Line label="Hole" text={owner.hole} />}
      </dl>
    </article>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 leading-snug">{text}</dd>
    </div>
  );
}
