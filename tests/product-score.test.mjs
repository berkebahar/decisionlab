import test from 'node:test';
import assert from 'node:assert/strict';
import { productScore } from '../app/products/product-score.ts';
import { isAnalysis, isScorePreferences } from '../app/products/product-model.ts';
import { analyzeProduct } from '../app/products/product-calculations.ts';
import { demoGroups } from '../app/products/demo-products.ts';
import { PRODUCTS_STORAGE_KEY, parseProducts, saveProduct, updateProductDecision, editAnalysis } from '../app/products/product-storage.ts';
import { readBackup, parseBackup } from '../app/data-backup.ts';
const base = { ...demoGroups[0].products[0], price: 100, tax: 0, shipping: 0, maintenanceYearly: 0, accessories: 0, subscription: 0, repairs: 0, resale: 0, duration: 12, durationUnit: 'months', uses: 10, useFrequency: 'month', usefulness: 4 };
const prefs = (overrides = {}) => ({ version: 1, maxNetCost: null, maxCostPerUse: null, maxOngoingCost: null, minMonths: null, minUsefulness: null, ...overrides });
const withScore = (preferences, overrides = {}) => ({ ...base, ...overrides, scorePreferences: prefs(preferences) });

test('old analyses remain valid and receive no invented personal score', () => {
  assert.equal(isAnalysis(base), true);
  assert.equal(productScore(base), null);
  const financial = analyzeProduct(base);
  assert.deepEqual(analyzeProduct(withScore({ minMonths: 12 })), financial);
});
test('personal score is the rounded equal-weight average with explicit limits', () => {
  const result = productScore(withScore({ maxNetCost: 50, minMonths: 24, minUsefulness: 5 }));
  assert.equal(result.percent, 60);
  assert.deepEqual(result.factors.map(f => f.percent), [50, 50, 80]);
  assert.equal(productScore(withScore({ maxNetCost: 500, minMonths: 1 })).percent, 100);
});
test('upfront fees and ongoing expenses affect costs without changing financial formulas', () => {
  const a = withScore({ maxNetCost: 100, maxOngoingCost: 50 }, { tax: 25, shipping: 25, maintenanceYearly: 100, subscription: 10, subscriptionFrequency: 'month', accessories: 30, repairs: 50 });
  const result = productScore(a);
  assert.equal(result.factors[0].value, 450);
  assert.equal(result.factors[1].value, 300);
  assert.equal(result.percent, Math.round((100 / 450 * 100 + 50 / 300 * 100) / 2));
});
test('lifespan units and usage feed personal fit; zero uses cannot inflate a score', () => {
  assert.equal(productScore(withScore({ minMonths: 24 }, { duration: 2, durationUnit: 'years' })).percent, 100);
  assert.equal(productScore(withScore({ maxCostPerUse: 1 })).percent, 100);
  assert.equal(productScore(withScore({ maxCostPerUse: 1 }, { uses: 5 })).percent, 60);
  const zero = productScore(withScore({ maxCostPerUse: 1, minMonths: 12 }, { uses: 0 }));
  assert.equal(zero.percent, null);
  assert.ok(zero.factors[0].missing.includes('positive expected usage'));
});
test('unknown required costs withhold the whole score, while irrelevant unknowns do not', () => {
  const incomplete = productScore(withScore({ maxNetCost: 500, minMonths: 12 }, { tax: null }));
  assert.equal(incomplete.percent, null);
  assert.ok(incomplete.factors[0].missing.includes('tax'));
  assert.equal(productScore(withScore({ minMonths: 12 }, { tax: null })).percent, 100);
  assert.equal(productScore(withScore({ maxOngoingCost: 50 }, { tax: null, resale: null })).percent, 100);
  assert.equal(productScore(withScore({ maxOngoingCost: 50 }, { repairs: null })).percent, null);
});
test('zero limits and zero-cost products are finite and bounded', () => {
  assert.equal(productScore(withScore({ maxNetCost: 0 })).percent, 0);
  assert.equal(productScore(withScore({ maxNetCost: 0, maxCostPerUse: 0 }, { price: 0 })).percent, 100);
  assert.equal(productScore(withScore({ maxNetCost: 0 }, { resale: 1000 })).percent, 100);
});
test('imported score preferences validate version, units, precision and at least one criterion', () => {
  assert.equal(isScorePreferences(prefs()), false);
  for (const invalid of [{ version: 2, minMonths: 12 }, { maxNetCost: -1 }, { maxNetCost: 1.001 }, { maxCostPerUse: Infinity }, { minMonths: 0 }, { minMonths: 1.5 }, { minMonths: 1201 }, { minUsefulness: 6 }, { minUsefulness: 2.5 }]) {
    assert.equal(isAnalysis({ ...base, scorePreferences: prefs(invalid) }), false);
  }
  assert.equal(isAnalysis(withScore({ maxNetCost: 0, minUsefulness: 1 })), true);
});
test('preferences survive existing storage/backups and original purchase predictions stay frozen', () => {
  const data = new Map(); const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const record = { id: 'score-fixture', createdAt: '2026-01-01T12:00:00.000Z', updatedAt: '2026-01-01T12:00:00.000Z', status: 'considering', reason: '', analysis: withScore({ maxNetCost: 500 }) };
  saveProduct(storage, record);
  assert.deepEqual(parseProducts(storage.getItem(PRODUCTS_STORAGE_KEY))[0].analysis.scorePreferences, record.analysis.scorePreferences);
  assert.deepEqual(parseBackup(JSON.stringify(readBackup(storage))).products[0].analysis.scorePreferences, record.analysis.scorePreferences);
  const bought = updateProductDecision(storage, record.id, { status: 'bought', reason: '' }, record.updatedAt);
  const edited = editAnalysis(storage, record.id, withScore({ maxNetCost: 10 }), bought.updatedAt);
  assert.equal(edited.purchaseEstimate.scorePreferences.maxNetCost, 500);
  assert.equal(edited.analysis.scorePreferences.maxNetCost, 10);
});
