"use client";
import { useEffect, useId, useRef } from "react";
import { printReceipt } from "./print-receipt";
import ProductScore from "./product-score-view";
import ReceiptLine from "./receipt-line";
import { useReceiptMotion } from "./use-receipt-motion";
import { analyzeProduct } from "./product-calculations";
import { formatMoney, formatUnitCost, formatQuantity, type ProductAnalysis } from "./product-model";

export default function TrueCostReceipt({ analysis: a, demo = false, compact = false }: { analysis: ProductAnalysis; demo?: boolean; compact?: boolean }) {
  const r = analyzeProduct(a), heading = useId(), receipt = useRef<HTMLElement>(null);
  useReceiptMotion(receipt);
  const printCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => { printCleanup.current?.(); }, []);
  const money = (n: number) => formatMoney(n, a.currency);
  const optional = (n: number | null, calculated = n) => n === null ? "Unknown · excluded" : money(calculated ?? 0);
  const breakdown = <>
    <dl className="receipt-lines">
      <ReceiptLine label="Sticker price" help={compact ? undefined : "The purchase price you entered, before tax, shipping, or future expenses."}>{money(a.price)}</ReceiptLine>
      <ReceiptLine label="+ Tax" help={compact ? undefined : "The tax amount you entered, not a percentage. Unknown tax is excluded from the estimate."}>{optional(a.tax)}</ReceiptLine>
      <ReceiptLine label="+ Shipping" help={compact ? undefined : "A one-time delivery cost. Enter 0 only when shipping does not apply."}>{optional(a.shipping)}</ReceiptLine>
      <ReceiptLine label="Total initial cost" subtotal>{money(r.initial)}</ReceiptLine>
    </dl>
    <dl className="receipt-lines">
      <ReceiptLine label={`+ Maintenance over ${r.months} months`} help={compact ? undefined : "Your yearly maintenance estimate multiplied by ownership months ÷ 12, rounded to cents."}>{optional(a.maintenanceYearly, r.maintenance)}</ReceiptLine>
      <ReceiptLine label="+ Accessories / consumables, entire period" help={compact ? undefined : "The total accessories or consumables allowance for your entire ownership period, not a monthly rate."}>{optional(a.accessories)}</ReceiptLine>
      <ReceiptLine label={`+ Subscriptions over ${r.months} months`} help={compact ? undefined : "Your subscription amount multiplied by ownership months, divided by 12 when you entered an annual rate."}>{optional(a.subscription, r.subscriptions)}</ReceiptLine>
      <ReceiptLine label="+ Repair allowance, entire period" help={compact ? undefined : "Your total allowance for repairs over the selected period. It is an estimate, not a prediction that repairs will happen."}>{optional(a.repairs)}</ReceiptLine>
      <ReceiptLine label="Ownership expenses" subtotal>{money(r.ownership)}</ReceiptLine>
      <ReceiptLine label="− Expected resale deduction" offset help={compact ? undefined : "Your estimated resale reduces ownership cost. The deduction cannot exceed modeled costs; resale is not guaranteed."}>{optional(a.resale, r.resaleDeduction)}</ReceiptLine>
    </dl>
  </>;
  function print() {
    const element = receipt.current; if (!element) return;
    printCleanup.current?.();
    printCleanup.current = printReceipt(element);
  }
  return <article ref={receipt} className={`true-receipt ${compact ? "receipt-compact" : ""}`} aria-labelledby={heading}>
    <header className="receipt-heading"><p className="eyebrow">DecisionLab / {demo ? "Fictional demonstration" : "Your estimates"}</p><h2 id={heading} tabIndex={-1}>True Cost Receipt</h2><p>{a.name}{a.model ? ` · ${a.model}` : ""}</p><span>{a.condition} · {a.currency} · {r.months} months planned ownership</span></header>
    {demo && <p className="product-notice">Fictional example · not market prices. Nothing is saved.</p>}
    {compact ? <dl className="receipt-lines receipt-overview">
      <ReceiptLine label="Sticker price">{money(a.price)}</ReceiptLine>
      {a.tax !== 0 && <ReceiptLine label="+ Tax">{optional(a.tax)}</ReceiptLine>}
      {a.shipping !== 0 && <ReceiptLine label="+ Shipping">{optional(a.shipping)}</ReceiptLine>}
      <ReceiptLine label="+ Ownership expenses">{money(r.ownership)}</ReceiptLine>
      <ReceiptLine label="− Expected resale deduction" offset>{optional(a.resale, r.resaleDeduction)}</ReceiptLine>
    </dl> : <>
      {breakdown}
    </>}
    <div className="receipt-results" aria-live={compact ? "polite" : undefined}>
      <div className="receipt-total"><span>Estimated true cost · net ownership</span><strong><span className="receipt-amount" key={money(r.net)}>{money(r.net)}</span></strong></div>
      <div className="receipt-per-use"><span>Estimated cost per use</span><strong><span className="receipt-amount" key={r.costPerUse === null ? "none" : formatUnitCost(r.costPerUse, a.currency)}>{r.costPerUse === null ? "Not available" : formatUnitCost(r.costPerUse, a.currency)}</span></strong><span>{r.costPerUse === null ? "Enter more than zero expected uses to calculate." : `Across approximately ${formatQuantity(r.totalUses)} uses`}</span></div>
    </div>
    {!compact && (a.alternative || a.goal) && <dl className="receipt-lines"><div><dt>Purchase-price difference from alternative</dt><dd>{r.alternativeDifference === null ? "No alternative entered" : `${r.alternativeDifference >= 0 ? "+" : "−"}${money(Math.abs(r.alternativeDifference))}`}</dd></div>{a.alternative && <div><dt>Alternative</dt><dd>{a.alternative.name} · {money(a.alternative.price)}</dd></div>}<div><dt>Selected goal / upfront impact</dt><dd>{!r.goal ? "Not included" : r.goal.delay === null ? "Goal cannot be reached under these assumptions" : `+${formatQuantity(r.goal.delay)} ${r.goal.unit}s`}</dd></div></dl>}
    {!compact && <ProductScore analysis={a} />}
    <p className="receipt-note">{r.missing.length ? "Incomplete estimate: unknown costs are excluded, not treated as zero." : "Based on your estimates, not verified prices."} {!compact && r.ongoingShare >= .25 && "Ongoing costs are at least 25% of modeled gross cost."}{!compact && " Cost per use depends on expected usage."}</p>
    {r.resaleCapped && <p className="product-notice">Entered resale exceeds modeled costs. The deduction is capped at those costs; net cost is floored at zero, not treated as profit.</p>}
    {compact && <details className="receipt-breakdown"><summary>Full cost breakdown</summary>
      {breakdown}
    </details>}
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
