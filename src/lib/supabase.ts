import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as { supabase?: SupabaseClient };

function getSupabase(): SupabaseClient {
  if (globalForSupabase.supabase) return globalForSupabase.supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  const client = createClient(url, key);
  if (process.env.NODE_ENV !== "production") globalForSupabase.supabase = client;
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    return (getSupabase() as any)[prop];
  },
});
