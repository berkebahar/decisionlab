"use client";
import { useState } from "react";
import Link from "next/link";
import { useProducts } from "./use-products";
import { actualResults } from "./product-calculations";
import { isReview, localDay, formatMoney, formatUnitCost, formatQuantity, type ProductRecord, type PurchaseReview } from "./product-model";
import { trackProductEvent } from "../analytics";
import { saveReview } from "./product-storage";
import { notifyStorageChange } from "../use-local-storage";
import Skeleton from "../components/skeleton";

const numericFields = [["price", "Actual purchase price"], ["tax", "Actual tax"], ["shipping", "Actual shipping"], ["uses", "Actual uses so far"], ["maintenance", "Actual maintenance to date"], ["accessories", "Actual accessories / consumables to date"], ["subscriptions", "Actual subscription costs to date"], ["repairs", "Actual repair costs to date"], ["resale", "Actual resale received, if sold"]] as const;
function ReviewEditor({ record }: { record: ProductRecord }) {
  const [values, setValues] = useState(() => Object.fromEntries(numericFields.map(([key]) => [key, record.review?.[key]?.toString() ?? ""])) as Record<typeof numericFields[number][0], string>);
  const [date, setDate] = useState(record.review?.purchaseDate ?? ""), [satisfaction, setSatisfaction] = useState(record.review?.satisfaction?.toString() ?? "");
  const [again, setAgain] = useState<PurchaseReview["buyAgain"]>(record.review?.buyAgain ?? "unsure"), [lifecycle, setLifecycle] = useState<PurchaseReview["lifecycle"]>(record.review?.lifecycle ?? "owned");
  const [reflection, setReflection] = useState(record.review?.reflection ?? ""), [message, setMessage] = useState("");
  const [version, setVersion] = useState(record.updatedAt);
  const prediction = record.purchaseEstimate ?? record.analysis;
  return <form className="purchase-review-form" onSubmit={event => { event.preventDefault();
    const numbers = Object.fromEntries(numericFields.map(([key]) => [key, values[key].trim() ? Number(values[key]) : null])) as Pick<PurchaseReview, typeof numericFields[number][0]>;
    const review: PurchaseReview = { ...numbers, purchaseDate: date, satisfaction: satisfaction ? Number(satisfaction) : null, buyAgain: again, lifecycle, reflection, updatedAt: new Date().toISOString() };
    if (!isReview(review) || date > localDay()) { setMessage("Check amounts, usage, rating, and purchase date. Purchase dates cannot be in the future."); return; }
    try { const result = saveReview(window.localStorage, record.id, review, version); setVersion(result.updatedAt); notifyStorageChange(); setMessage("Review saved. Your original prediction is unchanged."); trackProductEvent("review_completed"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your review."); }
  }}><p className="product-helper">Enter actual totals so far in {prediction.currency}, not monthly rates. Blank means unknown; use 0 for a confirmed zero. These values do not update automatically.</p><div className="product-fields"><div className="product-field"><label htmlFor={`purchase-date-${record.id}`}>Actual purchase date (optional)</label><input id={`purchase-date-${record.id}`} type="date" max={localDay()} min="0001-01-01" value={date} onChange={e => setDate(e.target.value)} /></div>{numericFields.map(([key,label]) => <div className="product-field" key={key}><label htmlFor={`${record.id}-${key}`}>{label}</label><input id={`${record.id}-${key}`} type="number" inputMode={key === "uses" ? "numeric" : "decimal"} min="0" max={key === "uses" ? 100_000_000 : 1_000_000_000} step={key === "uses" ? "1" : ".01"} value={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} /></div>)}<div className="product-field"><label htmlFor={`satisfaction-${record.id}`}>Satisfaction (optional)</label><select id={`satisfaction-${record.id}`} value={satisfaction} onChange={e => setSatisfaction(e.target.value)}><option value="">Not rated</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} / 5{n === 1 ? " — low" : n === 5 ? " — high" : ""}</option>)}</select></div><div className="product-field"><label htmlFor={`again-${record.id}`}>Would you buy it again?</label><select id={`again-${record.id}`} value={again} onChange={e => setAgain(e.target.value as PurchaseReview["buyAgain"])}><option value="unsure">Unsure / not answered</option><option value="yes">Yes</option><option value="no">No</option></select></div><div className="product-field"><label htmlFor={`lifecycle-${record.id}`}>Product status</label><select id={`lifecycle-${record.id}`} value={lifecycle} onChange={e => setLifecycle(e.target.value as PurchaseReview["lifecycle"])}><option value="owned">Still owned</option><option value="returned">Returned</option><option value="sold">Sold</option><option value="replaced">Replaced</option><option value="donated">Donated</option></select></div><div className="product-field product-wide"><label htmlFor={`reflection-${record.id}`}>Reflection (optional)</label><textarea id={`reflection-${record.id}`} rows={3} maxLength={1000} value={reflection} onChange={e => setReflection(e.target.value)} /></div></div><p className="product-helper">Resale reduces recorded cost only when marked sold. Refunds on returns are not modeled; costs remain recorded outlays. Nothing here claims money saved.</p><button type="submit" className="button-primary">Save purchase review</button><p role="status" className="product-status">{message}</p></form>;
}
export function ActualComparison({ record }: { record: ProductRecord }) {
  const prediction = record.purchaseEstimate ?? record.analysis;
  if (!record.review) return <p className="product-helper">No review yet. Record actual use and costs to compare with your prediction.</p>;
  const result = actualResults(prediction, record.review, new Date(record.review.updatedAt));
  const money = (v: number) => formatMoney(v, prediction.currency);
  return <div className="actual-comparison"><p className="eyebrow">Prediction vs recorded experience</p><p className="product-helper">Prediction: {result.planned.months} months. Actuals: totals through {record.review.updatedAt.slice(0,10)}. Different horizons, not a savings claim.</p>
    <div className="actual-pairs">
      <section className="actual-pair"><h4>Ownership cost</h4><dl className="product-metrics">
        <div><dt>Predicted · full period</dt><dd>{money(result.planned.net)}</dd></div>
        <div><dt>{result.complete ? "Recorded · to date" : "Known subtotal · incomplete"}</dt><dd>{result.costKnown ? money(result.cost) : "No cost data"}</dd></div>
      </dl></section>
      <section className="actual-pair"><h4>Usage</h4><dl className="product-metrics">
        <div><dt>Expected by review date</dt><dd>{result.expectedUsesToDate === null ? "Purchase date needed" : `Approximately ${formatQuantity(result.expectedUsesToDate)}`}</dd></div>
        <div><dt>Actual uses recorded</dt><dd>{result.actualUses === null ? "Not recorded" : formatQuantity(result.actualUses)}</dd></div>
      </dl><p className="product-helper">{formatQuantity(result.planned.totalUses)} uses planned over the full period.</p></section>
      <section className="actual-pair"><h4>Cost per use</h4><dl className="product-metrics">
        <div><dt>Predicted · full period</dt><dd>{result.planned.costPerUse === null ? "No expected uses" : formatUnitCost(result.planned.costPerUse, prediction.currency)}</dd></div>
        <div><dt>{result.complete ? "Recorded · to date" : "Recorded · incomplete costs"}</dt><dd>{result.costPerUse === null || !result.costKnown ? "Costs and positive uses needed" : formatUnitCost(result.costPerUse, prediction.currency)}</dd></div>
      </dl></section>
    </div>
    {!result.complete && <p className="product-notice">Some actual costs are unknown. Complete them, including confirmed zeros, before treating this as a total.</p>}{result.resaleCapped && <p className="product-notice">Recorded resale exceeds recorded costs; the displayed cost is floored at zero, not reported as profit.</p>}</div>;

}
export default function PurchaseLibrary() {
  const { records, loading, error } = useProducts();
  if (loading) return <Skeleton label="Preparing your purchases" />;
  const purchased = records.filter(r => r.status === "bought");
  return <><p className="product-local-note">Products marked bought, saved in this browser. Reviews keep your original prediction intact.</p>{error && <p role="status" className="product-error">{error}</p>}{!purchased.length && !error && <div className="product-empty"><h2>Experience gives a prediction perspective.</h2><p>Mark a product bought in your queue, then return to record actual use, cost, and satisfaction.</p><Link className="button-primary" href="/queue">Open decision queue</Link></div>}<div className="purchase-list">{purchased.map(record => <article className="purchase-card" key={record.id}><p className="eyebrow">Recorded purchase · {record.review ? { owned: "Still owned", returned: "Returned", sold: "Sold", replaced: "Replaced", donated: "Donated" }[record.review.lifecycle] : "Not reviewed yet"}</p><h2>{record.analysis.name}</h2>{record.review && <dl className="purchase-review-summary"><div><dt>Satisfaction</dt><dd>{record.review.satisfaction === null ? "Not rated" : `${record.review.satisfaction}/5`}</dd></div><div><dt>Buy again?</dt><dd>{{ yes: "Yes", no: "No", unsure: "Unsure" }[record.review.buyAgain]}</dd></div>{record.review.lifecycle === "sold" && <div><dt>Resale received</dt><dd>{record.review.resale === null ? "Not recorded" : formatMoney(record.review.resale, (record.purchaseEstimate ?? record.analysis).currency)}</dd></div>}</dl>}<ActualComparison record={record} /><details><summary>{record.review ? "Edit purchase review" : "Record actual costs and a review"}</summary><ReviewEditor record={record} /></details><Link className="text-link" href={`/analyze?id=${encodeURIComponent(record.id)}`}>View analysis →</Link></article>)}</div></>;
}
