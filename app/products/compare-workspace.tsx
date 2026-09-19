"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProducts } from "./use-products";
import { compareProducts } from "./product-calculations";
import { formatMoney, formatUnitCost, formatQuantity, type ProductAnalysis, type ProductRecord } from "./product-model";
import { demoGroups } from "./demo-products";
import ProductForm from "./product-form";
import StorageStatus from "./storage-status";
import Skeleton from "../components/skeleton";
import { trackProductEvent } from "../analytics";
import { comparisonMetrics, getComparisonFocus, type ComparisonMetric } from "./comparison-focus";
import "./comparison-focus.css";

type Choice = { key: string; analysis: ProductAnalysis; demo: boolean; sourceId?: string };
function Comparison({ initial, records }: { initial: Choice[]; records: ProductRecord[] }) {
  const products = useProducts();
  const [busy, setBusy] = useState(false);
  const copyIds = useRef(new Map<string, string>());
  const [choices, setChoices] = useState(initial), [editing, setEditing] = useState<number | "new" | null>(null);
  const [factors, setFactors] = useState(["Costs", "Usage", "Goal", "Purpose"]), [message, setMessage] = useState("");
  const [primaryMetric, setPrimaryMetric] = useState<ComparisonMetric>("trueCost");
  const [focusAnnouncement, setFocusAnnouncement] = useState("");
  const comparison = choices.length ? compareProducts(choices.map(c => c.analysis)) : null;
  const started = useRef(false);
  const completedChoices = useRef<Choice[] | null>(null);
  function startComparison() {
    if (started.current) return;
    started.current = true;
    trackProductEvent("compare_started");
  }
  const validComparison = choices.length >= 2 && comparison?.sameCurrency;
  useEffect(() => {
    // Linked saved products and explicitly selected demos also begin a comparison.
    if (choices.length > 0 && !started.current) {
      started.current = true;
      trackProductEvent("compare_started");
    }
    // Run after results commit, once per changed set of options; never on view toggles.
    if (editing !== null || !validComparison || completedChoices.current === choices) return;
    completedChoices.current = choices;
    trackProductEvent("comparison_completed");
  }, [choices, editing, validComparison]);
  function add(analysis: ProductAnalysis, demo = false, sourceId?: string) { if (choices.length >= 3) return; setChoices(current => [...current, { key: crypto.randomUUID(), analysis, demo, sourceId }]); setMessage(""); }
  if (editing !== null) return <ProductForm key={editing} initial={editing === "new" ? undefined : choices[editing].analysis} onCancel={() => setEditing(null)} onComplete={analysis => { if (editing === "new") add(analysis); else setChoices(current => current.map((choice, index) => index === editing ? { ...choice, analysis, sourceId: undefined } : choice)); setEditing(null); }} />;
  return <div className="comparison-workspace">
    <div className="product-toolbar"><button className="button-primary" type="button" disabled={choices.length >= 3} onClick={() => { startComparison(); setEditing("new"); }}>Add a product</button><div className="product-field"><label htmlFor="compare-load">Or choose a saved product</label><select id="compare-load" value="" disabled={choices.length >= 3} onChange={event => { const record = records.find(r => r.id === event.target.value); if (record) add(record.analysis, false, record.id); }}><option value="">Select a saved product</option>{records.map(record => <option key={record.id} value={record.id}>{record.analysis.name} · {record.analysis.condition}</option>)}</select></div></div>

    {choices.length > 0 && <>
    <div className="comparison-focus-picker"><div className="product-field"><label htmlFor="compare-primary-metric">Compare by</label><select id="compare-primary-metric" aria-describedby="compare-focus-help" value={primaryMetric} onChange={event => { const metric = event.target.value as ComparisonMetric; setPrimaryMetric(metric); setFocusAnnouncement(`Now highlighting ${comparisonMetrics[metric].toLowerCase()} for each product. The supporting breakdown is unchanged.`); }}>{Object.entries(comparisonMetrics).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div><p id="compare-focus-help">One measure, side by side. No scores or automatic winner.</p></div><p className="sr-only" role="status" aria-atomic="true">{focusAnnouncement}</p>

    </>}
    {!choices.length && <div className="product-empty"><h2>One question. Up to three possibilities.</h2><p>Create a product, load an analysis, or try a fictional demonstration. Currency differences are never converted automatically.</p></div>}
    {comparison && !comparison.sameCurrency && <p className="product-notice">Different currencies: cross-product monetary differences are unavailable. Compare amounts only after entering all products in the same currency.</p>}
    <p className="product-status" role="status">{message}</p>
    <div className="product-comparison-grid">{choices.map((choice,index) => {
      const a = choice.analysis, r = comparison!.results[index], money = (v: number) => formatMoney(v, a.currency);
      const focus = getComparisonFocus(primaryMetric, a, r);
      return <article className="comparison-product" key={choice.key}><p className="eyebrow">Option {index + 1} · {choice.demo ? "Fictional demo" : choice.sourceId ? "Saved snapshot" : "Unsaved comparison"}</p><h2>{a.name}</h2><p>{a.condition} · {a.currency}</p><dl className="comparison-primary-metric" data-metric={primaryMetric}><div key={`${primaryMetric}:${focus.value}`}><dt>{focus.label}</dt><dd data-available={focus.available}>{focus.value}</dd><dd className="comparison-metric-detail">{focus.detail}</dd></div></dl><dl className="product-metrics comparison-key-metrics">
        {(["trueCost", "costPerUse", "resale", "ongoingCost", "usage", "goalImpact"] as const).filter(metric => metric !== primaryMetric).map(metric => {
          const measure = getComparisonFocus(metric, a, r);
          return <div key={metric}><dt>{comparisonMetrics[metric]}</dt><dd>{measure.value}</dd></div>;
        })}
      </dl>{r.missing.length > 0 && <p className="product-helper">Incomplete estimate: some costs are unknown. See the full breakdown.</p>}<details className="comparison-details"><summary>Full breakdown & assumptions</summary><dl className="product-metrics">
        {factors.includes("Costs") && <><div><dt>Purchase price</dt><dd>{money(a.price)}</dd></div><div><dt>Initial cost incl. known tax/shipping</dt><dd>{money(r.initial)}</dd></div><div className="emphasized"><dt>Net ownership estimate</dt><dd>{money(r.net)}</dd></div><div><dt>Difference from option 1</dt><dd>{comparison!.netDifferences[index] === null ? "Different currency" : `${comparison!.netDifferences[index]! < 0 ? "−" : "+"}${money(Math.abs(comparison!.netDifferences[index]!))}`}</dd></div><div><dt>Maintenance over period</dt><dd>{a.maintenanceYearly === null ? "Unknown" : money(r.maintenance)}</dd></div><div><dt>Subscriptions over period</dt><dd>{a.subscription === null ? "Unknown" : money(r.subscriptions)}</dd></div><div><dt>Expected resale</dt><dd>{a.resale === null ? "Unknown" : money(a.resale)}</dd></div><div><dt>Price difference from named alternative</dt><dd>{r.alternativeDifference === null ? "Not entered" : `${r.alternativeDifference < 0 ? "−" : "+"}${money(Math.abs(r.alternativeDifference))}`}</dd></div></>}
        {factors.includes("Usage") && <><div><dt>Expected ownership (not verified lifetime)</dt><dd>{r.months} months</dd></div><div><dt>Estimated total uses</dt><dd>{formatQuantity(r.totalUses)}</dd></div><div className="emphasized"><dt>Estimated cost per use</dt><dd>{r.costPerUse === null ? "No expected uses" : formatUnitCost(r.costPerUse, a.currency)}</dd></div></>}
        {factors.includes("Goal") && <div><dt>Upfront goal delay</dt><dd>{!r.goal ? "Not included" : r.goal.delay === null ? "Unreachable with current contribution" : `+${formatQuantity(r.goal.delay)} ${r.goal.unit}s`}</dd></div>}
        {factors.includes("Purpose") && <><div><dt>Expected usefulness / importance</dt><dd>{a.usefulness}/5 · {a.importance}/5 (your assessments)</dd></div><div><dt>Problem to solve</dt><dd>{a.purpose || "Not entered"}</dd></div></>}
        <div><dt>Unknown or excluded</dt><dd>{r.missing.length ? r.missing.join(", ") : "None · all figures remain estimates"}</dd></div>
      </dl></details><div className="product-actions"><button className="button-outline" onClick={() => { startComparison(); setEditing(index); }} type="button">Edit assumptions</button><button className="button-outline" disabled={choices.length >= 3} type="button" onClick={() => add({ ...a, name: `${a.name.slice(0,72)} copy` }, choice.demo)}>Duplicate</button><button className="button-quiet" type="button" onClick={() => setChoices(c => c.filter((_, i) => i !== index))}>Remove from view</button></div>
      {!choice.demo && <button className="text-link" type="button" disabled={busy || products.saving || !!products.error} onClick={async () => { if (busy) return; setBusy(true); try { const now = new Date().toISOString(); if (!copyIds.current.has(choice.key)) copyIds.current.set(choice.key, crypto.randomUUID()); await products.save({ id: copyIds.current.get(choice.key)!, analysis: a, status: "considering", reason: "", createdAt: now, updatedAt: now }); copyIds.current.delete(choice.key); setMessage("An independent copy was saved to your queue."); trackProductEvent("decision_saved"); } catch { setMessage("Could not save. Your existing product data was kept."); } finally { setBusy(false); } }}>Save an independent receipt copy →</button>}
      {choice.demo && <button className="text-link" type="button" onClick={() => setChoices(current => current.map((c,i) => i === index ? { ...c, demo: false } : c))}>Use example as my own starting point →</button>}
      </article>;
    })}</div>
    <details className="product-demo-picker"><summary>Explore fictional demonstrations</summary><p>Example assumptions only, not market prices, durability claims, or your saved records. Selecting a demo replaces only this unsaved comparison view.</p><div className="product-actions">{demoGroups.map(group => <button key={group.name} className="button-outline" type="button" onClick={() => { setChoices(group.products.map((analysis, index) => ({ key: `demo-${index}`, analysis, demo: true }))); setMessage(""); }}>{group.name}</button>)}</div></details>
    {choices.length > 0 && <details className="comparison-options"><summary>Customize supporting details</summary><fieldset className="factor-picker"><legend>Supporting breakdown</legend>{["Costs", "Usage", "Goal", "Purpose"].map(factor => <label key={factor} className="product-check"><input type="checkbox" checked={factors.includes(factor)} onChange={event => setFactors(current => event.target.checked ? [...current, factor] : current.filter(f => f !== factor))} />{factor}</label>)}<p>Choose what appears in the full breakdown. The key measures stay visible.</p></fieldset></details>}
    {choices.length > 0 && <details className="assumption-differences"><summary>Compare the assumptions</summary><p>Different durations, frequencies, cost coverage, and goals can explain differences. Compare equivalent periods and complete missing costs before drawing conclusions. Purchase prices are not lifetime costs.</p><div className="product-comparison-grid">{choices.map((c,index) => <div key={c.key}><h3>Option {index + 1}: {c.analysis.name}</h3><dl className="product-metrics"><div><dt>Ownership / usage</dt><dd>{c.analysis.duration} {c.analysis.durationUnit} · {c.analysis.uses} uses/{c.analysis.useFrequency}</dd></div><div><dt>Maintenance</dt><dd>{c.analysis.maintenanceYearly === null ? "Unknown" : `${formatMoney(c.analysis.maintenanceYearly,c.analysis.currency)}/year`}</dd></div><div><dt>Subscription</dt><dd>{c.analysis.subscription === null ? "Unknown" : `${formatMoney(c.analysis.subscription,c.analysis.currency)}/${c.analysis.subscriptionFrequency}`}</dd></div><div><dt>Accessories / repairs, whole period</dt><dd>{c.analysis.accessories === null ? "Unknown" : formatMoney(c.analysis.accessories,c.analysis.currency)} / {c.analysis.repairs === null ? "Unknown" : formatMoney(c.analysis.repairs,c.analysis.currency)}</dd></div><div><dt>Goal assumptions</dt><dd>{c.analysis.goal ? `${c.analysis.goal.name}: ${formatMoney(c.analysis.goal.saved,c.analysis.currency)} saved of ${formatMoney(c.analysis.goal.target,c.analysis.currency)}, ${formatMoney(c.analysis.goal.contribution,c.analysis.currency)}/${c.analysis.goal.frequency}` : "No goal"}</dd></div></dl></div>)}</div></details>}
    <Link className="text-link" href="/queue">Your decision queue →</Link>
  </div>;
}
export default function CompareWorkspace() {
  const { records, error, loading } = useProducts(), params = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean).slice(0,3);
  if (loading) return <Skeleton label="Preparing your comparison" />;
  const demo = params.get("demo") !== null ? demoGroups[Number(params.get("demo"))] : undefined;
  const initial = demo ? demo.products.map((analysis, index) => ({ key: `demo-${index}`, analysis, demo: true })) : ids.map(id => records.find(r => r.id === id)).filter((r): r is ProductRecord => !!r).map(r => ({ key:r.id, analysis:r.analysis, demo:false, sourceId:r.id }));
  return <><StorageStatus />{error && <p role="status" className="product-error">{error}</p>}{ids.length > initial.length && <p className="product-notice">Some linked products are not available in your current storage.</p>}<Comparison key={`${ids.join(",")}:${params.get("demo") ?? ""}`} initial={initial} records={records} /></>;
}
