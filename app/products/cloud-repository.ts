import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../lib/supabase/database.types";
import { decodeCloudRecord } from "./cloud-records.ts";
import type { ProductRecord } from "./product-model.ts";

export type CloudCommand = { id: string; action: "create" | "edit" | "decide" | "review" | "delete"; payload: Json; expectedUpdatedAt?: string };
export interface ProductRepository {
  load(): Promise<ProductRecord[]>;
  mutate(command: CloudCommand): Promise<ProductRecord | null>;
}
function cloudError(code?: string) {
  if (code === "40001") return new Error("This record changed or was deleted elsewhere. Reload this page before editing again.");
  if (code === "23505") return new Error("This receipt may already be saved. Refresh cloud records before trying again.");
  if (code === "42501" || code === "PGRST301" || code === "PGRST303") return new Error("Your session could not be verified. Sign in again before saving.");
  return new Error("Cloud storage could not confirm the request. Your entries are still here. Refresh cloud records to check before retrying; local data was not changed.");
}
export function createCloudRepository(client: SupabaseClient<Database>, userId: string): ProductRepository {
  return {
    async load() {
      const records: ProductRecord[] = [];
      let total: number | null = null;
      do {
        const { data, count, error } = await client.from("queue_items").select("*, purchases(*)", { count: "exact" })
          .eq("user_id", userId).order("created_at", { ascending: false }).order("id")
          .range(records.length, records.length + 499);
        if (error) throw cloudError(error.code);
        if (!data || count === null || (total !== null && count !== total) || (!data.length && records.length < count)) {
          throw new Error("Cloud records changed while loading or are incomplete. Refresh to retry; existing records are preserved.");
        }
        total = count;
        records.push(...data.map(row => decodeCloudRecord(row, userId)));
      } while (records.length < total);
      if (records.length !== total || new Set(records.map(record => record.id)).size !== total) {
        throw new Error("Cloud records changed while loading. Refresh to retry; existing records are preserved.");
      }
      return records;
    },
    async mutate(command) {
      const { data, error } = await client.rpc("mutate_product", {
        p_user_id: userId, p_id: command.id, p_action: command.action,
        p_payload: command.payload, p_expected_updated_at: command.expectedUpdatedAt,
      });
      if (error) throw cloudError(error.code);
      if (command.action === "delete") return null;
      return decodeCloudRecord(data, userId);
    },
  };
}
