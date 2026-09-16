import { isProduct, isAnalysis, isReview, type ProductRecord, type ProductAnalysis, type ProductStatus, type PurchaseReview } from "./product-model.ts";
export const PRODUCTS_STORAGE_KEY = "decisionlab.products.v1";
const nextTimestamp = (previous: string) => new Date(Math.max(Date.now(), Date.parse(previous) + 1)).toISOString();
type Store = Pick<Storage, "getItem" | "setItem">;
export function parseProducts(raw: string | null): ProductRecord[] {
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 || !("items" in data) || !Array.isArray(data.items)
    || data.items.length > 1000 || !data.items.every(isProduct) || new Set(data.items.map(item => item.id)).size !== data.items.length) throw new Error("Product records are unreadable or use an unsupported version. Existing records are preserved.");
  return data.items;
}
function write(storage: Store, items: ProductRecord[]) {
  const raw = JSON.stringify({ version: 1, items });
  parseProducts(raw);
  storage.setItem(PRODUCTS_STORAGE_KEY, raw);
}
export function saveProduct(storage: Store, record: ProductRecord, expectedUpdatedAt?: string) {
  if (!isProduct(record)) throw new Error("Please check the product record.");
  const items = parseProducts(storage.getItem(PRODUCTS_STORAGE_KEY));
  const old = items.find(p => p.id === record.id);
  if (expectedUpdatedAt !== undefined && (!old || old.updatedAt !== expectedUpdatedAt)) throw new Error("This record changed or was deleted in another tab. Reload before editing.");
  if (old && expectedUpdatedAt === undefined) throw new Error("This product already exists.");
  write(storage, old ? items.map(p => p.id === record.id ? record : p) : [record, ...items]);
}
export function editAnalysis(storage: Store, id: string, analysis: ProductAnalysis, expectedUpdatedAt: string) {
  if (!isAnalysis(analysis)) throw new Error("Check your product assumptions.");
  const old = parseProducts(storage.getItem(PRODUCTS_STORAGE_KEY)).find(p => p.id === id);
  if (!old) throw new Error("This record was deleted.");
  const updated = { ...old, analysis, updatedAt: nextTimestamp(old.updatedAt) };
  saveProduct(storage, updated, expectedUpdatedAt); return updated;
}
export function updateProductDecision(storage: Store, id: string, fields: { status: ProductStatus; reason: string; reconsiderOn?: string; scheduledOn?: string }, expectedUpdatedAt: string) {
  const old = parseProducts(storage.getItem(PRODUCTS_STORAGE_KEY)).find(p => p.id === id);
  if (!old) throw new Error("This record was deleted.");
  const updated: ProductRecord = { ...old, ...fields, reconsiderOn: fields.reconsiderOn, scheduledOn: fields.scheduledOn,
    ...(fields.status === "bought" && !old.purchaseEstimate ? { purchaseEstimate: structuredClone(old.analysis) } : {}), updatedAt: nextTimestamp(old.updatedAt) };
  saveProduct(storage, updated, expectedUpdatedAt); return updated;
}
export function saveReview(storage: Store, id: string, review: PurchaseReview, expectedUpdatedAt: string) {
  if (!isReview(review)) throw new Error("Check the review amounts and dates.");
  const old = parseProducts(storage.getItem(PRODUCTS_STORAGE_KEY)).find(p => p.id === id);
  if (!old || old.status !== "bought") throw new Error("Mark this product bought before recording a purchase review.");
  const updated = { ...old, review, purchaseEstimate: old.purchaseEstimate ?? structuredClone(old.analysis), updatedAt: nextTimestamp(old.updatedAt) };
  saveProduct(storage, updated, expectedUpdatedAt); return updated;
}
export function deleteProduct(storage: Store, id: string) { const items = parseProducts(storage.getItem(PRODUCTS_STORAGE_KEY)); write(storage, items.filter(item => item.id !== id)); }
