"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProducts } from "./use-products";
import { compareProducts } from "./product-calculations";
import { formatMoney, formatUnitCost, formatQuantity, type ProductAnalysis, type ProductRecord } from "./product-model";
import { demoGroups } from "./demo-products";
import ProductForm from "./product-form";
import { saveProduct } from "./product-storage";
import { notifyStorageChange } from "../use-local-storage";
import Skeleton from "../components/skeleton";

type Choice = { key: string; analysis: ProductAnalysis; demo: boolean; sourceId?: string };
function Comparison({ initial, records }: { initial: Choice[]; records: ProductRecord[] }) {
  const [choices, setChoices] = useState(initial), [editing, setEditing] = useState<number | "new" | null>(null);
  const [factors, setFactors] = useState(["Costs", "Usage", "Goal", "Purpose"]), [message, setMessage] = useState("");
  const comparison = choices.length ? compareProducts(choices.map(c => c.analysis)) : null;
  function add(analysis: ProductAnalysis, demo = false, sourceId?: string) { if (choices.length >= 3) return; setChoices(current => [...current, { key: crypto.randomUUID(), analysis, demo, sourceId }]); setMessage(""); }
  if (editing !== null) return <ProductForm key={editing} initial={editing === "new" ? undefined : choices[editing].analysis} onCancel={() => setEditing(null)} onComplete={analysis => { if (editing === "new") add(analysis); else setChoices(current => current.map((choice, index) => index === editing ? { ...choice, analysis, sourceId: undefined } : choice)); setEditing(null); }} />;
  return <div className="comparison-workspace">
    <div className="product-toolbar"><button className="button-primary" type="button" disabled={choices.length >= 3} onClick={() => setEditing("new")}>Create product manually</button><div className="product-field"><label htmlFor="compare-load">Load an analyzed product</label><select id="compare-load" value="" disabled={choices.length >= 3} onChange={event => { const record = records.find(r => r.id === event.target.value); if (record) add(record.analysis, false, record.id); }}><option value="">Select a saved product</option>{records.map(record => <option key={record.id} value={record.id}>{record.analysis.name} · {record.analysis.condition}</option>)}</select></div></div>
    <details className="product-demo-picker"><summary>Explore fictional demonstrations</summary><p>Example assumptions only, not market prices, durability claims, or your saved records. Selecting a demo replaces only this unsaved comparison view.</p><div className="product-actions">{demoGroups.map(group => <button key={group.name} className="button-outline" type="button" onClick={() => { setChoices(group.products.map((analysis, index) => ({ key: `demo-${index}`, analysis, demo: true }))); setMessage(""); }}>{group.name}</button>)}</div></details>
    <fieldset className="factor-picker"><legend>Which factors matter to you?</legend>{["Costs", "Usage", "Goal", "Purpose"].map(factor => <label key={factor} className="product-check"><input type="checkbox" checked={factors.includes(factor)} onChange={event => setFactors(current => event.target.checked ? [...current, factor] : current.filter(f => f !== factor))} />{factor}</label>)}<p>These filters change what is shown, not a score. There is no universal winner.</p></fieldset>
    {!choices.length && <div className="product-empty"><h2>One question. Up to three possibilities.</h2><p>Create a product, load an analysis, or try a fictional demonstration. Currency differences are never converted automatically.</p></div>}
    {comparison && !comparison.sameCurrency && <p className="product-notice">Different currencies: cross-product monetary differences are unavailable. Compare amounts only after entering all products in the same currency.</p>}
    <p className="product-status" role="status">{message}</p>
    <div className="product-comparison-grid">{choices.map((choice,index) => {
      const a = choice.analysis, r = comparison!.results[index], money = (v: number) => formatMoney(v, a.currency);
      return <article className="comparison-product" key={choice.key}><p className="eyebrow">Option {index + 1} · {choice.demo ? "Fictional demo" : choice.sourceId ? "Saved snapshot" : "Unsaved comparison"}</p><h2>{a.name}</h2><p>{a.condition} · {a.currency}</p><dl className="product-metrics">
        {factors.includes("Costs") && <><div><dt>Purchase price</dt><dd>{money(a.price)}</dd></div><div><dt>Initial cost incl. known tax/shipping</dt><dd>{money(r.initial)}</dd></div><div className="emphasized"><dt>Net ownership estimate</dt><dd>{money(r.net)}</dd></div><div><dt>Difference from option 1</dt><dd>{comparison!.netDifferences[index] === null ? "Different currency" : `${comparison!.netDifferences[index]! < 0 ? "−" : "+"}${money(Math.abs(comparison!.netDifferences[index]!))}`}</dd></div><div><dt>Maintenance over period</dt><dd>{a.maintenanceYearly === null ? "Unknown" : money(r.maintenance)}</dd></div><div><dt>Subscriptions over period</dt><dd>{a.subscription === null ? "Unknown" : money(r.subscriptions)}</dd></div><div><dt>Expected resale</dt><dd>{a.resale === null ? "Unknown" : money(a.resale)}</dd></div><div><dt>Price difference from named alternative</dt><dd>{r.alternativeDifference === null ? "Not entered" : `${r.alternativeDifference < 0 ? "−" : "+"}${money(Math.abs(r.alternativeDifference))}`}</dd></div></>}
        {factors.includes("Usage") && <><div><dt>Expected ownership (not verified lifetime)</dt><dd>{r.months} months</dd></div><div><dt>Estimated total uses</dt><dd>{formatQuantity(r.totalUses)}</dd></div><div className="emphasized"><dt>Estimated cost per use</dt><dd>{r.costPerUse === null ? "No expected uses" : formatUnitCost(r.costPerUse, a.currency)}</dd></div></>}
        {factors.includes("Goal") && <div><dt>Upfront goal delay</dt><dd>{!r.goal ? "Not included" : r.goal.delay === null ? "Unreachable with current contribution" : `+${formatQuantity(r.goal.delay)} ${r.goal.unit}s`}</dd></div>}
        {factors.includes("Purpose") && <><div><dt>Expected usefulness / importance</dt><dd>{a.usefulness}/5 · {a.importance}/5 (your assessments)</dd></div><div><dt>Problem to solve</dt><dd>{a.purpose || "Not entered"}</dd></div></>}
        <div><dt>Unknown or excluded</dt><dd>{r.missing.length ? r.missing.join(", ") : "None entered as unknown; all figures remain estimates"}</dd></div>
      </dl><div className="product-actions"><button className="button-outline" onClick={() => setEditing(index)} type="button">Edit assumptions</button><button className="button-outline" disabled={choices.length >= 3} type="button" onClick={() => add({ ...a, name: `${a.name.slice(0,72)} copy` }, choice.demo)}>Duplicate</button><button className="button-quiet" type="button" onClick={() => setChoices(c => c.filter((_, i) => i !== index))}>Remove from view</button></div>
      {!choice.demo && <button className="text-link" type="button" onClick={() => { try { const now = new Date().toISOString(); saveProduct(window.localStorage, { id: crypto.randomUUID(), analysis: a, status: "considering", reason: "", createdAt: now, updatedAt: now }); notifyStorageChange(); setMessage("An independent copy was saved to your queue."); } catch { setMessage("Could not save. Your existing product data was kept."); } }}>Save an independent receipt copy →</button>}
      {choice.demo && <button className="text-link" type="button" onClick={() => setChoices(current => current.map((c,i) => i === index ? { ...c, demo: false } : c))}>Use example as my own starting point →</button>}
      </article>;
    })}</div>
    {choices.length > 0 && <details className="assumption-differences"><summary>Assumptions-difference view</summary><p>Different durations, frequencies, cost coverage, and goals can explain differences. Compare equivalent periods and complete missing costs before drawing conclusions. Purchase prices are not lifetime costs.</p><div className="product-comparison-grid">{choices.map((c,index) => <div key={c.key}><h3>Option {index + 1}: {c.analysis.name}</h3><dl className="product-metrics"><div><dt>Ownership / usage</dt><dd>{c.analysis.duration} {c.analysis.durationUnit} · {c.analysis.uses} uses/{c.analysis.useFrequency}</dd></div><div><dt>Maintenance</dt><dd>{c.analysis.maintenanceYearly === null ? "Unknown" : `${formatMoney(c.analysis.maintenanceYearly,c.analysis.currency)}/year`}</dd></div><div><dt>Subscription</dt><dd>{c.analysis.subscription === null ? "Unknown" : `${formatMoney(c.analysis.subscription,c.analysis.currency)}/${c.analysis.subscriptionFrequency}`}</dd></div><div><dt>Accessories / repairs, whole period</dt><dd>{c.analysis.accessories === null ? "Unknown" : formatMoney(c.analysis.accessories,c.analysis.currency)} / {c.analysis.repairs === null ? "Unknown" : formatMoney(c.analysis.repairs,c.analysis.currency)}</dd></div><div><dt>Goal assumptions</dt><dd>{c.analysis.goal ? `${c.analysis.goal.name}: ${formatMoney(c.analysis.goal.saved,c.analysis.currency)} saved of ${formatMoney(c.analysis.goal.target,c.analysis.currency)}, ${formatMoney(c.analysis.goal.contribution,c.analysis.currency)}/${c.analysis.goal.frequency}` : "No goal"}</dd></div></dl></div>)}</div></details>}
    <Link className="text-link" href="/queue">Your decision queue →</Link>
  </div>;
}
export default function CompareWorkspace() {
  const { records, error, loading } = useProducts(), params = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean).slice(0,3);
  if (loading) return <Skeleton label="Loading product comparisons" />;
  const demo = params.get("demo") !== null ? demoGroups[Number(params.get("demo"))] : undefined;
  const initial = demo ? demo.products.map((analysis, index) => ({ key: `demo-${index}`, analysis, demo: true })) : ids.map(id => records.find(r => r.id === id)).filter((r): r is ProductRecord => !!r).map(r => ({ key:r.id, analysis:r.analysis, demo:false, sourceId:r.id }));
  return <>{error && <p role="status" className="product-error">{error}</p>}{ids.length > initial.length && <p className="product-notice">Some linked products are not available in this browser.</p>}<Comparison key={`${ids.join(",")}:${params.get("demo") ?? ""}`} initial={initial} records={records} /></>;
}
