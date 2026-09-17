import BrandMark from "./brand-mark";

export default function Skeleton({ label = "Preparing your workspace" }: { label?: string }) {
  return <div className="skeleton-panel" role="status" aria-busy="true">
    <p className="skeleton-caption"><span className="skeleton-mark" aria-hidden="true"><BrandMark /></span>{label.replace(/^Loading/, "Preparing").replace(/^Opening/, "Preparing").replace(/[…]+$/, "")}</p>
    <div className="skeleton-paper" aria-hidden="true"><span className="skeleton-line short" /><span className="skeleton-line medium" /><span className="skeleton-line" /><span className="skeleton-total" /></div>
  </div>;
}
