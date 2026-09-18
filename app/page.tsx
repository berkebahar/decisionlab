import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./botanical-home.css";
import "./editorial-home.css";
import "./atmospheric-home.css";
import "./editorial-story.css";
import BotanicalRain from "./components/botanical-rain";
import LandingAtmosphere from "./components/landing-atmosphere";
import HiddenCostStory from "./components/hidden-cost-story";
import BotanicalShade from "./components/botanical-shade";
import CostScrollStory from "./components/cost-scroll-story";
import { storyProduct } from "./components/cost-story-model";
import ReceiptPreview from "./products/receipt-preview";
import Icon from "./components/lab-icon";
import { demoGroups } from "./products/demo-products";
import { actualResults, analyzeProduct } from "./products/product-calculations";
import { formatMoney, formatQuantity, formatUnitCost, type PurchaseReview } from "./products/product-model";

export const metadata: Metadata = {
  title: { absolute: "DecisionLab — Before you buy it, see what it will really cost." },
  description: "See the price, the upkeep, and what each use could cost. A private pre-purchase decision tool.",
};

// An illustrative completed ownership period, never written to personal storage.
const illustrativeReview: PurchaseReview = {
  price: 1200, tax: 0, shipping: 0, purchaseDate: "2021-01-01", uses: 650,
  maintenance: 140, accessories: 95, subscriptions: 0, repairs: 140,
  satisfaction: 4, buyAgain: "unsure", lifecycle: "sold", resale: 200,
  reflection: "Fictional illustration of a completed four-year ownership period.", updatedAt: "2025-01-01T12:00:00.000Z",
};

