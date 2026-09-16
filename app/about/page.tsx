import type { Metadata } from "next";
import Link from "next/link";
import PageHeading from "../components/page-heading";
import CreatorNote from "../components/creator-note";
import DecisionPath from "../components/decision-path";
import Icon from "../components/lab-icon";

export const metadata: Metadata = { title: "About the Lab", description: "Meet DecisionLab and its creator, Berke Bahar. A pre-purchase decision platform that makes opportunity cost useful in everyday life." };

export default function AboutPage() {
  return <div className="container about-page">
    <div className="about-intro"><PageHeading page="About" eyebrow="THE PERSPECTIVE BEHIND THE PRODUCT" title="Good decisions start with curiosity.">A little computer science. A little economics. A belief that understanding your options can change what’s possible.</PageHeading><div className="about-illustration"><DecisionPath /><span className="mono-label">IDEAS → EXPERIMENTS → PERSPECTIVE</span></div></div>
    <div className="about-grid" id="principles"><section className="content-panel"><span className="tool-icon"><Icon name="branch" /></span><p className="eyebrow">01 / THE IDEA</p><h2>What else could this become?</h2><p>Opportunity cost is the next-best option you give up when you make a choice. Money spent on one thing is money you can’t put toward another.</p><div className="about-equation"><strong>$120</strong><span>at $30 saved each week</span><Icon name="arrow" /><strong>4 weeks</strong></div><p>Spending $120 on shoes could mean reaching your laptop goal four weeks later. The shoes might be worth it to you. Seeing the trade-off helps you decide.</p><Link className="text-link" href="/goallens">Put the idea into practice <Icon name="arrow" size={17} /></Link></section>
    <section className="content-panel about-principle"><span className="tool-icon"><Icon name="target" /></span><p className="eyebrow">02 / THE APPROACH</p><h2>More perspective.<br />Always your decision.</h2><p>DecisionLab is a pre-purchase decision platform for evaluating physical products. It is not a marketplace, budgeting service, or financial adviser. The calculations use your estimates, not scraped prices or product claims.</p><ul className="principle-list"><li><Icon name="check" /><div><strong>Transparent by design.</strong><p>Every receipt separates your estimates, calculated totals, and missing inputs. Cost per use depends on expected usage; resale and durability are not guaranteed.</p></div></li><li><Icon name="check" /><div><strong>Your plans stay yours.</strong><p>Product analyses, reviews, goals, scenarios, and saved decisions stay in this browser. There’s no account or cross-device syncing. Clearing browser storage removes them.</p></div></li><li><Icon name="check" /><div><strong>Room to change your mind.</strong><p>Explore, compare, and revisit. Your priorities can evolve, and your plans can too.</p></div></li></ul></section></div>
    <CreatorNote />
    <section className="closing-cta"><div><p className="eyebrow">THE BEST WAY TO UNDERSTAND IS TO TRY.</p><h2>Bring your next what-if.</h2></div><Link className="button-primary" href="/analyze">Analyze a product <Icon name="arrow" /></Link></section>
  </div>;
}
