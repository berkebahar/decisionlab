"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { trackProductEvent } from "../analytics";
import { researchIntents, type ResearchIntent } from "./decision-research";
import { ResearchSession } from "./research-session";
import { submitResearchResponse } from "./submit-research";
import styles from "./research.module.css";

const emptySubscribe = () => () => {};
const emptySnapshot = () => null;
export function useResearchPhase(session: ResearchSession | null) {
  return useSyncExternalStore(session?.subscribe ?? emptySubscribe, session?.getSnapshot ?? emptySnapshot, emptySnapshot);
}

export function ResearchCard({ session, stage }: { session: ResearchSession; stage: "before" | "after" }) {
  const prefix = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [intent, setIntent] = useState<ResearchIntent | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const phase = useResearchPhase(session);

  useEffect(() => {
    if (stage === "before") heading.current?.focus();
    if (session.promptSeen(stage)) trackProductEvent("research_prompt_seen");
  }, [session, stage]);

  function skip() {
    if (session.skip()) trackProductEvent("research_skipped");
  }
  function complete() {
    // Continue is always available; an incomplete before section simply opts out.
    if (!intent || confidence === null) { if (stage === "before") skip(); return; }
    const answer = { intent, confidence };
    if (stage === "before") {
      if (session.completeBefore(answer)) trackProductEvent("research_before_completed");
    } else {
      void session.completeAfter(answer, submitResearchResponse).then(completed => {
        if (completed) trackProductEvent("research_response_completed");
      });
    }
  }
  if (phase === "skipped" || phase === "awaiting_receipt") return null;
  if (phase === "completed" || phase === "unavailable" || phase === "submitting") {
    return <p data-decision-research className={styles.status} role="status">{phase === "completed"
      ? "Thank you — your anonymous response has been saved."
      : phase === "submitting" ? "Saving your anonymous response…"
        : "Your response couldn’t be saved this time. Your receipt is ready to use."}</p>;
  }
  return <section data-decision-research className={`studio-paper ${styles.card} ${stage === "before" ? styles.before : ""}`} aria-labelledby={`${prefix}-heading`}>
    <h2 ref={heading} id={`${prefix}-heading`} tabIndex={-1}>{stage === "before" ? "Before seeing the full analysis" : "After seeing the True Cost analysis"}</h2>
    <form onSubmit={event => { event.preventDefault(); complete(); }} aria-describedby={`${prefix}-helper`}>
      <fieldset className={styles.question}>
        <legend>{stage === "before" ? "Would you buy this product?" : "Would you still buy this product?"}</legend>
        <div className={styles.intents}>{researchIntents.map(value => <label className={styles.choice} key={value}>
          <input type="radio" name={`${prefix}-intent`} value={value} checked={intent === value} onChange={() => setIntent(value)} />
          <span>{value === "yes" ? "Yes" : value === "maybe" ? "Maybe" : "No"}</span>
        </label>)}</div>
      </fieldset>
      <fieldset className={styles.question} aria-describedby={`${prefix}-scale`}>
        <legend>{stage === "before" ? "How confident are you in that decision?" : "How confident are you now?"}</legend>
        <div className={styles.confidence}>{[1, 2, 3, 4, 5].map(value => <label className={styles.choice} key={value}>
          <input type="radio" name={`${prefix}-confidence`} value={value} checked={confidence === value} onChange={() => setConfidence(value)} aria-label={`${value}${value === 1 ? " — Not confident" : value === 5 ? " — Very confident" : ""}`} />
          <span>{value}</span>
        </label>)}</div>
        <p className={styles.scale} id={`${prefix}-scale`}><span>1 = Not confident</span><span>5 = Very confident</span></p>
      </fieldset>
      <p className="product-helper" id={`${prefix}-helper`}>Optional — anonymous responses help us understand whether true-cost information changes purchasing decisions.</p>
      <div className="product-actions">
        <button type="submit" className="button-primary" disabled={stage === "after" && (!intent || confidence === null)}>{stage === "before" ? "Continue" : "Submit response"}</button>
        <button type="button" className="button-quiet" onClick={skip}>Skip</button>
      </div>
    </form>
  </section>;
}

/** Wait for the actual totals to enter a visible viewport, not just a receipt mount. */
export function ResearchReceiptObserver({ session, result }: { session: ResearchSession; result: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const totals = result.current?.querySelector<HTMLElement>(".receipt-results");
    if (!totals) return;
    let observer: IntersectionObserver | undefined;
    const check = () => {
      if (document.visibilityState !== "visible" || !totals.getClientRects().length) return;
      const bounds = totals.getBoundingClientRect();
      const visibleHeight = Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0);
      if (visibleHeight >= Math.min(bounds.height, window.innerHeight) / 2 && bounds.right > 0 && bounds.left < window.innerWidth) session.receiptSeen();
    };
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(check, { threshold: [0, .5, 1] });
      observer.observe(totals);
    }
    // Also handles browsers without IntersectionObserver and returning to a hidden tab.
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    document.addEventListener("visibilitychange", check);
    const frame = requestAnimationFrame(check);
    return () => {
      observer?.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("scroll", check); window.removeEventListener("resize", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [session, result]);
  return null;
}