export default function Home() {
  const example = demoGroups[0].products[0];
  const predicted = analyzeProduct(example);
  const experienced = actualResults(example, illustrativeReview, new Date(illustrativeReview.updatedAt));

  return <div className="editorial-home">
    <section className="botanical-hero editorial-hero" aria-labelledby="hero-heading" data-pointer-light>
      <div className="botanical-backdrop" aria-hidden="true"><Image src="/images/decisionlab-botanical-hero.webp" alt="" fill sizes="100vw" loading="eager" fetchPriority="high" /></div>
      <BotanicalRain />
      <BotanicalShade placement="hero" />
      <div className="hero container product-hero">
        <LandingAtmosphere />
        <div className="hero-copy">
          <p className="eyebrow">A clearer view of your next purchase.</p>
          <h1 id="hero-heading">Before you buy it,<br />see what it will really cost.</h1>
          <p className="hero-description">See the price, the upkeep, and what each use could cost.</p>
          <div className="hero-actions"><Link href="/analyze" className="button-primary">Analyze a product <Icon name="arrow" /></Link><Link href="/compare" className="editorial-text-link">Compare products <span aria-hidden="true">↗</span></Link></div>
          <p className="editorial-privacy">No account. No bank details. Private to this browser.</p>
        </div>
        <HiddenCostStory />
        <a className="editorial-scroll-cue" href="#cost-story">See the whole picture <span aria-hidden="true">↓</span></a>
      </div>
    </section>

    <CostScrollStory />

    <section className="editorial-section editorial-receipt-section" aria-labelledby="receipt-preview-heading" id="receipt-preview">
      <BotanicalShade placement="receipt" />
      <div className="container editorial-receipt-layout">
        <div className="editorial-section-copy">
          <p className="eyebrow">02 / Your assumptions, on paper</p>
          <h2 id="receipt-preview-heading">Your True Cost.<br />One clear receipt.</h2>
          <p>Adjust the usage below, then try your own purchase.</p>
          <Link href="/analyze" className="text-link">Create your own receipt <Icon name="arrow" size={17} /></Link>
        </div>
        <div className="editorial-live-receipt"><span className="receipt-paper-layers" data-atmosphere-reveal="paper" aria-hidden="true" /><ReceiptPreview product={storyProduct} /></div>
      </div>
    </section>

    <section className="editorial-section container editorial-comparison" aria-labelledby="comparison-heading">
      <div className="editorial-section-heading"><p className="eyebrow">03 / A matter of perspective</p><h2 id="comparison-heading">Different assumptions.<br />Different costs.</h2></div>
      <div className="editorial-comparison-columns">
        {demoGroups[0].products.map(product => {
          const result = analyzeProduct(product);
          return <article key={product.name} className="editorial-product-column">
            <p className="eyebrow">Fictional example / {product.condition}</p>
            <h3>{product.condition === "new" ? "The new laptop" : "The refurbished laptop"}</h3>
            <p className="editorial-large-number">{result.costPerUse === null ? "Not available" : formatUnitCost(result.costPerUse, product.currency)}<span>per expected use</span></p>
            <dl className="editorial-comparison-facts"><div><dt>Net ownership cost</dt><dd>{formatMoney(result.net, product.currency)}</dd></div><div><dt>Planned ownership</dt><dd>{result.months} months</dd></div></dl>
          </article>;
        })}
      </div>
      <div className="editorial-comparison-footer"><p>Fictional estimates, not market prices. Your priorities decide the trade-off.</p><Link href="/compare?demo=0" className="text-link">Explore this comparison <Icon name="arrow" size={17} /></Link></div>
    </section>

    <section className="editorial-section editorial-queue" aria-labelledby="queue-heading" data-pointer-light>
      <BotanicalShade placement="queue" />
      <div className="container editorial-queue-layout">
        <div className="editorial-section-copy"><p className="eyebrow">04 / Time to consider</p><h2 id="queue-heading">Give the decision<br />some space.</h2><p>Save a receipt and choose a date to reconsider.</p><Link href="/queue" className="editorial-text-link">Open your queue <span aria-hidden="true">→</span></Link></div>
        <ol className="editorial-queue-steps" aria-label="How the decision queue works"><li><span aria-hidden="true">01</span><h3>Save your receipt</h3></li><li><span aria-hidden="true">02</span><h3>Give it a day. Or seven.</h3></li><li><span aria-hidden="true">03</span><h3>Return with a clearer head</h3></li></ol>
      </div>
    </section>

    <section className="editorial-section container editorial-reflection" aria-labelledby="reflection-heading">
      <div className="editorial-section-heading"><p className="eyebrow">05 / After the purchase</p><h2 id="reflection-heading">What did you<br />actually get from it?</h2><p>Compare your original estimate with the costs and use you record.</p></div>
      <figure className="editorial-experience">
        <figcaption>Fictional laptop example · both columns cover a completed 48-month ownership period.</figcaption>
        <div className="editorial-experience-columns">
          <div><h3>The prediction</h3><dl><div><dt>Expected uses</dt><dd>{formatQuantity(predicted.totalUses)}</dd></div><div><dt>Estimated cost per use</dt><dd>{predicted.costPerUse === null ? "Not available" : formatUnitCost(predicted.costPerUse, example.currency)}</dd></div></dl></div>
          <div><h3>The imagined outcome</h3><dl><div><dt>Recorded uses</dt><dd>{formatQuantity(illustrativeReview.uses ?? 0)}</dd></div><div><dt>Cost per use</dt><dd>{experienced.costPerUse === null ? "Not available" : formatUnitCost(experienced.costPerUse, example.currency)}</dd></div></dl></div>
        </div>
        <details className="editorial-disclosure"><summary>Illustration assumptions</summary><p>This is a fictional demonstration, not a user record or a claim about laptop performance. The prediction uses the new-laptop example above. The imagined outcome is a {formatMoney(illustrativeReview.price ?? 0, example.currency)} purchase, {formatMoney(illustrativeReview.maintenance ?? 0, example.currency)} maintenance, {formatMoney(illustrativeReview.accessories ?? 0, example.currency)} accessories, {formatMoney(illustrativeReview.repairs ?? 0, example.currency)} repairs, and {formatMoney(illustrativeReview.resale ?? 0, example.currency)} resale after four years. Tax, shipping, and subscriptions are zero. Net cost is {formatMoney(experienced.cost, example.currency)} across {formatQuantity(illustrativeReview.uses ?? 0)} uses. Nothing is saved.</p></details>
      </figure>
      <div className="editorial-reflection-links"><Link href="/purchases" className="text-link">Your purchases <Icon name="arrow" size={17} /></Link><Link href="/insights" className="text-link">Insights from your records <Icon name="arrow" size={17} /></Link></div>
      <div className="editorial-closing"><h2>Analyze your<br />next purchase.</h2><div><Link className="button-primary" href="/analyze">Analyze a product <Icon name="arrow" /></Link><p>Created by Berke Bahar.</p></div></div>

    </section>
  </div>;
}
