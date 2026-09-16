"use client";
import { useLocalStorage, STORAGE_UNAVAILABLE } from "../use-local-storage";
import { parseProducts, PRODUCTS_STORAGE_KEY } from "./product-storage";
import type { ProductRecord } from "./product-model";
export function useProducts() {
  const snapshot = useLocalStorage(PRODUCTS_STORAGE_KEY);
  let records: ProductRecord[] = [], error = "";
  try { records = parseProducts(snapshot ?? null); }
  catch { error = snapshot === STORAGE_UNAVAILABLE ? "Browser storage is unavailable. You can analyze without saving." : "Saved products could not be read. They have been preserved; new saves will not overwrite them."; }
  return { records, error, loading: snapshot === undefined };
}
