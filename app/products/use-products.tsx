"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useLocalStorage, STORAGE_UNAVAILABLE, notifyStorageChange } from "../use-local-storage";
import * as local from "./product-storage";
import { isAnalysis, isProduct, isReview, type ProductRecord, type ProductAnalysis, type ProductStatus, type PurchaseReview } from "./product-model";
import { useAuth } from "../auth/auth-provider";
import { getSupabaseClient } from "../lib/supabase/client";
import { createCloudRepository } from "./cloud-repository";
import { CloudProductStore } from "./cloud-store";
import type { Json } from "../lib/supabase/database.types";

type DecisionFields = { status: ProductStatus; reason: string; reconsiderOn?: string; scheduledOn?: string };
type Products = {
  records: ProductRecord[]; error: string; loading: boolean; saving: boolean; mode: "local" | "cloud" | "pending";
  refresh: () => void;
  save: (record: ProductRecord) => Promise<ProductRecord>;
  edit: (id: string, analysis: ProductAnalysis, version: string) => Promise<ProductRecord>;
  decide: (id: string, fields: DecisionFields, version: string) => Promise<ProductRecord>;
  review: (id: string, review: PurchaseReview, version: string) => Promise<ProductRecord>;
  remove: (id: string, version: string) => Promise<void>;
};
const ProductContext = createContext<Products | null>(null);
export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error("Product storage provider is missing.");
  return context;
}
const blocked = async (): Promise<never> => { throw new Error("Saving is paused until your account connection is ready."); };
function PendingProducts({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <ProductContext.Provider value={{ records: [], loading: auth.loading, error: auth.error, saving: false, mode: "pending", refresh: () => window.location.reload(), save: blocked, edit: blocked, decide: blocked, review: blocked, remove: blocked }}>{children}</ProductContext.Provider>;
}
function LocalProducts({ children }: { children: ReactNode }) {
  const snapshot = useLocalStorage(local.PRODUCTS_STORAGE_KEY);
  let records: ProductRecord[] = [], error = "";
  try { records = local.parseProducts(snapshot ?? null); }
  catch { error = snapshot === STORAGE_UNAVAILABLE ? "Browser storage is unavailable. You can analyze without saving." : "Saved products could not be read. They have been preserved; new saves will not overwrite them."; }
  function done<T>(value: T) { notifyStorageChange(); return value; }
  const value: Products = {
    records, error, loading: snapshot === undefined, saving: false, mode: "local", refresh: notifyStorageChange,
    async save(record) { local.saveProduct(window.localStorage, record); return done(record); },
    async edit(id, analysis, version) { return done(local.editAnalysis(window.localStorage, id, analysis, version)); },
    async decide(id, fields, version) { return done(local.updateProductDecision(window.localStorage, id, fields, version)); },
    async review(id, review, version) { return done(local.saveReview(window.localStorage, id, review, version)); },
    async remove(id) { local.deleteProduct(window.localStorage, id); done(undefined); },
  };
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
function CloudProducts({ userId, children }: { userId: string; children: ReactNode }) {
  const [store] = useState(() => new CloudProductStore(createCloudRepository(getSupabaseClient(), userId)));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  useEffect(() => {
    store.start();
    const refresh = () => { if (document.visibilityState === "visible") void store.refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { store.stop(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [store]);
  const value: Products = {
    ...state, mode: "cloud", refresh: store.refresh,
    async save(record) {
      if (!isProduct(record)) throw new Error("Check the product record.");
      return (await store.mutate({ id: record.id, action: "create", payload: { analysis: record.analysis as unknown as Json } }))!;
    },
    async edit(id, analysis, version) {
      if (!isAnalysis(analysis)) throw new Error("Check your product assumptions.");
      return (await store.mutate({ id, action: "edit", payload: { analysis: analysis as unknown as Json }, expectedUpdatedAt: version }))!;
    },
    async decide(id, fields, version) {
      return (await store.mutate({ id, action: "decide", payload: fields, expectedUpdatedAt: version }))!;
    },
    async review(id, review, version) {
      if (!isReview(review)) throw new Error("Check the review amounts and dates.");
      return (await store.mutate({ id, action: "review", payload: { review: review as unknown as Json }, expectedUpdatedAt: version }))!;
    },
    async remove(id, version) { await store.mutate({ id, action: "delete", payload: {}, expectedUpdatedAt: version }); },
  };
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
export function ProductProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  // Switching storage scope remounts editors: no previous account's records or drafts can leak.
  if (auth.loading || auth.error) return <PendingProducts>{children}</PendingProducts>;
  if (auth.user) return <CloudProducts key={auth.user.id} userId={auth.user.id}>{children}</CloudProducts>;
  return <LocalProducts>{children}</LocalProducts>;
}
