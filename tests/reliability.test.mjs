import assert from "node:assert/strict";
import test from "node:test";
import { calculateRecurring, calculateSavings } from "../app/goal-lens-calculations.ts";
import { parseDecisions, STORAGE_KEY, storeDecision, updateJournal } from "../app/saved-decisions-storage.ts";
import { GOALS_STORAGE_KEY, goalProjection, parseGoals, storeGoal } from "../app/savings-goals.ts";
import { SCENARIOS_STORAGE_KEY, storeScenario } from "../app/simulator/scenario-storage.ts";
import { summarizeDecisions, summarizeGoals } from "../app/insights/insight-calculations.ts";
import { commitImport, parseBackup, previewImport, readBackup } from "../app/data-backup.ts";

const goal = { id: "goal", name: "Laptop", targetAmount: 1500, currentAmount: 900, weeklyContribution: 30, createdAt: "2026-09-16T12:00:00Z" };
const decision = { id: "choice", mode: "purchase", goalName: "Laptop", goalPrice: 1500, amountSaved: 900, weeklySavings: 30, purchases: [{ name: "Shoes", price: 120, extraWeeks: 4 }], savedAt: goal.createdAt };
const scenario = { id: "scenario", goalName: "Laptop", goalPrice: 1500, amountSaved: 1600, current: { weeklySavings: 30, spending: 120 }, alternative: { weeklySavings: 40, spending: 75 }, savedAt: goal.createdAt };
const blank = { format: "decisionlab-backup", version: 1, goals: [], decisions: [], scenarios: [] };
function memory() { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; }

test("recurring contribution is reduced once; annual equivalent is not the delay", () => {
  const result = calculateRecurring({ goalPrice: 1500, amountSaved: 900, weeklySavings: 30, costPerPurchase: 5, frequency: 3 });
  assert.equal(result.netWeeklySavings, 15);
  assert.equal(result.withPurchase, 40);
  assert.equal(result.extraWeeks, 20);
  assert.notEqual(result.extraWeeks, result.yearlyCost / 30);
});
test("zero or negative net contribution cannot fund an unfinished goal", () => {
  for (const costPerPurchase of [10, 11]) assert.match(calculateRecurring({ goalPrice: 1500, amountSaved: 900, weeklySavings: 30, costPerPurchase, frequency: 3 }).error, /Goal cannot be reached under these assumptions/);
  assert.equal(calculateRecurring({ goalPrice: 1500, amountSaved: 1600, weeklySavings: 30, costPerPurchase: 11, frequency: 3 }).withPurchase, 0);
});
test("recurring fractional dollars use cent precision and round final deposits", () => {
  const result = calculateRecurring({ goalPrice: .28, amountSaved: 0, weeklySavings: .14, costPerPurchase: .07, frequency: 1 });
  assert.equal(result.withoutPurchase, 2); assert.equal(result.withPurchase, 4);
});
test("overfunded balances survive all storage schemas and cap progress", () => {
  const store = memory(); storeGoal(store, { ...goal, currentAmount: 1600 }); storeDecision(store, { ...decision, amountSaved: 1600 }); storeScenario(store, scenario);
  assert.equal(parseGoals(store.getItem(GOALS_STORAGE_KEY))[0].currentAmount, 1600);
  const result = goalProjection({ ...goal, currentAmount: 1600 }, new Date());
  assert.equal(result.weeks, 0); assert.equal(result.progress, 100);
  assert.equal(summarizeGoals([{ ...goal, currentAmount: 1600 }]).progress, 100);
  assert.equal(summarizeGoals([{ ...goal, currentAmount: 1600 }]).completed, 1);
  assert.equal(calculateSavings({ goalPrice: 1500, amountSaved: 1600, weeklySavings: 30, purchasePrice: 120 }).withPurchase, 1);
});
test("journal updates preserve legacy snapshots and unrelated records", () => {
  const store = memory(); storeDecision(store, decision); storeDecision(store, { ...decision, id: "other" });
  const journal = { outcome: "bought", reason: "Needed for class", reflection: "Useful" };
  updateJournal(store, decision.id, journal);
  assert.deepEqual(parseDecisions(store.getItem(STORAGE_KEY))[1], { ...decision, journal });
  assert.deepEqual(parseDecisions(store.getItem(STORAGE_KEY))[0], { ...decision, id: "other" });
  assert.throws(() => updateJournal(store, "missing", journal));
  assert.throws(() => updateJournal(store, decision.id, { ...journal, reason: "a".repeat(501) }));
});
test("legacy recurring equivalents do not enter delay impact statistics", () => {
  const summary = summarizeDecisions([{ ...decision, mode: "recurring" }, decision]);
  assert.equal(summary.options, 1); assert.equal(summary.impact.moderate, 1);
  assert.equal(summary.modes.recurring.count, 1);
  assert.equal("totalDelay" in summary, false);
});
test("backup round trip retains journals and merges without replacing existing IDs", () => {
  const store = memory(); storeGoal(store, goal); storeDecision(store, decision); storeScenario(store, scenario);
  updateJournal(store, decision.id, { outcome: "postponed", reason: "Later", reflection: "" });
  const exported = parseBackup(JSON.stringify(readBackup(store)));
  const other = memory(); storeGoal(other, { ...goal, name: "Keep my edit" }); other.setItem("unrelated", "keep");
  const preview = previewImport(other, exported); assert.deepEqual(preview.additions, { products: 0, goals: 0, decisions: 1, scenarios: 1 });
  commitImport(other, preview);
  assert.equal(readBackup(other).goals[0].name, "Keep my edit");
  assert.deepEqual(readBackup(other).decisions, exported.decisions);
  assert.equal(other.getItem("unrelated"), "keep");
});
test("imports reject oversized, malformed, duplicate, negative and fractional records", () => {
  for (const raw of ["a".repeat(1_000_001), "{", "null", JSON.stringify({ ...blank, version: 99 }), JSON.stringify({ ...blank, goals: [goal, goal] }), JSON.stringify({ ...blank, goals: [{ ...goal, currentAmount: -1 }] }), JSON.stringify({ ...blank, decisions: [{ ...decision, weeklySavings: .001 }] }), JSON.stringify({ ...blank, scenarios: Array(1001).fill(scenario) })]) assert.throws(() => parseBackup(raw));
});
test("unreadable storage and changed previews cannot be overwritten by import", () => {
  const store = memory(); store.setItem(STORAGE_KEY, "broken");
  assert.throws(() => previewImport(store, blank)); assert.equal(store.getItem(STORAGE_KEY), "broken");
  const valid = memory(); const preview = previewImport(valid, { ...blank, goals: [goal] }); storeGoal(valid, { ...goal, id: "new" });
  assert.throws(() => commitImport(valid, preview), /another tab/); assert.equal(readBackup(valid).goals[0].id, "new");
});
test("a failed multi-key import rolls back only DecisionLab keys", () => {
  const store = memory(); storeGoal(store, goal); store.setItem("unrelated", "keep");
  const before = readBackup(store); const preview = previewImport(store, { ...blank, decisions: [decision], scenarios: [scenario] });
  const failing = { ...store, setItem(key, value) { if (key === SCENARIOS_STORAGE_KEY) throw Error("quota"); store.setItem(key, value); } };
  assert.throws(() => commitImport(failing, preview), /restored/);
  assert.deepEqual(readBackup(store), before); assert.equal(store.getItem("unrelated"), "keep");
});
