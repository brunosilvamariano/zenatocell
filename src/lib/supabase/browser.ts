import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";
let client: ReturnType<typeof createClient<Database>> | null = null;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client ??= createClient<Database>(url, key);
  return client;
}
