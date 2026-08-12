import { PublicPageShell } from "@/components/layout/public-page-shell";
import {
  CONSTITUTION_INTRO,
  CONSTITUTION_SECTIONS,
} from "@/lib/data/constitution";

export const metadata = {
  title: "Constitution",
};

export const dynamic = "force-dynamic";

export default async function ConstitutionPage() {
  return (
    <PublicPageShell>
      <div className="space-y-8">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">The law</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              Constitution
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {CONSTITUTION_INTRO}
            </p>
          </div>
        </header>

        <nav className="ff-card flex flex-wrap gap-2 p-4">
          {CONSTITUTION_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-lg border-2 border-foreground bg-[#f4f2ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-4">
          {CONSTITUTION_SECTIONS.map((section, idx) => (
            <section
              key={section.id}
              id={section.id}
              className="ff-card scroll-mt-28 p-5 sm:p-6"
            >
              <div className="flex items-baseline gap-3">
                <span className="ff-display text-sm text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h2 className="ff-display text-xl tracking-tight sm:text-2xl">
                  {section.title}
                </h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {section.body.map((line) => (
                  <li
                    key={line.slice(0, 48)}
                    className="flex gap-2 text-sm leading-relaxed text-foreground/90"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-field)]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PublicPageShell>
  );
}
