"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, supabaseConfigured } from "../lib/supabase/client";

type AuthState = { user: User | null; loading: boolean; error: string; configured: boolean };
const initial: AuthState = { user: null, loading: supabaseConfigured, error: "", configured: supabaseConfigured };
const AuthContext = createContext<AuthState>(initial);
export function useAuth() { return useContext(AuthContext); }
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    if (!supabaseConfigured) return;
    let active = true, events = 0;
    let unsubscribe = () => {};
    try {
      const client = getSupabaseClient();
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") return; // getSession reports initialization failures explicitly.
        events++;
        if (active) setState({ user: session?.user ?? null, loading: false, error: "", configured: true });
      });
      unsubscribe = () => data.subscription.unsubscribe();
      const version = events;
      void client.auth.getSession().then(({ data, error }) => {
        if (!active || events !== version) return;
        setState({ user: data.session?.user ?? null, loading: false, error: error ? "Could not verify your session. Reload to retry; saving is paused." : "", configured: true });
      }).catch(() => {
        if (active && events === version) setState({ ...initial, loading: false, error: "Could not verify your session. Reload to retry; saving is paused." });
      });
    } catch {
      // Do not reinterpret a failed auth check as a confirmed sign-out.
      queueMicrotask(() => { if (active) setState({ ...initial, loading: false, error: "Account connection is unavailable. Reload to retry; saving is paused." }); });
    }
    return () => { active = false; unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
