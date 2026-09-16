import assert from "node:assert/strict";
import test from "node:test";
import { deleteGoal, GOALS_STORAGE_KEY, goalProjection, parseGoals, parseLocalDate, storeGoal } from "../app/savings-goals.ts";

const goal = { id: "laptop", name: "Laptop", targetAmount: 1500, currentAmount: 900, weeklyContribution: 30, targetDate: "2027-02-03", createdAt: "2026-09-16T12:00:00.000Z" };
const now = new Date("2026-09-16T12:00:00");
function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("multiple goals survive rereading, editing, and deleting without touching legacy decisions", () => {
  const storage = memoryStorage();
  storage.setItem("decisionlab.saved-decisions.v1", "legacy decisions");
  storeGoal(storage, goal);
  const trip = { ...goal, id: "trip", name: "Trip" };
  storeGoal(storage, trip);
  assert.deepEqual(parseGoals(storage.getItem(GOALS_STORAGE_KEY)), [goal, trip]);
  const edited = { ...goal, currentAmount: 1000, targetDate: undefined };
  storeGoal(storage, edited, true);
  assert.equal(parseGoals(storage.getItem(GOALS_STORAGE_KEY))[0].currentAmount, 1000);
  assert.equal(parseGoals(storage.getItem(GOALS_STORAGE_KEY))[0].targetDate, undefined);
  deleteGoal(storage, "trip");
  assert.equal(parseGoals(storage.getItem(GOALS_STORAGE_KEY)).length, 1);
  assert.equal(storage.getItem("decisionlab.saved-decisions.v1"), "legacy decisions");
});

test("goals deleted by another tab are not resurrected by a stale edit", () => {
  const storage = memoryStorage();
  storeGoal(storage, goal);
  deleteGoal(storage, goal.id);
  assert.throws(() => storeGoal(storage, goal, true), /another tab/);
  assert.deepEqual(parseGoals(storage.getItem(GOALS_STORAGE_KEY)), []);
});

test("unreadable goals and duplicate IDs are kept intact on save or delete", () => {
  for (const raw of ["broken", "{}", '[{"name":"unknown"}]', JSON.stringify([goal, goal])]) {
    const storage = memoryStorage();
    storage.setItem(GOALS_STORAGE_KEY, raw);
    assert.throws(() => storeGoal(storage, goal));
    assert.throws(() => deleteGoal(storage, goal.id));
    assert.equal(storage.getItem(GOALS_STORAGE_KEY), raw);
  }
});

test("goal input validation rejects bad amounts and impossible dates", () => {
  for (const invalid of [
    { name: " " }, { targetAmount: 0 }, { currentAmount: -1 },
    { weeklyContribution: -1 }, { weeklyContribution: 0.001 },
    { targetAmount: Infinity }, { targetDate: "2026-02-30" }, { createdAt: "invalid" },
  ]) assert.throws(() => storeGoal(memoryStorage(), { ...goal, ...invalid }));
  assert.ok(parseLocalDate("2028-02-29"));
  assert.equal(parseLocalDate("2026-02-29"), null);
  assert.equal(parseLocalDate("2026-13-01"), null);
});

test("forecast uses whole weeks, local calendar dates, and the requested target date", () => {
  const result = goalProjection(goal, now);
  assert.equal(result.weeks, 20);
  assert.equal(result.progress, 60);
  assert.equal(result.completionDate.getFullYear(), 2027);
  assert.equal(result.completionDate.getMonth(), 1);
  assert.equal(result.completionDate.getDate(), 3);
  assert.equal(result.onTrack, true);
  assert.equal(goalProjection({ ...goal, targetDate: "2027-02-02" }, now).onTrack, false);
});

test("cent arithmetic prevents extra weeks; completed and paused goals have distinct outcomes", () => {
  assert.equal(goalProjection({ ...goal, targetAmount: 0.28, currentAmount: 0, weeklyContribution: 0.07 }, now).weeks, 4);
  const paused = goalProjection({ ...goal, weeklyContribution: 0 }, now);
  assert.equal(paused.weeks, null);
  assert.equal(paused.completionDate, null);
  const completed = goalProjection({ ...goal, currentAmount: 1500, weeklyContribution: 0 }, now);
  assert.equal(completed.weeks, 0);
  assert.equal(completed.progress, 100);
  assert.equal(completed.completionDate.getDate(), now.getDate());
});

test("very distant forecasts do not produce invalid calendar dates", () => {
  const result = goalProjection({ ...goal, targetAmount: 1_000_000_000, currentAmount: 0, weeklyContribution: 0.01 }, now);
  assert.equal(result.weeks, 100_000_000_000);
  assert.equal(result.completionDate, null);
});

test("blocked and full storage never produce a false save success", () => {
  assert.throws(() => storeGoal({ getItem() { throw new Error("blocked"); }, setItem() {} }, goal), /blocked/);
  assert.throws(() => storeGoal({ getItem() { return null; }, setItem() { throw new Error("full"); } }, goal), /full/);
});
