import { analyzeProduct } from "../products/product-calculations.ts";
import { formatMoney, formatUnitCost, type ProductAnalysis } from "../products/product-model.ts";

/** One fictional example across the hero, scroll story, and lifecycle explorer. */
export const storyProduct: ProductAnalysis = {
  name: "Fictional everyday camera", model: "Illustration only", category: "hobby", customCategory: "",
  condition: "new", currency: "USD", price: 899, tax: 0, shipping: 0,
  duration: 2, durationUnit: "years", uses: 5, useFrequency: "week",
  maintenanceYearly: 90, accessories: 120, subscription: 10, subscriptionFrequency: "month",
  repairs: 0, resale: 310, purpose: "Personal photography — fictional example", replaces: false,
  importance: 3, usefulness: 3, alternative: null, nextBestUse: "Keep money available", goal: null,
};
export const storyResult = analyzeProduct(storyProduct);
export const storyMoney = (value: number) => formatMoney(value, storyProduct.currency);
export const storyUnitCost = formatUnitCost(storyResult.costPerUse!, storyProduct.currency);
export const storyAssumptions = "Fictional camera · USD · 24 months · 5 uses per week. Tax, shipping and repairs: $0. Accessories: $120 total; maintenance: $90/year; subscription: $10/month. Resale is an estimate. Nothing saved.";
export const storyStages = [
  { label: "Buy", title: "The price you see.", detail: "The sticker price is the starting point, before the costs of owning it.", value: storyMoney(storyResult.initial), caption: "Initial cost", material: "price" },
  { label: "Maintain", title: "Make room for the extras.", detail: `${storyMoney(storyProduct.accessories!)} accessories + ${storyMoney(storyResult.maintenance)} maintenance over 24 months.`, value: storyMoney(storyResult.initial + storyProduct.accessories! + storyResult.maintenance), caption: "Price + accessories + maintenance", material: "extras" },
  { label: "Subscribe", title: "Small payments accumulate.", detail: `${storyMoney(storyProduct.subscription!)} a month becomes ${storyMoney(storyResult.subscriptions)} over two years.`, value: storyMoney(storyResult.initial + storyResult.ownership), caption: "Gross ownership cost", material: "recurring" },
  { label: "Resell", title: "What might come back?", detail: `${storyMoney(storyResult.resaleDeduction)} expected resale reduces the estimate. It is never guaranteed.`, value: storyMoney(storyResult.net), caption: "After estimated resale", material: "resale" },
  { label: "True cost", title: "The whole picture, on paper.", detail: `Across 520 expected uses, that is ${storyUnitCost} per use. Your assumptions shape the result.`, value: storyMoney(storyResult.net), caption: "Estimated true cost", material: "receipt" },
] as const;

export const lifecycleStages = [
  { label: "Sticker price", value: storyMoney(storyProduct.price), unit: "at purchase", detail: "One visible number. A starting point, not the complete ownership cost.", material: "price" },
  { label: "Ownership", value: `+${storyMoney(storyResult.ownership)}`, unit: "over 24 months", detail: "$120 accessories + $180 maintenance + $240 subscriptions. Expenses add up over time.", material: "ownership" },
  { label: "Resale", value: `−${storyMoney(storyResult.resaleDeduction)}`, unit: "estimated deduction", detail: "A possible return at the end of ownership. An assumption, not a promise.", material: "resale" },
  { label: "True cost", value: storyMoney(storyResult.net), unit: "net ownership", detail: "Sticker price + ownership expenses − expected resale. The complete estimate.", material: "receipt" },
  { label: "Cost per use", value: storyUnitCost, unit: "per expected use", detail: "520 expected uses across two years. Fewer uses mean a higher cost per use.", material: "usage" },
] as const;

/** Presentation only: clamp scroll position, never interpolate financial amounts. */
export function storyIndex(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(storyStages.length - 1, Math.max(0, Math.floor(progress * storyStages.length)));
}
