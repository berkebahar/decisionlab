import assert from "node:assert/strict";
import test from "node:test";
import { deleteDecision, parseDecisions, STORAGE_KEY, storeDecision } from "../app/saved-decisions-storage.ts";

const decision = {
  id: "first", mode: "purchase", goalName: "Laptop", goalPrice: 1500,
  amountSaved: 900, weeklySavings: 30, savedAt: "2026-09-16T12:00:00.000Z",
  purchases: [{ name: "Shoes", price: 120, extraWeeks: 4 }],
};

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("saved comparisons can be read by a fresh consumer after a reload", () => {
  const storage = memoryStorage();
  storeDecision(storage, decision);
  assert.deepEqual(parseDecisions(storage.getItem(STORAGE_KEY)), [decision]);
});

test("deleting one comparison keeps other comparisons and survives rereading", () => {
  const storage = memoryStorage();
  const second = { ...decision, id: "second" };
  storeDecision(storage, decision);
  storeDecision(storage, second);
  deleteDecision(storage, "first");
  assert.deepEqual(parseDecisions(storage.getItem(STORAGE_KEY)), [second]);
  deleteDecision(storage, "second");
  assert.deepEqual(parseDecisions(storage.getItem(STORAGE_KEY)), []);
});

test("two-option and recurring comparisons retain their prices and delays", () => {
  const storage = memoryStorage();
  const compared = { ...decision, mode: "compare", purchases: [...decision.purchases, { name: "Headphones", price: 75, extraWeeks: 3 }] };
  const recurring = { ...decision, id: "recurring", mode: "recurring", purchases: [{ name: "Coffee", price: 780, extraWeeks: 26 }] };
  storeDecision(storage, compared);
  storeDecision(storage, recurring);
  assert.deepEqual(parseDecisions(storage.getItem(STORAGE_KEY)), [recurring, compared]);
});

test("malformed stored data is preserved instead of silently overwritten", () => {
  const storage = memoryStorage();
  for (const raw of ["broken json", "{}", '[{"id":"invalid"}]']) {
    storage.setItem(STORAGE_KEY, raw);
    assert.throws(() => storeDecision(storage, decision));
    assert.throws(() => deleteDecision(storage, "first"));
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test("invalid saved dates, amounts, and option counts are rejected", () => {
  for (const invalid of [
    { ...decision, savedAt: "not a date" },
    { ...decision, amountSaved: -1 },
    { ...decision, weeklySavings: 0 },
    { ...decision, mode: "compare" },
    { ...decision, purchases: [{ name: "Shoes", price: -1, extraWeeks: 4 }] },
  ]) assert.throws(() => parseDecisions(JSON.stringify([invalid])));
});

test("storage failures propagate so the UI cannot announce a false success", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() {} };
  const full = { getItem() { return null; }, setItem() { throw new Error("quota"); } };
  assert.throws(() => storeDecision(blocked, decision), /blocked/);
  assert.throws(() => storeDecision(full, decision), /quota/);
});
