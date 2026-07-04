import { createBrowserClient } from "@supabase/ssr";

/**
 * 在 Client Component 中使用的 Supabase client。
 * anon key 可以安全暴露在瀏覽器,資料安全由 RLS 保護。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
