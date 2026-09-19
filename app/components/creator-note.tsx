import BrandMark from "./brand-mark";
import Icon from "./lab-icon";

export default function CreatorNote() {
  return <section className="creator-section" id="creator" aria-labelledby="creator-heading"><div className="creator-portrait" aria-hidden="true"><span className="portrait-grid" /><span className="creator-monogram">bb.</span><BrandMark /><span className="portrait-caption">CURIOSITY → POSSIBILITY</span></div><div className="creator-copy"><p className="eyebrow">A NOTE FROM THE CREATOR</p><h2 id="creator-heading">Built with curiosity.<br />Made for people like us.</h2><p>DecisionLab was created by Berke B., with an interest in computer science, mathematics, and economics.</p><p>The best tools don’t make decisions for you. They help you see your options more clearly.</p><div className="creator-signature"><span>Berke B.</span><a className="text-link" href="#creator">The story behind the lab <Icon name="arrow" size={16} /></a></div><p className="creator-credit">Created, designed, and developed by Berke B.</p></div></section>;
}
