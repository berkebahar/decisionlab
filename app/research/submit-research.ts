import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";
import { researchResponse, type ResearchResponse } from "./decision-research.ts";
import type { ResearchSubmission } from "./research-session.ts";

let client: SupabaseClient<Database> | undefined;

export async function submitResearchResponse(response: ResearchResponse): Promise<ResearchSubmission> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (typeof window === "undefined" || !url || !key) return "unavailable";
    // Separate from the account client: no auth token, session storage, or auth URL processing.
    client ??= createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "decisionlab.research.volatile" },
      global: { fetch: (input, init) => fetch(input, { ...init, credentials: "omit", referrerPolicy: "no-referrer" }) },
    });
    const payload = researchResponse(response.session_analysis_id, response.category,
      { intent: response.before_intent, confidence: response.before_confidence },
      { intent: response.after_intent, confidence: response.after_confidence });
    // INSERT returns no rows. A lost success followed by a duplicate is still complete.
    const { error } = await client.from("decision_research_responses").insert(payload)
      .abortSignal(AbortSignal.timeout(8000)).retry(false);
    return !error || error.code === "23505" ? "completed" : "unavailable";
  } catch {
    return "unavailable";
  }
}
