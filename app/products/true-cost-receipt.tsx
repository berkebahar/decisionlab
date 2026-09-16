"use client";
import { useId, useRef } from "react";
import { analyzeProduct } from "./product-calculations";
import { formatMoney, formatUnitCost, formatQuantity, type ProductAnalysis } from "./product-model";

export default function TrueCostReceipt({ analysis: a, demo = false, compact = false }: { analysis: ProductAnalysis; demo?: boolean; compact?: boolean }) {
  const r = analyzeProduct(a), heading = useId(), receipt = useRef<HTMLElement>(null);
  const money = (n: number) => formatMoney(n, a.currency);
  const optional = (n: number | null, calculated = n) => n === null ? "Unknown · excluded" : money(calculated ?? 0);
  function print() {
    const element = receipt.current; if (!element) return;
    const details = [...element.querySelectorAll("details")]; const states = details.map(d => d.open);
    element.classList.add("receipt-print-target"); details.forEach(d => d.open = true);
    try { window.print(); } finally { element.classList.remove("receipt-print-target"); details.forEach((d,i) => d.open = states[i]); }
  }
  return <article ref={receipt} className={`true-receipt ${compact ? "receipt-compact" : ""}`} aria-labelledby={heading}>
    <header className="receipt-heading"><p className="eyebrow">DecisionLab / {demo ? "Fictional demonstration" : "Your estimates"}</p><h2 id={heading}>True Cost Receipt</h2><p>{a.name}{a.model ? ` · ${a.model}` : ""}</p><span>{a.condition} · {a.currency} · {r.months} months planned ownership</span></header>
    {demo && <p className="product-notice">Fictional example, not current market prices or product specifications. Nothing here is saved.</p>}
    <dl className="receipt-lines"><div><dt>Purchase price</dt><dd>{money(a.price)}</dd></div><div><dt>+ Tax</dt><dd>{optional(a.tax)}</dd></div><div><dt>+ Shipping</dt><dd>{optional(a.shipping)}</dd></div><div className="receipt-subtotal"><dt>Total initial cost</dt><dd>{money(r.initial)}</dd></div></dl>
    <dl className="receipt-lines"><div><dt>+ Maintenance over {r.months} months</dt><dd>{optional(a.maintenanceYearly, r.maintenance)}</dd></div><div><dt>+ Accessories / consumables, entire period</dt><dd>{optional(a.accessories)}</dd></div><div><dt>+ Subscriptions over {r.months} months</dt><dd>{optional(a.subscription, r.subscriptions)}</dd></div><div><dt>+ Repair allowance, entire period</dt><dd>{optional(a.repairs)}</dd></div><div className="receipt-subtotal"><dt>Ownership expenses</dt><dd>{money(r.ownership)}</dd></div><div><dt>− Expected resale deduction</dt><dd>{optional(a.resale, r.resaleDeduction)}</dd></div></dl>
    <div className="receipt-results" aria-live={compact ? "polite" : undefined}><div><span>Estimated net ownership cost</span><strong>{money(r.net)}</strong></div><div><span>Estimated cost per use</span><strong>{r.costPerUse === null ? "Not available" : formatUnitCost(r.costPerUse, a.currency)}</strong><span>{r.costPerUse === null ? "Enter more than zero expected uses to calculate." : `Across approximately ${formatQuantity(r.totalUses)} uses`}</span></div></div>
    {!compact && <dl className="receipt-lines"><div><dt>Purchase-price difference from alternative</dt><dd>{r.alternativeDifference === null ? "No alternative entered" : `${r.alternativeDifference >= 0 ? "+" : "−"}${money(Math.abs(r.alternativeDifference))}`}</dd></div>{a.alternative && <div><dt>Alternative</dt><dd>{a.alternative.name} · {money(a.alternative.price)}</dd></div>}<div><dt>Selected goal / upfront impact</dt><dd>{!r.goal ? "Not included" : r.goal.delay === null ? "Goal cannot be reached under these assumptions" : `+${formatQuantity(r.goal.delay)} ${r.goal.unit}s`}</dd></div></dl>}
    <p className="receipt-note">{r.missing.length ? "More information is needed for a reliable comparison. Unknown values are excluded, not assumed to be zero." : "All cost fields are filled; they remain user-entered estimates, not verified prices."} {r.ongoingShare >= .25 && "Ongoing costs are at least 25% of modeled gross cost."} The result depends on expected usage; halve the uses and cost per use doubles.</p>
    {r.resaleCapped && <p className="product-notice">Entered resale exceeds modeled costs. The deduction is capped at those costs; net cost is floored at zero, not treated as profit.</p>}
    <details className="receipt-assumptions"><summary>Assumptions, missing inputs & formulas</summary>
      <p>Inputs are your estimates. Totals and cost per use are DecisionLab calculations. {r.missing.length ? `Unknown or excluded: ${r.missing.join(", ")}.` : "No cost inputs are missing."}</p>
      <p>Ownership: {a.duration} {a.durationUnit}; usage: {a.uses} per {a.useFrequency}. Years use 12 months and 52 weeks. Weekly usage is spread evenly across months. These are expectations, not durability guarantees.</p>
      <p>Initial = price + tax + shipping. Ownership expenses = yearly maintenance × months ÷ 12 + accessories/consumables for the whole period + subscription × months (÷ 12 for an annual rate) + repair allowance. Net = max(0, initial + ownership expenses − resale). Uses = frequency × duration. Cost per use = net ÷ uses; unavailable at zero uses.</p>
      <p>Currency is {a.currency}; no exchange-rate conversion. Amounts round to cents; estimates do not become more certain because they have decimal places. No inflation, interest, financing, energy, insurance, disposal fees, or other costs are included unless entered in the relevant cost allowances.</p>
      <p>Alternative differences compare purchase prices only, not ownership value. Use Compare for a fuller comparison. Importance {a.importance}/5 and usefulness {a.usefulness}/5 are your subjective assessments, never a scientific buying score.</p>
      {a.goal && <p>Goal: {a.goal.name}, {money(a.goal.saved)} saved toward {money(a.goal.target)}, adding {money(a.goal.contribution)} per {a.goal.frequency}. Count end-of-{a.goal.frequency} deposits, first in one {a.goal.frequency}. Baseline = ceil(max(0, target − saved) ÷ contribution); with purchase = ceil(max(0, target − saved + initial cost) ÷ contribution). Delay is the difference. Only upfront cost is included: future expenses and resale occur at unknown times. Contributions are after other expenses and exclude this purchase. Spending beyond available savings is hypothetical future spending, not assumed borrowing.</p>}
      <p>Purpose: {a.purpose || "Not entered"}. {a.replaces ? "Replaces something already owned." : "Not marked as a replacement."} Next-best use: {a.nextBestUse || "Not entered"}.</p>
    </details>
    {!compact && <button className="button-outline receipt-print" type="button" onClick={print}>Print receipt</button>}
  </article>;
}
