import test from "node:test";
import assert from "node:assert/strict";
import { demoGroups } from "../app/products/demo-products.ts";
import { isAnalysis, isProduct, formatUnitCost } from "../app/products/product-model.ts";
import { analyzeProduct, actualResults, compareProducts, productInsights } from "../app/products/product-calculations.ts";
import { PRODUCTS_STORAGE_KEY, parseProducts, saveProduct, editAnalysis, updateProductDecision, saveReview, deleteProduct } from "../app/products/product-storage.ts";
import { parseBackup, readBackup, previewImport, commitImport } from "../app/data-backup.ts";
import { STORAGE_KEY } from "../app/saved-decisions-storage.ts";

const analysis = { ...demoGroups[0].products[0], price: 100, tax: 10, shipping: 5, duration: 2, durationUnit: "years", uses: 2, useFrequency: "week", maintenanceYearly: 12, accessories: 20, subscription: 3, subscriptionFrequency: "month", repairs: 10, resale: 30 };
const record = { id: "product-1", createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T12:00:00.000Z", analysis, status: "considering", reason: "" };
const review = { price: 90, tax: 10, shipping: 5, purchaseDate: "2026-01-01", uses: 20, maintenance: 4, accessories: 10, subscriptions: 12, repairs: 0, satisfaction: 4, buyAgain: "yes", lifecycle: "sold", resale: 30, reflection: "Useful so far", updatedAt: "2026-07-01T12:00:00.000Z" };
function storage() { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key,value) => data.set(key,value), removeItem: key => data.delete(key) }; }

test("receipt adds upfront and period expenses, deducts resale, and divides by expected uses", () => {
  const r = analyzeProduct(analysis);
  assert.equal(r.initial, 115); assert.equal(r.maintenance, 24); assert.equal(r.subscriptions, 72);
  assert.equal(r.ownership, 126); assert.equal(r.net, 211); assert.equal(r.totalUses, 208);
  assert.equal(r.costPerUse, 211 / 208);
});
test("month/year durations and monthly/annual subscription rates agree", () => {
  const monthly = analyzeProduct({ ...analysis, duration: 6, durationUnit: "months", uses: 3, useFrequency: "month", subscription: 36, subscriptionFrequency: "year" });
  assert.equal(monthly.maintenance, 6); assert.equal(monthly.subscriptions, 18); assert.equal(monthly.totalUses, 18);
  assert.equal(analyzeProduct({ ...analysis, duration: 24, durationUnit: "months" }).net, analyzeProduct(analysis).net);
});
test("cent precision is preserved when prorating annual costs", () => {
  const r = analyzeProduct({ ...analysis, maintenanceYearly: 1, duration: 1, durationUnit: "months", subscription: 1, subscriptionFrequency: "year" });
  assert.equal(r.maintenance, .08); assert.equal(r.subscriptions, .08);
});
test("zero uses produces no Infinity, and resale beyond costs cannot create negative cost", () => {
  const result = analyzeProduct({ ...analysis, uses: 0, resale: 999 });
  assert.equal(result.costPerUse, null); assert.equal(result.net, 0); assert.equal(result.resaleCapped, true);
  assert.equal(JSON.stringify(result).includes("Infinity"), false);
  assert.equal(formatUnitCost(.0001, "USD"), "<$0.01");
});
test("the True Cost floor covers zero costs, equal resale, and resale above all ownership costs", () => {
  const free = { ...analysis, price: 0, tax: 0, shipping: 0, maintenanceYearly: 0, accessories: 0, subscription: 0, repairs: 0, resale: 0 };
  const gross = analyzeProduct({ ...analysis, resale: 0 }).net;
  for (const input of [free, { ...free, resale: 100 }, { ...analysis, resale: gross }, { ...analysis, resale: gross + .01 }]) {
    const result = analyzeProduct(input);
    assert.equal(result.net, 0);
    assert.equal(result.costPerUse, 0);
    assert.equal(result.resaleDeduction, result.initial + result.ownership);
    assert.equal(result.resaleCapped, input.resale > result.initial + result.ownership);
    assert.equal(analyzeProduct({ ...input, uses: 0 }).costPerUse, null);
  }
  assert.equal(analyzeProduct({ ...analysis, resale: gross - .01 }).net, .01);
});

