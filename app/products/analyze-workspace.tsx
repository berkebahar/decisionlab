"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductForm from "./product-form";
import TrueCostReceipt from "./true-cost-receipt";
import { useProducts } from "./use-products";
import { editAnalysis, saveProduct } from "./product-storage";
import { notifyStorageChange } from "../use-local-storage";
import type { ProductAnalysis, ProductRecord } from "./product-model";
import { demoGroups } from "./demo-products";
import Skeleton from "../components/skeleton";

function AnalysisEditor({ record, duplicate = false, demo }: { record?: ProductRecord; duplicate?: boolean; demo?: ProductAnalysis }) {
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(record?.analysis ?? demo ?? null);
  const [editing, setEditing] = useState(!record || duplicate || !!demo);
  const [saved, setSaved] = useState<ProductRecord | null>(duplicate ? null : record ?? null);
  const [message, setMessage] = useState("");
  const [demoActive, setDemoActive] = useState(!!demo);
  const result = useRef<HTMLDivElement>(null);
  const wasEditing = useRef(editing);
  useEffect(() => {
    if (wasEditing.current && !editing) result.current?.querySelector<HTMLElement>(".receipt-heading h2")?.focus();
    wasEditing.current = editing;
  }, [editing]);
  function save() {
    if (!analysis || demoActive) return;
    try {
      let result: ProductRecord;
      if (saved) result = editAnalysis(window.localStorage, saved.id, analysis, saved.updatedAt);
      else { const now = new Date().toISOString(); result = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, analysis, status: "considering", reason: "" }; saveProduct(window.localStorage, result); }
      setSaved(result); notifyStorageChange(); setMessage("Receipt saved to your decision queue.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save. Existing records are unchanged."); }
  }
  if (editing) return <>{(demoActive || duplicate) && <p className="product-local-note">{demoActive ? "Fictional demonstration. Nothing is stored unless you explicitly use these assumptions and save." : duplicate ? "Independent copy: change assumptions without altering the original." : "Nothing is saved until you choose Save receipt."}</p>}<ProductForm initial={analysis ?? undefined} onComplete={a => { setAnalysis(a); setEditing(false); setMessage(""); }} onCancel={analysis ? () => setEditing(false) : undefined} /></>;
  return analysis && <div ref={result} className="analysis-result"><TrueCostReceipt analysis={analysis} demo={demoActive} /><aside className="receipt-next"><p className="eyebrow">Step 5 of 5 · Receipt</p><h2>Your next step</h2><p>Save this receipt to reconsider later, or refine your assumptions.</p><div className="product-actions">{demoActive ? <button type="button" className="button-outline" onClick={() => setDemoActive(false)}>Use this example as my starting point</button> : <button type="button" className="button-primary" onClick={save}>{saved ? "Save updated receipt" : "Save receipt to queue"}</button>}<button type="button" className="button-outline" onClick={() => setEditing(true)}>Edit assumptions</button></div><p role="status" className="product-status">{message}</p>{saved && <><Link className="text-link" href={`/compare?ids=${encodeURIComponent(saved.id)}`}>Compare this product →</Link><Link className="text-link" href="/queue">Open decision queue →</Link></>}<p className="product-helper">Records stay on this browser/device. Clearing browser data can erase them. Export a backup from the queue.</p>{record?.purchaseEstimate && <p className="product-helper">The original estimate captured when marked bought remains unchanged for post-purchase reviews.</p>}</aside></div>;
}
export default function AnalyzeWorkspace() {
  const params = useSearchParams(), { records, loading, error } = useProducts();
  const id = params.get("id") ?? params.get("duplicate");
  const record = records.find(r => r.id === id);
  const demoIndex = params.get("demo");
  const demo = demoIndex !== null ? demoGroups[Number(demoIndex)]?.products[0] : undefined;
  if (id && loading) return <Skeleton label="Opening your product" />;
  if (id && !record) return <div className="product-empty"><h2>Product unavailable</h2><p>{error || "This product is not saved in this browser, or it was deleted."}</p><Link href="/analyze" className="button-primary">Start a new analysis</Link></div>;
  return <>{error && <p className="product-error" role="status">{error}</p>}<AnalysisEditor key={id ?? demoIndex ?? "new"} record={record} duplicate={!!params.get("duplicate")} demo={demo} /></>;
}
