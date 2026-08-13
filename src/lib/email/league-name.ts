import { createClient } from "@/lib/supabase/server";

export async function getLeagueName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("league_settings")
      .select("name")
      .eq("id", 1)
      .maybeSingle();
    if (data?.name) return String(data.name);
  } catch {
    // ignore
  }
  return "Upper Deckers";
}
