import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 在 Server Component / Route Handler 中使用的 Supabase client。
 * 只用 anon key,實際資料存取權限由資料庫的 RLS 決定。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Component 中呼叫 set 會被忽略,可安全略過。
          }
        },
      },
    }
  );
}
