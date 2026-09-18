import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Next normally resolves server-only and CSS, and compiles TSX. These test-only
// hooks let Node exercise the actual server loader and renderer without a server.
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
    if (specifier.endsWith(".module.css")) return { url: "data:text/javascript,export default {};", shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.endsWith(".tsx")) return next(url, context);
    return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
    }).outputText };
  },
});
const { getUsageStatistics } = await import("../app/about/usage-statistics-data.ts");
const { default: UsageStatistics } = await import("../app/about/usage-statistics.tsx");
hooks.deregister();

const envKeys = ["VERCEL_ANALYTICS_TOKEN", "VERCEL_ANALYTICS_PROJECT_ID", "VERCEL_ANALYTICS_TEAM_ID"];
function configure(t) {
  const original = envKeys.map(key => process.env[key]);
  t.after(() => envKeys.forEach((key, index) => {
    if (original[index] === undefined) delete process.env[key];
    else process.env[key] = original[index];
  }));
  process.env.VERCEL_ANALYTICS_TOKEN = "test-only-secret";
  process.env.VERCEL_ANALYTICS_PROJECT_ID = "prj_test";
  process.env.VERCEL_ANALYTICS_TEAM_ID = "team_test";
}

test("missing credentials or project ID never query the provider or fabricate counts", async t => {
  configure(t);
  const fetch = t.mock.method(globalThis, "fetch", () => { throw Error("Must not fetch"); });
  for (const key of envKeys.slice(0, 2)) {
    const value = process.env[key];
    process.env[key] = " ";
    assert.deepEqual(await getUsageStatistics(), []);
    process.env[key] = value;
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("only fixed production count queries are sent; only totals are returned", async t => {
  configure(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json({ data: { pageviews: 1234, count: 23, visitors: 999,
      eventData: "private input", clientIp: "private IP", visitorId: "private ID" }, query: { private: "private query" } });
  });
  const result = await getUsageStatistics();
  assert.equal(result.length, 7);
  assert.equal(result[0].count, 1234); // Never substitutes unique visitors.
  assert.ok(result.slice(1).every(stat => stat.count === 23));
  assert.deepEqual(calls.map(({ url }) => url.searchParams.get("filter")), [null,
    "eventName eq 'analysis_completed'", "eventName eq 'comparison_completed'",
    "eventName eq 'decision_saved'", "eventName eq 'receipt_printed'",
    "eventName eq 'purchase_recorded'", "eventName eq 'review_completed'",
  ]);
  for (const { url, options } of calls) {
    assert.equal(url.origin, "https://api.vercel.com");
    assert.match(url.pathname, /^\/v1\/query\/web-analytics\/(visits|events)\/count$/);
    assert.equal(url.searchParams.get("projectId"), "prj_test");
    assert.equal(url.searchParams.get("teamId"), "team_test");
    assert.ok([...url.searchParams.keys()].every(key => ["projectId", "teamId", "filter"].includes(key)));
    assert.equal(options.headers.Authorization, "Bearer test-only-secret");
    assert.equal(options.cache, "force-cache");
    assert.equal(options.next.revalidate, 600);
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
  }
  assert.ok(result.every(stat => Object.keys(stat).sort().join() === "count,id,label"));
  assert.doesNotMatch(JSON.stringify(result), /private|test-only-secret|prj_test|team_test|visitors/);
});

test("a confirmed zero is valid; absent, fractional, negative or coerced counts are hidden", async t => {
  configure(t);
  const bodies = [
    { data: { pageviews: 0 } }, { data: {} }, { data: { count: null } },
    { data: { count: "23" } }, { data: { count: -1 } }, { data: { count: 1.5 } },
    { data: { count: Number.MAX_SAFE_INTEGER + 1 } },
  ];
  t.mock.method(globalThis, "fetch", async () => Response.json(bodies.shift()));
  assert.deepEqual(await getUsageStatistics(), [{ id: "pageviews", label: "Page views", count: 0 }]);
});

test("partial API failures hide only unavailable metrics and personal projects omit teamId", async t => {
  configure(t);
  delete process.env.VERCEL_ANALYTICS_TEAM_ID;
  let index = 0;
  t.mock.method(globalThis, "fetch", async url => {
    assert.equal(url.searchParams.has("teamId"), false);
    switch (index++) {
      case 0: return Response.json({ data: { pageviews: 50 } });
      case 1: return new Response("unauthorized", { status: 401 });
      case 2: return new Response("plan unavailable", { status: 403 });
      case 3: return new Response("rate limited", { status: 429 });
      case 4: throw Error("Timeout or network failure");
      case 5: return new Response("invalid json", { status: 200 });
      default: return Response.json({ data: { count: 2 } });
    }
  });
  assert.deepEqual((await getUsageStatistics()).map(stat => stat.id), ["pageviews", "review_completed"]);
});

test("malformed provider payloads produce no public counts", async t => {
  configure(t);
  const bodies = [null, [], {}, { data: [] }, { data: 7 }, { data: { visitors: 5 } }, { data: { count: Infinity } }];
  t.mock.method(globalThis, "fetch", async () => Response.json(bodies.shift()));
  assert.deepEqual(await getUsageStatistics(), []);
});

test("unavailable UI has a graceful message and no numeric placeholders", () => {
  const html = renderToStaticMarkup(createElement(UsageStatistics, { statistics: [] }));
  assert.match(html, /DecisionLab in use/);
  assert.match(html, /Usage totals will appear here when available/);
  assert.doesNotMatch(html, /<dd|NaN|undefined/);
});

test("public UI renders exact counts and explicitly distinguishes page views from visitors", () => {
  const html = renderToStaticMarkup(createElement(UsageStatistics, { statistics: [
    { id: "pageviews", label: "Page views", count: 1234 },
    { id: "review_completed", label: "Reviews completed", count: 0 },
  ] }));
  assert.match(html, /<dd>1,234<\/dd>/);
  assert.match(html, /<dd>0<\/dd>/);
  assert.match(html, /repeat visits, not unique visitors/);
  assert.equal((html.match(/<dd>/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Analyses completed|NaN|undefined/);
});
