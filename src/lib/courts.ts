import { createClient } from "@/lib/supabase/server";
import { sampleCourts } from "@/data/sample";
import type { Court } from "@/lib/types";

function hasSupabase() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** 取得所有已發佈球場;未設定 Supabase 時回傳示範資料。 */
export async function getCourts(): Promise<Court[]> {
  if (!hasSupabase()) return sampleCourts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("status", "published")
    .order("name");

  if (error) {
    console.error("讀取球場失敗,改用示範資料:", error.message);
    return sampleCourts;
  }
  return (data as Court[]) ?? [];
}

/** 依 slug 取得單一球場。 */
export async function getCourtBySlug(slug: string): Promise<Court | null> {
  if (!hasSupabase()) {
    return sampleCourts.find((c) => c.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("讀取球場失敗:", error.message);
    return null;
  }
  return (data as Court) ?? null;
}
