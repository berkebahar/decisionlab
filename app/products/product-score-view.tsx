import { productScore } from "./product-score";
import { formatMoney, formatUnitCost, type ProductAnalysis } from "./product-model";

export default function ProductScore({ analysis }: { analysis: ProductAnalysis }) {
  const score = productScore(analysis);
  if (!score) return null;
  return <section className="personal-score" aria-label="User-specific product score">
    <div className="personal-score-heading"><div><span>User-specific product score</span><p>Fit against your personal limits</p></div><strong>{score.percent === null ? "Incomplete" : `${score.percent}%`}</strong></div>
    <p className="personal-score-note">{score.percent === null ? "Complete the missing estimates below to calculate your score." : "An estimate based on your targets, not a probability you should buy or proof of affordability."}</p>
    <details><summary>Score breakdown & method</summary>
      <dl>{score.factors.map(factor => <div key={factor.key}><dt>{factor.label}<span>{factor.unit === "months" ? `Minimum ${factor.limit} months` : factor.unit === "rating" ? `Minimum ${factor.limit}/5` : `Maximum ${formatMoney(factor.limit, analysis.currency)}${factor.key === "maxCostPerUse" ? " / use" : ""}`}</span></dt><dd>{factor.percent === null ? `Missing: ${factor.missing.join(", ")}` : `${Math.round(factor.percent)}% fit`}<span>{factor.value === null ? "No cost per use at zero uses" : factor.unit === "months" ? `${factor.value} months planned` : factor.unit === "rating" ? `${factor.value}/5 expected` : factor.key === "maxCostPerUse" ? `${formatUnitCost(factor.value, analysis.currency)} / use` : formatMoney(factor.value, analysis.currency)}</span></dd></div>)}</dl>
      <p>Each selected factor has equal weight. Cost fit = 100% within your maximum, otherwise maximum ÷ estimate × 100. Ownership/usefulness fit = estimate ÷ minimum × 100, capped at 100%. Average the unrounded factors, then round once. Missing required inputs prevent a total.</p>
      <p>Cost factors overlap: choosing several gives cost more influence. Fees, resale, and usage affect costs. Ownership duration is your expectation, not verified durability. This score is not a recommendation or guarantee.</p>
    </details>
  </section>;
}
