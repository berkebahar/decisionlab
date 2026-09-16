import assert from "node:assert/strict";
import test from "node:test";
import { impactLevel, summarizeDecisions, summarizeGoals } from "../app/insights/insight-calculations.ts";

test("insights separate annualized spending, one-time spending, and alternatives", () => {
  const summary = summarizeDecisions([
    { mode: "purchase", purchases: [{ price: 0.1, extraWeeks: 0 }] },
    { mode: "purchase", purchases: [{ price: 0.2, extraWeeks: 2 }] },
    { mode: "recurring", calculationVersion: 2, purchases: [{ price: 780, extraWeeks: 26 }] },
    { mode: "compare", purchases: [{ price: 120, extraWeeks: 4 }, { price: 75, extraWeeks: 3 }] },
  ]);
  assert.deepEqual(summary.modes, { purchase: { count: 2, amount: 0.3 }, recurring: { count: 1, amount: 780 }, compare: { count: 1, amount: 195 } });
  assert.deepEqual(summary.impact, { low: 2, moderate: 2, high: 1 });
  assert.equal(summary.options, 5);
});

test("combined goal progress is weighted by target amounts instead of averaging percentages", () => {
  const summary = summarizeGoals([
    { targetAmount: 100, currentAmount: 100, weeklyContribution: 0 },
    { targetAmount: 900, currentAmount: 100, weeklyContribution: 25 },
  ]);
  assert.deepEqual(summary, { saved: 200, target: 1000, weekly: 25, progress: 20, completed: 1 });
  assert.equal(summarizeGoals([]).progress, 0);
});

test("impact levels use the thresholds explained in the interface", () => {
  assert.equal(impactLevel(2), "low");
  assert.equal(impactLevel(3), "moderate");
  assert.equal(impactLevel(8), "moderate");
  assert.equal(impactLevel(9), "high");
});
