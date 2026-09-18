import { track, type BeforeSendEvent } from "@vercel/analytics";

const eventNames = [
  "homepage_viewed", "analyze_started", "analysis_completed", "compare_started",
  "comparison_completed", "decision_saved", "queue_opened", "purchase_recorded",
  "review_completed", "receipt_printed",
] as const;
export type ProductEvent = typeof eventNames[number];

// Deliberately accepts no properties: never pass records, form fields, or IDs.
export function trackProductEvent(name: ProductEvent) {
  if (typeof window === "undefined" || !eventNames.includes(name)) return;
  try {
    track(name);
  } catch {
    // Analytics must never interrupt a calculation, save, or print action.
  }
}

const publicPaths = new Set([
  "/", "/about", "/analyze", "/compare", "/queue", "/purchases",
  "/dashboard", "/goallens", "/simulator", "/insights",
]);

export function sanitizeAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    if (!publicPaths.has(url.pathname) || !["https:", "http:"].includes(url.protocol)) return null;
    // Drop all query parameters (including record IDs/UTMs), fragments and credentials.
    return { ...event, url: `${url.origin}${url.pathname}` };
  } catch {
    return null;
  }
}
