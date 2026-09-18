import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeAnalyticsEvent, trackProductEvent } from "../app/analytics.ts";

test("page views and custom events remove financial input, identifiers, and fragments from URLs", () => {
  for (const type of ["pageview", "event"]) {
    const event = { type, url: "https://user:password@decisionlab.example/analyze?id=private-id&name=Private&price=1234&email=private%40example.com&utm_campaign=secret#savings=5000" };
    assert.deepEqual(sanitizeAnalyticsEvent(event), { type, url: "https://decisionlab.example/analyze" });
    assert.match(event.url, /private-id/); // Sanitizing never changes the browser URL.
  }
});

test("only fixed public paths can be reported; malformed and unknown paths are dropped", () => {
  for (const path of ["/", "/about", "/analyze", "/compare", "/queue", "/purchases", "/dashboard", "/goallens", "/simulator", "/insights"]) {
    assert.equal(sanitizeAnalyticsEvent({ type: "pageview", url: `https://decisionlab.example${path}?private=secret` }).url, `https://decisionlab.example${path}`);
  }
  for (const url of ["invalid", "https://decisionlab.example/private-name", "https://decisionlab.example/analyze/private-id", "file:///analyze"]) {
    assert.equal(sanitizeAnalyticsEvent({ type: "pageview", url }), null);
  }
});

test("custom tracking accepts only approved event names and never forwards extra data", () => {
  const original = globalThis.window;
  const calls = [];
  globalThis.window = { va: (...args) => calls.push(args) };
  try {
    const names = ["homepage_viewed", "analyze_started", "analysis_completed", "compare_started", "comparison_completed", "decision_saved", "queue_opened", "purchase_recorded", "review_completed", "receipt_printed"];
    for (const name of names) trackProductEvent(name, { name: "Private product", price: 1234, notes: "Private notes" });
    trackProductEvent("Private user input");
    assert.deepEqual(calls, names.map(name => ["event", { name, options: undefined }]));
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});

test("unavailable or failing analytics cannot break product actions", () => {
  const original = globalThis.window;
  try {
    delete globalThis.window;
    assert.doesNotThrow(() => trackProductEvent("decision_saved"));
    globalThis.window = {};
    assert.doesNotThrow(() => trackProductEvent("decision_saved"));
    globalThis.window.va = () => { throw new Error("Blocked analytics"); };
    assert.doesNotThrow(() => trackProductEvent("decision_saved"));
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});
