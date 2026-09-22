import type { ResearchResponse, ResearchRow } from "../../research/decision-research";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type QueueRow = {
  id: string; user_id: string; created_at: string; updated_at: string;
  analysis: Json; status: string; reason: string; reconsider_on: string | null; scheduled_on: string | null;
};
export type PurchaseRow = {
  id: string; user_id: string; queue_item_id: string; created_at: string; updated_at: string;
  purchase_estimate: Json; review: Json | null;
};
export type Database = {
  public: {
    Tables: {
      decision_research_responses: { Row: ResearchRow; Insert: ResearchResponse; Update: never; Relationships: [] };
      queue_items: { Row: QueueRow; Insert: Pick<QueueRow, "user_id" | "analysis"> & Partial<QueueRow>; Update: Partial<QueueRow>; Relationships: [] };
      purchases: { Row: PurchaseRow; Insert: Pick<PurchaseRow, "user_id" | "queue_item_id" | "purchase_estimate"> & Partial<PurchaseRow>; Update: Partial<PurchaseRow>; Relationships: [{ foreignKeyName: "purchases_queue_item_id_user_id_fkey"; columns: ["queue_item_id", "user_id"]; isOneToOne: true; referencedRelation: "queue_items"; referencedColumns: ["id", "user_id"] }] };
    };
    Views: { [_ in never]: never };
    Functions: { mutate_product: { Args: { p_user_id: string; p_id: string; p_action: string; p_payload: Json; p_expected_updated_at?: string }; Returns: Json } };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
