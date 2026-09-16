import { formatQuantity, formatUnitCost } from "../products/product-model";
import { storyProduct as fictionalProduct, storyResult as result, storyMoney as money } from "./cost-story-model";

/** Native disclosure: the complete calculation works without JavaScript or motion. */
export default function HiddenCostStory() {
  return <figure className="hidden-cost-story" aria-labelledby="hidden-cost-caption">
    <figcaption id="hidden-cost-caption">Fictional camera · USD · see beyond the price</figcaption>
    <details className="hidden-cost-reveal">
      <summary>
        <span className="hidden-cost-price-label">The price you see</span>
        <span className="hidden-cost-sticker">{money(fictionalProduct.price)}</span>
        <span className="hidden-cost-trigger"><span className="hidden-cost-closed-label">Reveal the hidden costs</span><span className="hidden-cost-open-label">Hide the cost breakdown</span><span className="hidden-cost-arrow" aria-hidden="true">↓</span></span>
      </summary>
      <div className="hidden-cost-breakdown">
        <dl className="hidden-cost-lines">
          <div><dt>Accessories</dt><dd>+ {money(fictionalProduct.accessories ?? 0)}</dd></div>
          <div><dt>Maintenance over {result.months} months</dt><dd>+ {money(result.maintenance)}</dd></div>
          <div><dt>Subscriptions over {result.months} months</dt><dd>+ {money(result.subscriptions)}</dd></div>
          <div className="hidden-cost-resale"><dt>Expected resale</dt><dd>− {money(result.resaleDeduction)}</dd></div>
        </dl>
        <div className="hidden-cost-total"><span>Estimated true cost</span><strong>{money(result.net)}</strong></div>
        <div className="hidden-cost-per-use"><strong>{result.costPerUse === null ? "Not available" : formatUnitCost(result.costPerUse, fictionalProduct.currency)}</strong><span>per use · {formatQuantity(result.totalUses)} expected uses</span></div>
        <p className="hidden-cost-assumptions">USD. {fictionalProduct.duration} years, {fictionalProduct.uses} uses a week. {money(fictionalProduct.maintenanceYearly ?? 0)} yearly maintenance; {money(fictionalProduct.subscription ?? 0)} monthly subscription. Tax, shipping, and repairs: $0. Resale is an estimate.</p>
      </div>
    </details>
    <p className="hidden-cost-disclaimer">Fictional inputs. No market claims. Nothing saved.</p>
  </figure>;
}
