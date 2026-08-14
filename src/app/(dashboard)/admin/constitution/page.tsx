import { getConstitution } from "@/lib/data/constitution";
import { ConstitutionManager } from "@/components/admin/constitution-manager";

export const metadata = {
  title: "Admin · Constitution",
};

export default async function AdminConstitutionPage() {
  const { intro, sections, source, error } = await getConstitution();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">The law</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Constitution
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Edit the public{" "}
          <a href="/constitution" className="font-bold underline">
            /constitution
          </a>{" "}
          page. Save publishes immediately
          {source === "fallback"
            ? " (currently showing built-in fallback until DB sections exist)."
            : " · live from the database."}
        </p>
      </header>

      <ConstitutionManager
        intro={intro}
        // Only pass real DB rows — fallback static ids are not editable
        sections={source === "supabase" ? sections : []}
        error={
          error ||
          (source === "fallback"
            ? "No constitution_sections rows yet — run migrate-constitution.sql (seeds defaults) or add sections below once the table exists."
            : undefined)
        }
      />
    </div>
  );
}
