import { analyzeProduct } from "./product-calculations.ts";
import type { ProductAnalysis, ProductScorePreferences } from "./product-model.ts";

export type ScoreFactor = { key: Exclude<keyof ProductScorePreferences, "version">; label: string; value: number | null; limit: number; percent: number | null; unit: "money" | "months" | "rating"; missing: string[] };
const ceilingFit = (actual: number, limit: number) => actual <= limit ? 100 : limit / actual * 100;
const floorFit = (actual: number, target: number) => Math.min(100, actual / target * 100);

/** An explicit equal-weight fit index, not a probability, affordability check, or recommendation. */
export function productScore(analysis: ProductAnalysis) {
  const result = analyzeProduct(analysis);
  const preferences = analysis.scorePreferences;
  if (!preferences) return null;
  const factors: ScoreFactor[] = [];
  const costFields = ["tax", "shipping", "maintenanceYearly", "accessories", "subscription", "repairs", "resale"] as const;
  const ongoingFields = ["maintenanceYearly", "accessories", "subscription", "repairs"] as const;
  const names = { tax: "tax", shipping: "shipping", maintenanceYearly: "maintenance", accessories: "accessories", subscription: "subscription", repairs: "repairs", resale: "resale" };
  const missingCosts = costFields.filter(key => analysis[key] === null).map(key => names[key]);
  const missingOngoing = ongoingFields.filter(key => analysis[key] === null).map(key => names[key]);
  const add = (key: ScoreFactor["key"], label: string, value: number | null, unit: ScoreFactor["unit"], missing: string[], minimum = false) => {
    const limit = preferences[key];
    if (limit === null) return;
    const percent = missing.length || value === null ? null : minimum ? floorFit(value, limit) : ceilingFit(value, limit);
    factors.push({ key, label, value, limit, percent, unit, missing });
  };
  add("maxNetCost", "Net ownership cost", result.net, "money", missingCosts);
  add("maxCostPerUse", "Cost per use", result.costPerUse, "money", [...missingCosts, ...(result.totalUses === 0 ? ["positive expected usage"] : [])]);
  add("maxOngoingCost", "Ongoing costs", result.ownership, "money", missingOngoing);
  add("minMonths", "Planned ownership", result.months, "months", [], true);
  add("minUsefulness", "Expected usefulness", analysis.usefulness, "rating", [], true);
  const complete = factors.every(factor => factor.percent !== null);
  return { percent: complete ? Math.round(factors.reduce((sum, factor) => sum + factor.percent!, 0) / factors.length) : null, factors };
}
