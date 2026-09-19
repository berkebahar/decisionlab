import Link from "next/link";
import BrandMark from "./brand-mark";
import Icon from "./lab-icon";

export default function SiteFooter() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-top"><div><Link className="brand" href="/" aria-label="DecisionLab home"><BrandMark /><span>Decision<span className="brand-accent">Lab</span></span></Link><p>Before you buy, see the whole cost.<br />Your assumptions. Your decision.</p></div><div className="footer-links"><nav aria-label="Explore tools"><span className="eyebrow">THE WORKSPACE</span><Link href="/analyze">Analyze</Link><Link href="/compare">Compare</Link><Link href="/queue">Queue</Link><Link href="/purchases">Purchases</Link><Link href="/insights">Insights</Link></nav><nav aria-label="About DecisionLab and supporting tools"><span className="eyebrow">THE PERSPECTIVE</span><Link href="/account">Account</Link><Link href="/about">Our story</Link><Link href="/about#principles">How we think</Link><Link href="/about#creator">Meet the creator <Icon name="arrow" size={14} /></Link><span className="eyebrow footer-support-heading">SUPPORTING TOOLS</span><Link href="/dashboard">Savings Goals</Link><Link href="/goallens">GoalLens</Link><Link href="/simulator">Savings Simulator</Link></nav></div></div>
    <div className="footer-bottom"><p className="creator-credit">Created by Berke B.</p><p>Made for learning. Built for possibility.</p><a href="#top" aria-label="Back to top">Back to top ↑</a></div>
  </div></footer>;
}
