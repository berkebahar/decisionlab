import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseConfigured = Boolean(url && key);
let client: SupabaseClient<Database> | undefined;

// Client-only data access: no privileged keys, server sessions, or shared user caches.
export function getSupabaseClient() {
  if (!url || !key) throw new Error("Cloud saving is not configured. You can still use local storage.");
  if (typeof window === "undefined") throw new Error("The Supabase browser client is only available in the browser.");
  client ??= createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(15000) }) },
  });
  return client;
}
