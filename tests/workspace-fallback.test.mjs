import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Exercise the actual server-rendered fallback and receipt without a browser
// or Next bundler. Production imports and behavior are not mocked.
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      for (const extension of [".ts", ".tsx"]) {
        const url = new URL(specifier + extension, context.parentURL);
        if (existsSync(url)) return { url: url.href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.endsWith(".tsx")) return next(url, context);
    return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
    }).outputText };
  },
});
const { default: Skeleton } = await import("../app/components/skeleton.tsx");
const { default: WorkspaceError } = await import("../app/error.tsx");
const { default: Receipt } = await import("../app/products/true-cost-receipt.tsx");
const { storyProduct } = await import("../app/components/cost-story-model.ts");
hooks.deregister();

test("server loading fallback provides immediate, accessible recovery without hydration", () => {
  const html = renderToStaticMarkup(createElement(Skeleton, { label: "Preparing your comparison" }));
  assert.match(html, /role="status"/);
  assert.match(html, /Preparing your comparison/);
  assert.match(html, /class="skeleton-paper" aria-hidden="true"/);
  assert.match(html, /<a href="">reload this page<\/a>/);
  assert.match(html, /DecisionLab needs JavaScript enabled to open this workspace/);
  assert.doesNotMatch(html, /aria-busy="true"/); // Recovery must not wait for a busy region to finish.
});

test("workspace error offers retry and a regular reload link without exposing error details", () => {
  const html = renderToStaticMarkup(createElement(WorkspaceError, { retry() {} }));
  assert.match(html, /role="alert"/);
  assert.match(html, /This page could not open/);
  assert.match(html, />Try again<\/button>/);
  assert.match(html, /href="">Reload page<\/a>/);
  assert.match(html, /Your saved records remain in this browser/);
});

test("receipt explains the floor in the selected currency, with a warning when resale exceeds cost", () => {
  for (const [currency, zero] of [["USD", "$0.00"], ["EUR", "€0.00"]]) {
    const html = renderToStaticMarkup(createElement(Receipt, { analysis: { ...storyProduct, currency, resale: 9999 } }));
    assert.ok(html.includes(`True Cost is floored at ${zero}. DecisionLab does not model profit or appreciation`));
    assert.match(html, /Entered resale exceeds modeled costs/);
    assert.ok(html.includes(`<span class="receipt-amount">${zero}</span>`));
  }
});
