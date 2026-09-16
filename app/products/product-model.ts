import { moneyError } from "../goal-lens-calculations.ts";
import { parseLocalDate } from "../savings-goals.ts";

export const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "CHF"] as const;
export type Currency = typeof currencies[number];
export const categories = ["technology", "clothing", "home", "transport", "hobby", "sports", "education", "travel gear", "custom"] as const;
export type Category = typeof categories[number];
export const conditions = ["new", "used", "refurbished"] as const;
export type Condition = typeof conditions[number];
export type GoalContext = { name: string; saved: number; target: number; contribution: number; frequency: "week" | "month" };
export type ProductScorePreferences = {
  version: 1;
  maxNetCost: number | null;
  maxCostPerUse: number | null;
  maxOngoingCost: number | null;
  minMonths: number | null;
  minUsefulness: number | null;
};
export type ProductAnalysis = {
  name: string; model: string; category: Category; customCategory: string; condition: Condition; currency: Currency;
  price: number; tax: number | null; shipping: number | null;
  duration: number; durationUnit: "months" | "years"; uses: number; useFrequency: "week" | "month";
  maintenanceYearly: number | null; accessories: number | null; subscription: number | null; subscriptionFrequency: "month" | "year";
  repairs: number | null; resale: number | null;
  purpose: string; replaces: boolean; importance: number; usefulness: number;
  alternative: { name: string; price: number } | null; nextBestUse: string; goal: GoalContext | null;
  scorePreferences?: ProductScorePreferences;
};
export const statuses = ["analyzed", "considering", "bought", "skipped", "postponed"] as const;
export type ProductStatus = typeof statuses[number];
export const statusLabels: Record<ProductStatus, string> = { analyzed: "Analyzed only", considering: "Still considering", bought: "Bought", skipped: "Skipped", postponed: "Postponed" };
export type PurchaseReview = {
  price: number | null; tax: number | null; shipping: number | null; purchaseDate: string;
  uses: number | null; maintenance: number | null; accessories: number | null; subscriptions: number | null; repairs: number | null;
  satisfaction: number | null; buyAgain: "yes" | "no" | "unsure"; lifecycle: "owned" | "returned" | "sold" | "replaced" | "donated";
  resale: number | null; reflection: string; updatedAt: string;
};
export type ProductRecord = {
  id: string; createdAt: string; updatedAt: string; analysis: ProductAnalysis; status: ProductStatus; reason: string;
  reconsiderOn?: string; scheduledOn?: string; purchaseEstimate?: ProductAnalysis; review?: PurchaseReview;
};
export function isObject(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
const text = (v: unknown, max: number, required = false): v is string => typeof v === "string" && v.length <= max && (!required || !!v.trim());
const money = (v: unknown): v is number => typeof v === "number" && !moneyError(v);
const optionalMoney = (v: unknown) => v === null || money(v);
const rating = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
const date = (v: unknown): v is string => typeof v === "string" && !!parseLocalDate(v);
const timestamp = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d\d-\d\dT/.test(v) && date(v.slice(0, 10)) && Number.isFinite(Date.parse(v));
export function isScorePreferences(v: unknown): v is ProductScorePreferences {
  if (!isObject(v) || v.version !== 1) return false;
  return [v.maxNetCost, v.maxCostPerUse, v.maxOngoingCost].every(optionalMoney)
    && (v.minMonths === null || typeof v.minMonths === "number" && Number.isInteger(v.minMonths) && v.minMonths >= 1 && v.minMonths <= 1200)
    && (v.minUsefulness === null || rating(v.minUsefulness))
    && [v.maxNetCost, v.maxCostPerUse, v.maxOngoingCost, v.minMonths, v.minUsefulness].some(value => value !== null);
}
export function isAnalysis(v: unknown): v is ProductAnalysis {
  if (!isObject(v)) return false;
  return text(v.name, 80, true) && text(v.model, 120) && categories.includes(v.category as Category)
    && text(v.customCategory, 80, v.category === "custom") && conditions.includes(v.condition as Condition) && currencies.includes(v.currency as Currency)
    && money(v.price) && [v.tax, v.shipping, v.maintenanceYearly, v.accessories, v.subscription, v.repairs, v.resale].every(optionalMoney)
    && typeof v.duration === "number" && Number.isInteger(v.duration) && v.duration >= 1 && v.duration <= (v.durationUnit === "years" ? 100 : 1200)
    && ["months", "years"].includes(v.durationUnit as string) && typeof v.uses === "number" && Number.isFinite(v.uses) && v.uses >= 0 && v.uses <= 10000 && Math.abs(v.uses * 100 - Math.round(v.uses * 100)) < .0001
    && ["week", "month"].includes(v.useFrequency as string) && ["month", "year"].includes(v.subscriptionFrequency as string)
    && text(v.purpose, 500) && typeof v.replaces === "boolean" && rating(v.importance) && rating(v.usefulness)
    && (v.alternative === null || (isObject(v.alternative) && text(v.alternative.name, 80, true) && money(v.alternative.price)))
    && text(v.nextBestUse, 500) && (v.goal === null || (isObject(v.goal) && text(v.goal.name, 80, true) && money(v.goal.saved) && money(v.goal.target) && v.goal.target > 0 && money(v.goal.contribution) && ["week", "month"].includes(v.goal.frequency as string)))
    && (v.scorePreferences === undefined || isScorePreferences(v.scorePreferences));
}
export function isReview(v: unknown): v is PurchaseReview {
  return isObject(v) && [v.price, v.tax, v.shipping, v.maintenance, v.accessories, v.subscriptions, v.repairs, v.resale].every(optionalMoney)
    && (v.purchaseDate === "" || date(v.purchaseDate)) && (v.uses === null || (typeof v.uses === "number" && Number.isSafeInteger(v.uses) && v.uses >= 0 && v.uses <= 100_000_000))
    && (v.satisfaction === null || rating(v.satisfaction)) && ["yes", "no", "unsure"].includes(v.buyAgain as string)
    && ["owned", "returned", "sold", "replaced", "donated"].includes(v.lifecycle as string) && text(v.reflection, 1000) && timestamp(v.updatedAt);
}
export function isProduct(v: unknown): v is ProductRecord {
  return isObject(v) && text(v.id, 80, true) && timestamp(v.createdAt) && timestamp(v.updatedAt) && isAnalysis(v.analysis)
    && statuses.includes(v.status as ProductStatus) && text(v.reason, 500)
    && (v.reconsiderOn === undefined && v.scheduledOn === undefined || date(v.reconsiderOn) && date(v.scheduledOn) && v.reconsiderOn >= v.scheduledOn)
    && (v.purchaseEstimate === undefined || isAnalysis(v.purchaseEstimate)) && (v.review === undefined || isReview(v.review))
    && (v.review === undefined || v.purchaseEstimate !== undefined) && (v.status !== "bought" || v.purchaseEstimate !== undefined);
}
export const formatMoney = (value: number, currency: Currency) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
export const formatUnitCost = (value: number, currency: Currency) => value > 0 && value < .01 ? `<${formatMoney(.01, currency)}` : formatMoney(value, currency);
export const formatQuantity = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
export function localDay(now = new Date()) { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }
export function afterDays(days: number, now = new Date()) { const copy = new Date(now); copy.setDate(copy.getDate() + days); return localDay(copy); }
