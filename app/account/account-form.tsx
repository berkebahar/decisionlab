"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/auth-provider";
import { getSupabaseClient } from "../lib/supabase/client";
export default function AccountForm() {
  const { user, loading, configured, error } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  if (loading) return <p role="status" className="product-local-note">Checking your account…</p>;
  if (!configured) return <section className="content-panel"><h2>Local mode is ready.</h2><p>Accounts and cloud saving are not available on this site yet. You can keep using DecisionLab in this browser.</p><Link className="text-link" href="/analyze">Analyze a product →</Link></section>;
  return <section className="product-form" aria-label="DecisionLab account">
    {error && <p className="product-error" role="alert">{error}</p>}
    {user ? <><h2>Your account</h2><p>Signed in as <strong className="account-email">{user.email}</strong>.</p><p className="product-helper">Queue and Purchases save to your account. Local records, goals, GoalLens comparisons, and scenarios remain in this browser. Nothing is imported automatically.</p><div className="product-actions"><Link className="button-primary" href="/queue">Open Queue</Link><button className="button-outline" type="button" disabled={busy} onClick={async () => {
      if (busy) return;
      setBusy(true); setMessage("");
      try {
        const { error } = await getSupabaseClient().auth.signOut({ scope: "local" });
        if (error) throw error;
        setPassword(""); setMessage("Signed out. Your local records are still available; cloud records remain in your account.");
      } catch { setMessage("Could not confirm sign-out. Please try again when the connection is available."); }
      finally { setBusy(false); }
    }}>{busy ? "Signing out…" : "Sign out"}</button></div></> : <>
      <h2>{mode === "signin" ? "Sign in" : "Create an account"}</h2>
      <form onSubmit={async event => {
        event.preventDefault(); if (busy || error) return;
        setBusy(true); setMessage("");
        try {
          const client = getSupabaseClient();
          const result = mode === "signin" ? await client.auth.signInWithPassword({ email: email.trim(), password }) : await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/account` } });
          if (result.error) {
            setMessage(mode === "signin" ? "Could not sign in. Check your email and password, confirm your email if needed, and try again." : "Could not create your account. Check your details and connection, then try again.");
          } else {
            setPassword("");
            setMessage(result.data.session ? "You’re signed in. Your Queue and Purchases now use cloud storage." : "Check your email for a confirmation link. Once confirmed, return here to sign in.");
          }
        } catch { setMessage("Account service is unavailable. Please try again. Your local records are unchanged."); }
        finally { setBusy(false); }
      }}>
        <div className="product-fields"><div className="product-field product-wide"><label htmlFor="account-email">Email</label><input id="account-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></div><div className="product-field product-wide"><label htmlFor="account-password">Password</label><input id="account-password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : 1} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} aria-describedby={mode === "signup" ? "account-password-help" : undefined} />{mode === "signup" && <p id="account-password-help" className="product-helper">Use at least 8 characters.</p>}</div></div>
        <div className="product-actions"><button className="button-primary" type="submit" disabled={busy || !!error}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}</button><button className="button-quiet" type="button" disabled={busy} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setPassword(""); setMessage(""); }}>{mode === "signin" ? "Create an account" : "Already have an account? Sign in"}</button></div>
      </form><p className="product-helper">Signing in keeps your cloud and local records separate. No local records are uploaded or removed.</p>
    </>}
    <p role="status" className="product-status">{message}</p>
    <Link className="text-link" href="/analyze">Continue to Analyze →</Link>
  </section>;
}
