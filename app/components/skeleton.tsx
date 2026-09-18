import BrandMark from "./brand-mark";

export default function Skeleton({ label = "Preparing your workspace" }: { label?: string }) {
  return <div className="skeleton-panel">
    <p className="skeleton-caption" role="status"><span className="skeleton-mark" aria-hidden="true"><BrandMark /></span>{label}</p>
    <div className="skeleton-paper" aria-hidden="true"><span className="skeleton-line short" /><span className="skeleton-line medium" /><span className="skeleton-line" /><span className="skeleton-total" /></div>
    <p className="skeleton-help">If this workspace does not open, <a href="">reload this page</a>. DecisionLab needs JavaScript enabled to open this workspace.</p>
  </div>;
}
