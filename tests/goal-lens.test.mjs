import assert from "node:assert/strict";
import test from "node:test";
import { calculateRecurring, calculateSavings, moneyError, usd } from "../app/goal-lens-calculations.ts";

const example = { purchasePrice: 120, goalPrice: 1500, amountSaved: 900, weeklySavings: 30 };

test("the USD example adds four weeks and is 60% funded", () => {
  assert.deepEqual(calculateSavings(example), {
    withoutPurchase: 20, withPurchase: 24, extraWeeks: 4, progress: 60,
  });
  assert.equal(usd.format(1500), "$1,500.00");
  assert.equal(usd.format(120), "$120.00");
});

test("rounds each timeline up before finding the extra weeks", () => {
  const result = calculateSavings({ ...example, goalPrice: 100, amountSaved: 0, purchasePrice: 1 });
  assert.equal(result.withoutPurchase, 4);
  assert.equal(result.withPurchase, 4);
  assert.equal(result.extraWeeks, 0);
});

test("decimal dollars do not introduce a phantom week", () => {
  const result = calculateSavings({ goalPrice: 0.28, amountSaved: 0, purchasePrice: 0.14, weeklySavings: 0.07 });
  assert.equal(result.withoutPurchase, 4);
  assert.equal(result.withPurchase, 6);
  assert.equal(result.extraWeeks, 2);
});

test("zero weekly savings returns friendly validation", () => {
  assert.match(calculateSavings({ ...example, weeklySavings: 0 }).error, /weekly savings amount greater than \$0.00/);
});

test("negative, non-finite, and excessive amounts cannot enter calculations", () => {
  for (const key of Object.keys(example)) {
    for (const value of [-1, NaN, Infinity, 1_000_000_001]) {
      assert.ok(calculateSavings({ ...example, [key]: value }).error);
    }
  }
});

test("savings above the selected goal absorb purchases without negative time", () => {
  assert.deepEqual(calculateSavings({ ...example, amountSaved: 2000 }), { withoutPurchase: 0, withPurchase: 0, extraWeeks: 0, progress: 100 });
});

test("two purchases use the same baseline and preserve their individual delays", () => {
  const shoes = calculateSavings(example);
  const headphones = calculateSavings({ ...example, purchasePrice: 75 });
  assert.equal(shoes.withoutPurchase, headphones.withoutPurchase);
  assert.equal(headphones.withPurchase, 23);
  assert.equal(headphones.extraWeeks, 3);
  assert.equal(shoes.extraWeeks - headphones.extraWeeks, 1);
});

test("recurring spending uses 52 weeks and 12 average months", () => {
  const result = calculateRecurring({ ...example, costPerPurchase: 5, frequency: 3 });
  assert.equal(result.yearlyCost, 780);
  assert.equal(result.monthlyCost, 65);
  assert.equal(result.withoutPurchase, 20);
  assert.equal(result.withPurchase, 40);
  assert.equal(result.extraWeeks, 20);
});

test("recurring spending rejects invalid frequencies, rates, and annual totals", () => {
  for (const frequency of [-1, 0.5, 1001, NaN, Infinity]) {
    assert.ok(calculateRecurring({ ...example, costPerPurchase: 5, frequency }).error);
  }
  assert.ok(calculateRecurring({ ...example, costPerPurchase: -5, frequency: 3 }).error);
  assert.ok(calculateRecurring({ ...example, costPerPurchase: 1_000_000_000, frequency: 3 }).error);
  assert.ok(calculateRecurring({ ...example, weeklySavings: 0, costPerPurchase: 5, frequency: 3 }).error);
  assert.equal(calculateRecurring({ ...example, amountSaved: 2000, costPerPurchase: 5, frequency: 3 }).withPurchase, 0);
});

test("zero-frequency spending has no costs or delay", () => {
  const result = calculateRecurring({ ...example, costPerPurchase: 5, frequency: 0 });
  assert.equal(result.yearlyCost, 0);
  assert.equal(result.monthlyCost, 0);
  assert.equal(result.extraWeeks, 0);
});

test("amounts accept cents and reject fractional cents", () => {
  assert.equal(moneyError(19.99), undefined);
  assert.match(moneyError(19.999), /two decimal places/);
  assert.ok(calculateSavings({ ...example, weeklySavings: 0.001 }).error);
});

test("a purchase can delay an otherwise completed goal", () => {
  const result = calculateSavings({ ...example, amountSaved: 1500 });
  assert.equal(result.withoutPurchase, 0);
  assert.equal(result.withPurchase, 4);
});

test("a zero-price goal is complete, without dividing by zero", () => {
  assert.deepEqual(calculateSavings({ ...example, goalPrice: 0, amountSaved: 0 }), {
    withoutPurchase: 0, withPurchase: 0, extraWeeks: 0, progress: 100,
  });
});

test("purchases exceeding current savings still count against the shared budget", () => {
  const result = calculateSavings({ ...example, amountSaved: 0 });
  assert.equal(result.withoutPurchase, 50);
  assert.equal(result.withPurchase, 54);
  assert.equal(result.progress, 0);
});
