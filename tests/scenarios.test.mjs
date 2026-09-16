import assert from "node:assert/strict";
import test from "node:test";
import { deleteScenario, parseScenarios, SCENARIOS_STORAGE_KEY, storeScenario } from "../app/simulator/scenario-storage.ts";

const scenario = {
  id: "first", goalName: "Travel fund", goalPrice: 1000, amountSaved: 400,
  current: { weeklySavings: 40, spending: 180 }, alternative: { weeklySavings: 55, spending: 60 },
  savedAt: "2026-09-16T12:00:00.000Z",
};
function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("scenario plans preserve independent weekly contributions and spending on reload", () => {
  const storage = memoryStorage();
  storage.setItem("decisionlab.saved-decisions.v1", "existing decisions");
  storeScenario(storage, scenario);
  storeScenario(storage, { ...scenario, id: "second" });
  deleteScenario(storage, "second");
  assert.deepEqual(parseScenarios(storage.getItem(SCENARIOS_STORAGE_KEY)), [scenario]);
  assert.equal(storage.getItem("decisionlab.saved-decisions.v1"), "existing decisions");
});

test("malformed and duplicate saved scenarios are not overwritten", () => {
  for (const raw of ["broken", "{}", JSON.stringify([scenario, scenario])]) {
    const storage = memoryStorage();
    storage.setItem(SCENARIOS_STORAGE_KEY, raw);
    assert.throws(() => storeScenario(storage, scenario));
    assert.throws(() => deleteScenario(storage, scenario.id));
    assert.equal(storage.getItem(SCENARIOS_STORAGE_KEY), raw);
  }
});

test("scenario validation rejects amounts and plans that cannot produce a timeline", () => {
  for (const invalid of [
    { goalName: " " }, { goalPrice: 0 }, { amountSaved: -1 }, { savedAt: "invalid" },
    { current: { weeklySavings: 0, spending: 10 } },
    { alternative: { weeklySavings: 1, spending: -1 } },
    { alternative: { weeklySavings: 0.001, spending: 10 } },
    { goalPrice: 1_000_000_001 },
  ]) assert.throws(() => storeScenario(memoryStorage(), { ...scenario, ...invalid }));
});

test("scenario save failures propagate without announcing a successful save", () => {
  assert.throws(() => storeScenario({ getItem() { throw new Error("blocked"); }, setItem() {} }, scenario), /blocked/);
  assert.throws(() => storeScenario({ getItem() { return null; }, setItem() { throw new Error("full"); } }, scenario), /full/);
});
