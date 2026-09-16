import test from "node:test";
import assert from "node:assert/strict";
import { demoGroups } from "../app/products/demo-products.ts";
import { analyzeProduct } from "../app/products/product-calculations.ts";
import { formatMoney, formatUnitCost } from "../app/products/product-model.ts";
import { comparisonMetrics, getComparisonFocus } from "../app/products/comparison-focus.ts";

const base = demoGroups[0].products[0];
const focus = (metric, analysis = base) => getComparisonFocus(metric, analysis, analyzeProduct(analysis));

test("comparison focus displays existing receipt calculations without ranking products", () => {
  const result = analyzeProduct(base);
  assert.equal(Object.keys(comparisonMetrics).length, 7);
  assert.equal(focus("costPerUse").value, formatUnitCost(result.costPerUse, base.currency));
  assert.equal(focus("trueCost").value, formatMoney(result.net, base.currency));
  assert.equal(focus("purchasePrice").value, formatMoney(base.price, base.currency));
  assert.equal(focus("ongoingCost").value, formatMoney(result.ownership, base.currency));
  assert.match(focus("usage").detail, /48 months/);
});

test("comparison focus distinguishes zero uses, missing costs, and confirmed zero expenses", () => {
  assert.equal(focus("costPerUse", { ...base, uses: 0 }).available, false);
  assert.equal(focus("costPerUse", { ...base, uses: 0 }).value, "Not available");
  const unknown = { ...base, maintenanceYearly: null, accessories: null, subscription: null, repairs: null };
  assert.equal(focus("ongoingCost", unknown).value, "Unknown");
  assert.match(focus("ongoingCost", { ...unknown, repairs: 10 }).detail, /Known subtotal only/);
  assert.equal(focus("ongoingCost", { ...unknown, maintenanceYearly: 0, accessories: 0, subscription: 0, repairs: 0 }).value, "$0.00");
  assert.match(focus("trueCost", { ...base, shipping: null }).detail, /incomplete/);
  assert.doesNotMatch(focus("trueCost", { ...base, purpose: "" }).detail, /incomplete/);
});

test("comparison focus preserves each currency and distinguishes expected resale from its capped deduction", () => {
  assert.equal(focus("purchasePrice", { ...base, currency: "EUR" }).value, formatMoney(base.price, "EUR"));
  assert.equal(focus("resale", { ...base, resale: null }).value, "Unknown");
  assert.equal(focus("resale", { ...base, resale: 0 }).value, "$0.00");
  assert.equal(focus("resale", { ...base, resale: 100000 }).value, "$100,000.00");
  assert.match(focus("resale", { ...base, resale: 100000 }).detail, /deduction is capped/);
});

test("comparison focus distinguishes absent goals from unreachable goals and preserves deposit units", () => {
  assert.equal(focus("goalImpact").value, "Not included");
  const goal = { name: "Reserve", saved: 0, target: 1000, contribution: 0, frequency: "week" };
  assert.equal(focus("goalImpact", { ...base, goal }).value, "Not reachable");
  const monthly = focus("goalImpact", { ...base, goal: { ...goal, contribution: 100, frequency: "month" } });
  assert.equal(monthly.value, "+12 months");
  assert.match(monthly.detail, /Upfront cost only/);
});
