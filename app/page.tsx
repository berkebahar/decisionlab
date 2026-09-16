import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./botanical-home.css";
import LandingAtmosphere from "./components/landing-atmosphere";
import ReceiptPreview from "./products/receipt-preview";
import CreatorNote from "./components/creator-note";
import Icon from "./components/lab-icon";
import SmallChoices from "./components/small-choices";
import { demoGroups } from "./products/demo-products";
export const metadata: Metadata = {
  title: { absolute: "DecisionLab — Before you buy it, see what it will really cost." },
  description: "Compare price, ownership, usage, resale value, and the goals your purchase may delay. A private pre-purchase decision platform.",
};
export default function Home() {
  return <>
    <section className="botanical-hero" aria-labelledby="hero-heading">
      <div className="botanical-backdrop" aria-hidden="true"><Image src="/images/decisionlab-botanical-hero.webp" alt="" fill sizes="100vw" loading="eager" fetchPriority="high" /></div>
      <div className="hero container product-hero"><LandingAtmosphere />
      <div className="hero-copy"><p className="eyebrow">A considered purchase starts here</p><h1 id="hero-heading">Before you buy it, see what it will really cost.</h1><p className="hero-description">Compare price, ownership, usage, resale value, and the goals your purchase may delay.</p><div className="hero-actions"><Link href="/analyze" className="button-primary">Analyze a product <Icon name="arrow" /></Link><Link href="/compare" className="button-outline">Compare products</Link></div><div className="hero-trust"><span><Icon name="check" size={15} />No account or bank details</span><span><Icon name="check" size={15} />Private to this browser</span></div><p className="hero-assurance">A price tag is only the beginning. Use your own assumptions to see ownership costs and cost per use, then decide what matters to you.</p></div>
      <div className="hero-lab"><div className="botanical-preview-caption"><span>Explore the full picture</span><span>Live example</span></div><ReceiptPreview /></div>
      </div>
    </section>
    <div className="product-strip container"><span>Your decision, in four moves</span><p>Analyze the whole cost.</p><span aria-hidden="true">→</span><p>Compare possibilities.</p><span aria-hidden="true">→</span><p>Return with perspective.</p></div>
    <section className="tools-section container" aria-labelledby="tools-heading"><div className="section-heading"><div><p className="eyebrow">More than the purchase price</p><h2 id="tools-heading">From a possibility<br />to an informed choice.</h2></div><p>No store listings, sales incentives, or universal winners. Just transparent calculations using your estimates.</p></div><div className="bento-grid">
      <article className="bento-card bento-lens"><div className="bento-top"><span className="tool-icon"><Icon name="target" /></span><span className="mono-label">01 / Analyze</span></div><h3>Your True Cost Receipt</h3><p>See upfront costs, maintenance, consumables, subscriptions, and expected resale in one place. Unknown values remain visible.</p><Link href="/analyze" className="text-link">Analyze a product →</Link></article>
      <article className="bento-card bento-simulator"><div className="bento-top"><span className="tool-icon"><Icon name="branch" /></span><span className="mono-label">02 / Compare</span></div><h3>Different assumptions. Different costs.</h3><p>Compare up to three products, or new, used, and refurbished versions. Choose the factors that matter without a manufactured score.</p><Link href="/compare" className="text-link">Compare products →</Link></article>
      <article className="bento-card bento-dashboard"><div className="bento-top"><span className="tool-icon"><Icon name="clock" /></span><span className="mono-label">03 / Reconsider</span></div><div><h3>Leave yourself room.</h3><p>Save a receipt, choose a day to revisit it, and record your decision. Dates appear when you return; there are no push notifications.</p></div><Link href="/queue" className="text-link">Open your queue →</Link></article>
      <article className="bento-card bento-insights"><div className="bento-top"><span className="tool-icon"><Icon name="chart" /></span><span className="mono-label">04 / Reflect</span></div><h3>See how it worked out.</h3><p>Record actual use, ownership costs, and satisfaction after buying. Compare experience with your original prediction.</p><Link href="/purchases" className="text-link">Your purchase library →</Link></article>
    </div></section>
    <section className="container product-demo-section"><p className="eyebrow">Try a fictional example</p><h2>Same question. Different kinds of product.</h2><p>All demonstration values are fictional assumptions, not current prices, durability claims, or product recommendations. They are never added to your records automatically.</p><div className="product-demo-links">{demoGroups.map((group,index) => <Link className="button-outline" key={group.name} href={`/compare?demo=${index}`}>{group.name} →</Link>)}</div></section>
    <section className="opportunity-section container"><div className="opportunity-copy"><p className="eyebrow">Your priorities are part of the picture</p><h2>What else could<br />this money do?</h2><p>The next-best use of your money is an opportunity cost. That might be a different product, a personal goal, or simply keeping flexibility.</p><p>You can analyze a product without sharing savings information. A goal adds context; it does not decide whether the purchase is worthwhile.</p><Link className="text-link" href="/about">How DecisionLab thinks →</Link></div><div className="product-support-panel"><h3>Supporting tools, still here.</h3><p>Your existing goals, journals, and simulations are preserved.</p><Link className="text-link" href="/dashboard">Goals & legacy saved decisions →</Link><Link className="text-link" href="/goallens">GoalLens: purchases and recurring expenses →</Link><Link className="text-link" href="/simulator">Advanced savings Simulator →</Link></div></section>
    <details className="container supporting-experiment"><summary>Explore how small weekly choices accumulate</summary><SmallChoices /></details>
    <div className="container"><CreatorNote /></div>
    <section className="closing-cta container"><div><p className="eyebrow">Your assumptions. Your decision.</p><h2>Start with what you’re considering.</h2></div><Link className="button-primary" href="/analyze">Analyze a product <Icon name="arrow" /></Link></section>
  </>;
}
