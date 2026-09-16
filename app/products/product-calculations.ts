import { isAnalysis, isReview, type ProductAnalysis, type ProductRecord, type PurchaseReview } from "./product-model.ts";

const cents = (value: number | null) => Math.round((value ?? 0) * 100);
export const costLabels = { tax: "Tax", shipping: "Shipping", maintenanceYearly: "Yearly maintenance", accessories: "Accessories / consumables", subscription: "Required subscription", repairs: "Repair allowance", resale: "Resale value" } as const;
export function analyzeProduct(a: ProductAnalysis) {
  if (!isAnalysis(a)) throw new Error("Check the product inputs. Use finite nonnegative amounts with at most two decimal places.");
  const months = a.duration * (a.durationUnit === "years" ? 12 : 1);
  const initialCents = cents(a.price) + cents(a.tax) + cents(a.shipping);
  const maintenanceCents = Math.round(cents(a.maintenanceYearly) * months / 12);
  const subscriptionCents = Math.round(cents(a.subscription) * months / (a.subscriptionFrequency === "year" ? 12 : 1));
  const ownershipCents = maintenanceCents + cents(a.accessories) + subscriptionCents + cents(a.repairs);
  const gross = initialCents + ownershipCents;
  const resaleCents = Math.min(cents(a.resale), gross);
  const netCents = gross - resaleCents;
  const totalUses = a.uses * months * (a.useFrequency === "week" ? 52 / 12 : 1);
  const missing: string[] = (Object.keys(costLabels) as (keyof typeof costLabels)[]).filter(key => a[key] === null).map(key => costLabels[key]);
  if (!a.purpose.trim()) missing.push("Purpose");
  if (!a.nextBestUse.trim()) missing.push("Next-best use of the money");
  const g = a.goal;
  let goal: { baseline: number | null; withPurchase: number | null; delay: number | null; unit: "week" | "month" } | null = null;
  if (g) {
    const remaining = Math.max(0, cents(g.target) - cents(g.saved));
    const after = Math.max(0, cents(g.target) - cents(g.saved) + initialCents);
    const contribution = cents(g.contribution);
    const baseline = remaining === 0 ? 0 : contribution === 0 ? null : Math.ceil(remaining / contribution);
    const withPurchase = after === 0 ? 0 : contribution === 0 ? null : Math.ceil(after / contribution);
    goal = { baseline, withPurchase, delay: baseline === null || withPurchase === null ? null : withPurchase - baseline, unit: g.frequency };
  }
  return { months, initial: initialCents / 100, maintenance: maintenanceCents / 100, subscriptions: subscriptionCents / 100,
    ownership: ownershipCents / 100, resaleDeduction: resaleCents / 100, resaleCapped: cents(a.resale) > gross,
    net: netCents / 100, totalUses, costPerUse: totalUses > 0 ? netCents / 100 / totalUses : null,
    alternativeDifference: a.alternative ? (cents(a.price) - cents(a.alternative.price)) / 100 : null,
    ongoingShare: gross ? ownershipCents / gross : 0, missing, goal };
}
export function actualResults(a: ProductAnalysis, review: PurchaseReview, asOf: Date = new Date()) {
  if (!isReview(review)) throw new Error("Check your actual purchase records.");
  const planned = analyzeProduct(a);
  const known = [review.price, review.tax, review.shipping, review.maintenance, review.accessories, review.subscriptions, review.repairs];
  const gross = known.reduce<number>((sum, value) => sum + cents(value), 0);
  const resale = review.lifecycle === "sold" ? cents(review.resale) : 0;
  const cost = Math.max(0, gross - resale) / 100;
  const complete = known.every(v => v !== null) && (review.lifecycle !== "sold" || review.resale !== null);
  const elapsedDays = review.purchaseDate ? Math.max(0, (asOf.getTime() - new Date(`${review.purchaseDate}T12:00:00`).getTime()) / 86_400_000) : null;
  const expectedUsesToDate = elapsedDays === null ? null : a.uses * Math.min(elapsedDays / (365.25 / 12), planned.months) * (a.useFrequency === "week" ? 52 / 12 : 1);
  return { cost, complete, costPerUse: review.uses !== null && review.uses > 0 ? cost / review.uses : null, expectedUsesToDate, planned,
    resaleCapped: resale > gross, costKnown: known.some(v => v !== null), actualUses: review.uses };
}
export function compareProducts(products: ProductAnalysis[]) {
  if (products.length < 1 || products.length > 3) throw new Error("Compare one to three products.");
  const results = products.map(analyzeProduct);
  const sameCurrency = products.every(p => p.currency === products[0].currency);
  return { results, sameCurrency, netDifferences: results.map(r => sameCurrency ? (Math.round(r.net * 100) - Math.round(results[0].net * 100)) / 100 : null) };
}
export function productInsights(records: ProductRecord[]) {
  const counts = { analyzed: 0, considering: 0, bought: 0, skipped: 0, postponed: 0 };
  const categories: Record<string, number> = {};
  const satisfaction: Record<string, { sum: number; count: number }> = {};
  let reviewed = 0, again = 0, notAgain = 0;
  const waits: number[] = [];
  for (const record of records) {
    counts[record.status]++;
    const category = record.analysis.category === "custom" ? "custom" : record.analysis.category;
    categories[category] = (categories[category] ?? 0) + 1;
    if (record.scheduledOn && record.reconsiderOn) waits.push((Date.parse(`${record.reconsiderOn}T00:00:00Z`) - Date.parse(`${record.scheduledOn}T00:00:00Z`)) / 86_400_000);
    if (record.status === "bought" && record.review) {
      reviewed++;
      if (record.review.buyAgain === "yes") again++;
      if (record.review.buyAgain === "no") notAgain++;
      if (record.review.satisfaction !== null) {
        const item = satisfaction[category] ?? { sum: 0, count: 0 };
        satisfaction[category] = { sum: item.sum + record.review.satisfaction, count: item.count + 1 };
      }
    }
  }
  return { counts, categories, satisfaction, reviewed, again, notAgain, averagePlannedWait: waits.length ? waits.reduce((a,b) => a+b,0) / waits.length : null, scheduledCount: waits.length };
}
