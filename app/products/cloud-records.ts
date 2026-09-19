import { isObject, isProduct, type ProductRecord } from "./product-model.ts";

// Treat database JSON as untrusted. A malformed row must never look like an empty account.
export function decodeCloudRecord(value: unknown, userId: string): ProductRecord {
  if (!isObject(value) || value.user_id !== userId) throw new Error("Cloud data could not be verified. Existing records are preserved.");
  if ((value.reconsider_on === null) !== (value.scheduled_on === null)) throw new Error("Cloud dates could not be verified. Existing records are preserved.");
  const purchase = value.purchases;
  if (purchase !== null && (!isObject(purchase) || purchase.user_id !== userId || purchase.queue_item_id !== value.id)) {
    throw new Error("Cloud purchase data could not be verified. Existing records are preserved.");
  }
  const record = {
    id: value.id, createdAt: value.created_at, updatedAt: value.updated_at,
    analysis: value.analysis, status: value.status, reason: value.reason,
    ...(value.reconsider_on !== null ? { reconsiderOn: value.reconsider_on, scheduledOn: value.scheduled_on } : {}),
    ...(isObject(purchase) ? { purchaseEstimate: purchase.purchase_estimate, ...(purchase.review !== null ? { review: purchase.review } : {}) } : {}),
  };
  if (!isProduct(record)) throw new Error("A cloud record is unreadable. Existing records are preserved; saving is paused.");
  return record;
}
