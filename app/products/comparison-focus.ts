import type { analyzeProduct } from "./product-calculations.ts";
import { formatMoney, formatQuantity, formatUnitCost, type ProductAnalysis } from "./product-model.ts";

export const comparisonMetrics = {
  costPerUse: "Cost per use",
  trueCost: "True cost",
  purchasePrice: "Purchase price",
  resale: "Resale value",
  ongoingCost: "Ongoing cost",
  usage: "Usage",
  goalImpact: "Goal impact",
} as const;
export type ComparisonMetric = keyof typeof comparisonMetrics;

// Presentation only: every value comes from the existing receipt calculation.
export function getComparisonFocus(metric: ComparisonMetric, analysis: ProductAnalysis, result: ReturnType<typeof analyzeProduct>) {
  const money = (value: number) => formatMoney(value, analysis.currency);
  const incompleteCosts = [analysis.tax, analysis.shipping, analysis.maintenanceYearly, analysis.accessories, analysis.subscription, analysis.repairs, analysis.resale].some(value => value === null);
  const period = `${formatQuantity(result.months)} months`;
  switch (metric) {
    case "costPerUse":
      return {
        label: "Estimated cost per use",
        value: result.costPerUse === null ? "Not available" : formatUnitCost(result.costPerUse, analysis.currency),
        detail: result.costPerUse === null ? "Enter more than zero expected uses to calculate this measure." : `Across approximately ${formatQuantity(result.totalUses)} uses over ${period}.${incompleteCosts ? " Unknown costs are excluded; estimate is incomplete." : " Based on your estimates."}`,
        available: result.costPerUse !== null,
      };
    case "trueCost":
      return {
        label: "Estimated true cost",
        value: money(result.net),
        detail: `Net ownership cost over ${period}, after the modeled resale deduction.${incompleteCosts ? " Unknown costs are excluded; estimate is incomplete." : " Based on your estimates."}`,
        available: true,
      };
    case "purchasePrice":
      return { label: "Purchase price", value: money(analysis.price), detail: "Your entered price, before tax, shipping, and ownership costs.", available: true };
    case "resale":
      return {
        label: "Expected resale value",
        value: analysis.resale === null ? "Unknown" : money(analysis.resale),
        detail: analysis.resale === null ? "No resale estimate entered. It is excluded from the cost model." : `Your estimate after ${period}; not a price forecast.${result.resaleCapped ? ` The cost-model deduction is capped at ${money(result.resaleDeduction)}.` : ""}`,
        available: analysis.resale !== null,
      };
    case "ongoingCost": {
      const costs = [analysis.maintenanceYearly, analysis.accessories, analysis.subscription, analysis.repairs];
      const known = costs.some(value => value !== null);
      return {
        label: "Estimated ongoing cost",
        value: known ? money(result.ownership) : "Unknown",
        detail: !known ? "No ownership expenses entered. Unknown costs are excluded, not confirmed zero." : `Maintenance, accessories, subscriptions, and repairs across ${period}.${costs.some(value => value === null) ? " Known subtotal only; some expenses are unknown." : " All expense inputs are estimates."}`,
        available: known,
      };
    }
    case "usage":
      return { label: "Expected total usage", value: `${formatQuantity(result.totalUses)} uses`, detail: `${formatQuantity(analysis.uses)} per ${analysis.useFrequency} across ${period}. Planned use, not measured experience.`, available: true };
    case "goalImpact":
      return {
        label: "Upfront goal delay",
        value: !result.goal ? "Not included" : result.goal.delay === null ? "Not reachable" : `+${formatQuantity(result.goal.delay)} ${result.goal.unit}${result.goal.delay === 1 ? "" : "s"}`,
        detail: !result.goal ? "Add an optional savings goal to see its upfront impact." : result.goal.delay === null ? "The goal cannot be reached under the entered contribution and purchase assumptions." : `${analysis.goal!.name}. Upfront cost only; excludes the timing of future expenses and resale. Compare matching goals and units.`,
        available: !!result.goal && result.goal.delay !== null,
      };
  }
}
