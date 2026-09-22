"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductForm from "./product-form";
import TrueCostReceipt from "./true-cost-receipt";
import { useProducts } from "./use-products";
import StorageStatus from "./storage-status";
import type { ProductAnalysis, ProductRecord } from "./product-model";
import { demoGroups } from "./demo-products";
import Skeleton from "../components/skeleton";
import { trackProductEvent } from "../analytics";
import { ResearchSession } from "../research/research-session";
import { ResearchCard, ResearchReceiptObserver, useResearchPhase } from "../research/research-card";

function AnalysisEditor({ record, duplicate = false, demo }: { record?: ProductRecord; duplicate?: boolean; demo?: ProductAnalysis }) {
  const products = useProducts();
  const [busy, setBusy] = useState(false);
  const newId = useRef<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(record?.analysis ?? demo ?? null);
  const [editing, setEditing] = useState(!record || duplicate || !!demo);
  const [saved, setSaved] = useState<ProductRecord | null>(duplicate ? null : record ?? null);
  const [message, setMessage] = useState("");
  const [demoActive, setDemoActive] = useState(!!demo);
  const [research, setResearch] = useState<ResearchSession | null>(null);
  const researchPhase = useResearchPhase(research);
  // Reopened/duplicated records and demonstrations already expose the intervention.
  const researchEligible = useRef(!record && !demo);
  const formCompleted = useRef(false);
  const result = useRef<HTMLDivElement>(null);
  const receiptVisible = !editing && researchPhase !== "before";
  const wasVisible = useRef(receiptVisible);
  const receiptPending = useRef(false);
  useEffect(() => {
    if (!wasVisible.current && receiptVisible) result.current?.querySelector<HTMLElement>(".receipt-heading h2")?.focus();
    if (receiptVisible && receiptPending.current) {
      receiptPending.current = false;
      trackProductEvent("analysis_completed");
    }
    wasVisible.current = receiptVisible;
  }, [receiptVisible]);
  function completeAnalysis(a: ProductAnalysis) {
    if (formCompleted.current) return;
    formCompleted.current = true;
    receiptPending.current = true;
    setAnalysis(a); setMessage("");
    if (researchEligible.current) {
      researchEligible.current = false;
      // Entropy/browser failures must still reveal the receipt.
      try { setResearch(new ResearchSession(a.category)); } catch { setResearch(null); }
    }
    setEditing(false);
  }
  function editAssumptions() {
    // Do not pair the original before answer with an edited analysis.
    if (research?.skip()) trackProductEvent("research_skipped");
    formCompleted.current = false;
    setEditing(true);
  }
  async function save() {
    if (!analysis || demoActive || busy) return;
    setBusy(true);
    try {
      let result: ProductRecord;
      if (saved) result = await products.edit(saved.id, analysis, saved.updatedAt);
      else { const now = new Date().toISOString(); result = { id: newId.current ??= crypto.randomUUID(), createdAt: now, updatedAt: now, analysis, status: "considering", reason: "" }; result = await products.save(result); }
      setSaved(result); setMessage("Receipt saved to your decision queue.");
      trackProductEvent("decision_saved");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save. Existing records are unchanged."); }
    finally { setBusy(false); }
  }
  if (editing) return <>{(demoActive || duplicate) && <p className="product-local-note">{demoActive ? "Fictional demonstration. Nothing is stored unless you explicitly use these assumptions and save." : duplicate ? "Independent copy: change assumptions without altering the original." : "Nothing is saved until you choose Save receipt."}</p>}<ProductForm onStart={() => trackProductEvent("analyze_started")} initial={analysis ?? undefined} onComplete={completeAnalysis} onCancel={analysis ? () => setEditing(false) : undefined} /></>;
  if (research && researchPhase === "before") return <ResearchCard key={`${research.id}-before`} session={research} stage="before" />;
  return analysis && <div ref={result} className="analysis-result"><TrueCostReceipt analysis={analysis} demo={demoActive} />{research && researchPhase === "awaiting_receipt" && <ResearchReceiptObserver session={research} result={result} />}{research && researchPhase !== "awaiting_receipt" && researchPhase !== "skipped" && <ResearchCard key={`${research.id}-after`} session={research} stage="after" />}<aside className="receipt-next"><p className="eyebrow">Step 5 of 5 · Receipt</p><h2>Your next step</h2><p>Save this receipt to reconsider later, or refine your assumptions.</p><div className="product-actions">{demoActive ? <button type="button" className="button-outline" onClick={() => setDemoActive(false)}>Use this example as my starting point</button> : <button type="button" className="button-primary" onClick={save} disabled={busy || products.saving || products.loading || !!products.error || products.mode === "pending"}>{busy ? "Saving…" : saved ? "Save updated receipt" : "Save receipt to queue"}</button>}<button type="button" className="button-outline" onClick={editAssumptions}>Edit assumptions</button></div><p role="status" className="product-status">{message}</p>{saved && <><Link className="text-link" href={`/compare?ids=${encodeURIComponent(saved.id)}`}>Compare this product →</Link><Link className="text-link" href="/queue">Open decision queue →</Link></>}<p className="product-helper">{products.mode === "cloud" ? "Saved receipts are private to your account." : "Records stay in this browser. Export a local backup from the queue."}</p>{record?.purchaseEstimate && <p className="product-helper">The original estimate captured when marked bought remains unchanged for post-purchase reviews.</p>}</aside></div>;
}
export default function AnalyzeWorkspace() {
  const params = useSearchParams(), { records, loading, error } = useProducts();
  const id = params.get("id") ?? params.get("duplicate");
  const record = records.find(r => r.id === id);
  const demoIndex = params.get("demo");
  const demo = demoIndex !== null ? demoGroups[Number(demoIndex)]?.products[0] : undefined;
  if (id && loading) return <Skeleton label="Preparing your receipt" />;
  if (id && !record) return <div className="product-empty"><h2>Product unavailable</h2><p>{error || "This product is not in your current storage, or it was deleted."}</p><Link href="/analyze" className="button-primary">Start a new analysis</Link></div>;
  return <><StorageStatus />{error && <p className="product-error" role="status">{error}</p>}<AnalysisEditor key={id ?? demoIndex ?? "new"} record={record} duplicate={!!params.get("duplicate")} demo={demo} /></>;
}
