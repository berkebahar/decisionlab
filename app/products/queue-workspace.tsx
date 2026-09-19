"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useProducts } from "./use-products";
import StorageStatus from "./storage-status";
import { statuses, statusLabels, localDay, afterDays, formatMoney, formatUnitCost, type ProductRecord, type ProductStatus } from "./product-model";
import { analyzeProduct } from "./product-calculations";
import TrueCostReceipt from "./true-cost-receipt";
import Skeleton from "../components/skeleton";
import { trackProductEvent } from "../analytics";

function QueueCard({ record, today, onRemove }: { record: ProductRecord; today: string; onRemove: () => void }) {
  const products = useProducts();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(record.status), [reason, setReason] = useState(record.reason), [date, setDate] = useState(record.reconsiderOn ?? "");
  const [version, setVersion] = useState(record.updatedAt), [message, setMessage] = useState("");
  const receiptDetails = useRef<HTMLDetailsElement>(null);
  function viewReceipt() {
    const details = receiptDetails.current;
    if (!details) return;
    details.open = true;
    details.querySelector<HTMLElement>(".receipt-heading h2")?.focus();
  }
  function printSavedReceipt() {
    // Reuse the mounted receipt's own print action, including its existing analytics.
    receiptDetails.current?.querySelector<HTMLButtonElement>(".receipt-print")?.click();
  }
  const r = analyzeProduct(record.analysis);
  return <article className="queue-card" data-status={record.status}><header><div><p className="queue-state"><span key={record.status} className="decision-status" data-status={record.status}>{statusLabels[record.status]}</span><span>{record.analysis.condition}</span></p><h2>{record.analysis.name}</h2><dl className="queue-estimates"><div><dt>Estimated True Cost</dt><dd>{formatMoney(r.net, record.analysis.currency)}</dd></div><div><dt>Estimated cost per use</dt><dd>{r.costPerUse === null ? "Not available" : formatUnitCost(r.costPerUse, record.analysis.currency)}</dd></div></dl></div>{record.reconsiderOn && <p key={record.reconsiderOn} className="queue-date">{record.reconsiderOn <= today ? "Ready to reconsider" : "Reconsider on"}<time dateTime={record.reconsiderOn}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${record.reconsiderOn}T12:00:00`))}</time></p>}</header>
    {record.reason && <p className="queue-reason">{record.reason}</p>}
    <div className="product-actions queue-actions"><div className="queue-receipt-actions"><button className="button-primary" type="button" onClick={viewReceipt}>View Receipt</button><button className="button-outline" type="button" onClick={printSavedReceipt}>Print Receipt</button></div><div className="queue-secondary-actions"><Link className="button-quiet" href={`/analyze?id=${encodeURIComponent(record.id)}`}>Edit assumptions</Link><Link className="button-quiet" href={`/compare?ids=${encodeURIComponent(record.id)}`}>Compare</Link><Link className="button-quiet" href={`/analyze?duplicate=${encodeURIComponent(record.id)}`}>Duplicate analysis</Link></div></div>
    <details className="queue-edit"><summary>Update decision <span>Status · Reconsider date</span></summary><form className="queue-decision" onSubmit={async event => {
      event.preventDefault();
      if (date && date !== record.reconsiderOn && date < today) { setMessage("Choose today or a future reconsideration date."); return; }
      if (busy) return;
      setBusy(true);
      try { const updated = await products.decide(record.id, { status, reason, reconsiderOn: date || undefined, scheduledOn: date ? date === record.reconsiderOn ? record.scheduledOn ?? today : today : undefined }, version); setVersion(updated.updatedAt); setMessage("Decision updated. Your assumptions and any existing review were kept."); trackProductEvent("decision_saved"); if (record.status !== "bought" && updated.status === "bought") trackProductEvent("purchase_recorded"); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not update; your existing record is preserved."); }
      finally { setBusy(false); }
    }}><div className="product-fields"><div className="product-field"><label htmlFor={`status-${record.id}`}>Your decision</label><select id={`status-${record.id}`} value={status} onChange={event => setStatus(event.target.value as ProductStatus)}>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></div><div className="product-field"><label htmlFor={`date-${record.id}`}>Reconsider on (optional)</label><input id={`date-${record.id}`} type="date" min="0001-01-01" max="9999-12-31" value={date} onChange={event => setDate(event.target.value)} /></div></div><div className="product-actions">{[1,3,7].map(days => <button type="button" className="button-outline" key={days} onClick={() => setDate(afterDays(days))}>{days === 1 ? "Tomorrow" : `In ${days} days`}</button>)}<button className="button-quiet" type="button" onClick={() => setDate("")}>Clear date</button></div><div className="product-field"><label htmlFor={`reason-${record.id}`}>Reason (optional)</label><textarea id={`reason-${record.id}`} rows={2} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></div><p className="product-helper">Buying, skipping, and postponing can each be reasonable choices. Reconsideration dates appear only when you return; DecisionLab sends no notifications.</p><button type="submit" className="button-primary" disabled={busy || products.saving || !!products.error}>{busy ? "Saving…" : "Save decision"}</button><p role="status" className="product-status">{message}</p>{record.status === "bought" && <Link className="text-link" href="/purchases">Record actual use and a review →</Link>}</form></details>
    <details ref={receiptDetails} className="queue-receipt"><summary>Saved receipt</summary><TrueCostReceipt analysis={record.analysis} /></details><button type="button" className="delete-button" disabled={busy || products.saving || !!products.error} onClick={onRemove}>Delete product and review</button>
  </article>;
}
export default function QueueWorkspace() {
  const { records, loading, error, remove } = useProducts();
  const [filter, setFilter] = useState("active"), [message, setMessage] = useState("");
  const [today] = useState(() => localDay());
  if (loading) return <Skeleton label="Preparing your queue" />;
  const visible = records.filter(r => filter === "all" || (filter === "active" ? ["analyzed", "considering", "postponed"].includes(r.status) : r.status === filter));
  return <div><StorageStatus /><p className="product-helper">Revisit dates appear here; no notifications are sent.</p><div className="product-toolbar"><Link href="/analyze" className="button-primary">Analyze a product</Link><div className="product-field"><label htmlFor="queue-filter">Show</label><select id="queue-filter" value={filter} onChange={event => setFilter(event.target.value)}><option value="active">Under consideration</option><option value="all">All analyses and decisions</option><option value="skipped">Skipped</option><option value="bought">Bought</option></select></div><Link className="text-link" href="/purchases">Purchases →</Link></div><p role="status" className={error ? "product-error" : "product-status"}>{error || message}</p>
    {!visible.length && !error && <div className="product-empty"><h2>Give your next purchase some room.</h2><p>No products in this view. Analyze a product, save its receipt, and return when you’re ready to decide.</p><Link href="/analyze" className="button-outline">Start an analysis</Link></div>}
    <div className="queue-list">{visible.map(record => <QueueCard key={record.id} record={record} today={today} onRemove={async () => { if (!window.confirm(`Delete “${record.analysis.name}”, its receipt, and any review? This cannot be undone.`)) return; try { await remove(record.id, record.updatedAt); setMessage("Product deleted. Other records are unchanged."); document.getElementById("queue-filter")?.focus(); } catch { setMessage("Could not delete. Existing records were kept."); } }} />)}</div>
    {!records.length && !error && <p className="product-helper">Looking for older comparisons? <Link className="text-link" href="/dashboard#saved-decisions">Saved GoalLens comparisons</Link> stay in Savings Goals. They do not include a product receipt.</p>}
  </div>;
}
