/**
 * Server-only constitution loader (uses Supabase server client / cookies).
 * Client Components must import types/helpers from constitution-shared.ts only.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  CONSTITUTION_INTRO,
  CONSTITUTION_SECTIONS,
  mapConstitutionSection,
  type ConstitutionSection,
} from "@/lib/data/constitution-shared";

export type { ConstitutionSection } from "@/lib/data/constitution-shared";
export {
  CONSTITUTION_INTRO,
  CONSTITUTION_SECTIONS,
  CONSTITUTION_SECTION_KEYS,
  bodyToLines,
  mapConstitutionSection,
} from "@/lib/data/constitution-shared";

export async function getConstitution(): Promise<{
  intro: string;
  sections: ConstitutionSection[];
  source: "supabase" | "fallback";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      intro: CONSTITUTION_INTRO,
      sections: CONSTITUTION_SECTIONS,
      source: "fallback",
    };
  }

  try {
    const supabase = await createClient();
    const [secRes, settingsRes] = await Promise.all([
      supabase
        .from("constitution_sections")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true }),
      supabase
        .from("league_settings")
        .select("constitution_intro")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (secRes.error) {
      console.error("[constitution]", secRes.error.message);
      return {
        intro: CONSTITUTION_INTRO,
        sections: CONSTITUTION_SECTIONS,
        source: "fallback",
        error: secRes.error.message,
      };
    }

    const rows = secRes.data ?? [];
    if (rows.length === 0) {
      return {
        intro:
          (settingsRes.data?.constitution_intro as string | null)?.trim() ||
          CONSTITUTION_INTRO,
        sections: CONSTITUTION_SECTIONS,
        source: "fallback",
      };
    }

    const intro =
      (settingsRes.data?.constitution_intro as string | null)?.trim() ||
      CONSTITUTION_INTRO;

    return {
      intro,
      sections: rows.map((r) =>
        mapConstitutionSection(r as Record<string, unknown>)
      ),
      source: "supabase",
    };
  } catch (err) {
    console.error("[constitution] unexpected", err);
    return {
      intro: CONSTITUTION_INTRO,
      sections: CONSTITUTION_SECTIONS,
      source: "fallback",
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