test("saved product analyses retain receipt assumptions; incomplete older records are preserved", () => {
  const s = storage();
  const saved = { ...record, analysis: { ...analysis, resale: 999 } };
  saveProduct(s, saved);
  const raw = s.getItem(PRODUCTS_STORAGE_KEY);
  const restored = parseProducts(raw)[0];
  assert.deepEqual(restored.analysis, saved.analysis);
  assert.deepEqual(analyzeProduct(restored.analysis), analyzeProduct(saved.analysis));
  assert.equal(analyzeProduct(restored.analysis).net, 0);
  assert.equal(s.getItem(PRODUCTS_STORAGE_KEY), raw);
  const incomplete = JSON.stringify({ version: 1, items: [{ ...record, analysis: { name: "Older incomplete record", price: 100 } }] });
  s.setItem(PRODUCTS_STORAGE_KEY, incomplete);
  assert.throws(() => parseProducts(incomplete), /preserved/);
  assert.equal(s.getItem(PRODUCTS_STORAGE_KEY), incomplete);
});
test("missing optional expenses remain explicitly unknown rather than silently confirmed zero", () => {
  const result = analyzeProduct({ ...analysis, tax: null, shipping: null, maintenanceYearly: null, accessories: null, subscription: null, repairs: null, resale: null });
  assert.equal(result.initial, 100); assert.equal(result.net, 100); assert.equal(result.missing.length, 7);
  assert.equal(analyzeProduct({ ...analysis, tax: 0 }).missing.includes("Tax"), false);
});
test("upfront-only goal delay uses separately rounded weekly or monthly deposit counts", () => {
  const goal = { name: "Reserve", target: 1500, saved: 900, contribution: 30, frequency: "week" };
  const r = analyzeProduct({ ...analysis, price: 120, tax: 0, shipping: 0, goal });
  assert.deepEqual(r.goal, { baseline: 20, withPurchase: 24, delay: 4, unit: "week" });
  const m = analyzeProduct({ ...analysis, price: 120, tax: 0, shipping: 0, goal: { ...goal, contribution: 100, frequency: "month" } });
  assert.deepEqual(m.goal, { baseline: 6, withPurchase: 8, delay: 2, unit: "month" });
  assert.equal(analyzeProduct({ ...analysis, goal: { ...goal, contribution: 0 } }).goal.delay, null);
  assert.equal(analyzeProduct({ ...analysis, goal: { ...goal, saved: 2000 } }).goal.delay, 0);
  assert.equal(analyzeProduct(analysis).goal, null);
});
test("alternative difference is explicitly a purchase-price difference", () => {
  const r = analyzeProduct({ ...analysis, alternative: { name: "Other", price: 80 } });
  assert.equal(r.alternativeDifference, 20); assert.notEqual(r.alternativeDifference, r.net - 80);
});
test("comparison supports condition variants without inventing specifications or a winner", () => {
  const products = ["new", "used", "refurbished"].map(condition => ({ ...analysis, condition }));
  const r = compareProducts(products);
  assert.deepEqual(r.netDifferences, [0,0,0]); assert.equal("winner" in r, false);
  assert.equal(compareProducts([analysis, { ...analysis, currency: "EUR" }]).netDifferences[1], null);
  assert.throws(() => compareProducts(Array(4).fill(analysis)));
  assert.throws(() => compareProducts([]));
});
test("invalid imported amounts, currencies, durations, ratings and categories are rejected", () => {
  for (const change of [{ price: -1 }, { uses: Infinity }, { price: 1.001 }, { price: 1e9+1 }, { duration: 0 }, { duration: 1201, durationUnit: "months" }, { duration: 1.5 }, { currency: "XYZ" }, { usefulness: 6 }, { category: "unknown" }, { category: "custom", customCategory: "" }, { subscription: undefined }]) assert.equal(isAnalysis({ ...analysis, ...change }), false);
  assert.equal(isProduct({ ...record, createdAt: "2026-02-30T12:00:00Z" }), false);
});
test("queue changes persist dates and freeze the estimate on first purchase", () => {
  const s = storage(); saveProduct(s, record);
  const postponed = updateProductDecision(s, record.id, { status: "postponed", reason: "Think about it", reconsiderOn: "2026-01-08", scheduledOn: "2026-01-01" }, record.updatedAt);
  assert.equal(parseProducts(s.getItem(PRODUCTS_STORAGE_KEY))[0].reconsiderOn, "2026-01-08");
  const bought = updateProductDecision(s, record.id, { status: "bought", reason: "Needed it" }, postponed.updatedAt);
  assert.deepEqual(bought.purchaseEstimate, analysis);
  const edited = editAnalysis(s, record.id, { ...analysis, price: 500 }, bought.updatedAt);
  assert.equal(edited.purchaseEstimate.price, 100); assert.equal(edited.analysis.price, 500);
});
test("stale edits and malformed storage are rejected without erasing records", () => {
  const s = storage(); saveProduct(s, record);
  const updated = editAnalysis(s, record.id, { ...analysis, price: 200 }, record.updatedAt);
  assert.notEqual(updated.updatedAt, record.updatedAt);
  assert.throws(() => editAnalysis(s, record.id, analysis, record.updatedAt), /another tab/);
  for (const raw of ["broken", "[]", JSON.stringify({version:99,items:[]}), JSON.stringify({version:1,items:[record,record]})]) {
    s.setItem(PRODUCTS_STORAGE_KEY, raw); assert.throws(() => saveProduct(s,record)); assert.throws(() => deleteProduct(s, record.id)); assert.equal(s.getItem(PRODUCTS_STORAGE_KEY), raw);
  }
});
test("purchase reviews preserve the original estimate and actuals stay distinct", () => {
  const s = storage(); saveProduct(s,record);
  assert.throws(() => saveReview(s,record.id,review,record.updatedAt));
  const bought = updateProductDecision(s,record.id,{ status:"bought", reason:"" },record.updatedAt);
  const updated = saveReview(s,record.id,review,bought.updatedAt);
  assert.deepEqual(updated.purchaseEstimate,analysis);
  const r = actualResults(updated.purchaseEstimate,review,new Date(review.updatedAt));
  assert.equal(r.cost,101); assert.equal(r.costPerUse,101/20); assert.equal(r.complete,true);
  assert.ok(r.expectedUsesToDate < r.planned.totalUses);
  assert.equal(actualResults(analysis,{...review,uses:0}).costPerUse,null);
  assert.equal(actualResults(analysis,{...review,maintenance:null}).complete,false);
  assert.equal(actualResults(analysis,{...review,lifecycle:"owned"}).cost,131);
});
test("old backup migration preserves legacy records without fabricating product assumptions", () => {
  const legacyDecision = { id:"legacy", mode:"purchase", goalName:"Laptop", goalPrice:1500, amountSaved:900, weeklySavings:30, purchases:[{name:"Shoes",price:120,extraWeeks:4}], savedAt:record.createdAt };
  const old = { format:"decisionlab-backup", version:1, goals:[], decisions:[legacyDecision], scenarios:[] };
  const migrated = parseBackup(JSON.stringify(old));
  assert.equal(migrated.version,2); assert.deepEqual(migrated.products,[]); assert.deepEqual(migrated.decisions,[legacyDecision]);
  const s = storage(); saveProduct(s,record); s.setItem("other-app", "untouched");
  const preview = previewImport(s,old); commitImport(s,preview);
  assert.equal(parseProducts(s.getItem(PRODUCTS_STORAGE_KEY)).length,1); assert.equal(JSON.parse(s.getItem(STORAGE_KEY))[0].id,"legacy"); assert.equal(s.getItem("other-app"),"untouched");
});
test("version 2 product backup round trip merges IDs without replacing reviews", () => {
  const s = storage(); saveProduct(s,record); const bought = updateProductDecision(s,record.id,{status:"bought",reason:""},record.updatedAt); saveReview(s,record.id,review,bought.updatedAt);
  const exported = readBackup(s), target = storage(); commitImport(target,previewImport(target,exported));
  assert.deepEqual(readBackup(target),exported);
  const changed = {...exported, products:exported.products.map(p=>({...p,reason:"Incoming overwrite"}))};
  commitImport(target,previewImport(target,changed)); assert.equal(readBackup(target).products[0].reason,"");
  for(const incoming of [{...exported, products:[{...record,analysis:{...analysis,price:-1}}]}, {...exported,products:[record,record]}, {...exported,version:99}, {...exported,products:Array(1001).fill(record)}]) assert.throws(()=>parseBackup(JSON.stringify(incoming)));
  assert.throws(()=>parseBackup("x".repeat(1_000_001)));
});
test("failed fourth-key imports restore legacy keys too", () => {
  const s = storage(), before = readBackup(s);
  const incoming = {...before,products:[record]}, preview = previewImport(s,incoming);
  const failing = {...s,setItem(key,value){if(key===PRODUCTS_STORAGE_KEY)throw Error("full");s.setItem(key,value);}};
  assert.throws(()=>commitImport(failing,preview),/restored/); assert.deepEqual(readBackup(s),before);
});
test("product-only deletion keeps legacy keys and blocked writes cannot claim success", () => {
  const s = storage(); s.setItem(STORAGE_KEY,"legacy untouched"); saveProduct(s,record); deleteProduct(s,record.id);
  assert.equal(s.getItem(STORAGE_KEY),"legacy untouched");
  assert.throws(()=>saveProduct({getItem(){throw Error("blocked");},setItem(){}},record),/blocked/);
  assert.throws(()=>saveProduct({getItem(){return null;},setItem(){throw Error("full");}},record),/full/);
});
test("insights separate hypotheses, purchases and reviews without inferred savings", () => {
  const summary = productInsights([record,{...record,id:"skip",status:"skipped"},{...record,id:"buy",status:"bought",purchaseEstimate:analysis,review},{...record,id:"later",status:"postponed",scheduledOn:"2026-01-01",reconsiderOn:"2026-01-08"}]);
  assert.equal(summary.counts.bought,1); assert.equal(summary.counts.skipped,1); assert.equal(summary.reviewed,1); assert.equal(summary.again,1); assert.equal(summary.averagePlannedWait,7);
  assert.deepEqual(summary.satisfaction.technology,{sum:4,count:1}); assert.equal("savings" in summary,false); assert.equal("totalDelay" in summary,false);
  assert.equal(productInsights([]).averagePlannedWait,null); assert.deepEqual(productInsights([]).satisfaction,{});
});
test("fictional demonstrations never write storage and expose all three example groups", () => {
  assert.equal(demoGroups.length,3); assert.ok(demoGroups.every(g=>g.products.every(isAnalysis)));
});
